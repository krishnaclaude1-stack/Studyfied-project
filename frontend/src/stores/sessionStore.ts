/**
 * Session state store - Manages session metadata and per-lesson isolation.
 * Reference: Tech Plan Section 3.2 - Session Management
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { debouncedSaveSession, loadSession, clearSession as clearSessionStorage, setCurrentSession } from '../lib/session';

interface SessionState {
  // State
  lessonId: string | null;
  transcriptOpen: boolean;
  isHydrating: boolean;
  hasUnsavedChanges: boolean;

  // Actions
  setLessonId: (lessonId: string | null) => void;
  setTranscriptOpen: (open: boolean) => void;
  setHydrating: (hydrating: boolean) => void;
  setUnsavedChanges: (hasChanges: boolean) => void;
  hydrateSession: (lessonId: string) => void;
  clearSession: () => void;
  resetForReplay: () => void;
}

export const useSessionStore = create<SessionState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    lessonId: null,
    transcriptOpen: false,
    isHydrating: false,
    hasUnsavedChanges: false,

    // Actions
    setLessonId: (lessonId) => {
      set({ lessonId });
      if (lessonId) {
        setCurrentSession(lessonId);
      }
    },
    
    setTranscriptOpen: (open) => {
      set({ transcriptOpen: open });
      const { lessonId } = get();
      if (lessonId) {
        // Trigger debounced save via subscription
        set({ hasUnsavedChanges: true });
      }
    },
    
    setHydrating: (hydrating) => set({ isHydrating: hydrating }),
    
    setUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),
    
    hydrateSession: (lessonId) => {
      set({ isHydrating: true });
      
      try {
        const sessionData = loadSession(lessonId);
        
        if (sessionData) {
          set({ 
            lessonId,
            transcriptOpen: sessionData.transcriptOpen,
            isHydrating: false,
          });
          
          // Return session data for other stores to hydrate
          return sessionData;
        } else {
          set({ 
            lessonId,
            isHydrating: false,
          });
          setCurrentSession(lessonId);
        }
      } catch (error) {
        console.error('Failed to hydrate session:', error);
        set({ isHydrating: false });
      }
    },
    
    clearSession: () => {
      const { lessonId } = get();
      if (lessonId) {
        clearSessionStorage(lessonId);
        setCurrentSession(null);
      }
      set({ 
        lessonId: null,
        transcriptOpen: false,
        hasUnsavedChanges: false,
      });
    },
    
    resetForReplay: () => {
      // Replay resets playback but keeps session state
      set({ transcriptOpen: false });
    },
  }))
);

// Auto-save to localStorage when state changes (debounced)
useSessionStore.subscribe(
  (state) => ({
    lessonId: state.lessonId,
    transcriptOpen: state.transcriptOpen,
    hasUnsavedChanges: state.hasUnsavedChanges,
  }),
  (state) => {
    if (state.lessonId && state.hasUnsavedChanges) {
      // Get current state from other stores for complete save
      const playerStore = require('./playerStore').usePlayerStore.getState();
      const annotationStore = require('./annotationStore').useAnnotationStore.getState();
      
      debouncedSaveSession(state.lessonId, {
        playbackPosition: playerStore.currentTime,
        annotations: {
          lines: annotationStore.lines,
        },
        layerVisibility: annotationStore.layerVisibility,
        transcriptOpen: state.transcriptOpen,
      });
      
      // Reset unsaved changes flag after save triggered
      useSessionStore.setState({ hasUnsavedChanges: false });
    }
  }
);
