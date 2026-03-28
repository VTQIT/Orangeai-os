/**
 * Re-export from useMediaCache for backward compatibility.
 * All caching now uses persistent IndexedDB-backed media cache.
 */
export {
  startPrecaching,
  getCachedUrl,
  waitForCachedUrl,
  fetchAndCacheVideo,
  precacheLogos,
  precacheBackgrounds,
  precacheIcons,
  precacheVideos,
  precacheAds,
  precacheJollibee,
  precacheSpotify,
  precacheOrangeAi,
  initMediaCache,
  getCacheStats,
} from './useMediaCache';
