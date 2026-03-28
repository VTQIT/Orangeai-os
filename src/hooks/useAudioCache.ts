/**
 * IndexedDB-based audio cache for storing recently played songs.
 * Caches full audio blobs keyed by URL, with LRU eviction (max 20 songs).
 */

const DB_NAME = 'spotify-audio-cache';
const STORE_NAME = 'audio-blobs';
const DB_VERSION = 1;
const MAX_CACHED = 20;

interface CacheEntry {
  url: string;
  blob: Blob;
  accessedAt: number;
  size: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('accessedAt', 'accessedAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Get a cached audio blob URL, or null if not cached */
export async function getCachedAudio(url: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(url);
      req.onsuccess = () => {
        const entry = req.result as CacheEntry | undefined;
        if (entry) {
          // Update access time
          entry.accessedAt = Date.now();
          store.put(entry);
          resolve(URL.createObjectURL(entry.blob));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** Store an audio blob in IndexedDB cache with LRU eviction */
export async function cacheAudio(url: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Check count
    const countReq = store.count();
    await new Promise<void>((resolve) => {
      countReq.onsuccess = () => {
        if (countReq.result >= MAX_CACHED) {
          // Evict oldest
          const index = store.index('accessedAt');
          const cursor = index.openCursor();
          let deleted = 0;
          const toDelete = countReq.result - MAX_CACHED + 1;
          cursor.onsuccess = () => {
            const c = cursor.result;
            if (c && deleted < toDelete) {
              store.delete(c.primaryKey);
              deleted++;
              c.continue();
            } else {
              resolve();
            }
          };
          cursor.onerror = () => resolve();
        } else {
          resolve();
        }
      };
      countReq.onerror = () => resolve();
    });

    // Store new entry
    const entry: CacheEntry = {
      url,
      blob,
      accessedAt: Date.now(),
      size: blob.size,
    };
    store.put(entry);
  } catch {
    // Silently fail — cache is best-effort
  }
}

/** Check if audio is cached without loading it */
export async function isAudioCached(url: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count(url);
      req.onsuccess = () => resolve(req.result > 0);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/** Clear entire audio cache */
export async function clearAudioCache(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch {
    // ignore
  }
}
