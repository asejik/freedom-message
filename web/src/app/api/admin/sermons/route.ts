import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isMessagesAdmin } from '@/utils/supabase/admin';
import { SERMON_CARD_SELECT, SERMON_ADMIN_SELECT } from '@/lib/supabase';
import { isHttpUrl, getErrorMessage } from '@/lib/utils';
import type { SermonUpdate } from '@/types/database';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verify Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isMessagesAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    // Single full record (incl. transcript_text) for the edit form
    const id = searchParams.get('id');
    if (id) {
      const { data, error } = await supabase
        .from('sermons')
        .select(SERMON_ADMIN_SELECT)
        .eq('id', id)
        .single();

      if (error) throw error;
      return NextResponse.json({ data });
    }

    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '20', 10));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('sermons')
      // Table only shows card fields; transcripts (~61KB each) load on edit via ?id=
      .select(`${SERMON_CARD_SELECT}, play_count, download_count`, { count: 'exact' });

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

  } catch (error) {
    console.error("[ADMIN SERMONS GET ERROR]:", error);
    return NextResponse.json({ error: getErrorMessage(error) || "Failed to fetch sermons" }, { status: 500 });
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
    if (!isMessagesAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    // audio_url is opened by the Download buttons, so it must be a real web link
    if (!isHttpUrl(audio_url)) {
      return NextResponse.json({ error: "Audio URL must start with http:// or https://" }, { status: 400 });
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
      .insert(payload)
      .select(SERMON_CARD_SELECT)
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ data: insertedData }, { status: 201 });

  } catch (error) {
    console.error("[ADMIN SERMONS POST ERROR]:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) || "Failed to create sermon" },
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
    if (!isMessagesAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Sermon ID is required" }, { status: 400 });
    }

    const payload: SermonUpdate = {};
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.preacher_id !== undefined) payload.preacher_id = updates.preacher_id || null;
    if (updates.series_id !== undefined) payload.series_id = updates.series_id || null;
    if (updates.date_preached !== undefined) payload.date_preached = updates.date_preached;
    if (updates.audio_url !== undefined) {
      if (!isHttpUrl(updates.audio_url)) {
        return NextResponse.json({ error: "Audio URL must start with http:// or https://" }, { status: 400 });
      }
      payload.audio_url = updates.audio_url.trim();
    }
    if (updates.artwork_url !== undefined) payload.artwork_url = updates.artwork_url ? updates.artwork_url.trim() : null;
    if (updates.transcript_text !== undefined) payload.transcript_text = updates.transcript_text ? updates.transcript_text.trim() : null;
    if (updates.ai_summary !== undefined) payload.ai_summary = updates.ai_summary ? updates.ai_summary.trim() : null;
    if (updates.ai_tags !== undefined) payload.ai_tags = Array.isArray(updates.ai_tags) ? updates.ai_tags : [];
    if (updates.key_verses !== undefined) payload.key_verses = Array.isArray(updates.key_verses) ? updates.key_verses : null;
    if (updates.prayer_focus !== undefined) payload.prayer_focus = updates.prayer_focus ? updates.prayer_focus.trim() : null;

    const { data: updatedData, error: dbError } = await supabase
      .from('sermons')
      .update(payload)
      .eq('id', id)
      .select(SERMON_CARD_SELECT)
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ data: updatedData });

  } catch (error) {
    console.error("[ADMIN SERMONS PATCH ERROR]:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) || "Failed to update sermon" },
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
    if (!isMessagesAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  } catch (error) {
    console.error("[ADMIN SERMONS DELETE ERROR]:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) || "Failed to delete sermon" },
      { status: 500 }
    );
  }
}
