import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// The page is a client component, so its metadata lives here. Filtered views (?preacher=…)
// share this canonical.
export const metadata: Metadata = pageMetadata({
  title: "Browse sermons",
  description: "Filter the full sermon library by preacher, year and date.",
  path: "/search",
});

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
