/**
 * Annotation state store - Future annotation features
 * Reference: Zustand persist middleware documentation
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
}

export const useAnnotationStore = create<AnnotationState>()(
  persist(
    (set) => ({
      // Initial state
      lines: [],
      isScribbleMode: false,
      layerVisibility: {
        aiDrawings: true,
        myNotes: true,
      },

      // Actions
      addLine: (line) =>
        set((state) => ({
          lines: [...state.lines, line],
        })),
      toggleScribbleMode: () =>
        set((state) => ({
          isScribbleMode: !state.isScribbleMode,
        })),
      toggleLayerVisibility: (layer) =>
        set((state) => ({
          layerVisibility: {
            ...state.layerVisibility,
            [layer]: !state.layerVisibility[layer],
          },
        })),
      clearAnnotations: () =>
        set({
          lines: [],
        }),
    }),
    {
      name: 'studyfied-annotations',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
