"use client";

import { useEffect, useRef } from "react";
import { useAudioStore } from "@/store/useAudioStore";

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { 
    currentSermon, 
    isPlaying, 
    volume, 
    playbackSpeed,
    currentTime,
    updateProgress,
    pause
  } = useAudioStore();

  // Create the audio element exactly once
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio();
    }
  }, []);

  // Sync src — and handle clear (null sermon)
  useEffect(() => {
    if (!audioRef.current) return;

    if (!currentSermon) {
      // Player was closed — stop and unload
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
      return;
    }

    // Only update src if it changed
    if (audioRef.current.src !== currentSermon.audio_url) {
      audioRef.current.src = currentSermon.audio_url;
      audioRef.current.load();
    }
  }, [currentSermon]);

  // Sync play/pause
  useEffect(() => {
    if (!audioRef.current || !currentSermon) return;
    
    if (isPlaying) {
      // Play returns a promise that might reject if user hasn't interacted yet
      audioRef.current.play().catch((e) => {
        console.warn("Audio playback failed:", e);
        pause(); // Revert state if playback blocked
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSermon, pause]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Sync playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Handle external seeking (when currentTime changes significantly from actual time)
  useEffect(() => {
    if (!audioRef.current) return;
    if (Math.abs(audioRef.current.currentTime - currentTime) > 1.0) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Attach event listeners for progress tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let lastSavedTime = 0;

    const handleTimeUpdate = () => {
      // Only update store if we're not actively scrubbing
      const curr = audio.currentTime;
      const dur = audio.duration || 0;
      updateProgress(curr, dur);

      // Throttle localStorage save to once every 5 seconds
      if (currentSermon && Math.abs(curr - lastSavedTime) >= 5) {
        lastSavedTime = curr;
        import('@/store/useAudioStore').then(({ saveProgressToStorage }) => {
          saveProgressToStorage(currentSermon.id, curr, dur);
        });
      }
    };

    const handleEnded = () => {
      pause();
      updateProgress(0, audio.duration || 0);
      if (currentSermon) {
        import('@/store/useAudioStore').then(({ saveProgressToStorage }) => {
          saveProgressToStorage(currentSermon.id, audio.duration || 0, audio.duration || 0);
        });
      }
    };

    // Media Session API for mobile lock screen controls
    const setupMediaSession = () => {
      if ('mediaSession' in navigator && currentSermon) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentSermon.title,
          artist: currentSermon.preachers?.name || 'Unknown Preacher',
          album: currentSermon.series?.name || 'CLC Sermon',
          artwork: currentSermon.artwork_url ? [
            { src: currentSermon.artwork_url, sizes: '400x400', type: 'image/webp' }
          ] : []
        });

        navigator.mediaSession.setActionHandler('play', () => useAudioStore.getState().resume());
        navigator.mediaSession.setActionHandler('pause', () => pause());
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
          const skipTime = details.seekOffset || 15;
          audio.currentTime = Math.max(audio.currentTime - skipTime, 0);
        });
        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          const skipTime = details.seekOffset || 15;
          audio.currentTime = Math.min(audio.currentTime + skipTime, audio.duration);
        });
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", setupMediaSession);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", setupMediaSession);
    };
  }, [currentSermon, updateProgress, pause]);

  return <>{children}</>;
}
