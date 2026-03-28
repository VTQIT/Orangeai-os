/**
 * Persistent IndexedDB-based media cache with folder organization.
 * Replaces in-memory Map caches with disk-persistent blob storage.
 * 
 * Folder structure (IndexedDB object stores):
 *   - videos/backgrounds   — desktop background theme videos
 *   - videos/weather       — weather scene videos
 *   - videos/ads           — advertisement videos
 *   - videos/apps          — app-specific videos (Orange AI intro, etc.)
 *   - images/ads           — advertisement banner images
 *   - images/icons         — app icons
 *   - images/logos          — brand/splash logos
 *   - images/store         — Jollibee / store assets
 *   - images/spotify       — Spotify/Musify cover art
 *   - images/orangeai      — Orange AI Hub assets
 * 
 * Each entry stores: { url, blob, folder, cachedAt, size, version }
 * LRU eviction per folder when storage exceeds limits.
 * Background version-check detects new assets automatically.
 */

const DB_NAME = 'orangeai-media-cache';
const DB_VERSION = 2;
const STORE_NAME = 'media';

// Max items per folder category
const FOLDER_LIMITS: Record<string, number> = {
  'videos/backgrounds': 15,
  'videos/weather': 20,
  'videos/ads': 15,
  'videos/apps': 10,
  'images/ads': 20,
  'images/icons': 100,
  'images/logos': 20,
  'images/store': 30,
  'images/spotify': 30,
  'images/orangeai': 15,
};

interface CacheEntry {
  url: string;
  blob: Blob;
  folder: string;
  cachedAt: number;
  size: number;
  contentHash: string; // ETag or last-modified for versioning
}

// In-memory URL map for fast runtime lookups (populated from IndexedDB on init)
const memoryUrlMap = new Map<string, string>(); // original URL -> blob URL
let dbInstance: IDBDatabase | null = null;
let dbReady: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbReady) return dbReady;

  dbReady = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('folder', 'folder', { unique: false });
        store.createIndex('cachedAt', 'cachedAt', { unique: false });
        store.createIndex('folder_cachedAt', ['folder', 'cachedAt'], { unique: false });
      }
    };
    req.onsuccess = () => {
      dbInstance = req.result;
      resolve(dbInstance);
    };
    req.onerror = () => {
      console.warn('[MediaCache] IndexedDB open failed, falling back to memory-only');
      reject(req.error);
    };
  });
  return dbReady;
}

/** Hydrate in-memory map from IndexedDB on startup */
async function hydrateMemoryMap(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          const entry = cursor.value as CacheEntry;
          const blobUrl = URL.createObjectURL(entry.blob);
          memoryUrlMap.set(entry.url, blobUrl);
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => resolve();
    });
  } catch {
    // Fallback: memory-only mode
  }
}

