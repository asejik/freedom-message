import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { sitemapEntries } from "@/lib/seo";

// Rebuilt at most hourly, and only when a crawler asks (ids only: about 60 KB per rebuild)
export const revalidate = 3600;

// The API returns at most 1,000 rows per request
const PAGE_SIZE = 1000;

async function getAllSermonIds(): Promise<string[]> {
  const ids: string[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("sermons")
      .select("id")
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    ids.push(...(data ?? []).map((row: { id: string }) => row.id));
    if (!data || data.length < PAGE_SIZE) return ids;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    return sitemapEntries(await getAllSermonIds());
  } catch (err) {
    // Never fail the build (CI has no database). The next hourly rebuild adds the sermons back.
    console.error("[SITEMAP] Couldn't load sermons, listing the main pages only:", err);
    return sitemapEntries([]);
  }
}
