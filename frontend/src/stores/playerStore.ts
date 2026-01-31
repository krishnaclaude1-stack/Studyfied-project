/**
 * Player state store - Transient playback state
 * Reference: Zustand documentation
 */

import { create } from 'zustand';

interface PlayerState {
  // State
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentSceneId: string | null;
  volume: number;

  // Actions
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setCurrentScene: (sceneId: string | null) => void;
  setVolume: (volume: number) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  // Initial state
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  currentSceneId: null,
  volume: 1.0,

  // Actions
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  seek: (time: number) => set({ currentTime: time }),
  setCurrentTime: (time: number) => set({ currentTime: time }),
  setDuration: (duration: number) => set({ duration: duration }),
  setCurrentScene: (sceneId: string | null) => set({ currentSceneId: sceneId }),
  setVolume: (volume: number) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  reset: () =>
    set({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      currentSceneId: null,
      volume: 1.0,
    }),
}));
