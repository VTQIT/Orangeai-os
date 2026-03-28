import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRandomTransition } from '@/utils/bannerTransitions';
import { videoAds } from '@/data/videoAds';
import { getCachedUrl } from '@/hooks/useVideoCache';
import dc3Banner from '@/assets/banners/dc3-banner.jpg';

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

const firstAd: ImageAd = { type: 'image', id: 'dc3', image: dc3Banner, label: 'DC3', overlay: '🌐 DC3 — Decentralized Distributed Domain of Curated Cache Content' };

const imageAds: ImageAd[] = [
  { type: 'image', id: 'shangrila', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=320&fit=crop', label: 'Shangri-La Hotels', overlay: '🏨 Shangri-La — Luxury Awaits You' },
  { type: 'image', id: 'nvidia', image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=320&fit=crop', label: 'NVIDIA', overlay: '💚 NVIDIA — The Way It\'s Meant to Be Played' },
  { type: 'image', id: 'tesla', image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=320&fit=crop', label: 'Tesla Cars', overlay: '⚡ Tesla — Accelerating the Future' },
  { type: 'image', id: 'openclaw', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=320&fit=crop', label: 'Open Claw AI', overlay: '🤖 Open Claw — Next-Gen AI Platform' },
  { type: 'image', id: 'nba', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=320&fit=crop', label: 'NBA Basketball', overlay: '🏀 NBA — Where Amazing Happens' },
  { type: 'image', id: 'gta', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=320&fit=crop', label: 'GTA Games', overlay: '🎮 GTA VI — Coming Soon' },
  { type: 'image', id: 'batman', image: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=800&h=320&fit=crop', label: 'Batman Movies', overlay: '🦇 Batman — The Dark Knight Returns' },
  { type: 'image', id: 'taylor-swift', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=320&fit=crop', label: 'Taylor Swift', overlay: '🎵 Taylor Swift — The Eras Tour' },
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
  const raw: Ad[] = [firstAd];
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

export default function CortexAdBanner({ reshuffleKey }: { reshuffleKey?: number }) {
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
      // Wait for video to end
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
        ad.id === 'dc3'
          ? 'border-2 border-cyan-400/60 shadow-[0_0_15px_rgba(34,211,238,0.4),0_0_30px_rgba(34,211,238,0.2)] animate-pulse-glow'
          : isSponsored
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
            src={ad.image}
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
