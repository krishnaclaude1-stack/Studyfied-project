/**
 * Annotation state store - User annotations with session persistence
 * Reference: Zustand persist middleware documentation, Tech Plan Section 3.2
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface Line {
  x: number;
  y: number;
}

interface LayerVisibility {
  aiDrawings: boolean;
  myNotes: boolean;
}

interface AnnotationState {
  // State
  lines: Line[][];
  isScribbleMode: boolean;
  layerVisibility: LayerVisibility;

  // Actions
  addLine: (line: Line[]) => void;
  toggleScribbleMode: () => void;
  toggleLayerVisibility: (layer: 'aiDrawings' | 'myNotes') => void;
  clearAnnotations: () => void;
  hydrateFromSession: (lines: Line[][], layerVisibility: LayerVisibility) => void;
}

export const useAnnotationStore = create<AnnotationState>()(
  subscribeWithSelector((set) => ({
    // Initial state
    lines: [],
    isScribbleMode: false,
    layerVisibility: {
      aiDrawings: true,
      myNotes: true,
    },

    // Actions
    addLine: (line) => {
      set((state) => ({
        lines: [...state.lines, line],
      }));
      // Trigger session save
      const sessionStore = require('./sessionStore').useSessionStore;
      sessionStore.getState().setUnsavedChanges(true);
    },
    toggleScribbleMode: () =>
      set((state) => ({
        isScribbleMode: !state.isScribbleMode,
      })),
    toggleLayerVisibility: (layer) => {
      set((state) => ({
        layerVisibility: {
          ...state.layerVisibility,
          [layer]: !state.layerVisibility[layer],
        },
      }));
      // Trigger session save
      const sessionStore = require('./sessionStore').useSessionStore;
      sessionStore.getState().setUnsavedChanges(true);
    },
    clearAnnotations: () => {
      set({
        lines: [],
      });
      // Trigger session save
      const sessionStore = require('./sessionStore').useSessionStore;
      sessionStore.getState().setUnsavedChanges(true);
    },
    hydrateFromSession: (lines, layerVisibility) => {
      set({
        lines,
        layerVisibility,
      });
    },
  }))
);
