import { cache } from "react";
import { supabase, SERIES_SERMON_LIMIT, SERMON_CARD_SELECT, SERMON_LIST_SELECT } from "@/lib/supabase";
import type { Series, SermonWithRelations } from "@/types/database";

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

/** The newest sermons for the home shelves, plus when they were loaded (seeds the Featured shuffle). */
export interface InitialSermons {
  sermons: SermonWithRelations[];
  loadedAt: number;
}

/**
 * The 20 newest sermons for the home page's server render (the same query as
 * `/api/sermons?limit=20&count=false`). Returns `undefined` if they couldn't be loaded,
 * in which case the page fetches them in the browser as before.
 */
export async function getRecentSermons(): Promise<InitialSermons | undefined> {
  try {
    const { data, error } = await supabase
      .from("sermons")
      .select(SERMON_CARD_SELECT)
      .order("date_preached", { ascending: false })
      .range(0, 19);
    if (error) {
      console.error("[HOME PAGE] Server-side load failed, falling back to browser:", error.message);
      return undefined;
    }
    return { sermons: (data ?? []) as unknown as SermonWithRelations[], loadedAt: Date.now() };
  } catch (err) {
    console.error("[HOME PAGE] Server-side load failed, falling back to browser:", err);
    return undefined;
  }
}

/** A series and all of its sermons, newest first. */
export interface SeriesWithSermons {
  series: Pick<Series, "id" | "name" | "thumbnail_url">;
  sermons: SermonWithRelations[];
}

/**
 * Loads one series page on the server (page + metadata share it through `cache`).
 * Sermons are matched by series_id, so a series whose name appears inside another's
 * ("Service" in "Christmas Service") shows only its own sermons.
 * Returns `null` if the series doesn't exist, `undefined` if it couldn't be loaded
 * (the page then loads it in the browser).
 */
export const getSeries = cache(async (id: string): Promise<SeriesWithSermons | null | undefined> => {
  try {
    const [seriesResult, sermonsResult] = await Promise.all([
      supabase.from("series").select("id, name, thumbnail_url").eq("id", id).single(),
      supabase
        .from("sermons")
        .select(SERMON_CARD_SELECT)
        .eq("series_id", id)
        .order("date_preached", { ascending: false })
        .range(0, SERIES_SERMON_LIMIT - 1),
    ]);
    const error = seriesResult.error ?? sermonsResult.error;
    if (error && (error.code === "PGRST116" || error.code === "22P02")) return null;
    if (error || !seriesResult.data) {
      console.error("[SERIES PAGE] Server-side load failed, falling back to browser:", error?.message);
      return undefined;
    }
    return {
      series: seriesResult.data as SeriesWithSermons["series"],
      sermons: (sermonsResult.data ?? []) as unknown as SermonWithRelations[],
    };
  } catch (err) {
    console.error("[SERIES PAGE] Server-side load failed, falling back to browser:", err);
    return undefined;
  }
});