/** Store a blob in IndexedDB with folder categorization */
async function persistToIDB(url: string, blob: Blob, folder: string, contentHash: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Evict oldest in this folder if over limit
    const limit = FOLDER_LIMITS[folder] || 50;
    const folderIndex = store.index('folder');
    const countReq = folderIndex.count(folder);
    
    await new Promise<void>((resolve) => {
      countReq.onsuccess = () => {
        if (countReq.result >= limit) {
          const compoundIndex = store.index('folder_cachedAt');
          const range = IDBKeyRange.bound([folder, 0], [folder, Date.now()]);
          const cursor = compoundIndex.openCursor(range);
          let deleted = 0;
          const toDelete = countReq.result - limit + 1;
          cursor.onsuccess = () => {
            const c = cursor.result;
            if (c && deleted < toDelete) {
              const oldEntry = c.value as CacheEntry;
              // Revoke old blob URL from memory
              const oldBlobUrl = memoryUrlMap.get(oldEntry.url);
              if (oldBlobUrl) {
                URL.revokeObjectURL(oldBlobUrl);
                memoryUrlMap.delete(oldEntry.url);
              }
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

    const entry: CacheEntry = {
      url,
      blob,
      folder,
      cachedAt: Date.now(),
      size: blob.size,
      contentHash,
    };
    store.put(entry);
  } catch {
    // Best-effort persistence
  }
}

/** Check if a cached asset is stale by comparing headers */
async function isAssetStale(url: string): Promise<{ stale: boolean; hash: string }> {
  try {
    const db = await openDB();
    const entry = await new Promise<CacheEntry | undefined>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(url);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    });

    if (!entry) return { stale: true, hash: '' };

    // HEAD request to check if asset changed
    try {
      const resp = await fetch(url, { method: 'HEAD' });
      const etag = resp.headers.get('etag') || '';
      const lastMod = resp.headers.get('last-modified') || '';
      const newHash = etag || lastMod || '';
      
      if (newHash && entry.contentHash && newHash !== entry.contentHash) {
        return { stale: true, hash: newHash };
      }
      return { stale: false, hash: newHash || entry.contentHash };
    } catch {
      // Can't reach server — assume not stale
      return { stale: false, hash: entry.contentHash };
    }
  } catch {
    return { stale: true, hash: '' };
  }
}

// ─── Folder classification ────────────────────────────────────────────────────

function classifyUrl(url: string, poolHint?: string): string {
  if (poolHint) return poolHint;
  
  const lower = url.toLowerCase();
  if (lower.includes('/background') || lower.includes('bg-')) return 'videos/backgrounds';
  if (lower.includes('/weather') || lower.includes('weather')) return 'videos/weather';
  if (lower.includes('/ads/') || lower.includes('ad-')) return lower.match(/\.(mp4|webm|mov)/) ? 'videos/ads' : 'images/ads';
  if (lower.includes('orange-ai') || lower.includes('orangeai')) return 'images/orangeai';
  if (lower.includes('jollibee') || lower.includes('store')) return 'images/store';
  if (lower.includes('spotify') || lower.includes('musify')) return 'images/spotify';
  if (lower.includes('logo')) return 'images/logos';
  if (lower.includes('icon') || lower.includes('/icons/')) return 'images/icons';
  if (lower.match(/\.(mp4|webm|mov)/)) return 'videos/apps';
  if (lower.match(/\.(png|jpg|jpeg|gif|svg|webp)/)) return 'images/icons';
  if (lower.includes('unsplash.com')) return 'images/ads';
  return 'images/icons';
}

// ─── Public API (drop-in replacement) ─────────────────────────────────────────

// Track in-flight fetches
const pendingFetches = new Map<string, Promise<string>>();

const MAX_CONCURRENT = 3;
let activeCount = 0;
const taskQueue: Array<() => void> = [];

function runNext() {
  while (activeCount < MAX_CONCURRENT && taskQueue.length > 0) {
    activeCount++;
    const next = taskQueue.shift()!;
    next();
  }
}

/** Fetch, cache in memory + IndexedDB, return blob URL */
function fetchAndCache(url: string, folder?: string): Promise<string> {
  if (memoryUrlMap.has(url)) return Promise.resolve(memoryUrlMap.get(url)!);

  const existing = pendingFetches.get(url);
  if (existing) return existing;

  const resolvedFolder = classifyUrl(url, folder);

  const promise = fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const etag = res.headers.get('etag') || '';
      const lastMod = res.headers.get('last-modified') || '';
      const contentHash = etag || lastMod || `t-${Date.now()}`;
      return res.blob().then(blob => ({ blob, contentHash }));
    })
    .then(({ blob, contentHash }) => {
      const blobUrl = URL.createObjectURL(blob);
      memoryUrlMap.set(url, blobUrl);
      pendingFetches.delete(url);
      // Persist to IndexedDB in background
      persistToIDB(url, blob, resolvedFolder, contentHash).catch(() => {});
      return blobUrl;
    })
    .catch(() => {
      pendingFetches.delete(url);
      return url; // fallback to original
    });

  pendingFetches.set(url, promise);
  return promise;
}

/** Cache multiple assets with concurrency control */
function cacheAssetsAsync(urls: string[], folder?: string): Promise<string[]> {
  return Promise.all(urls.map(url => {
    if (memoryUrlMap.has(url) || pendingFetches.has(url)) {
      return fetchAndCache(url, folder);
    }
    return new Promise<string>((resolve) => {
      const run = () => {
        fetchAndCache(url, folder).then(result => {
          activeCount--;
          runNext();
          resolve(result);
        });
      };
      if (activeCount < MAX_CONCURRENT) {
        activeCount++;
        run();
      } else {
        taskQueue.push(run);
      }
    });
  }));
}

// ─── Precaching flags (prevent double-calls) ────────────────────────────────
const precachedPools = new Set<string>();

function precachePool(poolName: string, urls: string[], folder: string): Promise<string[]> {
  if (precachedPools.has(poolName)) {
    return Promise.resolve(urls.map(u => memoryUrlMap.get(u) ?? u));
  }
  precachedPools.add(poolName);
  return cacheAssetsAsync(urls, folder);
}

export function precacheLogos(urls: string[]) { return precachePool('logos', urls, 'images/logos'); }
export function precacheBackgrounds(urls: string[]) { return precachePool('backgrounds', urls, 'videos/backgrounds'); }
export function precacheIcons(urls: string[]) { return precachePool('icons', urls, 'images/icons'); }
export function precacheVideos(urls: string[]) { return precachePool('weather', urls, 'videos/weather'); }
export function precacheAds(urls: string[]) {
  if (precachedPools.has('ads')) return Promise.resolve(urls.map(u => memoryUrlMap.get(u) ?? u));
  precachedPools.add('ads');
  const videos = urls.filter(u => /\.(mp4|webm|mov)$/i.test(u));
  const images = urls.filter(u => !/\.(mp4|webm|mov)$/i.test(u));
  return Promise.all([
    cacheAssetsAsync(videos, 'videos/ads'),
    cacheAssetsAsync(images, 'images/ads'),
  ]).then(([v, i]) => [...v, ...i]);
}
export function precacheJollibee(urls: string[]) { return precachePool('jollibee', urls, 'images/store'); }
export function precacheSpotify(urls: string[]) { return precachePool('spotify', urls, 'images/spotify'); }
export function precacheOrangeAi(urls: string[]) { return precachePool('orangeai', urls, 'images/orangeai'); }

/** Get cached blob URL or fallback to original */
export function getCachedUrl(url: string): string {
  return memoryUrlMap.get(url) ?? url;
}

/** Wait for a specific URL to be cached */
export function waitForCachedUrl(url: string): Promise<string> {
  const cached = memoryUrlMap.get(url);
  if (cached) return Promise.resolve(cached);
  const pending = pendingFetches.get(url);
  if (pending) return pending;
  return fetchAndCache(url, 'videos/backgrounds');
}

/** Fetch and cache a single video */
export function fetchAndCacheVideo(url: string): Promise<string> {
  return fetchAndCache(url, 'videos/apps');
}

// ─── Background version checker ──────────────────────────────────────────────

/** Check all registered URLs for staleness and re-fetch if needed */
async function backgroundVersionCheck(allUrls: string[]): Promise<void> {
  // Run checks with low priority — small batches with delays
  const BATCH_SIZE = 5;
  const DELAY_MS = 2000;

  for (let i = 0; i < allUrls.length; i += BATCH_SIZE) {
    const batch = allUrls.slice(i, i + BATCH_SIZE);
    const checks = await Promise.all(
      batch.map(async (url) => {
        const { stale } = await isAssetStale(url);
        return { url, stale };
      })
    );

    const staleUrls = checks.filter(c => c.stale).map(c => c.url);
    if (staleUrls.length > 0) {
      // Re-fetch stale assets
      for (const url of staleUrls) {
        // Remove from memory so fetchAndCache will re-download
        const oldBlob = memoryUrlMap.get(url);
        if (oldBlob) {
          URL.revokeObjectURL(oldBlob);
          memoryUrlMap.delete(url);
        }
      }
      await cacheAssetsAsync(staleUrls);
    }

    // Throttle between batches
    if (i + BATCH_SIZE < allUrls.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
}

// ─── Initialization & main start ─────────────────────────────────────────────

let initDone = false;
let initPromise: Promise<void> | null = null;

/** Initialize: hydrate memory map from IndexedDB */
export function initMediaCache(): Promise<void> {
  if (initDone) return Promise.resolve();
  if (initPromise) return initPromise;
  initPromise = hydrateMemoryMap().then(() => { initDone = true; }).catch(() => { initDone = true; });
  return initPromise;
}

let criticalReady: Promise<void> | null = null;

/**
 * Start all precaching with proper priority ordering.
 * Initializes IndexedDB hydration first, then proceeds with priority-based loading.
 */
export function startPrecaching(config: {
  logos: string[];
  backgrounds: string[];
  backgroundThemes: string[];
  icons: string[];
  weatherVideos: string[];
  adAssets: string[];
  jollibeeAssets?: string[];
  spotifyAssets?: string[];
  orangeAiAssets?: string[];
}): Promise<void> {
  if (criticalReady) return criticalReady;

  criticalReady = initMediaCache().then(async () => {
    // P0: Critical assets (logos + default background)
    await Promise.all([
      precacheLogos(config.logos),
      precacheBackgrounds(config.backgrounds),
    ]);
  });

  // P1 + P2 in background after critical
  criticalReady.then(() => {
    precacheIcons(config.icons);
    if (config.jollibeeAssets?.length) precacheJollibee(config.jollibeeAssets);
    if (config.orangeAiAssets?.length) precacheOrangeAi(config.orangeAiAssets);
    precacheAds(config.adAssets).then(() => {
      // P2: Weather + themes + spotify
      precacheVideos(config.weatherVideos);
      if (config.spotifyAssets?.length) precacheSpotify(config.spotifyAssets);
      const themeVideos = config.backgroundThemes.filter(u => !memoryUrlMap.has(u));
      if (themeVideos.length > 0) {
        cacheAssetsAsync(themeVideos, 'videos/backgrounds');
      }

      // After everything cached, run background version check
      const allUrls = [
        ...config.logos, ...config.backgrounds, ...config.backgroundThemes,
        ...config.icons, ...config.weatherVideos, ...config.adAssets,
        ...(config.jollibeeAssets || []), ...(config.spotifyAssets || []),
        ...(config.orangeAiAssets || []),
      ];
      // Delay version check to not interfere with initial load
      setTimeout(() => backgroundVersionCheck(allUrls), 30000);
    });
  });

  return criticalReady;
}

/** Get cache statistics for debugging */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  totalSize: number;
  folders: Record<string, { count: number; size: number }>;
}> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();
      const folders: Record<string, { count: number; size: number }> = {};
      let totalEntries = 0;
      let totalSize = 0;

      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          const entry = cursor.value as CacheEntry;
          totalEntries++;
          totalSize += entry.size;
          if (!folders[entry.folder]) folders[entry.folder] = { count: 0, size: 0 };
          folders[entry.folder].count++;
          folders[entry.folder].size += entry.size;
          cursor.continue();
        } else {
          resolve({ totalEntries, totalSize, folders });
        }
      };
      req.onerror = () => resolve({ totalEntries: 0, totalSize: 0, folders: {} });
    });
  } catch {
    return { totalEntries: 0, totalSize: 0, folders: {} };
  }
}
