"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { SermonCard } from "@/components/sermons/SermonCard";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAudioStore } from "@/store/useAudioStore";
import type { SermonWithRelations, Preacher } from "@/types/database";

const MOODS = ["Grace", "Favour", "Faith", "Healing", "Redemption", "Righteousness"];
const CARD_WIDTH = 220;

// ── Horizontal shelf for desktop/tablet with smart < > buttons ───────────────
function SermonShelf({
  title,
  subtitle,
  sermons,
  isLoading,
}: {
  title: string;
  subtitle: string;
  sermons?: SermonWithRelations[];
  isLoading?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
      return () => {
        ref.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [sermons, checkScroll]);

  const scroll = useCallback((direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = CARD_WIDTH * 3;
    scrollRef.current.scrollBy({ left: direction === "right" ? amount : -amount, behavior: "smooth" });
    setTimeout(checkScroll, 350);
  }, [checkScroll]);

  return (
    <section>
      <p className="text-[#AAAAAA] text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1">{subtitle}</p>
      <div className="flex items-center justify-between mb-3.5 sm:mb-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">{title}</h2>
        <div className="hidden sm:flex gap-2">
          {/* Back/Previous button: greyed out by default until scrolled */}
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
              !canScrollLeft
                ? "opacity-30 border-white/10 text-white/30 cursor-not-allowed"
                : "border-white/20 text-white hover:bg-white/10 active:scale-95 cursor-pointer"
            }`}
            title="Scroll left"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          {/* Next button */}
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
              !canScrollRight
                ? "opacity-30 border-white/10 text-white/30 cursor-not-allowed"
                : "border-white/20 text-white hover:bg-white/10 active:scale-95 cursor-pointer"
            }`}
            title="Scroll right"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[220px] sm:h-[260px] flex items-center justify-center">
          <Loader2 className="animate-spin text-white/40" />
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3.5 sm:gap-5 overflow-x-auto hide-scrollbar pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-12 md:px-12"
        >
          {sermons?.map((sermon, idx) => (
            <SermonCard key={sermon.id} sermon={sermon} index={idx} layout="shelf" />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Sermon Action Modal (for 3-dots button) ──────────────────────────────────
function SermonActionSheet({
  sermon,
  onClose,
}: {
  sermon: SermonWithRelations | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { play } = useAudioStore();
  const [copied, setCopied] = useState(false);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (!sermon) return;
    try {
      const favs = JSON.parse(localStorage.getItem("favourite_sermons") || "[]");
      setIsFav(favs.includes(sermon.id));
    } catch {
      // ignore
    }
  }, [sermon]);

  if (!sermon) return null;

  const thumb = sermon.artwork_url || sermon.series?.thumbnail_url || null;
  const preacherName = sermon.preachers?.name ?? "Citizens Preacher";

  const toggleFavorite = () => {
    try {
      const favs: string[] = JSON.parse(localStorage.getItem("favourite_sermons") || "[]");
      let updated: string[];
      if (favs.includes(sermon.id)) {
        updated = favs.filter((id) => id !== sermon.id);
        setIsFav(false);
      } else {
        updated = [...favs, sermon.id];
        setIsFav(true);
      }
      localStorage.setItem("favourite_sermons", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const copyShareLink = async () => {
    try {
      const url = `${window.location.origin}/sermons/${sermon.id}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    if (sermon.audio_url) {
      window.open(sermon.audio_url, "_blank");
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-sm flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-[#121214] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-5 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sermon Preview */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-white/10">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 shrink-0 border border-white/10">
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt={sermon.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-white/30 text-2xl">headphones</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-sm font-bold line-clamp-2 leading-tight">{sermon.title}</h3>
            <p className="text-[#AAAAAA] text-xs mt-1 truncate">{preacherName}</p>
          </div>
        </div>

        {/* Action List */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => {
              play(sermon);
              onClose();
            }}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-white/10 active:bg-white/15 text-white transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[22px] text-primary">play_circle</span>
            <span>Play Sermon</span>
          </button>

          <button
            onClick={() => {
              onClose();
              router.push(`/sermons/${sermon.id}`);
            }}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-white/10 active:bg-white/15 text-white transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[22px] text-white/70">info</span>
            <span>View Sermon Details</span>
          </button>

          <button
            onClick={toggleFavorite}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-white/10 active:bg-white/15 text-white transition-colors text-sm font-medium"
          >
            <span
              className={`material-symbols-outlined text-[22px] ${isFav ? "text-red-400" : "text-white/70"}`}
              style={{ fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
            <span>{isFav ? "Remove from Favourites" : "Save to Favourites"}</span>
          </button>

          {sermon.audio_url && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-white/10 active:bg-white/15 text-white transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[22px] text-white/70">download</span>
              <span>Download Audio</span>
            </button>
          )}

          <button
            onClick={copyShareLink}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-white/10 active:bg-white/15 text-white transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[22px] text-white/70">
              {copied ? "check" : "share"}
            </span>
            <span>{copied ? "Link Copied!" : "Share / Copy Link"}</span>
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs text-center transition-all mt-1"
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
}

// ── YouTube Music "Quick Picks" on Mobile: 4 items per column, swipeable ─────
function QuickPicksSection({
  sermons,
  isLoading,
}: {
  sermons?: SermonWithRelations[];
  isLoading?: boolean;
}) {
  const { currentSermon, isPlaying, play, togglePlay } = useAudioStore();
  const [selectedSermon, setSelectedSermon] = useState<SermonWithRelations | null>(null);

  // Group sermons into columns of 4 items each (YouTube Music style)
  const columns: SermonWithRelations[][] = [];
  if (sermons && sermons.length > 0) {
    for (let i = 0; i < Math.min(sermons.length, 16); i += 4) {
      columns.push(sermons.slice(i, i + 4));
    }
  }

  return (
    <section className="md:hidden">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-[13px]">headphones</span>
        </div>
        <p className="text-[#AAAAAA] text-[11px] font-bold uppercase tracking-wider">Quick picks</p>
      </div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-white tracking-tight">Featured Sermons</h2>
      </div>

      {isLoading ? (
        <div className="h-[260px] flex items-center justify-center">
          <Loader2 className="animate-spin text-white/40" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2">
          {columns.map((col, colIdx) => (
            <div
              key={colIdx}
              className="w-[85vw] sm:w-[340px] shrink-0 snap-start flex flex-col gap-1"
            >
              {col.map((sermon) => {
                const thumb = sermon.artwork_url || sermon.series?.thumbnail_url || null;
                const preacherName = sermon.preachers?.name ?? "Citizens Preacher";
                const dateStr = sermon.date_preached
                  ? new Date(sermon.date_preached).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })
                  : "";
                const isCurrentSermon = currentSermon?.id === sermon.id;
                const isPlayingThis = isCurrentSermon && isPlaying;

                return (
                  <div
                    key={sermon.id}
                    className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    {/* Thumbnail: Clicking plays the sermon */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrentSermon) togglePlay();
                        else play(sermon);
                      }}
                      className="w-13 h-13 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 relative border border-white/5 cursor-pointer active:scale-95 transition-transform"
                      title={isPlayingThis ? "Pause" : "Play Sermon"}
                    >
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt={sermon.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-white/30 text-xl">headphones</span>
                        </div>
                      )}

                      {/* Play / Volume icon overlay */}
                      <div
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                          isPlayingThis ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <span
                          className="material-symbols-outlined text-white text-[20px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {isPlayingThis ? "volume_up" : "play_arrow"}
                        </span>
                      </div>
                    </div>

                    {/* Text info: Clicking navigates to details page */}
                    <Link
                      href={`/sermons/${sermon.id}`}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <p className="text-white text-xs sm:text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {sermon.title}
                      </p>
                      <p className="text-[#AAAAAA] text-[11px] sm:text-xs mt-0.5 truncate">
                        {preacherName}
                        {dateStr ? ` • ${dateStr}` : ""}
                      </p>
                    </Link>

                    {/* 3-dots action menu button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSermon(sermon);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all text-white/50 hover:text-white shrink-0"
                      aria-label="More options"
                    >
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Action modal for 3-dots */}
      {selectedSermon && (
        <SermonActionSheet
          sermon={selectedSermon}
          onClose={() => setSelectedSermon(null)}
        />
      )}
    </section>
  );
}

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
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropW = Math.min(256, window.innerWidth - 24);
      const leftRaw = rect.left;
      const left = Math.min(Math.max(12, leftRaw), window.innerWidth - dropW - 12);
      setDropdownPos({ top: rect.bottom + 6, left, width: dropW });
    }
    setTempDate(value);
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

// ── Main Home Page Component ──────────────────────────────────────────────────
function HomeContent() {
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [selectedPreacher, setSelectedPreacher] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [gridPage, setGridPage] = useState(1);
  const gridLimit = 20;

  const isFiltering = !!(activeMood || searchText || selectedPreacher || selectedYear || selectedDate);

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

  // Featured sermons query
  const { data: featured, isLoading: featuredLoading } = useQuery<SermonWithRelations[]>({
    queryKey: ["sermons", "featured"],
    enabled: !isFiltering,
    queryFn: async () => {
      const url = new URL("/api/sermons", window.location.origin);
      url.searchParams.set("limit", "20");
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch featured sermons");
      const json = await res.json();
      return [...(json.data ?? [])].sort(() => 0.5 - Math.random());
    },
  });

  // Recent sermons query
  const { data: recent, isLoading: recentLoading } = useQuery<SermonWithRelations[]>({
    queryKey: ["sermons", "recent"],
    enabled: !isFiltering,
    queryFn: async () => {
      const url = new URL("/api/sermons", window.location.origin);
      url.searchParams.set("limit", "20");
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch recent sermons");
      const json = await res.json();
      return json.data ?? [];
    },
  });

  // Filtered sermons query (when search/filters applied)
  const { data: gridResults, isLoading: gridLoading } = useQuery<{ data: SermonWithRelations[]; count: number }>({
    queryKey: ["sermons", "grid", activeMood, searchText, selectedPreacher, selectedYear, selectedDate, gridPage],
    enabled: isFiltering,
    queryFn: async () => {
      const url = new URL("/api/sermons", window.location.origin);
      url.searchParams.set("limit", gridLimit.toString());
      url.searchParams.set("page", gridPage.toString());
      if (activeMood) url.searchParams.set("tag", activeMood);
      if (searchText) url.searchParams.set("title", searchText);
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
