"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { SermonWithRelations } from "@/types/database";
import { SermonCard } from "@/components/sermons/SermonCard";
import { FilterDropdown } from "@/components/filters/FilterDropdown";
import { LoadError } from "@/components/ui/LoadError";
import { getYearOptions } from "@/lib/years";
import { SERIES_SERMON_LIMIT } from "@/lib/supabase";
import type { SeriesWithSermons } from "@/lib/sermon-server";

async function fetchSeriesSermons(seriesId: string): Promise<SermonWithRelations[]> {
  const url = new URL("/api/sermons", window.location.origin);
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("limit", String(SERIES_SERMON_LIMIT));
  url.searchParams.set("count", "false");
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch series sermons");
  const json = await res.json();
  return json.data ?? [];
}

/**
 * One series and its sermons. `initial` is the server-rendered data (so the sermons are in
 * the HTML); without it (the server couldn't load it) the sermons are fetched in the browser.
 * The year filter is page state, not a URL parameter: reading search params here would stop
 * the page from being rendered on the server.
 */
export function SeriesDetail({ seriesId, initial }: { seriesId: string; initial?: SeriesWithSermons }) {
  const [selectedYear, setSelectedYear] = useState("");

  const { data: sermons, isLoading, isError, refetch } = useQuery<SermonWithRelations[]>({
    queryKey: ["sermons", "series", seriesId],
    queryFn: () => fetchSeriesSermons(seriesId),
    initialData: initial?.sermons,
  });

  const seriesName = initial?.series.name ?? sermons?.[0]?.series?.name ?? "Series";
  const shown = selectedYear ? (sermons ?? []).filter((s) => s.date_preached.startsWith(selectedYear)) : sermons;

  return (
    <div className="w-full flex flex-col pb-[120px] text-white">
      <header className="sticky top-0 z-40 bg-[#030303]/90 backdrop-blur-xl w-full h-14 sm:h-[72px] flex items-center justify-between px-4 sm:px-6 border-b border-white/5 gap-3">
        <Link
          href="/series"
          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#AAAAAA] hover:text-white bg-white/10 hover:bg-white/15 px-3 sm:px-3.5 py-1.5 rounded-full transition-colors shrink-0"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] sm:text-[18px]">arrow_back</span>
          <span>Back to All Series</span>
        </Link>

        <div className="flex items-center gap-2">
          <FilterDropdown
            label="Year"
            value={selectedYear}
            options={getYearOptions()}
            menuWidth={220}
            onSelect={setSelectedYear}
            onClear={() => setSelectedYear("")}
          />
        </div>
      </header>

      <div className="px-4 sm:px-6 md:px-12 py-5 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-400">Series Archive</span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1 text-white">{seriesName}</h1>
          <p className="text-xs sm:text-sm text-[#AAAAAA] mt-1">
            {shown
              ? `${shown.length} sermon${shown.length === 1 ? "" : "s"} found${selectedYear ? ` in ${selectedYear}` : ""}`
              : "Browse messages"}
          </p>
        </div>

        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="animate-spin text-white/40" />
          </div>
        ) : isError ? (
          <LoadError onRetry={() => refetch()} />
        ) : !shown || shown.length === 0 ? (
          <div className="text-center text-[#AAAAAA] py-12 text-sm">
            No sermons found in this series{selectedYear ? ` for year ${selectedYear}` : ""}.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
            {shown.map((sermon, idx) => (
              <SermonCard key={sermon.id} sermon={sermon} index={idx} layout="grid" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
