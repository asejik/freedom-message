import { NextResponse } from "next/server";
import { verifyTranscriptsAccess } from "@/lib/server/transcripts-auth";
import { supabase } from "@/lib/supabase";
import { getServiceClient } from "@/lib/server/service-client";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
};

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyTranscriptsAccess(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.reason || "Unauthorized" },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    const { id } = await context.params;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Sermon ID is required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const db = getServiceClient() || supabase;
    const { data, error } = await db
      .from("sermons")
      .select("id, title, date_preached, transcript_text, preachers(id, name), series(id, name)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Sermon not found or transcript unavailable." },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json({ data }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("[TRANSCRIPT DETAIL ERROR]:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
