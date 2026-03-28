import { useState, useEffect, useCallback, useRef } from 'react';
import { getCachedUrl, waitForCachedUrl } from './useVideoCache';

export interface BackgroundTheme {
  id: string;
  label: string;
  icon: string;
  videoUrl: string;
}

export const backgroundThemes: BackgroundTheme[] = [
  { id: 'default', label: 'Default', icon: '🎬', videoUrl: '/videos/background.mp4' },
  { id: 'sunny', label: 'Sunny', icon: '☀️', videoUrl: '/videos/sunny.mp4' },
  { id: 'rainy', label: 'Rainy', icon: '🌧️', videoUrl: '/videos/rainy.mp4' },
  { id: 'snowy', label: 'Snowy', icon: '🌨️', videoUrl: '/videos/snowy.mp4' },
  { id: 'thunderstorm', label: 'Storm', icon: '⛈️', videoUrl: '/videos/thunderstorm.mp4' },
  { id: 'foggy', label: 'Foggy', icon: '🌫️', videoUrl: '/videos/foggy.mp4' },
  { id: 'autumn', label: 'Autumn', icon: '🍂', videoUrl: '/videos/autumn.mp4' },
  { id: 'sunset', label: 'Sunset', icon: '🌅', videoUrl: '/videos/sunset.mp4' },
  { id: 'spring', label: 'Spring', icon: '🌸', videoUrl: '/videos/spring.mp4' },
  { id: 'typhoon', label: 'Typhoon', icon: '🌀', videoUrl: '/videos/typhoon.mp4' },
  { id: 'fullmoon', label: 'Full Moon', icon: '🌕', videoUrl: '/videos/fullmoon.mp4' },
];

const STORAGE_KEY = 'orangeai-bg-theme';

// Global listeners for cross-component reactivity
const listeners = new Set<(id: string) => void>();

function notifyListeners(id: string) {
  listeners.forEach(fn => fn(id));
}

export function useBackgroundTheme() {
  const [selectedId, setSelectedId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'default';
    } catch {
      return 'default';
    }
  });

  // Resolved blob URL (starts with sync lookup, upgrades async)
  const [resolvedUrl, setResolvedUrl] = useState<string>(() => {
    const theme = backgroundThemes.find(t => t.id === (localStorage.getItem(STORAGE_KEY) || 'default')) || backgroundThemes[0];
    return getCachedUrl(theme.videoUrl);
  });

  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  // When selectedId changes, resolve the cached URL (wait if still loading)
  useEffect(() => {
    const theme = backgroundThemes.find(t => t.id === selectedId) || backgroundThemes[0];
    const syncUrl = getCachedUrl(theme.videoUrl);

    if (syncUrl !== theme.videoUrl) {
      // Already cached as blob
      setResolvedUrl(syncUrl);
    } else {
      // Not cached yet — wait for it, use raw URL in the meantime
      setResolvedUrl(theme.videoUrl);
      waitForCachedUrl(theme.videoUrl).then(blobUrl => {
        if (mountedRef.current) setResolvedUrl(blobUrl);
      });
    }
  }, [selectedId]);

  useEffect(() => {
    const handler = (id: string) => setSelectedId(id);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const selectTheme = useCallback((id: string) => {
    setSelectedId(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
    notifyListeners(id);
  }, []);

  const currentTheme = backgroundThemes.find(t => t.id === selectedId) || backgroundThemes[0];

  return { selectedId, selectTheme, currentTheme, videoUrl: resolvedUrl, themes: backgroundThemes };
}
