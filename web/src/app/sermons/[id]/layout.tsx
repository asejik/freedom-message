import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";

interface SermonLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  try {
    const { data: sermon } = await supabase
      .from("sermons")
      .select("title, ai_summary, artwork_url, preachers(name)")
      .eq("id", id)
      .single();

    if (!sermon) {
      return {
        title: "Sermon | Freedom Messages",
        description: "Listen to sermon audio on Freedom Messages.",
      };
    }

    const preacherName = (sermon.preachers as unknown as { name?: string })?.name || "Apostle Muyiwa Areo";
    const title = `${sermon.title} — ${preacherName}`;
    const description = sermon.ai_summary 
      ? sermon.ai_summary.slice(0, 160) 
      : `Listen to "${sermon.title}" by ${preacherName} on Freedom Messages.`;

    const images = sermon.artwork_url ? [sermon.artwork_url] : [];

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "music.song",
        images,
        siteName: "Freedom Messages",
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
      title: "Sermon | Freedom Messages",
      description: "Listen to sermon audio on Freedom Messages.",
    };
  }
}

export default function SermonLayout({ children }: SermonLayoutProps) {
  return <>{children}</>;
}
