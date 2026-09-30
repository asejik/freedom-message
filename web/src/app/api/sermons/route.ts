import { NextResponse } from 'next/server';
import { supabase, SERMON_CARD_SELECT } from "@/lib/supabase";

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
    const year = searchParams.get('year');
    const tag = searchParams.get('tag');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
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

    const date = searchParams.get('date');
    if (date && date.trim() !== '') {
      dbQuery = dbQuery.eq('date_preached', date.trim());
    }

    if (year && year.trim() !== '') {
      dbQuery = dbQuery.gte('date_preached', `${year}-01-01`).lte('date_preached', `${year}-12-31`);
    }

    // Filter by tag (mood chip) - behaves like a title search while AI tags are populating
    if (tag && tag.trim() !== '') {
      dbQuery = dbQuery.ilike('title', `%${tag.trim()}%`);
    }

    const { data, count, error } = await dbQuery
      .order('date_preached', { ascending: false })
      .range(offset, offset + limit - 1);

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
    console.error("[CATALOG API ERROR]:", message);
    return NextResponse.json(
      { error: `Catalog fetch failed: ${message}` },
      { status: 500 }
    );
  }
}
