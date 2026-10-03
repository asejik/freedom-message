import { cache } from "react";
import { supabase, SERMON_LIST_SELECT } from "@/lib/supabase";
import type { SermonWithRelations } from "@/types/database";

/**
 * Loads one sermon for server rendering (page + link-preview metadata).
 * `cache` makes the page and generateMetadata share a single query per request.
 *
 * Returns the sermon, `null` if it doesn't exist (zero rows / malformed id), or
 * `undefined` if it couldn't be loaded right now, in which case the page falls back
 * to fetching in the browser (with its usual error and Try again handling).
 */
export const getSermon = cache(async (id: string): Promise<SermonWithRelations | null | undefined> => {
  try {
    const { data, error } = await supabase
      .from("sermons")
      .select(SERMON_LIST_SELECT)
      .eq("id", id)
      .single();

    if (error && (error.code === "PGRST116" || error.code === "22P02")) return null;
    if (error) {
      console.error("[SERMON PAGE] Server-side load failed, falling back to browser:", error.message);
      return undefined;
    }
    return data as unknown as SermonWithRelations;
  } catch (err) {
    console.error("[SERMON PAGE] Server-side load failed, falling back to browser:", err);
    return undefined;
  }
});
