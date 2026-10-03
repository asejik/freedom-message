import type { Metadata } from "next";
import { homeJsonLd, pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { CONTACT_EMAIL } from "@/components/layout/SiteFooter";

// The page is a client component, so its metadata lives in this layout (route group: same URL /)
export const metadata: Metadata = pageMetadata({
  title: "Messages: Sermons by Apostle Muyiwa Areo",
  description: "Listen to and search over 1,400 sermons by Apostle Muyiwa Areo and other ministers, from 2015 to today.",
  path: "/",
  absoluteTitle: true,
});

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={homeJsonLd(CONTACT_EMAIL)} />
      {children}
    </>
  );
}
