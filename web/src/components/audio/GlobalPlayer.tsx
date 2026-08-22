"use client";

import { useAudioStore } from "@/store/useAudioStore";
import { Play, Pause, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export function GlobalPlayer() {
  const {
    currentSermon,
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    togglePlay,
    clear,
    seek,
    setSpeed
  } = useAudioStore();

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  const displayTime = isScrubbing ? localTime : currentTime;

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleScrubStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    handleScrubMove(e);
  };

  const handleScrubMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement> | MouseEvent | TouchEvent) => {
    if (!progressRef.current || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent | React.MouseEvent).clientX;
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setLocalTime(pos * duration);
  };

  const handleScrubEnd = () => {
    if (isScrubbing) {
      setIsScrubbing(false);
      seek(localTime);
    }
  };

  // Global mouse/touch up for scrubber
  useEffect(() => {
    if (isScrubbing) {
      const handleMove = (e: MouseEvent | TouchEvent) => handleScrubMove(e);
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("touchmove", handleMove);
      window.addEventListener("mouseup", handleScrubEnd);
      window.addEventListener("touchend", handleScrubEnd);
      return () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("touchmove", handleMove);
        window.removeEventListener("mouseup", handleScrubEnd);
        window.removeEventListener("touchend", handleScrubEnd);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScrubbing, localTime]); // localTime needed for seek on end

  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  const toggleSpeed = () => {
    const nextSpeed = playbackSpeed >= 2.0 ? 0.5 : playbackSpeed >= 1.5 ? 2.0 : playbackSpeed >= 1.0 ? 1.5 : 1.0;
    setSpeed(nextSpeed);
  };

  if (!currentSermon) return null;

  return (
    <div className="fixed bottom-[68px] md:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.25rem)] max-w-[600px] animate-fade-up">
      <div className="bg-[#121318]/95 backdrop-blur-2xl rounded-2xl p-3.5 sm:p-4 shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col gap-2.5 sm:gap-3 relative border border-white/15">

        {/* Close Button */}
        <button
          onClick={clear}
          className="absolute -top-2.5 -right-2.5 bg-[#181920] border border-white/20 text-white/70 hover:text-white rounded-full p-1 shadow-md hover:scale-110 active:scale-95 transition-all z-10"
          title="Close player"
        >
          <X size={14} />
        </button>

        {/* Info Row */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary border border-primary/30 shadow-sm relative overflow-hidden">
            {currentSermon.artwork_url && currentSermon.artwork_url !== "ERROR" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentSermon.artwork_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[22px] relative z-10 text-white">music_note</span>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <h4 className="text-xs sm:text-sm font-semibold text-white truncate" title={currentSermon.title}>
              {currentSermon.title}
            </h4>
            <p className="text-[11px] sm:text-xs text-white/60 truncate mt-0.5 font-normal">
              {currentSermon.preachers?.name || "Unknown Preacher"}
            </p>
          </div>
          
          {/* Main Play/Pause (Desktop right side) */}
          <div className="hidden sm:flex items-center gap-2.5">
             <button
               onClick={toggleSpeed}
               className="text-xs font-semibold text-blue-400 bg-blue-500/15 hover:bg-blue-500/25 px-2 py-1 rounded-lg transition-colors border border-blue-500/20"
             >
               {playbackSpeed}x
             </button>
             <button
               onClick={togglePlay}
               className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-all shadow-md active:scale-95 shrink-0"
             >
               {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
             </button>
          </div>
        </div>

        {/* Scrubber */}
        <div className="flex items-center gap-3 font-label-sm text-label-sm text-on-surface-variant">
          <span className="w-8 text-right font-medium">{formatTime(displayTime)}</span>
          <div
            ref={progressRef}
            className="flex-1 h-2 bg-surface-container-high rounded-full cursor-pointer relative group"
            onMouseDown={handleScrubStart}
            onTouchStart={handleScrubStart}
          >
            <div
              className="absolute top-0 left-0 h-full bg-primary rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Scrubber thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-sm border border-primary/30 transition-transform opacity-0 group-hover:opacity-100"
              style={{ left: `calc(${progressPercent}% - 7px)`, transform: isScrubbing ? 'translateY(-50%) scale(1.3)' : 'translateY(-50%) scale(1)' }}
            />
          </div>
          <span className="w-8 font-medium">{formatTime(duration)}</span>
        </div>

        {/* Controls Row (Mobile) */}
        <div className="flex sm:hidden items-center justify-between mt-1 px-1">
          <button
            onClick={toggleSpeed}
            className="font-label-md text-label-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors"
          >
            {playbackSpeed}x
          </button>

          <button
            onClick={togglePlay}
            className="play-glow w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition-all shadow-md active:scale-95"
          >
            <span className="material-symbols-outlined text-[28px]">
              {isPlaying ? "pause" : "play_arrow"}
            </span>
          </button>

          <a
            href={currentSermon.audio_url}
            download
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
          </a>
        </div>

      </div>
    </div>
  );
}
