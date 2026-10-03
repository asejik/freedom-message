import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSeries } from "@/lib/sermon-server";
import { pageMetadata, seriesDescription } from "@/lib/seo";
import { usableImageUrl } from "@/lib/utils";
import { SeriesDetail } from "@/components/series/SeriesDetail";

// Rendered on the server with the series' sermons in the HTML, then cached for 5 minutes
// (the same freshness as sermon pages and the public lists).
export const revalidate = 300;

// None built ahead of time; each series is rendered on its first visit (Next.js needs this list).
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  // Same cached query as the page
  const result = await getSeries(id);
  if (!result) return { title: "Series" };
  const { series, sermons } = result;
  return pageMetadata({
    title: series.name,
    description: seriesDescription(series.name, sermons.map((s) => s.date_preached)),
    path: `/series/${series.id}`,
    image: usableImageUrl(series.thumbnail_url),
  });
}

export default async function SeriesPage({ params }: Props) {
  const { id } = await params;
  const result = await getSeries(id);
  // A series that doesn't exist gets a real 404
  if (result === null) notFound();
  return <SeriesDetail seriesId={id} initial={result} />;
}
