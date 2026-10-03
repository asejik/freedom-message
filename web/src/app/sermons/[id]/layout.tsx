import type { Metadata } from "next";
import { getSermon } from "@/lib/sermon-server";
import { usableImageUrl } from "@/lib/utils";
import { OPEN_GRAPH_BASE, truncateDescription } from "@/lib/seo";

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
        title: "Sermon",
        description: "Listen to sermon audio on Messages.",
      };
    }

    // Only name a preacher when one is recorded (32 sermons have none)
    const preacherName = sermon.preachers?.name;
    // The root layout's title template already appends " | Messages"
    const title = preacherName ? `${sermon.title} — ${preacherName}` : sermon.title;
    const description = sermon.ai_summary
      ? truncateDescription(sermon.ai_summary)
      : `Listen to "${sermon.title}"${preacherName ? ` by ${preacherName}` : ""} on Messages.`;

    const artwork = usableImageUrl(sermon.artwork_url);
    const images = artwork ? [artwork] : [];

    return {
      title,
      description,
      alternates: { canonical: `/sermons/${id}` },
      // A page about one recording; shares the site name and locale (see OPEN_GRAPH_BASE)
      openGraph: {
        ...OPEN_GRAPH_BASE,
        type: "article",
        publishedTime: sermon.date_preached,
        title,
        description,
        url: `/sermons/${id}`,
        images,
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
      title: "Sermon",
      description: "Listen to sermon audio on Messages.",
    };
  }
}

export default function SermonLayout({ children }: SermonLayoutProps) {
  return <>{children}</>;
}
