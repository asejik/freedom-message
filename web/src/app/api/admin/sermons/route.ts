import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verify Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '20', 10));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('sermons')
      .select('*, preachers(*), series(*)', { count: 'exact' });

    if (search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`);
    }

    const { data, count, error } = await query
      .order('date_preached', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      page,
      limit,
    });

  } catch (error: any) {
    console.error("[ADMIN SERMONS GET ERROR]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch sermons" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verify Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse Body
    const body = await request.json();
    const {
      title,
      preacher_id,
      series_id,
      date_preached,
      audio_url,
      artwork_url,
      transcript_text,
      ai_summary,
      ai_tags,
      key_verses,
      prayer_focus
    } = body;

    if (!title || !date_preached || !audio_url) {
      return NextResponse.json({ error: "Title, Date Preached, and Audio URL are required" }, { status: 400 });
    }

    const payload = {
      title: title.trim(),
      preacher_id: preacher_id || null,
      series_id: series_id || null,
      date_preached,
      audio_url: audio_url.trim(),
      artwork_url: artwork_url ? artwork_url.trim() : null,
      transcript_text: transcript_text ? transcript_text.trim() : null,
      ai_summary: ai_summary ? ai_summary.trim() : null,
      ai_tags: Array.isArray(ai_tags) ? ai_tags : (ai_tags ? [ai_tags] : []),
      key_verses: Array.isArray(key_verses) ? key_verses : (key_verses ? [key_verses] : null),
      prayer_focus: prayer_focus ? prayer_focus.trim() : null
    };

    const { data: insertedData, error: dbError } = await supabase
      .from('sermons')
      .insert(payload as any)
      .select('*, preachers(*), series(*)')
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ data: insertedData }, { status: 201 });

  } catch (error: any) {
    console.error("[ADMIN SERMONS POST ERROR]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create sermon" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verify Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Sermon ID is required" }, { status: 400 });
    }

    const payload: Record<string, any> = {};
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.preacher_id !== undefined) payload.preacher_id = updates.preacher_id || null;
    if (updates.series_id !== undefined) payload.series_id = updates.series_id || null;
    if (updates.date_preached !== undefined) payload.date_preached = updates.date_preached;
    if (updates.audio_url !== undefined) payload.audio_url = updates.audio_url.trim();
    if (updates.artwork_url !== undefined) payload.artwork_url = updates.artwork_url ? updates.artwork_url.trim() : null;
    if (updates.transcript_text !== undefined) payload.transcript_text = updates.transcript_text ? updates.transcript_text.trim() : null;
    if (updates.ai_summary !== undefined) payload.ai_summary = updates.ai_summary ? updates.ai_summary.trim() : null;
    if (updates.ai_tags !== undefined) payload.ai_tags = Array.isArray(updates.ai_tags) ? updates.ai_tags : [];
    if (updates.key_verses !== undefined) payload.key_verses = Array.isArray(updates.key_verses) ? updates.key_verses : null;
    if (updates.prayer_focus !== undefined) payload.prayer_focus = updates.prayer_focus ? updates.prayer_focus.trim() : null;

    const { data: updatedData, error: dbError } = await (supabase
      .from('sermons') as any)
      .update(payload)
      .eq('id', id)
      .select('*, preachers(*), series(*)')
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ data: updatedData });

  } catch (error: any) {
    console.error("[ADMIN SERMONS PATCH ERROR]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update sermon" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verify Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ error: "Sermon ID is required" }, { status: 400 });
    }

    const { error: dbError } = await supabase
      .from('sermons')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, message: "Sermon deleted successfully" });

  } catch (error: any) {
    console.error("[ADMIN SERMONS DELETE ERROR]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete sermon" },
      { status: 500 }
    );
  }
}
