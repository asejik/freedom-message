import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { MAX_LIST_LIMIT } from '@/lib/utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

/**
 * Explicit column projection for sermon listing/card queries.
 * Excludes `transcript_text` (~30-100KB per row) which is only needed
 * on the single sermon detail page.
 */
export const SERMON_LIST_SELECT = `
  id,
  title,
  date_preached,
  audio_url,
  artwork_url,
  preacher_id,
  series_id,
  ai_summary,
  ai_tags,
  key_verses,
  prayer_focus,
  play_count,
  download_count,
  created_at,
  preachers(id, name),
  series(id, name, thumbnail_url)
`.replace(/\s+/g, ' ').trim();

/**
 * Minimal projection for sermon cards, shelves and the audio player.
 * Omits the AI fields (ai_summary alone is ~2.5KB per row), which only the
 * detail page renders. The join strings must stay identical to
 * SERMON_LIST_SELECT because API routes swap them for `!inner` joins.
 */
export const SERMON_CARD_SELECT = `
  id,
  title,
  date_preached,
  audio_url,
  artwork_url,
  preacher_id,
  series_id,
  preachers(id, name),
  series(id, name, thumbnail_url)
`.replace(/\s+/g, ' ').trim();

/** Most sermons a series page loads (the largest series has 54): the most /api/sermons allows. */
export const SERIES_SERMON_LIMIT = MAX_LIST_LIMIT;

/**
 * Everything the admin edit form needs: the detail fields plus the transcript.
 * Explicit on purpose: `select('*')` would also pull the large `search_vector`
 * full-text index column.
 */
export const SERMON_ADMIN_SELECT = `${SERMON_LIST_SELECT}, transcript_text`;
