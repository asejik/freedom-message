import { NextResponse } from "next/server";
import { verifyTranscriptsAccess } from "@/lib/server/transcripts-auth";
import { supabase } from "@/lib/supabase";
import { getServiceClient } from "@/lib/server/service-client";
import { parsePaging } from "@/lib/utils";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
};

export async function GET(request: Request) {
  try {
    const auth = await verifyTranscriptsAccess(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.reason || "Unauthorized" },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    const { searchParams } = new URL(request.url);
    const title = searchParams.get("q") || searchParams.get("title");
    const preacherParams = searchParams.getAll("preacher");
    const preachers = preacherParams
      .flatMap((p) => p.split(","))
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    const series = searchParams.get("series");
    const seriesId = searchParams.get("series_id");
    const year = searchParams.get("year");
    const sort = searchParams.get("sort") || "newest";

    const paging = parsePaging(searchParams.get("page"), searchParams.get("limit") || "25");
    if (!paging) {
      return NextResponse.json({ error: "Invalid page or limit." }, { status: 400 });
    }
    const { page, limit } = paging;
    const offset = (page - 1) * limit;

    const hasSeriesFilter = Boolean(series && series.trim() !== "");
    const hasPreacherFilter = preachers.length > 0;

    let selectQuery = "id, title, date_preached, preachers(id, name), series(id, name)";
    if (hasPreacherFilter) {
      selectQuery = selectQuery.replace("preachers(id, name)", "preachers!inner(id, name)");
    }
    if (hasSeriesFilter) {
      selectQuery = selectQuery.replace("series(id, name)", "series!inner(id, name)");
    }

    const db = getServiceClient() || supabase;
    let dbQuery = db.from("sermons").select(selectQuery, { count: "exact" });

    if (title && title.trim() !== "") {
      dbQuery = dbQuery.ilike("title", `%${title.trim()}%`);
    }

    if (preachers.length === 1) {
      dbQuery = dbQuery.ilike("preachers.name", `%${preachers[0]}%`);
    } else if (preachers.length > 1) {
      dbQuery = dbQuery.in("preachers.name", preachers);
    }

    if (hasSeriesFilter && series) {
      dbQuery = dbQuery.ilike("series.name", `%${series.trim()}%`);
    }

    if (seriesId && seriesId.trim() !== "") {
      dbQuery = dbQuery.eq("series_id", seriesId.trim());
    }

    if (year && year.trim() !== "") {
      dbQuery = dbQuery
        .gte("date_preached", `${year}-01-01`)
        .lte("date_preached", `${year}-12-31`);
    }

    if (sort === "oldest") {
      dbQuery = dbQuery.order("date_preached", { ascending: true });
    } else if (sort === "title-asc") {
      dbQuery = dbQuery.order("title", { ascending: true });
    } else if (sort === "title-desc") {
      dbQuery = dbQuery.order("title", { ascending: false });
    } else {
      // Default: newest first
      dbQuery = dbQuery.order("date_preached", { ascending: false });
    }

    const { data, count, error } = await dbQuery
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[TRANSCRIPTS API ERROR]:", error);
      return NextResponse.json(
        { error: "Could not fetch sermons." },
        { status: 500, headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        data: data ?? [],
        count: count ?? 0,
        page,
        limit,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error("[TRANSCRIPTS API ERROR]:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
