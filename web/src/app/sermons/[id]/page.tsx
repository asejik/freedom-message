import { notFound } from "next/navigation";
import { getSermon } from "@/lib/sermon-server";
import { SermonDetail } from "@/components/sermons/SermonDetail";

// Rendered on the server with the sermon already in the HTML (the slowest page on
// phones used to fetch it only after its JavaScript ran). Cached for 5 minutes, the
// same freshness as the public sermon lists.
export const revalidate = 300;

// No sermons are built ahead of time; each is rendered on its first visit, then cached
// and refreshed in the background every 5 minutes (Next.js requires this empty list for that).
export async function generateStaticParams() {
  return [];
}

export default async function SermonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sermon = await getSermon(id);
  // A sermon that doesn't exist gets a real 404 (not a 200 "not found" page)
  if (sermon === null) notFound();
  return <SermonDetail sermonId={id} initialSermon={sermon} />;
}
