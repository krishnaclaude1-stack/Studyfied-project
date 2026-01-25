/**
 * Session persistence utilities for localStorage-based session management.
 * Implements per-lesson session isolation and single-tab enforcement.
 * 
 * Reference: Tech Plan Section 3.2 - Session Management
 */

export interface SessionData {
  lessonId: string;
  playbackPosition: number;
  annotations: {
    lines: Array<{ x: number; y: number }[]>;
  };
  layerVisibility: {
    aiDrawings: boolean;
    myNotes: boolean;
  };
  transcriptOpen: boolean;
  lastUpdated: number;
}

export interface CurrentSession {
  lessonId: string | null;
  tabId: string;
  timestamp: number;
}

const SESSION_PREFIX = 'studyfied_session_';
const CURRENT_SESSION_KEY = 'studyfied_current_session';
const TAB_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Generate unique tab ID
let tabId: string | null = null;
const getTabId = (): string => {
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return tabId;
};

/**
 * Save session data to localStorage with debouncing.
 * @param lessonId - Unique lesson identifier
 * @param data - Session data to persist
 */
export const saveSession = (lessonId: string, data: Omit<SessionData, 'lessonId' | 'lastUpdated'>): void => {
  try {
    const sessionData: SessionData = {
      lessonId,
      ...data,
      lastUpdated: Date.now(),
    };
    
    const key = `${SESSION_PREFIX}${lessonId}`;
    localStorage.setItem(key, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Failed to save session:', error);
  }
};

/**
 * Load session data from localStorage.
 * @param lessonId - Unique lesson identifier
 * @returns Session data or null if not found
 */
export const loadSession = (lessonId: string): SessionData | null => {
  try {
    const key = `${SESSION_PREFIX}${lessonId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return null;
    }
    
    const data = JSON.parse(stored) as SessionData;
    return data;
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
};

/**
 * Clear session data for a specific lesson.
 * @param lessonId - Unique lesson identifier
 */
export const clearSession = (lessonId: string): void => {
  try {
    const key = `${SESSION_PREFIX}${lessonId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
};

/**
 * Clear all lesson sessions (used on "New Material" action).
 */
export const clearAllSessions = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(SESSION_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem(CURRENT_SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear all sessions:', error);
  }
};

/**
 * Set current session metadata (for single-tab enforcement).
 * @param lessonId - Unique lesson identifier or null
 */
export const setCurrentSession = (lessonId: string | null): void => {
  try {
    if (!lessonId) {
      localStorage.removeItem(CURRENT_SESSION_KEY);
      return;
    }
    
    const session: CurrentSession = {
      lessonId,
      tabId: getTabId(),
      timestamp: Date.now(),
    };
    
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to set current session:', error);
  }
};

/**
 * Get current session metadata.
 * @returns Current session or null
 */
export const getCurrentSession = (): CurrentSession | null => {
  try {
    const stored = localStorage.getItem(CURRENT_SESSION_KEY);
    
    if (!stored) {
      return null;
    }
    
    const session = JSON.parse(stored) as CurrentSession;
    return session;
  } catch (error) {
    console.error('Failed to get current session:', error);
    return null;
  }
};

/**
 * Check if lesson is open in another tab.
 * @param lessonId - Unique lesson identifier
 * @returns Object with conflict status and details
 */
export const checkTabConflict = (lessonId: string): { 
  hasConflict: boolean; 
  isStale: boolean;
  otherTabId?: string;
} => {
  try {
    const currentSession = getCurrentSession();
    
    if (!currentSession || currentSession.lessonId !== lessonId) {
      return { hasConflict: false, isStale: false };
    }
    
    const currentTabId = getTabId();
    const isOtherTab = currentSession.tabId !== currentTabId;
    
    if (!isOtherTab) {
      return { hasConflict: false, isStale: false };
    }
    
    // Check if session is stale (>5 minutes old)
    const age = Date.now() - currentSession.timestamp;
    const isStale = age > TAB_TIMEOUT_MS;
    
    return {
      hasConflict: !isStale,
      isStale,
      otherTabId: currentSession.tabId,
    };
  } catch (error) {
    console.error('Failed to check tab conflict:', error);
    return { hasConflict: false, isStale: false };
  }
};

/**
 * Claim ownership of a lesson session (force override).
 * @param lessonId - Unique lesson identifier
 */
export const claimSession = (lessonId: string): void => {
  setCurrentSession(lessonId);
};

/**
 * Debounced wrapper for saveSession (max 1 write/sec).
 */
let saveTimeout: NodeJS.Timeout | null = null;
const DEBOUNCE_MS = 1000;

export const debouncedSaveSession = (
  lessonId: string, 
  data: Omit<SessionData, 'lessonId' | 'lastUpdated'>
): void => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    saveSession(lessonId, data);
    saveTimeout = null;
  }, DEBOUNCE_MS);
};
