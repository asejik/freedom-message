"use client";

import { useState, useEffect, useMemo, Suspense, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Lock,
  LogOut,
  FileText,
  Copy,
  Check,
  Download,
  Loader2,
  Calendar,
  User,
  Folder,
  ArrowUpDown,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Type,
} from "lucide-react";
import { FilterDropdown } from "@/components/filters/FilterDropdown";
import { getYearOptions } from "@/lib/years";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatSermonDate } from "@/lib/dates";
import { supabase } from "@/lib/supabase";
import type { Preacher, Series } from "@/types/database";

interface SermonListItem {
  id: string;
  title: string;
  date_preached: string;
  preachers: { id: string; name: string } | null;
  series: { id: string; name: string } | null;
}

interface SermonDetail extends SermonListItem {
  transcript_text: string | null;
}

// ── Highlighted text helper for in-transcript search ──────────────────────────
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) {
    return <>{text}</>;
  }

  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className="bg-amber-400/35 text-amber-200 px-0.5 rounded font-semibold"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

// ── Passcode Gate Component ──────────────────────────────────────────────────
function PasscodeGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError("Please enter the access passcode.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/transcripts/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.authenticated) {
        onAuthenticated();
      } else {
        setError(data.error || "Incorrect access code. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#12141a]/95 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
            <Lock size={26} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Transcripts Portal</h1>
          <p className="text-sm text-white/60 mt-1.5 max-w-xs">
            Enter the authorized unit passcode to explore, search, and export the full sermon transcripts archive.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="passcode-input" className="block text-xs font-medium text-white/70 mb-1.5">
              Unit Access Passcode
            </label>
            <div className="relative">
              <input
                id="passcode-input"
                type={showPasscode ? "text" : "password"}
                autoFocus
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter passcode..."
                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3.5 pr-10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                aria-label={showPasscode ? "Hide passcode" : "Show passcode"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
              >
                {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Enter Transcripts Archive</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/5 text-center text-[11px] text-white/40">
          Protected Church Research Archive · Read-Only Access
        </div>
      </div>
    </div>
  );
}

// ── Transcript Viewer Component ──────────────────────────────────────────────
function TranscriptViewer({
  sermonId,
  onSessionExpired,
}: {
  sermonId: string | null;
  onSessionExpired: () => void;
}) {
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [copied, setCopied] = useState(false);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  const {
    data: detailData,
    isLoading: detailLoading,
    isError: detailError,
    refetch: refetchDetail,
  } = useQuery<{ data: SermonDetail }>({
    queryKey: ["transcript-detail", sermonId],
    enabled: Boolean(sermonId),
    queryFn: async () => {
      if (!sermonId) throw new Error("No sermon selected");
      const res = await fetch(`/api/transcripts/${sermonId}`);
      if (res.status === 401) {
        onSessionExpired();
        throw new Error("Session expired");
      }
      if (!res.ok) throw new Error("Could not load transcript");
      return res.json();
    },
  });

  const activeSermon = detailData?.data;
  const transcriptText = activeSermon?.transcript_text || "";

  const wordCount = useMemo(() => {
    if (!transcriptText) return 0;
    return transcriptText.trim().split(/\s+/).filter(Boolean).length;
  }, [transcriptText]);

  const readingTime = useMemo(() => {
    return Math.ceil(wordCount / 180);
  }, [wordCount]);

  const inTranscriptMatches = useMemo(() => {
    if (!transcriptSearch.trim() || !transcriptText) return 0;
    const escaped = transcriptSearch.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = transcriptText.match(new RegExp(escaped, "gi"));
    return matches ? matches.length : 0;
  }, [transcriptSearch, transcriptText]);

  const handleCopyTranscript = async () => {
    if (!transcriptText) return;
    try {
      await navigator.clipboard.writeText(transcriptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleDownloadTxt = () => {
    if (!activeSermon || !transcriptText) return;

    const preacherName = activeSermon.preachers?.name || "Unknown Preacher";
    const seriesName = activeSermon.series?.name || "None";
    const formattedDate = formatSermonDate(activeSermon.date_preached);

    const safeTitle =
      activeSermon.title
        .replace(/[/\\?%*:|"<>]/g, "-")
        .replace(/\s+/g, " ")
        .trim() || "sermon-transcript";

    const content = [
      `TITLE: ${activeSermon.title}`,
      `PREACHER: ${preacherName}`,
      `DATE PREACHED: ${formattedDate}`,
      `SERIES: ${seriesName}`,
      "=".repeat(60),
      "",
      transcriptText,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeTitle}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!sermonId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/40">
        <FileText size={42} className="opacity-20 mb-3" />
        <h3 className="text-base font-semibold text-white/70">No Sermon Selected</h3>
        <p className="text-xs text-white/40 max-w-sm mt-1">
          Select a sermon from the list on the left to read, search, and copy its full transcript.
        </p>
      </div>
    );
  }

  if (detailLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/50 gap-3">
        <Loader2 size={30} className="animate-spin text-blue-500" />
        <p className="text-xs">Loading full transcript...</p>
      </div>
    );
  }

  if (detailError || !activeSermon) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-red-400 gap-3">
        <p className="text-xs">Could not load the transcript for this sermon.</p>
        <button
          onClick={() => refetchDetail()}
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Reader Header */}
      <div className="p-4 md:p-6 border-b border-white/10 bg-[#0d0f17] space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight leading-snug">
              {activeSermon.title}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60">
              {activeSermon.preachers?.name && (
                <span className="flex items-center gap-1.5">
                  <User size={13} className="text-blue-400" />
                  <span className="font-medium text-white/80">
                    {activeSermon.preachers.name}
                  </span>
                </span>
              )}
              {activeSermon.date_preached && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-blue-400" />
                  <span>{formatSermonDate(activeSermon.date_preached)}</span>
                </span>
              )}
              {activeSermon.series?.name && (
                <span className="flex items-center gap-1.5">
                  <Folder size={13} className="text-blue-400" />
                  <span>{activeSermon.series.name}</span>
                </span>
              )}
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyTranscript}
              disabled={!transcriptText}
              className={`h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                copied
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
              }`}
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Transcript</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadTxt}
              disabled={!transcriptText}
              title="Download as .txt"
              className="h-9 px-3 rounded-xl text-xs font-medium text-white/80 bg-white/10 hover:bg-white/15 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Download .txt</span>
            </button>
          </div>
        </div>

        {/* Sub-toolbar: Stats, In-Text Search, and Font Size */}
        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
          <div className="flex items-center gap-3">
            <span>
              <strong className="text-white">{wordCount.toLocaleString()}</strong> words
            </span>
            <span>•</span>
            <span>~{readingTime} min read</span>
          </div>

          <div className="flex items-center gap-3">
            {/* In-transcript search */}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
              />
              <input
                type="text"
                value={transcriptSearch}
                onChange={(e) => setTranscriptSearch(e.target.value)}
                placeholder="Find word in text..."
                className="h-7 w-40 sm:w-48 bg-white/5 border border-white/10 rounded-lg pl-7 pr-6 text-[11px] text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
              />
              {transcriptSearch && (
                <button
                  type="button"
                  onClick={() => setTranscriptSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>

            {transcriptSearch.trim() && (
              <span className="text-[11px] text-amber-300 font-medium">
                {inTranscriptMatches} match{inTranscriptMatches === 1 ? "" : "es"}
              </span>
            )}

            {/* Font size toggle */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
              <button
                onClick={() => setFontSize("sm")}
                title="Small font"
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                  fontSize === "sm" ? "bg-white/20 text-white" : "text-white/40 hover:text-white"
                }`}
              >
                A-
              </button>
              <button
                onClick={() => setFontSize("base")}
                title="Medium font"
                className={`px-1.5 py-0.5 rounded text-xs font-semibold transition-all ${
                  fontSize === "base" ? "bg-white/20 text-white" : "text-white/40 hover:text-white"
                }`}
              >
                <Type size={12} />
              </button>
              <button
                onClick={() => setFontSize("lg")}
                title="Large font"
                className={`px-1.5 py-0.5 rounded text-[12px] font-semibold transition-all ${
                  fontSize === "lg" ? "bg-white/20 text-white" : "text-white/40 hover:text-white"
                }`}
              >
                A+
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Body */}
      <div
        ref={transcriptContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0b0d14]"
      >
        {!transcriptText ? (
          <div className="p-8 text-center text-white/40 text-xs">
            No transcript text is currently available for this sermon.
          </div>
        ) : (
          <article
            className={`max-w-3xl mx-auto text-white/85 leading-relaxed selection:bg-blue-500/30 selection:text-white font-sans ${
              fontSize === "sm"
                ? "text-xs space-y-4"
                : fontSize === "lg"
                ? "text-base space-y-6"
                : "text-sm space-y-5"
            }`}
          >
            {transcriptText
              .split(/\n\s*\n/)
              .filter((p) => p.trim().length > 0)
              .map((paragraph, idx) => (
                <p key={idx} className="whitespace-pre-wrap">
                  <HighlightedText text={paragraph} query={transcriptSearch} />
                </p>
              ))}
          </article>
        )}
      </div>
    </div>
  );
}

// ── Main Content Component ───────────────────────────────────────────────────
function TranscriptsContent() {
  const searchParams = useSearchParams();

  // Auth state
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Filter states initialized from URL params if present
  const [searchText, setSearchText] = useState(() => searchParams.get("q") || searchParams.get("title") || "");
  const [selectedPreachers, setSelectedPreachers] = useState<string[]>(() =>
    searchParams
      .getAll("preacher")
      .flatMap((p) => p.split(","))
      .map((p) => p.trim())
      .filter(Boolean)
  );
  const [selectedSeries, setSelectedSeries] = useState<string>(() => searchParams.get("series") || "");
  const [selectedYear, setSelectedYear] = useState<string>(() => searchParams.get("year") || "");
  const [sortOption, setSortOption] = useState<string>(() => searchParams.get("sort") || "newest");
  const [page, setPage] = useState<number>(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const limit = 25;

  // Selected sermon for reader pane
  const [selectedSermonId, setSelectedSermonId] = useState<string | null>(
    () => searchParams.get("id") || null
  );

  // Debounced search query
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);

  // Check auth status on mount
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch("/api/transcripts/auth");
        const data = await res.json().catch(() => ({}));
        if (isMounted) {
          setIsAuthenticated(Boolean(data.authenticated));
        }
      } catch {
        if (isMounted) setIsAuthenticated(false);
      } finally {
        if (isMounted) setIsCheckingAuth(false);
      }
    }
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  // Preachers options
  const { data: preachers } = useQuery<Preacher[]>({
    queryKey: ["transcripts-preachers"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data } = await supabase.from("preachers").select("id, name").order("name");
      return (data ?? []) as Preacher[];
    },
    staleTime: 15 * 60 * 1000,
  });

  // Series options
  const { data: seriesList } = useQuery<Series[]>({
    queryKey: ["transcripts-series"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data } = await supabase.from("series").select("id, name").order("name");
      return (data ?? []) as Series[];
    },
    staleTime: 15 * 60 * 1000,
  });

  // Sermons metadata query (no transcript_text payload)
  const {
    data: listData,
    isLoading: listLoading,
    isError: listError,
    refetch: refetchList,
  } = useQuery<{ data: SermonListItem[]; count: number; page: number; limit: number }>({
    queryKey: [
      "transcripts-list",
      debouncedSearch,
      selectedPreachers,
      selectedSeries,
      selectedYear,
      sortOption,
      page,
    ],
    enabled: isAuthenticated,
    queryFn: async () => {
      const url = new URL("/api/transcripts", window.location.origin);
      url.searchParams.set("limit", limit.toString());
      url.searchParams.set("page", page.toString());
      if (debouncedSearch) url.searchParams.set("q", debouncedSearch);
      for (const p of selectedPreachers) {
        url.searchParams.append("preacher", p);
      }
      if (selectedSeries) url.searchParams.set("series", selectedSeries);
      if (selectedYear) url.searchParams.set("year", selectedYear);
      if (sortOption) url.searchParams.set("sort", sortOption);

      const res = await fetch(url.toString());
      if (res.status === 401) {
        setIsAuthenticated(false);
        throw new Error("Session expired. Please log in again.");
      }
      if (!res.ok) throw new Error("Failed to load sermons.");
      return res.json();
    },
  });

  const sermons = useMemo(() => listData?.data ?? [], [listData?.data]);
  const totalCount = listData?.count ?? 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  // Derive active sermon id: explicit selection or first sermon in current results
  const effectiveSermonId = selectedSermonId ?? (sermons.length > 0 ? sermons[0].id : null);

  // Sync state to URL params for deep-linking & refreshing
  useEffect(() => {
    if (typeof window === "undefined" || !isAuthenticated) return;
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    for (const p of selectedPreachers) {
      if (p.trim()) params.append("preacher", p.trim());
    }
    if (selectedSeries) params.set("series", selectedSeries);
    if (selectedYear) params.set("year", selectedYear);
    if (sortOption !== "newest") params.set("sort", sortOption);
    if (page > 1) params.set("page", page.toString());
    if (effectiveSermonId) params.set("id", effectiveSermonId);

    const qs = params.toString();
    const newUrl = qs ? `/transcripts?${qs}` : "/transcripts";
    const currentUrl = window.location.pathname + window.location.search;
    if (currentUrl !== newUrl) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [
    debouncedSearch,
    selectedPreachers,
    selectedSeries,
    selectedYear,
    sortOption,
    page,
    effectiveSermonId,
    isAuthenticated,
  ]);

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await fetch("/api/transcripts/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } finally {
      setIsAuthenticated(false);
      setSelectedSermonId(null);
    }
  };

  // Toggle preacher filter
  const togglePreacher = (name: string) => {
    setSelectedPreachers((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
    setPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchText("");
    setSelectedPreachers([]);
    setSelectedSeries("");
    setSelectedYear("");
    setSortOption("newest");
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    searchText.trim() ||
      selectedPreachers.length > 0 ||
      selectedSeries ||
      selectedYear ||
      sortOption !== "newest"
  );

  // Loading state
  if (isCheckingAuth) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3 text-white/50">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className="text-sm">Connecting to Transcripts Archive...</span>
      </div>
    );
  }

  // Passcode gate state
  if (!isAuthenticated) {
    return <PasscodeGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="border-b border-white/10 bg-[#0c0e14]/90 backdrop-blur-xl px-4 md:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <FileText size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight">
                Transcripts Explorer
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-semibold">
                <ShieldCheck size={11} />
                Research Unit
              </span>
            </div>
            <p className="text-[11px] text-white/50 hidden sm:block">
              Dedicated full-text archive for sermon transcripts · Read-Only
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/60 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{totalCount.toLocaleString()} Sermons</span>
          </div>

          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* ── Search & Filter Bar ─────────────────────────────────────────────── */}
      <div className="border-b border-white/5 bg-[#0a0c12]/60 px-4 md:px-6 py-3 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1 max-w-lg">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
            />
            <input
              type="text"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              placeholder="Search sermon title..."
              className="w-full h-10 bg-white/5 border border-white/10 rounded-full pl-9 pr-8 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => {
                  setSearchText("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters & Sorting */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Preachers filter */}
            <FilterDropdown
              label="Preacher"
              values={selectedPreachers}
              options={(preachers ?? []).map((p) => ({ id: p.name, label: p.name }))}
              onToggle={togglePreacher}
              onClear={() => {
                setSelectedPreachers([]);
                setPage(1);
              }}
              menuWidth={280}
            />

            {/* Series filter */}
            <FilterDropdown
              label="Series"
              value={selectedSeries}
              options={(seriesList ?? []).map((s) => ({ id: s.name, label: s.name }))}
              onSelect={(val) => {
                setSelectedSeries(val);
                setPage(1);
              }}
              onClear={() => {
                setSelectedSeries("");
                setPage(1);
              }}
              menuWidth={280}
            />

            {/* Year filter */}
            <FilterDropdown
              label="Year"
              value={selectedYear}
              options={getYearOptions()}
              onSelect={(val) => {
                setSelectedYear(val);
                setPage(1);
              }}
              onClear={() => {
                setSelectedYear("");
                setPage(1);
              }}
              menuWidth={160}
            />

            {/* Sort selector */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-full px-2.5 h-10 text-xs text-white/80">
              <ArrowUpDown size={13} className="text-white/40 mr-1.5 shrink-0" />
              <select
                aria-label="Sort sermons"
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs text-white outline-none cursor-pointer pr-1"
              >
                <option value="newest" className="bg-[#12141a] text-white">
                  Newest First
                </option>
                <option value="oldest" className="bg-[#12141a] text-white">
                  Oldest First
                </option>
                <option value="title-asc" className="bg-[#12141a] text-white">
                  Title (A–Z)
                </option>
                <option value="title-desc" className="bg-[#12141a] text-white">
                  Title (Z–A)
                </option>
              </select>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="h-10 px-3 rounded-full text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Two-Pane Layout (List + Viewer) ─────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* Left Pane: Sermon List */}
        <section
          aria-label="Sermon List"
          className="lg:col-span-4 xl:col-span-4 border-r border-white/10 flex flex-col bg-[#08090b] overflow-hidden"
        >
          {/* List Header */}
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between text-xs text-white/60">
            <span>
              {listLoading ? (
                "Loading sermons..."
              ) : (
                <>
                  Found <strong className="text-white">{totalCount}</strong> sermon
                  {totalCount === 1 ? "" : "s"}
                </>
              )}
            </span>
            <span>
              Page {page} of {totalPages}
            </span>
          </div>

          {/* List Items Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {listLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-white/5 animate-pulse space-y-2"
                  >
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : listError ? (
              <div className="p-6 text-center text-xs text-red-400 space-y-2">
                <p>Failed to load sermon list.</p>
                <button
                  onClick={() => refetchList()}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs"
                >
                  Retry
                </button>
              </div>
            ) : sermons.length === 0 ? (
              <div className="p-8 text-center text-white/40 space-y-2">
                <FileText size={28} className="mx-auto opacity-30" />
                <p className="text-xs">No sermons match the selected filters.</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-blue-400 hover:underline cursor-pointer"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              sermons.map((sermon) => {
                const isSelected = sermon.id === effectiveSermonId;
                return (
                  <button
                    key={sermon.id}
                    onClick={() => setSelectedSermonId(sermon.id)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all border block cursor-pointer ${
                      isSelected
                        ? "bg-blue-600/15 border-blue-500/40 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/30"
                        : "bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="font-semibold text-xs sm:text-sm text-white line-clamp-2 leading-snug">
                      {sermon.title}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/50">
                      {sermon.preachers?.name && (
                        <span className="flex items-center gap-1">
                          <User size={11} className="text-white/40 shrink-0" />
                          <span className="truncate max-w-[140px]">
                            {sermon.preachers.name}
                          </span>
                        </span>
                      )}

                      {sermon.date_preached && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-white/40 shrink-0" />
                          <span>{formatSermonDate(sermon.date_preached, "short")}</span>
                        </span>
                      )}
                    </div>

                    {sermon.series?.name && (
                      <div className="mt-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/5 truncate max-w-full">
                          <Folder size={10} className="text-white/40 shrink-0" />
                          <span className="truncate">{sermon.series.name}</span>
                        </span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* List Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-white/5 bg-[#0a0c12] flex items-center justify-between text-xs text-white/70">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <span className="text-[11px] text-white/50">
                {page} / {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </section>

        {/* Right Pane: Transcript Viewer & Tools */}
        <section
          aria-label="Transcript Reader"
          className="lg:col-span-8 xl:col-span-8 flex flex-col bg-[#0b0d14] overflow-hidden"
        >
          <TranscriptViewer
            key={effectiveSermonId ?? "empty"}
            sermonId={effectiveSermonId}
            onSessionExpired={() => setIsAuthenticated(false)}
          />
        </section>
      </div>
    </div>
  );
}

// ── Export Wrapped in Suspense ────────────────────────────────────────────────
export default function TranscriptsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3 text-white/50">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <span className="text-sm">Loading Transcripts Explorer...</span>
        </div>
      }
    >
      <TranscriptsContent />
    </Suspense>
  );
}
