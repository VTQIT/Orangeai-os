/**
 * Preload queue hook — fetches upcoming songs while the current one plays.
 * Uses IndexedDB cache for recently played songs and preloads next 2-3 tracks.
 * Adapts preload behavior based on connection type (WiFi vs cellular).
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { getCachedAudio, cacheAudio } from './useAudioCache';

interface PreloadStatus {
  url: string;
  state: 'pending' | 'loading' | 'cached' | 'error';
  bufferedSeconds: number;
  totalSeconds: number;
}

interface ConnectionInfo {
  type: 'wifi' | 'cellular' | 'unknown';
  downlink: number; // Mbps estimate
  saveData: boolean;
}

function getConnectionInfo(): ConnectionInfo {
  const nav = navigator as any;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  if (!conn) return { type: 'unknown', downlink: 10, saveData: false };

  const type = conn.type === 'wifi' || conn.effectiveType === '4g' ? 'wifi' : 'cellular';
  return {
    type,
    downlink: conn.downlink || 10,
    saveData: conn.saveData || false,
  };
}

interface Track {
  audioUrl: string;
  duration: number;
}

export function usePreloadQueue(tracks: Track[], currentIndex: number, isPlaying: boolean) {
  const preloadedUrls = useRef<Map<string, { blobUrl: string; audio: HTMLAudioElement }>>(new Map());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const [preloadStatuses, setPreloadStatuses] = useState<Map<string, PreloadStatus>>(new Map());
  const [dataSaverMode, setDataSaverMode] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>(getConnectionInfo);
  const skipHistory = useRef<number[]>([]);

  // Track skip patterns
  const recordSkip = useCallback(() => {
    skipHistory.current.push(Date.now());
    // Keep last 20 skips
    if (skipHistory.current.length > 20) skipHistory.current.shift();
  }, []);

  // Monitor connection changes
  useEffect(() => {
    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (!conn) return;

    const update = () => setConnectionInfo(getConnectionInfo());
    conn.addEventListener('change', update);
    return () => conn.removeEventListener('change', update);
  }, []);

  // Calculate how many tracks to preload
  const getPreloadCount = useCallback((): number => {
    if (dataSaverMode) return 0; // Only current song
    if (connectionInfo.saveData) return 0;
    if (connectionInfo.type === 'cellular') return 1;

    // Check rapid skipping — if user is skipping a lot, preload more
    const recentSkips = skipHistory.current.filter(t => Date.now() - t < 30000).length;
    if (recentSkips > 5) return 3;
    return 2;
  }, [dataSaverMode, connectionInfo]);

  // Get buffer health for a URL
  const getBufferHealth = useCallback((url: string): number => {
    const entry = preloadedUrls.current.get(url);
    if (!entry) return 0;
    const audio = entry.audio;
    if (!audio.buffered.length) return 0;
    return audio.buffered.end(audio.buffered.length - 1);
  }, []);

  // Preload a single track
  const preloadTrack = useCallback(async (track: Track): Promise<void> => {
    const url = track.audioUrl;
    if (preloadedUrls.current.has(url)) return;

    // Check IndexedDB cache first
    const cachedBlobUrl = await getCachedAudio(url);
    if (cachedBlobUrl) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = cachedBlobUrl;
      preloadedUrls.current.set(url, { blobUrl: cachedBlobUrl, audio });
      setPreloadStatuses(prev => {
        const next = new Map(prev);
        next.set(url, { url, state: 'cached', bufferedSeconds: track.duration, totalSeconds: track.duration });
        return next;
      });
      return;
    }

    // Fetch and cache
    const controller = new AbortController();
    abortControllers.current.set(url, controller);

    setPreloadStatuses(prev => {
      const next = new Map(prev);
      next.set(url, { url, state: 'loading', bufferedSeconds: 0, totalSeconds: track.duration });
      return next;
    });

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Cache in IndexedDB for future
      cacheAudio(url, blob).catch(() => {});

      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = blobUrl;

      preloadedUrls.current.set(url, { blobUrl, audio });
      abortControllers.current.delete(url);

      setPreloadStatuses(prev => {
        const next = new Map(prev);
        next.set(url, { url, state: 'cached', bufferedSeconds: track.duration, totalSeconds: track.duration });
        return next;
      });
    } catch (err: any) {
      abortControllers.current.delete(url);
      if (err.name !== 'AbortError') {
        setPreloadStatuses(prev => {
          const next = new Map(prev);
          next.set(url, { url, state: 'error', bufferedSeconds: 0, totalSeconds: track.duration });
          return next;
        });
      }
    }
  }, []);

  // Get a preloaded blob URL (or original if not preloaded)
  const getPreloadedUrl = useCallback((url: string): string => {
    return preloadedUrls.current.get(url)?.blobUrl ?? url;
  }, []);

  // Main preload effect — runs when track changes or playback starts
  useEffect(() => {
    if (tracks.length === 0) return;
    if (!isPlaying && currentIndex === 0) return;

    const count = getPreloadCount();
    const toPreload: Track[] = [];

    for (let i = 1; i <= count; i++) {
      const idx = (currentIndex + i) % tracks.length;
      if (idx !== currentIndex) {
        toPreload.push(tracks[idx]);
      }
    }

    // Also preload previous track for quick back-skip
    if (currentIndex > 0) {
      toPreload.push(tracks[currentIndex - 1]);
    }

    // Preload current track too
    toPreload.push(tracks[currentIndex]);

    toPreload.forEach(t => preloadTrack(t));
  }, [currentIndex, isPlaying, tracks, getPreloadCount, preloadTrack]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllers.current.forEach(c => c.abort());
      preloadedUrls.current.forEach(({ blobUrl }) => URL.revokeObjectURL(blobUrl));
      preloadedUrls.current.clear();
      abortControllers.current.clear();
    };
  }, []);

  // Calculate total buffer health across upcoming tracks
  const bufferHealthSeconds = (() => {
    if (tracks.length === 0) return 0;
    let total = 0;
    const count = getPreloadCount();
    for (let i = 0; i <= count; i++) {
      const idx = (currentIndex + i) % tracks.length;
      const track = tracks[idx];
      if (!track) continue;
      const url = track.audioUrl;
      const status = preloadStatuses.get(url);
      if (status?.state === 'cached') {
        total += status.totalSeconds;
      } else if (status?.state === 'loading') {
        total += status.bufferedSeconds;
      }
    }
    return total;
  })();

  return {
    getPreloadedUrl,
    getBufferHealth,
    preloadStatuses,
    bufferHealthSeconds,
    connectionInfo,
    dataSaverMode,
    setDataSaverMode,
    recordSkip,
    preloadCount: getPreloadCount(),
  };
}
