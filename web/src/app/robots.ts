import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Everything may be crawled. Private pages use a noindex tag instead (a crawler must be able
// to fetch a page to read it). Don't block /api/: Google needs /api/sermons to render the
// pages that load their sermons in the browser.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
