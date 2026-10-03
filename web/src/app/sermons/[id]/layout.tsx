import type { Metadata } from "next";
import { getSermon } from "@/lib/sermon-server";

interface SermonLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  try {
    // Same cached query as the page, so a page view costs one database round trip
    const sermon = await getSermon(id);

    if (!sermon || !sermon.title) {
      return {
        title: "Sermon | Messages",
        description: "Listen to sermon audio on Messages.",
      };
    }

    // Only name a preacher when one is recorded (32 sermons have none)
    const preacherName = sermon.preachers?.name;
    // The root layout's title template already appends " | Messages"
    const title = preacherName ? `${sermon.title} — ${preacherName}` : sermon.title;
    const description = sermon.ai_summary
      ? sermon.ai_summary.slice(0, 160)
      : `Listen to "${sermon.title}"${preacherName ? ` by ${preacherName}` : ""} on Messages.`;

    const images = sermon.artwork_url ? [sermon.artwork_url] : [];

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "music.song",
        images,
        siteName: "Messages",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images,
      },
    };
  } catch {
    return {
      title: "Sermon | Messages",
      description: "Listen to sermon audio on Messages.",
    };
  }
}

export default function SermonLayout({ children }: SermonLayoutProps) {
  return <>{children}</>;
}
