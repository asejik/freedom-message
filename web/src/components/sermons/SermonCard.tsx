"use client";

import Link from "next/link";
import { SermonWithRelations } from "@/types/database";
import { useAudioStore } from "@/store/useAudioStore";
import { artworkGradient, seriesAccent } from "@/lib/utils";

interface SermonCardProps {
  sermon: SermonWithRelations;
  layout?: "grid" | "list" | "shelf";
  index?: number;
}

export function SermonCard({ sermon, layout = "grid", index = 0 }: SermonCardProps) {
  const { currentSermon, isPlaying, play, togglePlay } = useAudioStore();

  const isCurrentSermon = currentSermon?.id === sermon.id;
  const isPlayingThis = isCurrentSermon && isPlaying;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentSermon) togglePlay();
    else play(sermon);
  };

  const formattedDate = sermon.date_preached
    ? (() => {
        try {
          const d = new Date(sermon.date_preached);
          return isNaN(d.getTime())
            ? sermon.date_preached
            : new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(d);
        } catch {
          return sermon.date_preached;
        }
      })()
    : null;

  const seriesName = sermon.series?.name ?? "Standalone";
  const preacherName = sermon.preachers?.name ?? "Unknown Preacher";
  const gradient = artworkGradient(seriesName);
  const accentText = seriesAccent(seriesName);

  const hasArtwork = Boolean(sermon.artwork_url && sermon.artwork_url !== "ERROR" && sermon.artwork_url.trim() !== "");

  if (layout === "list") {
    return (
      <article 
        onClick={handlePlay} 
        className="premium-card animate-fade-up flex items-center p-3 sm:p-4 gap-3.5 sm:gap-4 bg-white/60 dark:bg-surface-container-lowest/40 backdrop-blur-md rounded-xl border border-white/50 dark:border-white/10 shadow-sm cursor-pointer hover:bg-surface/80 group"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Thumbnail */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 relative shadow-sm border border-white/50 bg-surface-container">
          {hasArtwork ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sermon.artwork_url!} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="material-symbols-outlined text-primary/30 text-[28px] sm:text-[32px]">music_note</span>
            </div>
          )}
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPlayingThis ? "pause" : "play_arrow"}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <span className={`text-[10px] uppercase tracking-wider font-semibold mb-0.5 truncate block ${accentText}`}>
            {seriesName}
          </span>
          <h3 className="font-body-md text-sm sm:text-base font-bold text-primary truncate leading-tight mb-0.5">
            {sermon.title}
          </h3>
          <p className="font-label-sm text-xs text-on-surface-variant truncate">
            {preacherName} • {formattedDate}
          </p>
        </div>

        {/* Quick Action */}
        <button 
          onClick={handlePlay}
          className="p-2 text-white/60 hover:text-white transition-colors flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isPlayingThis ? "'FILL' 1" : "'FILL' 0" }}>
            {isPlayingThis ? "pause_circle" : "play_circle"}
          </span>
        </button>
      </article>
    );
  }

  /* ── GRID & SHELF layout ──────────────────────────────────────────────────── */
  const widthClasses = layout === "shelf" 
    ? "w-[145px] sm:w-[175px] md:w-[195px] shrink-0" 
    : "w-full min-w-0";

  return (
    <div
      className={`group cursor-pointer animate-fade-up flex flex-col gap-2 ${widthClasses}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Square Art Area */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-surface-container shadow-md border border-white/5">
        {/* Link to detail page covering the image area */}
        <Link href={`/sermons/${sermon.id}`} className="absolute inset-0 z-0">
          <span className="sr-only">View {sermon.title}</span>
        </Link>
        
        {hasArtwork ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sermon.artwork_url!} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-500`}>
            <span className="material-symbols-outlined text-primary/20 text-[48px] sm:text-[64px]">music_note</span>
          </div>
        )}
        
        {/* Hover / Active Play Button Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
          <button 
            onClick={(e) => handlePlay(e)}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-transform pointer-events-auto shadow-xl"
            title={isPlayingThis ? "Pause" : "Play"}
          >
             <span className="material-symbols-outlined text-[24px] sm:text-[28px] translate-x-[1px]" style={{ fontVariationSettings: "'FILL' 1" }}>
               {isCurrentSermon ? (isPlaying ? "pause" : "play_arrow") : "play_arrow"}
             </span>
          </button>
        </div>

        {/* Playing indicator badge (visible when actively playing) */}
        {isPlayingThis && (
          <div className="absolute bottom-2 left-2 z-20 bg-primary/90 text-white rounded-full p-1 shadow-md">
            <span className="material-symbols-outlined text-[16px] animate-pulse">volume_up</span>
          </div>
        )}

        {/* Top-right quick actions (Download) */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              window.open(sermon.audio_url, '_blank');
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white hover:scale-110 transition-transform"
            title="Download Sermon"
          >
            <span className="material-symbols-outlined text-[15px] sm:text-[18px]">download</span>
          </button>
        </div>
      </div>
      
      {/* Text Area */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <Link href={`/sermons/${sermon.id}`}>
          <h3 className="font-sans text-xs sm:text-[14px] font-semibold text-white line-clamp-2 leading-snug group-hover:text-blue-300 transition-colors">
            {sermon.title}
          </h3>
        </Link>
        <p className="font-sans text-[11px] sm:text-xs text-[#AAAAAA] line-clamp-1 leading-normal font-normal">
          {preacherName}
        </p>
        {formattedDate && (
          <p className="font-sans text-[10px] sm:text-[11px] text-[#777777] line-clamp-1 leading-normal">
            {formattedDate}
          </p>
        )}
      </div>
    </div>
  );
}
