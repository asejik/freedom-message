"use client";

import { useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { SermonCard } from "@/components/sermons/SermonCard";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { SermonWithRelations, Preacher } from "@/types/database";
import { FilterDropdown } from "@/components/filters/FilterDropdown";
import { DateFilterPicker } from "@/components/filters/DateFilterPicker";
import { getYearOptions } from "@/lib/years";
import { SermonShelf } from "@/components/home/SermonShelf";
import { QuickPicksSection } from "@/components/home/QuickPicksSection";

const MOODS = ["Grace", "Favour", "Faith", "Healing", "Redemption", "Righteousness"];

// ── Home shelf data ──────────────────────────────────────────────────────────
async function fetchRecentSermons(): Promise<SermonWithRelations[]> {
  const url = new URL("/api/sermons", window.location.origin);
  url.searchParams.set("limit", "20");
  url.searchParams.set("count", "false");
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch recent sermons");
  const json = await res.json();
  return json.data ?? [];
}

// Module-level so TanStack Query keeps the shuffled result stable between renders
function shuffleSermons(sermons: SermonWithRelations[]): SermonWithRelations[] {
  return [...sermons].sort(() => 0.5 - Math.random());
}

// ── Main Home Page Component ──────────────────────────────────────────────────
function HomeContent() {
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [selectedPreacher, setSelectedPreacher] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [gridPage, setGridPage] = useState(1);
  const gridLimit = 20;
  const debouncedSearch = useDebouncedValue(searchText);

  const isFiltering = !!(activeMood || debouncedSearch || selectedPreacher || selectedYear || selectedDate);

  const clearFilters = () => {
    setActiveMood(null);
    setSearchText("");
    setSelectedPreacher("");
    setSelectedYear("");
    setSelectedDate("");
    setGridPage(1);
  };

  // Preachers list for filter dropdown
  const { data: preachers } = useQuery<Preacher[]>({
    queryKey: ["preachers-list"],
    queryFn: async () => {
      const { data } = await supabase.from("preachers").select("id, name").order("name");
      return (data ?? []) as Preacher[];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes — preachers list rarely changes
  });

  // Featured and Recent share one cached request; Featured is a shuffled view of it
  const { data: featured, isLoading: featuredLoading } = useQuery<SermonWithRelations[], Error, SermonWithRelations[]>({
    queryKey: ["sermons", "recent"],
    enabled: !isFiltering,
    queryFn: fetchRecentSermons,
    select: shuffleSermons,
  });

  // Recent sermons query
  const { data: recent, isLoading: recentLoading } = useQuery<SermonWithRelations[]>({
    queryKey: ["sermons", "recent"],
    enabled: !isFiltering,
    queryFn: fetchRecentSermons,
  });

  // Filtered sermons query (when search/filters applied)
  const { data: gridResults, isLoading: gridLoading } = useQuery<{ data: SermonWithRelations[]; count: number }>({
    queryKey: ["sermons", "grid", activeMood, debouncedSearch, selectedPreacher, selectedYear, selectedDate, gridPage],
    enabled: isFiltering,
    queryFn: async () => {
      const url = new URL("/api/sermons", window.location.origin);
      url.searchParams.set("limit", gridLimit.toString());
      url.searchParams.set("page", gridPage.toString());
      if (activeMood) url.searchParams.set("tag", activeMood);
      if (debouncedSearch) url.searchParams.set("title", debouncedSearch);
      if (selectedPreacher) url.searchParams.set("preacher", selectedPreacher);
      if (selectedYear) url.searchParams.set("year", selectedYear);
      if (selectedDate) url.searchParams.set("date", selectedDate);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    },
  });

  const totalGridPages = gridResults?.count ? Math.ceil(gridResults.count / gridLimit) : 1;

  return (
    <div className="w-full min-h-full flex flex-col pb-[160px] relative">
      {/* ── Top Hero Background with feathered fading edges ── */}
      <div 
        className="absolute top-0 left-0 right-0 h-[480px] sm:h-[540px] md:h-[600px] pointer-events-none overflow-hidden z-0"
        style={{
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.3) 70%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.3) 70%, transparent 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-bg.jpg"
          alt="Hero Background"
          className="w-full h-full object-cover object-[center_25%] opacity-25 filter contrast-105 saturate-110"
        />
        {/* Smooth dark overlays for seamless blending */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030303]/30 via-[#030303]/65 to-[#030303]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030303] via-transparent to-[#030303] opacity-70" />
      </div>

      {/* ── Lower Section Background with feathered fading edges ── */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[480px] sm:h-[560px] md:h-[640px] pointer-events-none overflow-hidden z-0"
        style={{
          maskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.2) 75%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.2) 75%, transparent 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/footer-bg.jpg"
          alt="Lower Background"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-[center_20%] opacity-25 filter contrast-105 saturate-110"
        />
        {/* Smooth dark overlays for seamless blending */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030303]/30 via-[#030303]/65 to-[#030303]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030303] via-transparent to-[#030303] opacity-70" />
      </div>

      {/* ── Desktop Header: Search + All dropdowns in ONE single horizontal row ── */}
      <header className="hidden md:flex sticky top-0 z-40 bg-[#030303]/80 backdrop-blur-xl w-full items-center gap-3 px-6 md:px-12 py-3 border-b border-white/5">
        {/* Search input */}
        <div className="max-w-md w-full bg-white/10 hover:bg-white/15 transition-colors border border-white/5 rounded-full h-10 flex items-center px-4 shrink-0">
          <span className="material-symbols-outlined text-[#AAAAAA] mr-2 text-[18px]">search</span>
          <input
            type="text"
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setGridPage(1); }}
            placeholder="Search sermons..."
            className="bg-transparent border-none outline-none text-white w-full placeholder:text-[#AAAAAA] text-sm"
          />
          {searchText && (
            <button onClick={() => { setSearchText(""); setGridPage(1); }} className="ml-1 text-[#AAAAAA] hover:text-white">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Dropdowns on the same row */}
        <div className="flex items-center gap-2 flex-nowrap">
          <FilterDropdown
            label="Preacher"
            value={selectedPreacher}
            options={(preachers ?? []).map((p) => ({ id: p.id, label: p.name }))}
            onSelect={(v) => { setSelectedPreacher(v); setGridPage(1); }}
            onClear={() => { setSelectedPreacher(""); setGridPage(1); }}
          />
          <FilterDropdown
            label="Year"
            value={selectedYear}
            options={getYearOptions()}
            onSelect={(v) => { setSelectedYear(v); setGridPage(1); }}
            onClear={() => { setSelectedYear(""); setGridPage(1); }}
          />
          <DateFilterPicker
            value={selectedDate}
            onSelect={(v) => { setSelectedDate(v); setGridPage(1); }}
            onClear={() => { setSelectedDate(""); setGridPage(1); }}
          />

          {isFiltering && (
            <button
              onClick={clearFilters}
              className="h-10 px-3.5 rounded-full text-xs font-semibold text-[#AAAAAA] hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 shrink-0"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
              Clear
            </button>
          )}
        </div>
      </header>

      <div className="relative z-10 px-4 sm:px-6 md:px-12 py-5 sm:py-6 flex flex-col gap-8 sm:gap-12">
        {/* ── Mood Chips ── */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto hide-scrollbar pb-1 items-center">
          {/* Home button: visible when filtering to easily reset to default view */}
          {isFiltering && (
            <button
              onClick={clearFilters}
              className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all active:scale-95 bg-white/10 text-white hover:bg-white/20 flex items-center gap-1.5 shrink-0 border border-white/10"
            >
              <span className="material-symbols-outlined text-[16px]">home</span>
              Home
            </button>
          )}

          {MOODS.map((mood) => (
            <button
              key={mood}
              onClick={() => { setActiveMood(mood === activeMood ? null : mood); setGridPage(1); }}
              className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all active:scale-95 shrink-0 ${
                activeMood === mood ? "bg-white text-black font-bold shadow-sm" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {mood}
            </button>
          ))}

          {/* Clear filter chip */}
          {isFiltering && (
            <button
              onClick={clearFilters}
              className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm text-[#AAAAAA] hover:text-white whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
              Clear
            </button>
          )}
        </div>

        {/* ── Content area: Filtered Grid vs Default Shelves ── */}
        {isFiltering ? (
          <section>
            <p className="text-[#AAAAAA] text-xs sm:text-sm mb-4">
              Results for
              {activeMood ? ` Mood: "${activeMood}"` : ""}
              {searchText ? ` "${searchText}"` : ""}
              {selectedPreacher ? ` Preacher: "${selectedPreacher}"` : ""}
              {selectedYear ? ` Year: "${selectedYear}"` : ""}
              {selectedDate ? ` Date: "${selectedDate}"` : ""}
            </p>
            {gridLoading ? (
              <div className="h-[260px] flex items-center justify-center">
                <Loader2 className="animate-spin text-white/40" />
              </div>
            ) : !gridResults?.data || gridResults.data.length === 0 ? (
              <div className="text-center py-12 text-[#AAAAAA]">No sermons found matching your criteria.</div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
                  {gridResults.data.map((sermon, idx) => (
                    <SermonCard key={sermon.id} sermon={sermon} index={idx} layout="grid" />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalGridPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-12">
                    <button
                      onClick={() => setGridPage((p) => Math.max(1, p - 1))}
                      disabled={gridPage === 1}
                      className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30 hover:bg-white/20 transition-colors text-white"
                    >
                      <span className="material-symbols-outlined text-[22px] text-white">chevron_left</span>
                    </button>
                    <span className="text-[#AAAAAA] font-semibold text-sm">
                      Page {gridPage} of {totalGridPages}
                    </span>
                    <button
                      onClick={() => setGridPage((p) => Math.min(totalGridPages, p + 1))}
                      disabled={gridPage === totalGridPages}
                      className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30 hover:bg-white/20 transition-colors text-white"
                    >
                      <span className="material-symbols-outlined text-[22px] text-white">chevron_right</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        ) : (
          <>
            {/* Mobile: YouTube Music Quick Picks (4-item stacked swipeable columns) */}
            <QuickPicksSection sermons={featured} isLoading={featuredLoading} />

            {/* Desktop: Horizontal Featured Shelf with smart < > scroll arrows */}
            <div className="hidden md:block">
              <SermonShelf title="Featured Sermons" subtitle="Handpicked for you" sermons={featured} isLoading={featuredLoading} />
            </div>

            {/* Recent Sermons Shelf */}
            <SermonShelf title="Recent Sermons" subtitle="New releases" sermons={recent} isLoading={recentLoading} />
          </>
        )}
      </div>
    </div>
  );
}

export default function Homepage() {
  return (
    <Suspense
      fallback={
        <div className="h-[260px] flex items-center justify-center">
          <Loader2 className="animate-spin text-white/40" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
