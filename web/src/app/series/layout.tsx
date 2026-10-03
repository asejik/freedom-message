import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// The page is a client component, so its metadata lives here. Each series has its own
// page, /series/[id], which overrides this metadata.
export const metadata: Metadata = pageMetadata({
  title: "Sermon series",
  description: "Every sermon series, in order.",
  path: "/series",
});

export default function SeriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
