import type { Metadata } from "next";

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

interface PageMetadataInput {
  title: string;
  description: string;
  /** The page's own path, e.g. "/search" (made absolute through metadataBase) */
  path: string;
  /** Use the title as is, without the " | Messages" suffix (home page) */
  absoluteTitle?: boolean;
}

/**
 * Title, description, self-referencing canonical and matching preview tags for one page.
 * Never set a canonical in the root layout: every page without its own would inherit it
 * and point search engines at the home page instead.
 */
export function pageMetadata({ title, description, path, absoluteTitle = false }: PageMetadataInput): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { ...OPEN_GRAPH_BASE, title, description, url: path },
    twitter: { card: "summary_large_image", title, description },
  };
}
