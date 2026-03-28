import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Heart } from 'lucide-react';
import { fetchAndCacheVideo } from '@/hooks/useVideoCache';

interface MtvTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  videoUrl: string;
}

interface MtvVideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: MtvTrack[];
  initialIndex: number;
}

export default function MtvVideoPlayer({ isOpen, onClose, tracks, initialIndex }: MtvVideoPlayerProps) {
  const [currentIdx, setCurrentIdx] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [cachedUrls, setCachedUrls] = useState<Map<string, string>>(new Map());
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimer = useRef<number | null>(null);
  const progressTimer = useRef<number | null>(null);

  const currentTrack = tracks[currentIdx];

  // Preload current + next 2 videos into memcache
  useEffect(() => {
    if (!isOpen || tracks.length === 0) return;
    const toCache = [currentIdx, currentIdx + 1, currentIdx + 2]
      .filter(i => i < tracks.length)
      .map(i => tracks[i].videoUrl)
      .filter(url => !cachedUrls.has(url));

    toCache.forEach(url => {
      fetchAndCacheVideo(url).then(blobUrl => {
        setCachedUrls(prev => new Map(prev).set(url, blobUrl));
      });
    });
  }, [isOpen, currentIdx, tracks]);

  // Reset on index change
  useEffect(() => {
    setCurrentIdx(initialIndex);
  }, [initialIndex]);

  // Auto-play when track changes
  useEffect(() => {
    if (!isOpen || !videoRef.current || !currentTrack) return;
    const src = cachedUrls.get(currentTrack.videoUrl) || currentTrack.videoUrl;
    videoRef.current.src = src;
    videoRef.current.load();
    videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  }, [currentIdx, isOpen, currentTrack, cachedUrls]);

  // Progress tracking
  useEffect(() => {
    if (!isOpen) return;
    progressTimer.current = window.setInterval(() => {
      if (videoRef.current) {
        setProgress(videoRef.current.currentTime);
        setDuration(videoRef.current.duration || 0);
      }
    }, 250);
    return () => { if (progressTimer.current) clearInterval(progressTimer.current); };
  }, [isOpen]);

  const goNext = useCallback(() => {
    if (tracks.length === 0) return;
    const next = shuffle
      ? Math.floor(Math.random() * tracks.length)
      : currentIdx < tracks.length - 1 ? currentIdx + 1 : 0;
    setCurrentIdx(next);
    setProgress(0);
  }, [currentIdx, shuffle, tracks.length]);

  const goPrev = useCallback(() => {
    if (tracks.length === 0) return;
    if (videoRef.current && videoRef.current.currentTime > 3) {
      videoRef.current.currentTime = 0;
      setProgress(0);
      return;
    }
    const prev = currentIdx > 0 ? currentIdx - 1 : tracks.length - 1;
    setCurrentIdx(prev);
    setProgress(0);
  }, [currentIdx, tracks.length]);

  const handleVideoEnd = useCallback(() => {
    if (repeat) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    } else {
      goNext();
    }
  }, [repeat, goNext]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying]);

  // Single tap → show/hide controls (auto-hide after 3s)
  const handleTap = useCallback(() => {
    setShowControls(prev => {
      const next = !prev;
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
      if (next) {
        controlsTimer.current = window.setTimeout(() => setShowControls(false), 3000);
      }
      return next;
    });
  }, []);

  const toggleLike = useCallback((id: string) => {
    setLiked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = ratio * duration;
    setProgress(ratio * duration);
  }, [duration]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  // Vertical swipe for TikTok-style navigation
  const touchStartY = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 80) {
      if (diff > 0) goNext(); // swipe up → next
      else goPrev(); // swipe down → prev
    }
  }, [goNext, goPrev]);

  if (!isOpen || tracks.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[300] flex flex-col"
          style={{ maxWidth: 428, margin: '0 auto', aspectRatio: '9/16' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          onClick={handleTap}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Black background */}
          <div className="absolute inset-0 bg-black" />

          {/* Video */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted={false}
            onEnded={handleVideoEnd}
          />

          {/* Track info (always visible at bottom) */}
          <div className="absolute bottom-20 left-4 right-16 z-20">
            <motion.p
              className="text-white font-bold text-base drop-shadow-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={currentTrack?.id + '-title'}
            >
              {currentTrack?.title}
            </motion.p>
            <motion.p
              className="text-white/70 text-sm drop-shadow-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              key={currentTrack?.id + '-artist'}
            >
              {currentTrack?.artist}
            </motion.p>
          </div>

          {/* Right-side action buttons (TikTok-style) */}
          <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-5">
            <button
              onClick={(e) => { e.stopPropagation(); if (currentTrack) toggleLike(currentTrack.id); }}
              className="flex flex-col items-center gap-1"
            >
              <Heart
                size={28}
                className={`drop-shadow-lg ${currentTrack && liked.has(currentTrack.id) ? 'text-red-500 fill-red-500' : 'text-white'}`}
              />
              <span className="text-white text-[10px] drop-shadow-lg">
                {currentTrack && liked.has(currentTrack.id) ? 'Liked' : 'Like'}
              </span>
            </button>
          </div>

          {/* Close button (always visible) */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute top-12 right-4 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm"
          >
            <X size={20} className="text-white" />
          </button>

          {/* Controls overlay (shown on tap) */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                className="absolute inset-0 z-20 flex flex-col items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Semi-transparent backdrop */}
                <div className="absolute inset-0 bg-black/30" />

                {/* Center controls */}
                <div className="relative z-10 flex items-center gap-8">
                  <button onClick={(e) => { e.stopPropagation(); goPrev(); }}>
                    <SkipBack size={32} className="text-white drop-shadow-lg" fill="white" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                  >
                    {isPlaying
                      ? <Pause size={32} className="text-white drop-shadow-lg" fill="white" />
                      : <Play size={32} className="text-white drop-shadow-lg ml-1" fill="white" />
                    }
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); goNext(); }}>
                    <SkipForward size={32} className="text-white drop-shadow-lg" fill="white" />
                  </button>
                </div>

                {/* Bottom bar controls */}
                <div className="absolute bottom-6 left-4 right-4 z-10">
                  {/* Progress bar */}
                  <div
                    className="w-full h-1 bg-white/20 rounded-full cursor-pointer mb-2"
                    onClick={(e) => { e.stopPropagation(); seekTo(e); }}
                  >
                    <div className="h-full bg-white rounded-full" style={{ width: `${progressPct}%` }} />
                  </div>
                  <div className="flex justify-between mb-3">
                    <span className="text-white/60 text-[10px]">{formatTime(progress)}</span>
                    <span className="text-white/60 text-[10px]">{formatTime(duration)}</span>
                  </div>

                  {/* Loop / Shuffle */}
                  <div className="flex items-center justify-center gap-6">
                    <button onClick={(e) => { e.stopPropagation(); setShuffle(!shuffle); }}>
                      <Shuffle size={18} className={`drop-shadow-lg ${shuffle ? 'text-[#1DB954]' : 'text-white/60'}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setRepeat(!repeat); }}>
                      <Repeat size={18} className={`drop-shadow-lg ${repeat ? 'text-[#1DB954]' : 'text-white/60'}`} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Swipe indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
            <div className="w-8 h-1 bg-white/30 rounded-full" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
