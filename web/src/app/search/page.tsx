"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { SermonCard } from "@/components/sermons/SermonCard";
import { Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { SermonWithRelations, Preacher } from "@/types/database";

const MOODS = ["Grace", "Favour", "Faith", "Healing", "Redemption", "Righteousness"];

// ── Filter Dropdown ──────────────────────────────────────────────────────────
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
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [search, setSearch] = useState("");
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
      const dropW = Math.min(256, window.innerWidth - 24);
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

// ── Date Picker ───────────────────────────────────────────────────────────────
function DateFilterPicker({
  value,
  onSelect,
  onClear,
}: {
  value: string;
  onSelect: (val: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState(value);
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
    setTempDate(value);
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropW = Math.min(280, window.innerWidth - 24);
      const leftRaw = rect.left;
      const left = Math.min(Math.max(12, leftRaw), window.innerWidth - dropW - 12);
      setDropdownPos({ top: rect.bottom + 6, left, width: dropW });
    }
    setOpen(true);
  };

  const formattedValue = value
    ? (() => {
        try {
          return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
        } catch { return value; }
      })()
    : "";

  const handleApply = () => {
    if (tempDate) {
      const yearMatch = tempDate.match(/^(\d{4})-\d{2}-\d{2}$/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1], 10);
        if (year >= 1900 && year <= 2100) { onSelect(tempDate); }
      }
    } else { onClear(); }
    setOpen(false);
  };

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
        <span className="material-symbols-outlined text-[16px] opacity-80">calendar_today</span>
        <span>{value ? formattedValue : "Date"}</span>
        {value ? (
          <span
            onClick={(e) => { e.stopPropagation(); onClear(); setTempDate(""); setOpen(false); }}
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
          className="p-3.5 bg-[#121212] border border-white/15 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.9)] flex flex-col gap-3"
        >
          <label className="text-xs font-semibold text-[#AAAAAA]">Select Specific Date</label>
          <input
            type="date"
            value={tempDate}
            onChange={(e) => {
              const val = e.target.value;
              setTempDate(val);
              if (!val) { onClear(); return; }
              const yearMatch = val.match(/^(\d{4})-\d{2}-\d{2}$/);
              if (yearMatch) {
                const year = parseInt(yearMatch[1], 10);
                if (year >= 1900 && year <= 2100) { onSelect(val); }
              }
            }}
            onKeyDown={(e) => { if (e.key === "Enter") handleApply(); }}
            className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex items-center justify-between gap-2 pt-1">
            {value ? (
              <button
                type="button"
                onClick={() => { onClear(); setTempDate(""); setOpen(false); }}
                className="text-xs text-red-400 hover:underline font-medium"
              >
                Clear Filter
              </button>
            ) : <div />}
            <button
              type="button"
              onClick={handleApply}
              className="bg-white text-black px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-white/90 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ── Search Content ────────────────────────────────────────────────────────────
function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [searchText, setSearchText] = useState(initialQuery);
  const [selectedPreacher, setSelectedPreacher] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [gridPage, setGridPage] = useState(1);
  const gridLimit = 20;

  const isFiltering = !!(searchText.trim() || selectedPreacher || selectedYear || selectedDate);

  const clearFilters = () => {
    setSearchText("");
    setSelectedPreacher("");
    setSelectedYear("");
    setSelectedDate("");
    setGridPage(1);
  };

  // Preachers list
  const { data: preachers } = useQuery<Preacher[]>({
    queryKey: ["preachers-list"],
    queryFn: async () => {
      const { data } = await supabase.from("preachers").select("id, name").order("name");
      return (data ?? []) as Preacher[];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes — preachers list rarely changes
  });

  // Query for sermon search (ONLY executed when user has searched/filtered)
  const { data: gridResults, isLoading: gridLoading } = useQuery<{ data: SermonWithRelations[]; count: number }>({
    queryKey: ["sermons", "search", searchText, selectedPreacher, selectedYear, selectedDate, gridPage],
    enabled: isFiltering,
    queryFn: async () => {
      const url = new URL("/api/sermons", window.location.origin);
      url.searchParams.set("limit", gridLimit.toString());
      url.searchParams.set("page", gridPage.toString());
      if (searchText.trim()) url.searchParams.set("title", searchText.trim());
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
    <div className="w-full flex flex-col pb-[120px]">
      {/* ── Search & Filter Header ── */}
      <header className="sticky top-0 z-40 bg-[#030303]/95 backdrop-blur-xl w-full border-b border-white/5 px-4 sm:px-6 md:px-12 py-3.5">
        {/* On desktop: single horizontal row for search + all dropdowns */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search bar */}
          <div className="flex-1 bg-white/10 hover:bg-white/15 transition-colors border border-white/10 rounded-full h-11 flex items-center px-4 shrink-0">
            <span className="material-symbols-outlined text-[#AAAAAA] mr-2.5 text-[20px]">search</span>
            <input
              type="text"
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setGridPage(1); }}
              placeholder="Search sermons by title or topic..."
              className="bg-transparent border-none outline-none text-white w-full placeholder:text-[#AAAAAA] text-sm"
              autoFocus
            />
            {searchText && (
              <button onClick={() => { setSearchText(""); setGridPage(1); }} className="ml-1 text-[#AAAAAA] hover:text-white">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* Filter dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
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
              options={Array.from({ length: 12 }, (_, i) => {
                const y = (2026 - i).toString();
                return { id: y, label: y };
              })}
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
                className="h-10 px-3 rounded-full text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-all flex items-center gap-1 shrink-0"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 md:px-12 py-6 flex flex-col gap-6">
        {!isFiltering ? (
          /* Default state before searching */
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white/40">
              <span className="material-symbols-outlined text-[32px]">search</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1.5">Search Freedom Messages</h2>
            <p className="text-sm text-[#AAAAAA] max-w-sm">
              Type a sermon title or select a preacher, year, or date above to find messages.
            </p>
          </div>
        ) : (
          /* Results section when filtered */
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#AAAAAA] text-xs sm:text-sm">
                {gridLoading ? "Searching catalog..." : (
                  <>
                    Showing <span className="text-white font-semibold">{gridResults?.count ?? 0}</span> sermons
                    {searchText ? ` matching "${searchText}"` : ""}
                    {selectedPreacher ? ` by ${selectedPreacher}` : ""}
                    {selectedYear ? ` (${selectedYear})` : ""}
                    {selectedDate ? ` on ${selectedDate}` : ""}
                  </>
                )}
              </p>
            </div>

            {gridLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="animate-spin text-white/40" />
              </div>
            ) : !gridResults?.data || gridResults.data.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-[48px] text-white/20">search_off</span>
                <p className="text-white font-bold text-lg">No sermons found</p>
                <p className="text-[#AAAAAA] text-sm max-w-sm">
                  Try searching with different keywords, or clear some filter options.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-2 px-5 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 transition-all"
                >
                  Clear all filters
                </button>
              </div>
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
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[300px] flex items-center justify-center">
          <Loader2 className="animate-spin text-white/40" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
