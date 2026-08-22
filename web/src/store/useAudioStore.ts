import { create } from 'zustand';
import { SermonWithRelations } from '@/types/database';

interface AudioState {
  // State
  currentSermon: SermonWithRelations | null;
  isPlaying: boolean;
  playbackSpeed: number;
  currentTime: number;
  duration: number;
  volume: number;
  
  // Actions
  play: (sermon: SermonWithRelations) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  updateProgress: (currentTime: number, duration: number) => void;
  clear: () => void;
}

// ── LocalStorage Helpers (safe for SSR) ──────────────────────────────────────
const VOLUME_KEY = 'fm_volume';
const PROGRESS_PREFIX = 'fm_progress_';

function getInitialVolume(): number {
  if (typeof window === 'undefined') return 1.0;
  try {
    const saved = localStorage.getItem(VOLUME_KEY);
    return saved !== null ? parseFloat(saved) : 1.0;
  } catch {
    return 1.0;
  }
}

export function getSavedProgress(sermonId: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const saved = localStorage.getItem(`${PROGRESS_PREFIX}${sermonId}`);
    return saved !== null ? parseFloat(saved) : 0;
  } catch {
    return 0;
  }
}

export function saveProgressToStorage(sermonId: string, time: number, duration: number) {
  if (typeof window === 'undefined' || !sermonId) return;
  try {
    // Only save meaningful progress (> 10s and not completed > 98%)
    if (time > 10 && duration > 0 && time < duration * 0.98) {
      localStorage.setItem(`${PROGRESS_PREFIX}${sermonId}`, time.toFixed(1));
    } else if (duration > 0 && time >= duration * 0.98) {
      localStorage.removeItem(`${PROGRESS_PREFIX}${sermonId}`);
    }
  } catch {
    // Ignore storage errors (quota/incognito)
  }
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentSermon: null,
  isPlaying: false,
  playbackSpeed: 1.0,
  currentTime: 0,
  duration: 0,
  volume: getInitialVolume(),

  play: (sermon) => {
    // If playing the same sermon, just resume
    if (get().currentSermon?.id === sermon.id) {
      set({ isPlaying: true });
      return;
    }
    
    // Check for saved progress to resume playback
    const savedTime = getSavedProgress(sermon.id);

    set({
      currentSermon: sermon,
      isPlaying: true,
      currentTime: savedTime,
      duration: 0,
    });
  },

  pause: () => set({ isPlaying: false }),
  
  resume: () => {
    if (get().currentSermon) {
      set({ isPlaying: true });
    }
  },

  togglePlay: () => {
    const state = get();
    if (!state.currentSermon) return;
    set({ isPlaying: !state.isPlaying });
  },

  setSpeed: (speed) => set({ playbackSpeed: Math.max(0.5, Math.min(2.0, speed)) }),

  seek: (time) => {
    set({ currentTime: time });
    const current = get().currentSermon;
    if (current) saveProgressToStorage(current.id, time, get().duration);
  },

  setVolume: (volume) => {
    const safeVol = Math.max(0, Math.min(1, volume));
    set({ volume: safeVol });
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(VOLUME_KEY, safeVol.toString()); } catch {}
    }
  },

  updateProgress: (currentTime, duration) => set({ currentTime, duration }),
  
  clear: () => set({
    currentSermon: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  })
}));
