import { NextResponse } from 'next/server';
import { supabase, SERMON_CARD_SELECT } from "@/lib/supabase";
import { recordError } from "@/lib/server/logs";
import { parsePaging } from "@/lib/utils";

// Public catalog is identical for every visitor and only changes on admin
// uploads, so let the Vercel CDN serve it for 5 minutes (stale up to 1 hour
// while it refreshes in the background).
const PUBLIC_LIST_CACHE = 'public, s-maxage=300, stale-while-revalidate=3600';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const preacher = searchParams.get('preacher');
    const series = searchParams.get('series');
    // Exact series match (series pages); `series` above matches names partially
    const seriesId = searchParams.get('series_id');
    const year = searchParams.get('year');
    const tag = searchParams.get('tag');
    // Bounded: an unchecked limit returned up to 1,000 rows (736 KB) per request, and bad
    // values caused 500s that were recorded in the error log
    const paging = parsePaging(searchParams.get('page'), searchParams.get('limit'));
    if (!paging) {
      return NextResponse.json({ error: "Invalid page or limit." }, { status: 400 });
    }
    const { page, limit } = paging;
    const offset = (page - 1) * limit;

    // Build the select projection, conditionally using !inner for active filters.
    const hasSeriesFilter = series && series.trim() !== '';
    const hasPreacherFilter = preacher && preacher.trim() !== '';

    // Replace the join portions of SERMON_CARD_SELECT with !inner when filtering
    let selectQuery = SERMON_CARD_SELECT;
    if (hasPreacherFilter) {
      selectQuery = selectQuery.replace('preachers(id, name)', 'preachers!inner(id, name)');
    }
    if (hasSeriesFilter) {
      selectQuery = selectQuery.replace('series(id, name, thumbnail_url)', 'series!inner(id, name, thumbnail_url)');
    }

    // Callers that don't show totals (home shelves) pass count=false to skip the COUNT query
    const wantCount = searchParams.get('count') !== 'false';

    let dbQuery = supabase
      .from('sermons')
      .select(selectQuery, wantCount ? { count: 'exact' } : undefined);

    if (title && title.trim() !== '') {
      dbQuery = dbQuery.ilike('title', `%${title.trim()}%`);
    }

    if (preacher && preacher.trim() !== '') {
      dbQuery = dbQuery.ilike('preachers.name', `%${preacher.trim()}%`);
    }

    if (hasSeriesFilter) {
      dbQuery = dbQuery.ilike('series.name', `%${series.trim()}%`);
    }

    if (seriesId && seriesId.trim() !== '') {
      dbQuery = dbQuery.eq('series_id', seriesId.trim());
    }

    const date = searchParams.get('date');
    if (date && date.trim() !== '') {
      dbQuery = dbQuery.eq('date_preached', date.trim());
    }

    if (year && year.trim() !== '') {
      dbQuery = dbQuery.gte('date_preached', `${year}-01-01`).lte('date_preached', `${year}-12-31`);
    }

    // Filter by topic (mood chip): the word may appear in the title, the AI summary
    // or the AI tags. Tags alone would miss most sermons (only ~230 have them).
    const safeTag = (tag ?? '').replace(/[^a-zA-Z0-9 ]/g, '').trim();
    if (safeTag) {
      dbQuery = dbQuery.or(`title.ilike.%${safeTag}%,ai_summary.ilike.%${safeTag}%,ai_tags.cs.{${safeTag}}`);
    }

    const { data, count, error } = await dbQuery
      .order('date_preached', { ascending: false })
      .range(offset, offset + limit - 1);

    // A page past the end (only possible when counting) is an empty page, not a server error
    if (error?.code === 'PGRST103') {
      return NextResponse.json({ data: [], count: 0, page, limit }, { headers: { 'Cache-Control': PUBLIC_LIST_CACHE } });
    }

    if (error) {
      console.error("[CATALOG API ERROR] Supabase query failed:", error);
      throw error;
    }

    return NextResponse.json(
      {
        data: data ?? [],
        count: count ?? 0,
        page,
        limit,
      },
      { headers: { 'Cache-Control': PUBLIC_LIST_CACHE } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    // Details stay in the server log; clients get a generic message (no DB internals)
    console.error("[CATALOG API ERROR]:", message);
    await recordError({ source: "server", error, path: request.url, context: "route /api/sermons" });
    return NextResponse.json(
      { error: "Could not load sermons. Please try again." },
      { status: 500 }
    );
  }
}
