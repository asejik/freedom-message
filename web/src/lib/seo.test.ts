import { describe, expect, it } from "vitest";
import { pageMetadata } from "@/lib/seo";

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
