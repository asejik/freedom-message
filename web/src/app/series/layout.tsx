import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// The page is a client component, so its metadata lives here. Single-series views
// (?series=…) share this canonical until they get their own titles (SEO-8).
export const metadata: Metadata = pageMetadata({
  title: "Sermon series",
  description: "Every sermon series, in order.",
  path: "/series",
});

export default function SeriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
