import { AnimatePresence, motion } from 'framer-motion';
import { getCachedUrl } from '@/hooks/useVideoCache';

interface WeatherVideoBackgroundProps {
  videoUrl: string;
  videoKey: string;
}

export default function WeatherVideoBackground({ videoUrl, videoKey }: WeatherVideoBackgroundProps) {
  const src = getCachedUrl(videoUrl);

  return (
    <div className="absolute inset-0 overflow-hidden rounded-3xl">
      <AnimatePresence mode="wait">
        <motion.video
          key={videoKey}
          src={src}
          autoPlay
          loop
          muted
          playsInline
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
    </div>
  );
}
