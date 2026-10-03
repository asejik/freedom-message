// Shared by the admin backup download (browser), the backup API and the restore script docs.

export const BACKUP_FORMAT = "messages-backup";
export const BACKUP_VERSION = 1;

/** How often a backup is due (the dashboard counts down to this). */
export const BACKUP_INTERVAL_DAYS = 30;

/** Sermons per export request: ~25 x ~61 KB transcripts stays well under Vercel's 4.5 MB response limit. */
export const BACKUP_PAGE_SIZE = 25;

/** Every sermons column except search_vector (a derived index the restore rebuilds). */
export const SERMON_BACKUP_COLUMNS =
  "id, title, date_preached, audio_url, artwork_url, preacher_id, series_id, transcript_text, ai_summary, ai_tags, key_verses, prayer_focus, play_count, download_count, created_at";

export type BackupStatus = {
  installed: boolean;          // false until the messages_admin_log migration has run
  lastBackupAt: string | null;
  intervalDays: number;
};

/** Days until the next backup is due: negative when overdue, null if never backed up. */
export function daysUntilNextBackup(lastBackupAt: string | null, now: Date, intervalDays = BACKUP_INTERVAL_DAYS): number | null {
  if (!lastBackupAt) return null;
  const due = new Date(lastBackupAt).getTime() + intervalDays * 24 * 60 * 60 * 1000;
  return Math.ceil((due - now.getTime()) / (24 * 60 * 60 * 1000));
}
