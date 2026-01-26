/**
 * Lesson data store - Persistent lesson state
 * Reference: Zustand persist middleware documentation
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { LessonManifest, AudioCheckpoint } from '../types/lesson';

interface LessonState {
  // State
  lessonManifest: LessonManifest | null;
  audioUrl: string | null;
  loadedAssets: Map<string, HTMLImageElement>;
  checkpoints: AudioCheckpoint[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setLesson: (manifest: LessonManifest, audioUrl: string) => void;
  setLoadedAssets: (assets: Map<string, HTMLImageElement>) => void;
  setCheckpoints: (checkpoints: AudioCheckpoint[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearLesson: () => void;
}

export const useLessonStore = create<LessonState>()(
  persist(
    (set) => ({
      // Initial state
      lessonManifest: null,
      audioUrl: null,
      loadedAssets: new Map(),
      checkpoints: [],
      isLoading: false,
      error: null,

      // Actions
      setLesson: (manifest, audioUrl) =>
        set({
          lessonManifest: manifest,
          audioUrl: audioUrl,
          error: null,
        }),
      setLoadedAssets: (assets) => set({ loadedAssets: assets }),
      setCheckpoints: (checkpoints) => set({ checkpoints: checkpoints }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error: error }),
      clearLesson: () =>
        set({
          lessonManifest: null,
          audioUrl: null,
          loadedAssets: new Map(),
          checkpoints: [],
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: 'studyfied-lesson',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lessonManifest: state.lessonManifest,
        audioUrl: state.audioUrl,
      }),
    }
  )
);
