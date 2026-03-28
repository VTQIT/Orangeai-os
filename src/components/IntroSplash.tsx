import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import originLogo from '@/assets/icons/origin-os-logo.png';
import { getCachedUrl } from '@/hooks/useVideoCache';
import { playIntroSound } from '@/hooks/useOSSounds';

interface IntroSplashProps {
  onComplete: () => void;
  /** When true, critical assets (background + logos) are cached and ready */
  assetsReady?: boolean;
}

export default function IntroSplash({ onComplete, assetsReady = false }: IntroSplashProps) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    if (!logoLoaded) return;
    playIntroSound();

    // Gentle pulse from 0→40% quickly, then slow crawl to 70% while waiting
    const fastPhase = setInterval(() => {
      setProgress(prev => {
        if (prev >= 40) { clearInterval(fastPhase); return 40; }
        return prev + 4;
      });
    }, 30);

    return () => clearInterval(fastPhase);
  }, [logoLoaded]);

  // Slow crawl 40→70% while waiting for assets
  useEffect(() => {
    if (progress < 40 || progress >= 70 || assetsReady) return;
    const crawl = setInterval(() => {
      setProgress(prev => {
        if (prev >= 70) { clearInterval(crawl); return 70; }
        return prev + 0.3;
      });
    }, 100);
    return () => clearInterval(crawl);
  }, [progress >= 40, assetsReady]);

  // When assets are ready, instantly fill to 100%
  useEffect(() => {
    if (!assetsReady) return;
    const fill = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(fill); return 100; }
        return prev + 5;
      });
    }, 15);
    return () => clearInterval(fill);
  }, [assetsReady]);

  // Fallback: if assets take too long (>5s), complete anyway
  useEffect(() => {
    const fallback = setTimeout(() => {
      setProgress(100);
    }, 5000);
    return () => clearTimeout(fallback);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => {
        setVisible(false);
        setTimeout(onComplete, 600);
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [progress, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
          style={{ backgroundColor: '#000000' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {/* Logo with glow */}
          <motion.div
            className="relative mb-12"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,165,50,0.4) 0%, rgba(255,140,20,0.15) 50%, transparent 70%)',
                filter: 'blur(30px)',
                transform: 'scale(1.8)',
              }}
              animate={{ opacity: [0.5, 1, 0.5], scale: [1.6, 2.0, 1.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,200,100,0.1) 40%, transparent 60%)',
                filter: 'blur(20px)',
                transform: 'scale(1.5)',
              }}
              animate={{ opacity: [0.3, 0.7, 0.3], scale: [1.3, 1.6, 1.3] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />

            <div
              className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
              style={{ boxShadow: '0 0 40px rgba(255,165,50,0.5), 0 0 80px rgba(255,140,20,0.2)' }}
            >
              <img
                src={getCachedUrl(originLogo)}
                alt="Orange AI OS"
                onLoad={() => setLogoLoaded(true)}
                style={{
                  width: '102%',
                  height: '102%',
                  maxWidth: 'none',
                  objectFit: 'cover',
                  borderRadius: '50%',
                  transform: 'scale(1.05)',
                }}
              />
            </div>
          </motion.div>

          {/* Loading bar */}
          <motion.div
            className="w-48"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: 2, backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #e8851e, #f5a623, #ffba44)',
                  boxShadow: '0 0 8px rgba(245,166,35,0.6), 0 0 16px rgba(245,166,35,0.3)',
                }}
              />
            </div>

            <motion.p
              className="text-center mt-4 tracking-[0.3em] font-light"
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              ORANGE AI OS
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
