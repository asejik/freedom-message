"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, SERMON_LIST_SELECT, SERMON_CARD_SELECT } from "@/lib/supabase";
import { useAudioStore } from "@/store/useAudioStore";
import { Loader2 } from "lucide-react";
import { SermonCard } from "@/components/sermons/SermonCard";
import type { SermonWithRelations } from "@/types/database";
import { openExternalUrl } from "@/lib/utils";
import { useFavourite } from "@/hooks/useFavourite";
import { LoadError } from "@/components/ui/LoadError";
import { recordSermonEvent } from "@/lib/stats";
import { formatSermonDate } from "@/lib/dates";

/**
 * Interactive sermon page. `initialSermon` comes from the server render:
 * a sermon, null (doesn't exist) or undefined (server couldn't load it, so fetch here).
 */
export function SermonDetail({
  sermonId,
  initialSermon,
}: {
  sermonId: string;
  initialSermon: SermonWithRelations | null | undefined;
}) {
  // Select only what this component needs: the store also holds the playback
  // position, which changes several times a second while a sermon plays
  const currentSermonId = useAudioStore((s) => s.currentSermon?.id);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const play = useAudioStore((s) => s.play);
  const togglePlay = useAudioStore((s) => s.togglePlay);
  const [copied, setCopied] = useState(false);
  const [isFav, toggleFav] = useFavourite(sermonId);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = sermon?.title || "Messages Sermon";
    // Only name a preacher when one is recorded (32 sermons have none)
    const by = sermon?.preachers?.name ? ` by ${sermon.preachers.name}` : "";
    const text = sermon ? `Listen to "${sermon.title}"${by} on Messages` : "Messages Sermon";

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        if ((err as Error)?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn("Clipboard copy failed:", e);
    }
  };

  const { data: sermon, isLoading, isError, refetch } = useQuery<SermonWithRelations | null>({
    queryKey: ["sermon", sermonId],
    initialData: initialSermon,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sermons")
        .select(SERMON_LIST_SELECT)
        .eq("id", sermonId)
        .single();

      // No such sermon (PGRST116: zero rows) or a malformed id (22P02) is "not found", not a failure
      if (error && (error.code === "PGRST116" || error.code === "22P02")) return null;
      if (error) throw error;
      return data as unknown as SermonWithRelations;
    },
  });

  // "You might also like": other sermons from the same series first, then more
  // from the same preacher, newest first
  const { data: relatedSermons } = useQuery<SermonWithRelations[]>({
    queryKey: ["sermons", "related", sermonId],
    enabled: !!sermon,
    queryFn: async () => {
      const RELATED_LIMIT = 10;
      const fetchBy = async (column: "series_id" | "preacher_id", value: string | null | undefined) => {
        if (!value) return [];
        const { data, error } = await supabase
          .from("sermons")
          .select(SERMON_CARD_SELECT)
          .eq(column, value)
          .neq("id", sermonId)
          .order("date_preached", { ascending: false })
          .limit(RELATED_LIMIT);

        if (error) throw error;
        return (data as unknown as SermonWithRelations[]) ?? [];
      };

      const related = await fetchBy("series_id", sermon?.series_id);
      if (related.length < RELATED_LIMIT) {
        const seen = new Set(related.map((r) => r.id));
        const byPreacher = await fetchBy("preacher_id", sermon?.preacher_id);
        related.push(...byPreacher.filter((r) => !seen.has(r.id)));
      }
      return related.slice(0, RELATED_LIMIT);
    },
  });

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-white/50 w-8 h-8" />
      </div>
    );
  }

  if (isError) {
    return <LoadError onRetry={() => refetch()} message="We couldn't load this sermon right now. Check your connection and try again." />;
  }

  if (!sermon) {
    return <div className="p-12 text-center text-white">Sermon not found.</div>;
  }

  const isCurrentSermon = currentSermonId === sermon.id;
  const isPlayingThis = isCurrentSermon && isPlaying;

  const handlePlay = () => {
    if (isCurrentSermon) togglePlay();
    else play(sermon);
  };

  const formattedDate = formatSermonDate(sermon.date_preached);

  return (
    <div className="w-full flex flex-col pb-[140px] text-white">
      
      {/* Hero Section */}
      <div className="relative w-full px-4 sm:px-6 md:px-12 pt-6 sm:pt-12 pb-6 sm:pb-8 flex flex-col sm:flex-row gap-5 sm:gap-8 items-center sm:items-end text-center sm:text-left">
        {/* Dynamic Background Blur */}
        <div 
          className="absolute inset-0 z-0 opacity-20 blur-3xl pointer-events-none"
          style={{ 
            backgroundImage: sermon.artwork_url ? `url(${sermon.artwork_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-[#030303] pointer-events-none" />

        {/* Artwork */}
        <div className="relative z-10 w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] md:w-[260px] md:h-[260px] shrink-0 rounded-2xl overflow-hidden shadow-2xl bg-surface-container border border-white/10">
          {sermon.artwork_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sermon.artwork_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/5">
              <span aria-hidden="true" className="material-symbols-outlined text-[64px] sm:text-[80px] text-white/20">music_note</span>
            </div>
          )}
        </div>

        {/* Header Info */}
        <div className="relative z-10 flex flex-col gap-1.5 sm:gap-2 flex-1 min-w-0">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#AAAAAA]">
            Sermon • {formattedDate}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight leading-tight break-words">
            {sermon.title}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[#AAAAAA] mt-1">
            {sermon.preachers?.name || "Unknown Preacher"} 
            {sermon.series && ` • ${sermon.series.name}`}
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-4 sm:mt-6 flex-wrap">
            <button 
              onClick={handlePlay}
              className="flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-white text-black font-semibold hover:scale-105 active:scale-95 transition-transform text-sm sm:text-base shadow-lg"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-xl sm:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isPlayingThis ? "pause" : "play_arrow"}
              </span>
              <span>{isPlayingThis ? "Pause" : "Play Sermon"}</span>
            </button>

            {/* Share / Copy Link Button */}
            <button 
              onClick={handleShare}
              className={`h-10 sm:h-12 px-3.5 sm:px-4 rounded-full border flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium transition-all ${
                copied
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : "border-white/20 text-white hover:bg-white/10 active:scale-95"
              }`}
              title="Share or Copy Sermon Link"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px] sm:text-[20px]">
                {copied ? "check" : "share"}
              </span>
              <span>{copied ? "Link Copied!" : "Share"}</span>
            </button>

            {/* Favourite Button */}
            <button 
              onClick={toggleFav}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition-all ${
                isFav
                  ? "bg-red-500/20 border-red-500/40 text-red-400 shadow-md"
                  : "border-white/20 text-white hover:bg-white/10 active:scale-95"
              }`}
              title={isFav ? "Remove from Favourites" : "Save to Favourites"}
            >
              <span aria-hidden="true" 
                className="material-symbols-outlined text-[18px] sm:text-[20px]" 
                style={{ fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0" }}
              >
                favorite
              </span>
            </button>

            {/* Download Button */}
            <button 
              onClick={() => { recordSermonEvent(sermon.id, "download"); openExternalUrl(sermon.audio_url); }}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all"
              title="Download Sermon"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px] sm:text-[20px]">download</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Enrichment & Details Section */}
      <div className="px-4 sm:px-6 md:px-12 py-6 sm:py-8 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 relative z-10">
        
        <div className="md:col-span-2 flex flex-col gap-8 sm:gap-10">
          {/* Summary */}
          {sermon.ai_summary && (
            <section>
              <h3 className="text-lg sm:text-xl font-bold mb-3 flex items-center gap-2">
                <span aria-hidden="true" className="material-symbols-outlined text-blue-400 text-xl">auto_awesome</span>
                <span>About this Sermon</span>
              </h3>
              <div className="text-[#AAAAAA] text-xs sm:text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap">
                {sermon.ai_summary}
              </div>
            </section>
          )}

          {/* Prayer Focus */}
          {sermon.prayer_focus && (
            <section>
              <h3 className="text-lg sm:text-xl font-bold mb-3.5 flex items-center gap-2">
                <span aria-hidden="true" className="material-symbols-outlined text-purple-400 text-xl">sign_language</span>
                <span>Prayer Focus</span>
              </h3>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 relative overflow-hidden">
                <ul className="space-y-3">
                  {(() => {
                    let clean = sermon.prayer_focus.trim();
                    if (clean.startsWith('"') && clean.endsWith('"')) {
                      clean = clean.slice(1, -1).trim();
                    }
                    const points = clean
                      .split(/(?:^|\n|[\s]+)[•\*\-][\s]+|(?:^|\n)[\d]+[\.\)]\s+/)
                      .map(p => p.trim())
                      .filter(p => p.length > 0);

                    const finalPoints = points.length > 0 ? points : clean.split('\n').filter(Boolean);

                    return finalPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-3 text-[#D1D5DB] leading-relaxed text-xs sm:text-sm md:text-[15px]">
                        <span className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 sm:mt-2 shrink-0 shadow-sm shadow-purple-400/50" />
                        <span className="flex-1 text-white/90">{point}</span>
                      </li>
                    ));
                  })()}
                </ul>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar info (Key Verses, Tags) */}
        <div className="flex flex-col gap-6 sm:gap-8">
          {sermon.key_verses && sermon.key_verses.length > 0 && (
            <section>
              <h3 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-2">
                <span aria-hidden="true" className="material-symbols-outlined text-[#AAAAAA] text-lg">menu_book</span>
                Key Verses
              </h3>
              <ul className="flex flex-col gap-2">
                {sermon.key_verses.map((verse, i) => (
                  <li key={i} className="text-[#AAAAAA] bg-white/5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium border border-white/5">
                    {verse}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {sermon.ai_tags && sermon.ai_tags.length > 0 && (
            <section>
              <h3 className="text-base sm:text-lg font-bold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {sermon.ai_tags.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-white/10 text-[11px] sm:text-xs font-semibold text-[#AAAAAA]">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Suggested Sermons Shelf (hidden when there is nothing related to show) */}
      {relatedSermons && relatedSermons.length > 0 && (
      <section className="px-4 sm:px-6 md:px-12 mt-8 sm:mt-12">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">You might also like</h2>
        </div>
        <div className="flex gap-3.5 sm:gap-4 overflow-x-auto hide-scrollbar pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-12 md:px-12">
          {relatedSermons?.map((s, idx) => (
            <SermonCard key={s.id} sermon={s} index={idx} layout="shelf" />
          ))}
        </div>
      </section>
      )}

    </div>
  );
}
