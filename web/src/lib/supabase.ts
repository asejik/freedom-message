import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

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
