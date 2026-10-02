import { supabase } from "@/lib/supabase";

type SermonCounter = "play" | "download";

/**
 * Adds one to a sermon's play or download count, at most once per sermon per
 * browser session (so replays and pause/resume don't inflate the numbers).
 * Fire-and-forget: counting must never get in the way of listening, so every
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
