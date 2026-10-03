import { serializeJsonLd } from "@/lib/seo";

/** Structured data for search engines (server-rendered, so it's in the raw HTML). */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // serializeJsonLd escapes "<", so stored text can't close this tag (Next.js's JSON-LD guide)
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
