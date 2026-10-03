import type { Metadata, MetadataRoute } from "next";
import type { SermonWithRelations } from "@/types/database";
import { isHttpUrl, usableImageUrl } from "@/lib/utils";

/** The site's one public address: used for canonicals, the sitemap and link previews. */
export const SITE_URL = "https://messages.muyiwaareo.com";
export const SITE_NAME = "Messages";

/**
 * The 1200×630 card shown when a page without its own image is shared (public/og-default.jpg).
 * Referenced explicitly: Next's opengraph-image file is dropped by any page that sets openGraph.
 */
export const DEFAULT_SHARE_IMAGE = {
  url: "/og-default.jpg",
  width: 1200,
  height: 630,
  alt: "Messages: sermons by Apostle Muyiwa Areo",
};

/**
 * Open Graph fields every page shares. Next.js merges metadata shallowly, so a page that
 * sets its own `openGraph` replaces the root layout's whole object: spread this into it
 * so the site name and locale aren't lost.
 */
export const OPEN_GRAPH_BASE = {
  siteName: SITE_NAME,
  locale: "en_US",
  type: "website" as const,
  images: [DEFAULT_SHARE_IMAGE],
};

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
    twitter: { card: "summary_large_image", title, description, images: [DEFAULT_SHARE_IMAGE] },
  };
}

/** Public pages that aren't sermons. Keep in sync with the routes that use pageMetadata(). */
export const PUBLIC_PATHS = ["/", "/search", "/series", "/ai", "/privacy"] as const;

/**
 * Sitemap entries: the public pages, then one per sermon. No `lastModified`: sermons have
 * no updated-at column, and search engines ignore dates that aren't reliably accurate.
 */
export function sitemapEntries(sermonIds: readonly string[]): MetadataRoute.Sitemap {
  return [
    ...PUBLIC_PATHS.map((path) => ({ url: `${SITE_URL}${path === "/" ? "" : path}` })),
    ...sermonIds.map((id) => ({ url: `${SITE_URL}/sermons/${id}` })),
  ];
}

/** Shortens text for a meta description at a word boundary (results show about 155 characters). */
export function truncateDescription(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  // Fall back to a hard cut only if the text has no space in a sensible place
  const shortened = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${shortened.replace(/[\s,;:.]+$/, "")}…`;
}

// ── Structured data (JSON-LD) ────────────────────────────────────────────────
// Only facts the site already shows. Never add ratings, reviews or invented details.

/** The ministry that publishes the sermons (as named in the site footer). */
const PUBLISHER = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Muyiwa Areo Ministry International",
  url: "https://www.muyiwaareo.com",
  logo: `${SITE_URL}/icon-512.png`,
};

/**
 * JSON for a <script type="application/ld+json"> tag. "<" is escaped so stored text
 * (titles, summaries) can never close the script tag and inject HTML.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Home page: the site (its name in search results) and its publisher. */
export function homeJsonLd(contactEmail: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: "en",
        publisher: { "@id": PUBLISHER["@id"] },
      },
      { ...PUBLISHER, email: contactEmail },
    ],
  };
}

/** A sermon page: the recording, with only the fields the page displays. */
export function sermonJsonLd(sermon: SermonWithRelations): Record<string, unknown> {
  const url = `${SITE_URL}/sermons/${sermon.id}`;
  const artwork = usableImageUrl(sermon.artwork_url);
  return {
    "@context": "https://schema.org",
    "@type": "AudioObject",
    "@id": url,
    url,
    name: sermon.title,
    // Summaries can run to several KB and are already on the page: keep the HTML light
    ...(sermon.ai_summary ? { description: truncateDescription(sermon.ai_summary, 300) } : {}),
    ...(isHttpUrl(sermon.audio_url) ? { contentUrl: sermon.audio_url.trim(), encodingFormat: "audio/mpeg" } : {}),
    datePublished: sermon.date_preached,
    inLanguage: "en",
    ...(artwork ? { thumbnailUrl: artwork } : {}),
    // Only name a preacher when one is recorded
    ...(sermon.preachers?.name ? { creator: { "@type": "Person", name: sermon.preachers.name } } : {}),
    ...(sermon.series?.name ? { isPartOf: { "@type": "CreativeWorkSeries", name: sermon.series.name } } : {}),
    publisher: { "@type": "Organization", name: PUBLISHER.name, url: PUBLISHER.url },
  };
}
