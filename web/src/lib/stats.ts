import { supabase } from "@/lib/supabase";

export type SermonCounter = "play" | "download" | "view";

/**
 * Adds one to a sermon's play, download, or view count, at most once per sermon per
 * browser session (so replays, repeated visits and pause/resume don't inflate the numbers).
 * Fire-and-forget: counting must never get in the way of listening or browsing, so every
 * failure (offline, database function not installed) is ignored.
 */
export function recordSermonEvent(sermonId: string, counter: SermonCounter): void {
  if (typeof window === "undefined" || !sermonId) return;

  const sessionKey = `fm_counted_${counter}_${sermonId}`;
  try {
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, "1");
  } catch {
    // Storage blocked (private mode): count anyway rather than not at all
  }

  void supabase
    .rpc("increment_sermon_counter", { target_sermon_id: sermonId, counter })
    .then(({ error }) => {
      if (error) console.debug("[stats] counter not recorded:", error.message);
    });
}
