import type { User } from "@supabase/supabase-js";
import { getServiceClient } from "@/lib/server/service-client";
import { logAdminAction } from "@/lib/server/logs";
import { getErrorMessage } from "@/lib/utils";

const ARTWORK_PATH = "/storage/v1/object/public/artwork/";

/**
 * Deletes an artwork file from Storage, but only if it lives in our `artwork`
 * bucket AND no remaining sermon or series still uses the same URL (artwork is
 * often shared by every sermon in a series). Never throws.
 */
export async function removeUnusedArtwork(artworkUrl: string, user: User): Promise<void> {
  try {
    const index = artworkUrl.indexOf(ARTWORK_PATH);
    if (index === -1) return; // not one of our uploaded files (e.g. "ERROR" or an external URL)
    const fileName = decodeURIComponent(artworkUrl.slice(index + ARTWORK_PATH.length).split("?")[0]);
    if (!fileName || fileName.includes("/")) return;

    const db = getServiceClient();
    if (!db) return;

    const [sermons, series] = await Promise.all([
      db.from("sermons").select("id", { count: "exact", head: true }).eq("artwork_url", artworkUrl),
      db.from("series").select("id", { count: "exact", head: true }).eq("thumbnail_url", artworkUrl),
    ]);
    if (sermons.error || series.error) return; // unsure: keep the file
    if ((sermons.count ?? 0) > 0 || (series.count ?? 0) > 0) return; // still in use

    const { error } = await db.storage.from("artwork").remove([fileName]);
    if (error) {
      console.error("[ARTWORK CLEANUP] could not remove", fileName, error.message);
      return;
    }
    await logAdminAction(user, "artwork.delete", { type: "artwork", id: fileName }, { reason: "unused after sermon delete" });
  } catch (err) {
    console.error("[ARTWORK CLEANUP] failed:", getErrorMessage(err));
  }
}
