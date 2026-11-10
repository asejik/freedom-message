import type { Metadata } from 'next';
import { OPEN_GRAPH_BASE } from '@/lib/seo';

const TITLE = 'Transcripts Explorer';
const DESCRIPTION = 'Search, read, and export sermon transcripts. Private access for church units.';

// The page's own link-preview card (public/og-transcripts.jpg). Its text sits inside the
// centre square, because WhatsApp crops the small preview to it.
const SHARE_IMAGE = {
  url: '/og-transcripts.jpg',
  width: 1200,
  height: 630,
  alt: 'Messages Transcripts Explorer: search, read and export sermon transcripts',
};

export const metadata: Metadata = {
  // The root layout's title template appends " | Messages"
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  // Without these the page inherits the site-wide "Sermon Library" preview
  openGraph: { ...OPEN_GRAPH_BASE, title: TITLE, description: DESCRIPTION, url: '/transcripts', images: [SHARE_IMAGE] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [SHARE_IMAGE] },
};

export default function TranscriptsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen bg-[#08090b] text-white flex flex-col">
      {children}
    </div>
  );
}
