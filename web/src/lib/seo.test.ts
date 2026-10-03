import { describe, expect, it } from "vitest";
import { homeJsonLd, pageMetadata, serializeJsonLd, seriesDescription, sermonJsonLd, sitemapEntries, truncateDescription } from "@/lib/seo";
import type { SermonWithRelations } from "@/types/database";

describe("pageMetadata", () => {
  const meta = pageMetadata({ title: "Sermon series", description: "Every series.", path: "/series" });

  it("gives the page a self-referencing canonical and a matching preview URL", () => {
    expect(meta.alternates?.canonical).toBe("/series");
    expect(meta.openGraph).toMatchObject({ url: "/series", title: "Sermon series", description: "Every series." });
  });

  it("keeps the shared site name and locale in the page's own Open Graph object", () => {
    expect(meta.openGraph).toMatchObject({ siteName: "Messages", locale: "en_US" });
  });

  it("adds the site name to the title unless the title is marked absolute", () => {
    expect(meta.title).toEqual({ absolute: "Sermon series | Messages" });
    expect(meta.openGraph).toMatchObject({ title: "Sermon series" });
    const home = pageMetadata({ title: "Messages: Sermons", description: "d", path: "/", absoluteTitle: true });
    expect(home.title).toEqual({ absolute: "Messages: Sermons" });
  });
});

describe("sitemapEntries", () => {
  it("lists the public pages first, then every sermon, as absolute production URLs", () => {
    const entries = sitemapEntries(["a1", "b2"]);
    expect(entries.map((e) => e.url)).toEqual([
      "https://messages.muyiwaareo.com",
      "https://messages.muyiwaareo.com/search",
      "https://messages.muyiwaareo.com/series",
      "https://messages.muyiwaareo.com/ai",
      "https://messages.muyiwaareo.com/privacy",
      "https://messages.muyiwaareo.com/sermons/a1",
      "https://messages.muyiwaareo.com/sermons/b2",
    ]);
  });

  it("lists series pages after the main pages and before the sermons", () => {
    const urls = sitemapEntries(["a1"], ["s9"]).map((e) => e.url);
    expect(urls.slice(-2)).toEqual([
      "https://messages.muyiwaareo.com/series/s9",
      "https://messages.muyiwaareo.com/sermons/a1",
    ]);
  });

  it("never includes private or device-only pages", () => {
    const urls = sitemapEntries([]).map((e) => e.url);
    for (const path of ["/admin", "/login", "/favourites"]) {
      expect(urls.some((u) => u.endsWith(path))).toBe(false);
    }
  });
});

describe("truncateDescription", () => {
  it("leaves short text alone, collapsing extra whitespace", () => {
    expect(truncateDescription("  A short\n summary. ")).toBe("A short summary.");
  });

  it("cuts long text at a word boundary and adds an ellipsis", () => {
    const text = "God is still working supernatural wonders in the lives of those who believe ".repeat(4);
    const result = truncateDescription(text);
    expect(result.length).toBeLessThanOrEqual(155);
    expect(result.endsWith("…")).toBe(true);
    expect(text.startsWith(result.slice(0, -1))).toBe(true);
    expect(text.charAt(result.length - 1)).toBe(" ");
  });
});

describe("seriesDescription", () => {
  it("states the sermon count and the years they span", () => {
    expect(seriesDescription("Faith", ["2021-05-02", "2019-01-06", "2020-03-01"])).toBe(
      'Listen to all 3 sermons in the "Faith" series (2019–2021) on Messages.'
    );
  });

  it("handles a single sermon and a single year", () => {
    expect(seriesDescription("Easter", ["2024-03-31"])).toBe('Listen to the sermon in the "Easter" series (2024) on Messages.');
  });
});

describe("share image", () => {
  it("every page built with pageMetadata carries the default 1200×630 image", () => {
    const meta = pageMetadata({ title: "t", description: "d", path: "/ai" });
    expect(meta.openGraph).toMatchObject({ images: [{ url: "/og-default.jpg", width: 1200, height: 630 }] });
    expect(meta.twitter).toMatchObject({ images: [{ url: "/og-default.jpg" }] });
  });

  it("uses a page's own square artwork with X's square card", () => {
    const meta = pageMetadata({ title: "t", description: "d", path: "/series/s1", image: "https://x.supabase.co/a.webp" });
    expect(meta.openGraph).toMatchObject({ images: ["https://x.supabase.co/a.webp"] });
    expect(meta.twitter).toMatchObject({ card: "summary", images: ["https://x.supabase.co/a.webp"] });
  });
});

describe("structured data", () => {
  const sermon = {
    id: "abc",
    title: "Faith </script><script>alert(1)</script>",
    date_preached: "2026-09-27",
    audio_url: "https://archive.org/download/x/y.mp3",
    artwork_url: "ERROR",
    ai_summary: "A message about faith.",
    preachers: null,
    series: { id: "s1", name: "Global Miracle Service", thumbnail_url: null },
  } as unknown as SermonWithRelations;

  it("escapes \"<\" so stored text can't close the script tag", () => {
    const json = serializeJsonLd(sermonJsonLd(sermon));
    expect(json).not.toContain("<");
    expect(JSON.parse(json).name).toBe(sermon.title);
  });

  it("describes a sermon with only the facts it has", () => {
    const data = sermonJsonLd(sermon);
    expect(data).toMatchObject({
      "@type": "AudioObject",
      url: "https://messages.muyiwaareo.com/sermons/abc",
      contentUrl: "https://archive.org/download/x/y.mp3",
      datePublished: "2026-09-27",
      isPartOf: { name: "Global Miracle Service" },
    });
    // No preacher recorded, and "ERROR" is not an image
    expect(data).not.toHaveProperty("creator");
    expect(data).not.toHaveProperty("thumbnailUrl");
  });

  it("names the site and its publisher on the home page", () => {
    const graph = homeJsonLd("info@example.org")["@graph"] as Record<string, unknown>[];
    expect(graph.map((n) => n["@type"])).toEqual(["WebSite", "Organization"]);
    expect(graph[1]).toMatchObject({ name: "Muyiwa Areo Ministry International", email: "info@example.org" });
  });
});
