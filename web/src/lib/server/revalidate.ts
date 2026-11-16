import { revalidatePath } from "next/cache";
import { getErrorMessage } from "@/lib/utils";

// The home, sermon and series pages are cached for a long time (see their
// `revalidate` values) and refreshed here, when an admin changes something.
// A 5-minute timer made every crawler visit regenerate and re-store a page.
// Each call only marks pages as out of date: a page is rebuilt on its next visit.

function refresh(paths: Array<[path: string, type?: "page"]>): void {
  try {
    for (const [path, type] of paths) revalidatePath(path, type);
  } catch (err) {
    // The database change already succeeded; the pages' own timers still catch up.
    console.error("[REVALIDATE] Could not refresh cached pages:", getErrorMessage(err));
  }
}

/**
 * After one sermon is created, edited or deleted: its own page, the home
 * shelves, and the series pages (it may have joined, left or moved series).
 */
export function refreshAfterSermonChange(sermonId: string | undefined): void {
  refresh([
    ...(sermonId ? [[`/sermons/${sermonId}`] as [string]] : []),
    ["/"],
    ["/series/[id]", "page"],
  ]);
}

/** After a preacher or series changes: their names and artwork appear on every sermon and series page. */
export function refreshAllPublicPages(): void {
  refresh([["/"], ["/sermons/[id]", "page"], ["/series/[id]", "page"]]);
}
