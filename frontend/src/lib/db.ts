import { get, set, del, keys, clear } from 'idb-keyval';

/**
 * IndexedDB wrapper using idb-keyval for client-side storage.
 * Used for storing lessons, assets, and user preferences.
 */

export const db = {
  get,
  set,
  del,
  keys,
  clear,
};

export type { UseStore } from 'idb-keyval';
