import { useApiSettingsStore } from '../stores/apiSettingsStore'
import type { ApiSettings } from '../types/apiSettings'

/**
 * Read current API settings synchronously from the Zustand store.
 * Safe to use in non-React code like `lib/api.ts`.
 */
export function getApiSettings(): ApiSettings {
  return useApiSettingsStore.getState().settings
}
