import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// The page is a client component, so its metadata lives in this layout (route group: same URL /)
export const metadata: Metadata = pageMetadata({
  title: "Messages: Sermons by Apostle Muyiwa Areo",
  description: "Listen to and search over 1,400 sermons by Apostle Muyiwa Areo and other ministers, from 2015 to today.",
  path: "/",
  absoluteTitle: true,
});

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
