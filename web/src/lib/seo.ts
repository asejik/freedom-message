/** The site's one public address: used for canonicals, the sitemap and link previews. */
export const SITE_URL = "https://messages.muyiwaareo.com";
export const SITE_NAME = "Messages";

/**
 * Open Graph fields every page shares. Next.js merges metadata shallowly, so a page that
 * sets its own `openGraph` replaces the root layout's whole object: spread this into it
 * so the site name and locale aren't lost.
 */
export const OPEN_GRAPH_BASE = {
  siteName: SITE_NAME,
  locale: "en_US",
  type: "website",
} as const;
