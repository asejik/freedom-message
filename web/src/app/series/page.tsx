"use client";

import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { artworkGradient } from "@/lib/utils";
import type { Series, SermonWithRelations } from "@/types/database";
import { SermonCard } from "@/components/sermons/SermonCard";
import { FilterDropdown } from "@/components/filters/FilterDropdown";
import { getYearOptions } from "@/lib/years";
import { LoadError } from "@/components/ui/LoadError";

function SeriesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedSeries = searchParams.get("series") || searchParams.get("name");
  const selectedYear = searchParams.get("year") || "";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  const limit = 24;

  const handleYearChange = (newYear: string) => {
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (newYear) {
      params.set("year", newYear);
    } else {
      params.delete("year");
    }
    const qs = params.toString();
    router.push(qs ? `/series?${qs}` : "/series");
  };

  const handleClearFilters = () => {
    setSearch("");
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("year");
    const qs = params.toString();
    router.push(qs ? `/series?${qs}` : "/series");
  };

  // Query for All Series List
  const { data: seriesResult, isLoading: seriesLoading, isError: seriesError, refetch: refetchSeries } = useQuery<{ data: Series[]; count: number }>({
    queryKey: ["series", "paginated", debouncedSearch, selectedYear, page],
    enabled: !selectedSeries,
    queryFn: async () => {
      let selectFields = "id, name, thumbnail_url, created_at";
      if (selectedYear) {
        selectFields = "id, name, thumbnail_url, created_at, sermons!inner(id, date_preached)";
      }

      let q = supabase
        .from("series")
        .select(selectFields, { count: "exact" })
        .order("name", { ascending: true })
        .range((page - 1) * limit, page * limit - 1);

      if (selectedYear) {
        q = q
          .gte("sermons.date_preached", `${selectedYear}-01-01`)
          .lte("sermons.date_preached", `${selectedYear}-12-31`);
      }

      if (debouncedSearch) {
        q = q.ilike("name", `%${debouncedSearch}%`);
      }

      const { data, count, error } = await q;
      if (error) throw error;
      return { data: (data as unknown as Series[]) || [], count: count || 0 };
    },
  });

  // Query for Sermons in Selected Series
  const { data: sermonsInSeries, isLoading: sermonsLoading, isError: sermonsError, refetch: refetchSermons } = useQuery<{ data: SermonWithRelations[]; count: number }>({
    queryKey: ["sermons", "series", selectedSeries, selectedYear],
    enabled: !!selectedSeries,
    queryFn: async () => {
      const url = new URL("/api/sermons", window.location.origin);
      url.searchParams.set("series", selectedSeries!);
      if (selectedYear) {
        url.searchParams.set("year", selectedYear);
      }
      url.searchParams.set("limit", "50");
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch series sermons");
      return res.json();
    },
  });

  const totalPages = seriesResult?.count ? Math.ceil(seriesResult.count / limit) : 1;
  const isFiltering = !!(selectedYear || search.trim());

  // ── Selected Series View (Sermons in Series) ──────────────────────────────────
  if (selectedSeries) {
    const backHref = selectedYear ? `/series?year=${encodeURIComponent(selectedYear)}` : "/series";

    return (
      <div className="w-full flex flex-col pb-[120px] text-white">
        <header className="sticky top-0 z-40 bg-[#030303]/90 backdrop-blur-xl w-full h-14 sm:h-[72px] flex items-center justify-between px-4 sm:px-6 border-b border-white/5 gap-3">
          <button
            onClick={() => router.push(backHref)}
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#AAAAAA] hover:text-white bg-white/10 hover:bg-white/15 px-3 sm:px-3.5 py-1.5 rounded-full transition-colors shrink-0"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[16px] sm:text-[18px]">arrow_back</span>
            <span>Back to All Series</span>
          </button>

          <div className="flex items-center gap-2">
            <FilterDropdown
              label="Year"
              value={selectedYear}
              options={getYearOptions()}
            menuWidth={220}
              onSelect={handleYearChange}
              onClear={() => handleYearChange("")}
            />
          </div>
        </header>

        <div className="px-4 sm:px-6 md:px-12 py-5 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-primary">Series Archive</span>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1 text-white">{selectedSeries}</h1>
            <p className="text-xs sm:text-sm text-[#AAAAAA] mt-1">
              {sermonsInSeries?.count !== undefined
                ? `${sermonsInSeries.count} sermon${sermonsInSeries.count === 1 ? "" : "s"} found${selectedYear ? ` in ${selectedYear}` : ""}`
                : "Browse messages"}
            </p>
          </div>

          {sermonsLoading ? (
            <div className="h-40 flex items-center justify-center">
              <Loader2 className="animate-spin text-white/40" />
            </div>
          ) : sermonsError ? (
            <LoadError onRetry={() => refetchSermons()} />
          ) : !sermonsInSeries?.data || sermonsInSeries.data.length === 0 ? (
            <div className="text-center text-[#AAAAAA] py-12 text-sm">
              No sermons found in this series{selectedYear ? ` for year ${selectedYear}` : ""}.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
              {sermonsInSeries.data.map((sermon, idx) => (
                <SermonCard key={sermon.id} sermon={sermon} index={idx} layout="grid" />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── All Series Catalog View ───────────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col pb-[120px] text-white">
      <header className="sticky top-0 z-40 bg-[#030303]/90 backdrop-blur-xl w-full h-14 sm:h-[72px] flex items-center px-4 sm:px-6 gap-2.5 sm:gap-4 border-b border-white/5">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight hidden md:block w-[100px] shrink-0">Series</h1>

        {/* Search Bar */}
        <div className="max-w-[420px] flex-1 bg-white/10 hover:bg-white/15 transition-colors border border-white/5 rounded-full h-10 sm:h-12 flex items-center px-3.5 sm:px-4">
          <span aria-hidden="true" className="material-symbols-outlined text-[#AAAAAA] mr-2.5 text-[18px] sm:text-[20px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search series by name..."
            className="bg-transparent border-none outline-none text-white w-full placeholder:text-[#AAAAAA] text-xs sm:text-sm"
          />
          {search && (
            <button aria-label="Clear search"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="text-[#AAAAAA] hover:text-white ml-1"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Year Filter Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <FilterDropdown
            label="Year"
            value={selectedYear}
            options={getYearOptions()}
            menuWidth={220}
            onSelect={handleYearChange}
            onClear={() => handleYearChange("")}
          />

          {isFiltering && (
            <button
              onClick={handleClearFilters}
              className="h-10 px-3 rounded-full text-xs font-semibold text-[#AAAAAA] hover:text-white hover:bg-white/10 transition-colors hidden sm:flex items-center gap-1 shrink-0"
              title="Reset all filters"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[14px]">close</span>
              Clear
            </button>
          )}
        </div>
      </header>

      <div className="px-4 sm:px-6 md:px-12 py-5 sm:py-8">
        <div className="flex justify-between items-end mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
              All Series {selectedYear ? `(${selectedYear})` : ""}
            </h2>
            <p className="text-[#AAAAAA] text-xs sm:text-sm">
              {seriesResult?.count !== undefined
                ? `${seriesResult.count} series ${selectedYear ? `with messages preached in ${selectedYear}` : "grouped by themes and events"}`
                : "Browse sermons grouped by series themes and events."}
            </p>
          </div>
        </div>

        {seriesLoading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="animate-spin text-white/40" />
          </div>
        ) : seriesError ? (
          <LoadError onRetry={() => refetchSeries()} />
        ) : !seriesResult?.data.length ? (
          <div className="text-center text-[#AAAAAA] py-12 text-sm">
            No series found{selectedYear ? ` for ${selectedYear}` : ""}{search ? ` matching "${search}"` : ""}.
          </div>
        ) : (
          <>
            {/* Compact Grid Layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3.5 sm:gap-4">
              {seriesResult.data.map((s) => {
                const gradient = artworkGradient(s.name);
                const seriesHref = `/series?series=${encodeURIComponent(s.name)}${selectedYear ? `&year=${encodeURIComponent(selectedYear)}` : ""}`;

                return (
                  <Link
                    key={s.id}
                    href={seriesHref}
                    className="group flex flex-col gap-1.5"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-surface-container relative shadow-md border border-white/10 group-hover:scale-105 transition-transform duration-300">
                      {s.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.thumbnail_url} alt={s.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                          <span aria-hidden="true" className="material-symbols-outlined text-[32px] text-white/30 drop-shadow-md">
                            library_music
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:underline underline-offset-2 decoration-white/30 mt-0.5">
                      {s.name}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <button aria-label="Previous page"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30 hover:bg-white/20 transition-colors"
                >
                  <span aria-hidden="true" className="material-symbols-outlined">chevron_left</span>
                </button>
                <span className="text-[#AAAAAA] font-semibold text-sm">
                  Page {page} of {totalPages}
                </span>
                <button aria-label="Next page"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30 hover:bg-white/20 transition-colors"
                >
                  <span aria-hidden="true" className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SeriesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-40 flex items-center justify-center">
          <Loader2 className="animate-spin text-white/40" />
        </div>
      }
    >
      <SeriesContent />
    </Suspense>
  );
}
