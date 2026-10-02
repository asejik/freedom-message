"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useAudioStore } from "@/store/useAudioStore";
import type { SermonWithRelations } from "@/types/database";
import { SermonActionSheet } from "@/components/home/SermonActionSheet";

export function QuickPicksSection({
  sermons,
  isLoading,
}: {
  sermons?: SermonWithRelations[];
  isLoading?: boolean;
}) {
  // Select only what this component needs: the store also holds the playback
  // position, which changes several times a second while a sermon plays
  const currentSermonId = useAudioStore((s) => s.currentSermon?.id);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const play = useAudioStore((s) => s.play);
  const togglePlay = useAudioStore((s) => s.togglePlay);
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
          <span aria-hidden="true" className="material-symbols-outlined text-primary text-[13px]">headphones</span>
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
        <div 
          className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory scroll-pl-4 -mx-4 px-4 pb-2"
          style={{ scrollPaddingLeft: "16px" }}
        >
          {columns.map((col, colIdx) => (
            <div
              key={colIdx}
              className="w-[85vw] sm:w-[340px] shrink-0 snap-start flex flex-col gap-1"
            >
              {col.map((sermon) => {
                const thumb = sermon.artwork_url || sermon.series?.thumbnail_url || null;
                const preacherName = sermon.preachers?.name ?? "Unknown Preacher";
                const dateStr = sermon.date_preached
                  ? new Date(sermon.date_preached).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })
                  : "";
                const isCurrentSermon = currentSermonId === sermon.id;
                const isPlayingThis = isCurrentSermon && isPlaying;

                return (
                  <div
                    key={sermon.id}
                    className="flex items-center gap-3 py-1.5 pr-2 pl-0 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors group"
                  >
                    {/* Thumbnail: Clicking plays the sermon */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrentSermon) togglePlay();
                        else play(sermon);
                      }}
                      className="w-13 h-13 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 relative border border-white/5 cursor-pointer active:scale-95 transition-transform"
                      aria-label={isPlayingThis ? `Pause ${sermon.title}` : `Play ${sermon.title}`}
                    >
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span aria-hidden="true" className="material-symbols-outlined text-white/30 text-xl">headphones</span>
                        </div>
                      )}

                      {/* Play / Volume icon overlay */}
                      <div
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                          isPlayingThis ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <span aria-hidden="true"
                          className="material-symbols-outlined text-white text-[20px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {isPlayingThis ? "volume_up" : "play_arrow"}
                        </span>
                      </div>
                    </button>

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
                      <span aria-hidden="true" className="material-symbols-outlined text-[20px]">more_vert</span>
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
