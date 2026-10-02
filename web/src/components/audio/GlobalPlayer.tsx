"use client";

import { useAudioStore } from "@/store/useAudioStore";
import { Play, Pause, X, Loader2, RotateCcw, RotateCw } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const SKIP_SECONDS = 15;

export function GlobalPlayer() {
  const {
    currentSermon,
    isPlaying,
    isBuffering,
    loadError,
    currentTime,
    duration,
    playbackSpeed,
    togglePlay,
    retry,
    clear,
    seek,
    setSpeed
  } = useAudioStore();

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  const displayTime = isScrubbing ? localTime : currentTime;

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = Math.floor(time % 60);
    const ss = `${s < 10 ? "0" : ""}${s}`;
    // Sermons often run past an hour: show h:mm:ss instead of e.g. "75:20"
    return h > 0 ? `${h}:${m < 10 ? "0" : ""}${m}:${ss}` : `${m}:${ss}`;
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

  const seekTo = (time: number) => {
    if (duration === 0) return;
    seek(Math.max(0, Math.min(duration, time)));
  };

  // Keyboard support for the seek slider
  const handleScrubKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = {
      ArrowLeft: currentTime - 5,
      ArrowDown: currentTime - 5,
      ArrowRight: currentTime + 5,
      ArrowUp: currentTime + 5,
      PageDown: currentTime - 60,
      PageUp: currentTime + 60,
      Home: 0,
      End: duration,
    };
    if (e.key in steps) {
      e.preventDefault();
      seekTo(steps[e.key]);
    }
  };

  const toggleSpeed = () => {
    const nextSpeed = playbackSpeed >= 2.0 ? 0.5 : playbackSpeed >= 1.5 ? 2.0 : playbackSpeed >= 1.0 ? 1.5 : 1.0;
    setSpeed(nextSpeed);
  };

  if (!currentSermon) return null;

  const showSpinner = isPlaying && isBuffering;
  const playLabel = showSpinner ? "Loading audio" : isPlaying ? "Pause" : "Play";

  return (
    <div className="fixed bottom-[68px] md:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.25rem)] max-w-[600px] animate-fade-up">
      <div className="bg-[#121318]/95 backdrop-blur-2xl rounded-2xl p-3.5 sm:p-4 shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col gap-2.5 sm:gap-3 relative border border-white/15">

        {/* Close Button */}
        <button
          onClick={clear}
          className="absolute -top-2.5 -right-2.5 bg-[#181920] border border-white/20 text-white/70 hover:text-white rounded-full p-1 shadow-md hover:scale-110 active:scale-95 transition-all z-10"
          title="Close player"
          aria-label="Close player"
        >
          <X size={14} aria-hidden="true" />
        </button>

        {/* Info Row */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary border border-primary/30 shadow-sm relative overflow-hidden">
            {currentSermon.artwork_url && currentSermon.artwork_url !== "ERROR" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentSermon.artwork_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[22px] relative z-10 text-white" aria-hidden="true">music_note</span>
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

          {/* Main controls (Desktop right side) */}
          <div className="hidden sm:flex items-center gap-2">
             <button
               onClick={toggleSpeed}
               className="text-xs font-semibold text-blue-400 bg-blue-500/15 hover:bg-blue-500/25 px-2 py-1 rounded-lg transition-colors border border-blue-500/20"
               aria-label={`Playback speed ${playbackSpeed}x. Change speed`}
             >
               {playbackSpeed}x
             </button>
             <button
               onClick={() => seekTo(currentTime - SKIP_SECONDS)}
               className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
               aria-label={`Back ${SKIP_SECONDS} seconds`}
               title={`Back ${SKIP_SECONDS} seconds`}
             >
               <RotateCcw size={18} aria-hidden="true" />
             </button>
             <button
               onClick={togglePlay}
               className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-all shadow-md active:scale-95 shrink-0"
               aria-label={playLabel}
             >
               {showSpinner ? (
                 <Loader2 size={18} className="animate-spin" aria-hidden="true" />
               ) : isPlaying ? (
                 <Pause size={18} aria-hidden="true" />
               ) : (
                 <Play size={18} className="ml-0.5" aria-hidden="true" />
               )}
             </button>
             <button
               onClick={() => seekTo(currentTime + SKIP_SECONDS)}
               className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
               aria-label={`Forward ${SKIP_SECONDS} seconds`}
               title={`Forward ${SKIP_SECONDS} seconds`}
             >
               <RotateCw size={18} aria-hidden="true" />
             </button>
          </div>
        </div>

        {/* Load failure: say what happened and offer a way forward */}
        {loadError && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2">
            <p className="text-xs text-red-300 leading-snug">
              Couldn&apos;t load this sermon. Check your connection and try again.
            </p>
            <button
              onClick={retry}
              className="shrink-0 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Scrubber */}
        <div className="flex items-center gap-3 font-label-sm text-label-sm text-on-surface-variant">
          <span className="w-11 text-right font-medium tabular-nums">{formatTime(displayTime)}</span>
          {/* Tall, padded hit area around the thin track so it is easy to grab on touch screens */}
          <div
            ref={progressRef}
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration)}
            aria-valuenow={Math.floor(displayTime)}
            aria-valuetext={`${formatTime(displayTime)} of ${formatTime(duration)}`}
            className="flex-1 py-3 -my-3 cursor-pointer relative group touch-none rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
            onMouseDown={handleScrubStart}
            onTouchStart={handleScrubStart}
            onKeyDown={handleScrubKeyDown}
          >
            <div className="h-2 bg-surface-container-high rounded-full relative">
              <div
                className="absolute top-0 left-0 h-full bg-primary rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
              {/* Scrubber thumb: always visible on touch screens, on hover/focus with a mouse */}
              <div
                className="absolute top-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-sm border border-primary/30 transition-transform opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100"
                style={{ left: `calc(${progressPercent}% - 7px)`, transform: isScrubbing ? 'translateY(-50%) scale(1.3)' : 'translateY(-50%) scale(1)' }}
              />
            </div>
          </div>
          <span className="w-11 font-medium tabular-nums">{formatTime(duration)}</span>
        </div>

        {/* Controls Row (Mobile) */}
        <div className="flex sm:hidden items-center justify-between mt-1 px-1">
          <button
            onClick={toggleSpeed}
            className="font-label-md text-label-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors min-w-11 min-h-11"
            aria-label={`Playback speed ${playbackSpeed}x. Change speed`}
          >
            {playbackSpeed}x
          </button>

          <button
            onClick={() => seekTo(currentTime - SKIP_SECONDS)}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white/80 active:bg-white/10 active:scale-95 transition-all"
            aria-label={`Back ${SKIP_SECONDS} seconds`}
          >
            <RotateCcw size={22} aria-hidden="true" />
          </button>

          <button
            onClick={togglePlay}
            className="play-glow w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition-all shadow-md active:scale-95"
            aria-label={playLabel}
          >
            {showSpinner ? (
              <Loader2 size={26} className="animate-spin" aria-hidden="true" />
            ) : (
              <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            )}
          </button>

          <button
            onClick={() => seekTo(currentTime + SKIP_SECONDS)}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white/80 active:bg-white/10 active:scale-95 transition-all"
            aria-label={`Forward ${SKIP_SECONDS} seconds`}
          >
            <RotateCw size={22} aria-hidden="true" />
          </button>

          <a
            href={currentSermon.audio_url}
            download
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
            aria-label="Download sermon"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">download</span>
          </a>
        </div>

      </div>
    </div>
  );
}
