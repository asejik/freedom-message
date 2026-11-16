import { notFound } from "next/navigation";
import { getSermon } from "@/lib/sermon-server";
import { SermonDetail } from "@/components/sermons/SermonDetail";
import { JsonLd } from "@/components/seo/JsonLd";
import { sermonJsonLd } from "@/lib/seo";

// Rendered on the server with the sermon already in the HTML (the slowest page on
// phones used to fetch it only after its JavaScript ran). The admin routes refresh
// this page when a sermon, preacher or series changes (lib/server/revalidate.ts), so
// the timer is only a 7-day safety net. A short timer made every crawler visit
// regenerate and re-store the page (Vercel ISR writes).
export const revalidate = 604800;

// No sermons are built ahead of time; each is rendered on its first visit, then cached
// until an admin change or the 7-day timer refreshes it (Next.js requires this empty list for that).
export async function generateStaticParams() {
  return [];
}

export default async function SermonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sermon = await getSermon(id);
  // A sermon that doesn't exist gets a real 404 (not a 200 "not found" page)
  if (sermon === null) notFound();
  // On the live site, fail the render rather than cache a page without its data for
  // 7 days: Next.js keeps the last good copy and tries again on the next visit.
  // Elsewhere (CI and e2e have no database) the page loads its data in the browser.
  if (sermon === undefined && process.env.VERCEL) throw new Error("Sermon could not be loaded from the database");
  return (
    <>
      {/* Skipped when the server couldn't load the sermon (the page then loads it in the browser) */}
      {sermon && <JsonLd data={sermonJsonLd(sermon)} />}
      <SermonDetail sermonId={id} initialSermon={sermon} />
    </>
  );
}
