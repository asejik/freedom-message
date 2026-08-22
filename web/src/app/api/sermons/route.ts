import { NextResponse } from 'next/server';
import { supabase, SERMON_LIST_SELECT } from '@/lib/supabase';

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

    // Replace the join portions of SERMON_LIST_SELECT with !inner when filtering
    let selectQuery = SERMON_LIST_SELECT;
    if (hasPreacherFilter) {
      selectQuery = selectQuery.replace('preachers(id, name)', 'preachers!inner(id, name)');
    }
    if (hasSeriesFilter) {
      selectQuery = selectQuery.replace('series(id, name, thumbnail_url)', 'series!inner(id, name, thumbnail_url)');
    }

    let dbQuery = supabase
      .from('sermons')
      .select(selectQuery, { count: 'exact' });

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

    return NextResponse.json({
      data: data ?? [],
      count: count ?? 0,
      page,
      limit,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[CATALOG API ERROR]:", message);
    return NextResponse.json(
      { error: `Catalog fetch failed: ${message}` },
      { status: 500 }
    );
  }
}
