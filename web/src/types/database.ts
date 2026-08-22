// =============================================================================
// CLC Sermon Platform — Database Types
// Mirrors the Supabase PostgreSQL schema defined in web/supabase/schema.sql
// =============================================================================

// ── Base row type helper ──────────────────────────────────────────────────────

/** Fields present on every Supabase table row. */
interface BaseRow {
  id: string;          // UUID
  created_at: string;  // ISO 8601 timestamp string from Supabase
}


// =============================================================================
// RAW TABLE TYPES  (match schema columns 1-to-1)
// =============================================================================

/** A single row from the `preachers` table. */
export interface Preacher extends BaseRow {
  name: string;
}

/** A single row from the `series` table. */
export interface Series extends BaseRow {
  name: string;
  thumbnail_url?: string | null;
}

/**
 * A single row from the `sermons` table.
 * Foreign keys (`preacher_id`, `series_id`) are stored as UUIDs here.
 * For joined shapes, use `SermonWithRelations`.
 */
export interface Sermon extends BaseRow {
  title:           string;
  date_preached:   string;
  audio_url:       string;
  artwork_url?:    string | null;
  preacher_id:     string | null;
  series_id:       string | null;
  transcript_text: string | null;
  ai_summary:      string | null;
  ai_tags:         string[];
  key_verses?:     string[] | null;
  prayer_focus?:   string | null;
  play_count?:     number;
  download_count?: number;
}


// =============================================================================
// JOINED / RELATIONAL TYPES  (used in UI components and TanStack Query hooks)
// =============================================================================

/**
 * A sermon row with its related `preachers` and `series` records eagerly joined.
 * This is what the frontend receives when querying:
 *   `supabase.from('sermons').select('*, preachers(*), series(*)')`
 */
export interface SermonWithRelations extends Omit<Sermon, 'preacher_id' | 'series_id'> {
  preacher_id: string | null;   // retained for mutation payloads
  series_id:   string | null;
  preachers:   Preacher | null; // null if preacher_id is null or join fails
  series:      Series   | null; // null if series_id is null or join fails
}


// =============================================================================
// INSERT / UPDATE PAYLOAD TYPES  (used in admin tools & migration script)
// =============================================================================

/** Payload for creating a new preacher. */
export type PreacherInsert = Pick<Preacher, 'name'>;

/** Payload for creating a new series. */
export type SeriesInsert = Pick<Series, 'name'> & { thumbnail_url?: string | null };

/** Payload for creating a new sermon (all nullable fields are truly optional). */
export interface SermonInsert {
  title:           string;
  date_preached:   string;
  audio_url:       string;
  preacher_id?:    string | null;
  series_id?:      string | null;
  transcript_text?: string | null;
  ai_summary?:     string | null;
  ai_tags?:        string[];
}

/** Payload for partially updating an existing sermon. */
export type SermonUpdate = Partial<SermonInsert>;


// =============================================================================
// API / QUERY RESPONSE WRAPPERS
// =============================================================================

/** Standard paginated list response shape used by TanStack Query hooks. */
export interface PaginatedResponse<T> {
  data:  T[];
  count: number;  // total row count (from Supabase `count: 'exact'`)
  page:  number;
  limit: number;
}

/** Search result — sermon with a relevance rank (for FTS responses). */
export interface SermonSearchResult extends SermonWithRelations {
  rank?: number;   // optional ts_rank score from full-text search
}


// =============================================================================
// SUPABASE DATABASE TYPE MAP  (for supabase-js v2 generic client typing)
// =============================================================================

/**
 * Pass this to `createClient<Database>()` for end-to-end type safety.
 *
 * Example:
 *   import { createClient } from '@supabase/supabase-js'
 *   import type { Database } from '@/types/database'
 *   const supabase = createClient<Database>(url, key)
 */
export interface Database {
  public: {
    Tables: {
      preachers: {
        Row:    Preacher;
        Insert: PreacherInsert & { id?: string; created_at?: string };
        Update: Partial<PreacherInsert>;
      };
      series: {
        Row:    Series;
        Insert: SeriesInsert & { id?: string; created_at?: string };
        Update: Partial<SeriesInsert>;
      };
      sermons: {
        Row:    Sermon;
        Insert: SermonInsert & { id?: string; created_at?: string };
        Update: SermonUpdate;
      };
    };
    Views:     Record<string, never>;
    Functions: {
      search_sermons: {
        Args:    { query: string };
        Returns: Sermon[];
      };
    };
    Enums:     Record<string, never>;
  };
}
