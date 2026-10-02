"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAudioStore } from "@/store/useAudioStore";
import { openExternalUrl } from "@/lib/utils";
import type { SermonWithRelations } from "@/types/database";
import { useFavourite } from "@/hooks/useFavourite";

export function SermonActionSheet({
  sermon,
  onClose,
}: {
  sermon: SermonWithRelations | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const play = useAudioStore((s) => s.play);
  const [copied, setCopied] = useState(false);
  const [isFav, toggleFavorite] = useFavourite(sermon?.id);

  if (!sermon) return null;

  const thumb = sermon.artwork_url || sermon.series?.thumbnail_url || null;
  const preacherName = sermon.preachers?.name ?? "Citizens Preacher";

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
    openExternalUrl(sermon.audio_url);
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
