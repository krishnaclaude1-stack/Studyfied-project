/**
 * Session hydration hook - Loads session data on mount
 * Reference: Tech Plan Section 3.2 - Session Lifecycle
 */

import { useEffect, useState } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { usePlayerStore } from '../stores/playerStore';
import { useAnnotationStore } from '../stores/annotationStore';
import { checkTabConflict, claimSession } from '../lib/session';

interface UseSessionHydrationOptions {
  lessonId: string;
  audioDuration: number;
  onTabConflict?: (otherTabId: string) => void;
}

interface UseSessionHydrationResult {
  isHydrating: boolean;
  hasTabConflict: boolean;
  isStale: boolean;
  claimOwnership: () => void;
}

/**
 * Hook to handle session hydration on workspace mount.
 * Loads persisted session data and checks for multi-tab conflicts.
 * 
 * @param options - Configuration options
 * @returns Hydration status and control functions
 */
export const useSessionHydration = ({
  lessonId,
  audioDuration,
  onTabConflict,
}: UseSessionHydrationOptions): UseSessionHydrationResult => {
  const [hasTabConflict, setHasTabConflict] = useState(false);
  const [isStale, setIsStale] = useState(false);
  
  const hydrateSession = useSessionStore((state) => state.hydrateSession);
  const isHydrating = useSessionStore((state) => state.isHydrating);
  const hydratePlayer = usePlayerStore((state) => state.hydrateFromSession);
  const hydrateAnnotations = useAnnotationStore((state) => state.hydrateFromSession);

  useEffect(() => {
    if (!lessonId) return;

    // Check for tab conflicts
    const conflict = checkTabConflict(lessonId);
    setHasTabConflict(conflict.hasConflict);
    setIsStale(conflict.isStale);

    if (conflict.hasConflict && onTabConflict && conflict.otherTabId) {
      onTabConflict(conflict.otherTabId);
      return; // Don't hydrate if there's a conflict
    }

    // Auto-claim if stale or no conflict
    if (conflict.isStale || !conflict.hasConflict) {
      claimSession(lessonId);
      
      // Hydrate session from localStorage
      const sessionData = hydrateSession(lessonId);
      
      if (sessionData) {
        // Restore player state
        hydratePlayer(sessionData.playbackPosition, audioDuration);
        
        // Restore annotation state
        hydrateAnnotations(
          sessionData.annotations.lines,
          sessionData.layerVisibility
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, audioDuration]);

  const claimOwnership = () => {
    claimSession(lessonId);
    setHasTabConflict(false);
    
    // Hydrate after claiming
    const sessionData = hydrateSession(lessonId);
    if (sessionData) {
      hydratePlayer(sessionData.playbackPosition, audioDuration);
      hydrateAnnotations(
        sessionData.annotations.lines,
        sessionData.layerVisibility
      );
    }
  };

  return {
    isHydrating,
    hasTabConflict,
    isStale,
    claimOwnership,
  };
};
