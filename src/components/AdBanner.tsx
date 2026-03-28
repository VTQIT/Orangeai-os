import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRandomTransition } from '@/utils/bannerTransitions';
import { videoAds } from '@/data/videoAds';
import { getCachedUrl } from '@/hooks/useVideoCache';

const SPONSORED_AD: VideoAdItem = {
  type: 'video',
  id: 'sponsored-grok',
  video: '/videos/ads/sponsored-grok.mp4',
  label: 'Grok AI',
  overlay: '🤖 Grok — The AI That Gets You',
};

interface ImageAd { type: 'image'; id: string; image: string; label: string; overlay: string }
interface VideoAdItem { type: 'video'; id: string; video: string; label: string; overlay: string }
type Ad = ImageAd | VideoAdItem;

const imageAds: ImageAd[] = [
  { type: 'image', id: 'mcdonalds', image: 'https://images.unsplash.com/photo-1619454016518-697bc231e7cb?w=800&h=320&fit=crop', label: "McDonald's - I'm Lovin' It", overlay: "🍔 McDonald's — I'm Lovin' It™" },
  { type: 'image', id: 'jollibee', image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&h=320&fit=crop', label: 'Jollibee - Chickenjoy', overlay: '🐝 Jollibee — Chickenjoy Bucket Fest!' },
  { type: 'image', id: 'apple', image: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=800&h=320&fit=crop', label: 'Apple - Think Different', overlay: '🍎 Apple — Think Different' },
  { type: 'image', id: 'netflix', image: 'https://dummyimage.com/800x320/111111/e50914.png&text=NETFLIX+Originals', label: 'Netflix - Stream Now', overlay: '🎬 Netflix — New Releases Streaming Now' },
  { type: 'image', id: 'cnn', image: 'https://dummyimage.com/800x320/cc0000/ffffff.png&text=CNN+Breaking+News', label: 'CNN - Breaking News', overlay: '📰 CNN — Breaking News 24/7' },
  { type: 'image', id: 'amazon', image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&h=320&fit=crop', label: 'Amazon Fresh', overlay: '🛒 Amazon Fresh — Delivered to Your Door' },
  { type: 'image', id: 'grab', image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&h=320&fit=crop', label: 'Grab - Everyday Everything', overlay: '🚗 Grab — Everyday, Everything App' },
  { type: 'image', id: 'starbucks', image: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800&h=320&fit=crop', label: 'Starbucks Coffee', overlay: '☕ Starbucks — Your Favorite Brew Awaits' },
  { type: 'image', id: 'spacex', image: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=800&h=320&fit=crop', label: 'SpaceX - To The Stars', overlay: '🚀 SpaceX — Making Life Multiplanetary' },
  { type: 'image', id: 'starlink', image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=320&fit=crop', label: 'Starlink Internet', overlay: '🛰️ Starlink — High-Speed Internet Everywhere' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildPlaylist(): Ad[] {
  const shuffledImages = shuffle(imageAds);
  const shuffledVideos = shuffle(videoAds).map(v => ({ ...v, type: 'video' as const }));
  const raw: Ad[] = [];
  let vi = 0;
  for (let i = 0; i < shuffledImages.length; i++) {
    raw.push(shuffledImages[i]);
    if (vi < shuffledVideos.length) {
      raw.push(shuffledVideos[vi++]);
    }
  }
  while (vi < shuffledVideos.length) {
    raw.push(shuffledVideos[vi++]);
  }
  // Insert sponsored Grok ad every 3rd position
  const playlist: Ad[] = [];
  for (let i = 0; i < raw.length; i++) {
    if (i > 0 && i % 3 === 0) {
      playlist.push({ ...SPONSORED_AD, id: `${SPONSORED_AD.id}-${i}` });
    }
    playlist.push(raw[i]);
  }
  return playlist;
}

export default function AdBanner({ reshuffleKey }: { reshuffleKey?: number }) {
  const [playlist, setPlaylist] = useState(buildPlaylist);
  const [index, setIndex] = useState(0);
  const [transition, setTransition] = useState(getRandomTransition);

  useEffect(() => {
    setPlaylist(buildPlaylist());
    setIndex(0);
    setTransition(getRandomTransition());
  }, [reshuffleKey]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const ad = playlist[index];

  const advance = useCallback(() => {
    setTransition(getRandomTransition());
    setIndex(prev => (prev + 1) % playlist.length);
  }, [playlist.length]);

  useEffect(() => {
    if (ad.type === 'video') {
      return;
    }
    timerRef.current = setTimeout(advance, 5000);
    return () => clearTimeout(timerRef.current);
  }, [index, ad.type, advance]);

  const handleVideoEnd = useCallback(() => {
    advance();
  }, [advance]);

  const isSponsored = ad.id.startsWith('sponsored-grok');

  return (
    <div
      className={`mx-4 mt-3 relative overflow-hidden rounded-2xl transition-all duration-700 ${
        isSponsored
          ? 'border-2 border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.4),0_0_30px_rgba(251,191,36,0.2)]'
          : 'border border-white/20'
      }`}
      style={{ height: 160 }}
      onClick={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <AnimatePresence mode="wait">
        {ad.type === 'video' ? (
          <motion.video
            key={ad.id}
            ref={videoRef}
            src={getCachedUrl(ad.video)}
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
            initial={transition.initial}
            animate={transition.animate}
            exit={transition.exit}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'top' }}
          />
        ) : (
          <motion.img
            key={ad.id}
            src={getCachedUrl(ad.image)}
            alt={ad.label}
            initial={transition.initial}
            animate={transition.animate}
            exit={transition.exit}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-[5]" />
      <div className="absolute bottom-6 left-3 right-3 z-10">
        <p className="text-white text-sm font-semibold drop-shadow-lg truncate">{ad.overlay}</p>
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {playlist.map((_, i) => (
          <button
            key={i}
            onClick={() => { setTransition(getRandomTransition()); setIndex(i); }}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === index ? 'bg-white w-4' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
