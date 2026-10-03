import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// The page is a client component, so its metadata lives here
export const metadata: Metadata = pageMetadata({
  title: "Ask AI about the sermons",
  description: "Ask a question and get an answer drawn from the sermon library, with links to the sermons.",
  path: "/ai",
});

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
