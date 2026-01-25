/**
 * Player state store - Transient playback state with session persistence
 * Reference: Zustand documentation, Tech Plan Section 3.2
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

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
  togglePlayPause: () => void;
  seek: (time: number) => void;
  skipForward: () => void;
  skipBackward: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setCurrentScene: (sceneId: string | null) => void;
  setVolume: (volume: number) => void;
  reset: () => void;
  hydrateFromSession: (playbackPosition: number, duration: number) => void;
}

export const usePlayerStore = create<PlayerState>()(
  subscribeWithSelector((set) => ({
    // Initial state
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    currentSceneId: null,
    volume: 1.0,

    // Actions
    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),
    togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
    seek: (time: number) => set({ currentTime: time }),
    skipForward: () =>
      set((state) => {
        const newTime = Math.min(state.currentTime + 10, state.duration);
        return { currentTime: newTime };
      }),
    skipBackward: () =>
      set((state) => {
        const newTime = Math.max(state.currentTime - 10, 0);
        return { currentTime: newTime };
      }),
    setCurrentTime: (time: number) => {
      set({ currentTime: time });
      // Trigger session save
      const sessionStore = require('./sessionStore').useSessionStore;
      sessionStore.getState().setUnsavedChanges(true);
    },
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
    hydrateFromSession: (playbackPosition: number, duration: number) => {
      set({
        currentTime: playbackPosition,
        duration: duration,
        isPlaying: false,
      });
    },
  }))
);
