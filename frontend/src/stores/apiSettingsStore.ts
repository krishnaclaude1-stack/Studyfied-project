import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

import { db } from '../lib/db'
import { ApiSettings, DEFAULT_API_SETTINGS } from '../types/apiSettings'

const DB_KEY = 'settings:api'
const INDEXEDDB_TIMEOUT_MS = 5000 // 5 second timeout

/**
 * Wrap a promise with a timeout.
 * Rejects if the promise doesn't resolve within the specified time.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('IndexedDB operation timed out')), timeoutMs)
    ),
  ])
}

interface ApiSettingsState {
  settings: ApiSettings
  isHydrating: boolean
  isHydrated: boolean
  lastSavedAt: number | null

  hydrate: () => Promise<void>
  update: (partial: Partial<ApiSettings>) => void
  setAll: (settings: ApiSettings) => void
  save: () => Promise<void>
  reset: () => Promise<void>
}

export const useApiSettingsStore = create<ApiSettingsState>()(
  subscribeWithSelector((set, get) => ({
    settings: DEFAULT_API_SETTINGS,
    isHydrating: false,
    isHydrated: false,
    lastSavedAt: null,

    hydrate: async () => {
      const { isHydrated, isHydrating } = get()
      
      // Prevent multiple simultaneous hydrations
      if (isHydrated || isHydrating) {
        return
      }

      set({ isHydrating: true })
      try {
        const stored = (await withTimeout(
          db.get(DB_KEY),
          INDEXEDDB_TIMEOUT_MS
        )) as ApiSettings | undefined
        if (stored) {
          set({ settings: stored, isHydrated: true })
        } else {
          set({ isHydrated: true })
        }
      } catch (err) {
        console.error('Failed to hydrate API settings:', err)
        // Fall back to defaults on timeout or error
        set({ settings: DEFAULT_API_SETTINGS, isHydrated: true })
      } finally {
        set({ isHydrating: false })
      }
    },

    update: (partial) => {
      set((state) => ({
        settings: {
          ...state.settings,
          ...partial,
        },
      }))
    },

    setAll: (settings) => set({ settings }),

    save: async () => {
      const { settings } = get()
      try {
        await withTimeout(db.set(DB_KEY, settings), INDEXEDDB_TIMEOUT_MS)
        set({ lastSavedAt: Date.now() })
      } catch (err) {
        console.error('Failed to save API settings:', err)
        throw new Error('Failed to save settings. Please try again.')
      }
    },

    reset: async () => {
      try {
        await withTimeout(db.set(DB_KEY, DEFAULT_API_SETTINGS), INDEXEDDB_TIMEOUT_MS)
        set({ settings: DEFAULT_API_SETTINGS, lastSavedAt: Date.now() })
      } catch (err) {
        console.error('Failed to reset API settings:', err)
        throw new Error('Failed to reset settings. Please try again.')
      }
    },
  }))
)

// Auto-hydrate in browser environment only (skip in tests/SSR)
// Tests can manually call hydrate() when needed
if (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined') {
  // Use queueMicrotask to defer hydration until after module initialization
  // This prevents race conditions during test setup
  queueMicrotask(() => {
    useApiSettingsStore.getState().hydrate().catch((err) => {
      // Log but don't throw - app should work with defaults
      console.warn('Auto-hydration failed, using default settings:', err)
    })
  })
}
