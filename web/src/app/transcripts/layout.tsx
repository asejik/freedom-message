import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transcripts Explorer | The Messages',
  description: 'Search, read, and export sermon transcripts.',
  robots: { index: false, follow: false },
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
