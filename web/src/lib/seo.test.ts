import { describe, expect, it } from "vitest";
import { pageMetadata, sitemapEntries, truncateDescription } from "@/lib/seo";

describe("pageMetadata", () => {
  const meta = pageMetadata({ title: "Sermon series", description: "Every series.", path: "/series" });

  it("gives the page a self-referencing canonical and a matching preview URL", () => {
    expect(meta.alternates?.canonical).toBe("/series");
    expect(meta.openGraph).toMatchObject({ url: "/series", title: "Sermon series", description: "Every series." });
  });

  it("keeps the shared site name and locale in the page's own Open Graph object", () => {
    expect(meta.openGraph).toMatchObject({ siteName: "Messages", locale: "en_US" });
  });

  it("uses the title template unless the title is marked absolute", () => {
    expect(meta.title).toBe("Sermon series");
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
