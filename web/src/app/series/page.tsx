"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef, Suspense } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import { artworkGradient } from "@/lib/utils";
import type { Series, SermonWithRelations } from "@/types/database";
import { SermonCard } from "@/components/sermons/SermonCard";

const YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const y = (2026 - i).toString();
  return { id: y, label: y };
});

// ── Year Filter Dropdown (Portal-based, matching Home & Search pages) ─────────
function FilterDropdown({
  label,
  value,
  options,
  onSelect,
  onClear,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onSelect: (val: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleOpen = () => {
    if (open) { setOpen(false); return; }
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropW = Math.min(220, window.innerWidth - 24);
      const leftRaw = rect.left;
      const left = Math.min(Math.max(12, leftRaw), window.innerWidth - dropW - 12);
      setDropdownPos({ top: rect.bottom + 6, left, width: dropW });
    }
    setSearch("");
    setOpen(true);
  };

  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`h-10 px-3.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap border shrink-0 ${
          value
            ? "bg-white text-black border-white font-semibold shadow-md"
            : "bg-white/10 text-white border-white/5 hover:bg-white/15"
        }`}
      >
        <span>{value ? `${label}: ${value}` : label}</span>
        {value ? (
          <span
            onClick={(e) => { e.stopPropagation(); onClear(); setOpen(false); }}
            className="material-symbols-outlined text-[14px] hover:opacity-75 ml-0.5"
          >
            close
          </span>
        ) : (
          <span className="material-symbols-outlined text-[16px] opacity-70">expand_more</span>
        )}
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, position: "fixed", zIndex: 999999 }}
          className="max-h-72 bg-[#121212] border border-white/15 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden"
        >
          {options.length > 6 && (
            <div className="p-2 border-b border-white/10 shrink-0">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none placeholder:text-[#AAAAAA]"
              />
            </div>
          )}
          <div className="overflow-y-auto p-1.5 space-y-0.5 flex-1">
            <button
              onClick={() => { onClear(); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-[#AAAAAA] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              All {label}s (Clear)
            </button>
            {filtered.map((opt) => (
              <button
                key={opt.id}
                onClick={() => { onSelect(opt.label); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition-colors flex items-center justify-between ${
                  value === opt.label ? "bg-white text-black font-bold" : "text-white hover:bg-white/10"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {value === opt.label && <span className="material-symbols-outlined text-[16px]">check</span>}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function SeriesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedSeries = searchParams.get("series") || searchParams.get("name");
  const selectedYear = searchParams.get("year") || "";

  const [search, setSearch] = useState("");
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
  const { data: seriesResult, isLoading: seriesLoading } = useQuery<{ data: Series[]; count: number }>({
    queryKey: ["series", "paginated", search, selectedYear, page],
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

      if (search) {
        q = q.ilike("name", `%${search}%`);
      }

      const { data, count, error } = await q;
      if (error) throw error;
      return { data: (data as unknown as Series[]) || [], count: count || 0 };
    },
  });

  // Query for Sermons in Selected Series
  const { data: sermonsInSeries, isLoading: sermonsLoading } = useQuery<{ data: SermonWithRelations[]; count: number }>({
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
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">arrow_back</span>
            <span>Back to All Series</span>
          </button>

          <div className="flex items-center gap-2">
            <FilterDropdown
              label="Year"
              value={selectedYear}
              options={YEAR_OPTIONS}
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
          <span className="material-symbols-outlined text-[#AAAAAA] mr-2.5 text-[18px] sm:text-[20px]">search</span>
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
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="text-[#AAAAAA] hover:text-white ml-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Year Filter Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <FilterDropdown
            label="Year"
            value={selectedYear}
            options={YEAR_OPTIONS}
            onSelect={handleYearChange}
            onClear={() => handleYearChange("")}
          />

          {isFiltering && (
            <button
              onClick={handleClearFilters}
              className="h-10 px-3 rounded-full text-xs font-semibold text-[#AAAAAA] hover:text-white hover:bg-white/10 transition-colors hidden sm:flex items-center gap-1 shrink-0"
              title="Reset all filters"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
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
                        <img src={s.thumbnail_url} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                          <span className="material-symbols-outlined text-[32px] text-white/30 drop-shadow-md">
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
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30 hover:bg-white/20 transition-colors"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <span className="text-[#AAAAAA] font-semibold text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30 hover:bg-white/20 transition-colors"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
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
