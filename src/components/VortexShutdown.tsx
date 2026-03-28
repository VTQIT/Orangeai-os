import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VortexShutdownProps {
  active: boolean;
  originRef: React.RefObject<HTMLDivElement>;
  onComplete: () => void;
}

export default function VortexShutdown({ active, originRef, onComplete }: VortexShutdownProps) {
  const [phase, setPhase] = useState<'idle' | 'vortex' | 'vacuum' | 'collapse' | 'black'>('idle');
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [elements, setElements] = useState<{ id: number; x: number; y: number; w: number; h: number; el: HTMLElement }[]>([]);

  useEffect(() => {
    if (!active) {
      setPhase('idle');
      return;
    }

    // Get origin logo center position
    const rect = originRef.current?.getBoundingClientRect();
    if (rect) {
      setCenter({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }

    // Collect all visible interactive elements on screen
    const selectors = [
      '[data-vortex-target]',
      '.os-glass',
      '[class*="os-glass-dock"]',
      '[class*="clock-widget"]',
      '[class*="search-bar"]',
    ];

    const found: typeof elements = [];
    const seen = new Set<HTMLElement>();

    // Get the main container's children as vacuum targets
    const mainContainer = document.querySelector('[data-vortex-container]');
    if (mainContainer) {
      const children = mainContainer.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        if (child === originRef.current?.closest('[data-vortex-container]')) continue;
        const r = child.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && !seen.has(child)) {
          seen.add(child);
          found.push({ id: i, x: r.left, y: r.top, w: r.width, h: r.height, el: child });
        }
      }
    }

    // Also target the StatusBar
    const statusBar = document.querySelector('[data-vortex-statusbar]') as HTMLElement;
    if (statusBar && !seen.has(statusBar)) {
      seen.add(statusBar);
      const r = statusBar.getBoundingClientRect();
      found.push({ id: found.length, x: r.left, y: r.top, w: r.width, h: r.height, el: statusBar });
    }

    // Turn video background to black
    const video = document.querySelector('video') as HTMLVideoElement;
    if (video) {
      video.style.transition = 'opacity 0.8s ease';
      video.style.opacity = '0';
    }

    setElements(found);
    setPhase('vortex');

    const t1 = setTimeout(() => setPhase('vacuum'), 400);
    const t2 = setTimeout(() => setPhase('collapse'), 1800);
    const t3 = setTimeout(() => setPhase('black'), 2400);
    const t4 = setTimeout(() => onComplete(), 3200);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [active]);

  // Apply vacuum effect directly to DOM elements
  useEffect(() => {
    if (phase === 'vacuum' && elements.length > 0) {
      elements.forEach(({ el }, i) => {
        const rect = el.getBoundingClientRect();
        const dx = center.x - (rect.left + rect.width / 2);
        const dy = center.y - (rect.top + rect.height / 2);
        const delay = i * 60;

        el.style.transition = `transform 1.2s cubic-bezier(0.55, 0.06, 0.68, 0.19) ${delay}ms, opacity 0.8s ease ${delay + 400}ms`;
        el.style.transform = `translate(${dx}px, ${dy}px) scale(0) rotate(${720 + i * 90}deg)`;
        el.style.opacity = '0';
        el.style.transformOrigin = 'center center';
      });
    }
  }, [phase, elements, center]);

  // Reset elements on unmount or deactivation
  useEffect(() => {
    return () => {
      elements.forEach(({ el }) => {
        el.style.transition = '';
        el.style.transform = '';
        el.style.opacity = '';
        el.style.transformOrigin = '';
      });
    };
  }, [elements]);

  if (!active && phase === 'idle') return null;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[9999] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Vortex spiral effect at center */}
          {(phase === 'vortex' || phase === 'vacuum' || phase === 'collapse') && (
            <div
              className="absolute"
              style={{ left: center.x, top: center.y, transform: 'translate(-50%, -50%)' }}
            >
              {/* Spinning rings */}
              {[0, 1, 2, 3, 4].map(ring => (
                <motion.div
                  key={ring}
                  className="absolute rounded-full border-2"
                  style={{
                    borderColor: `hsl(25, 95%, ${55 + ring * 8}%)`,
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{
                    width: 0, height: 0,
                    x: '-50%', y: '-50%',
                    opacity: 0,
                    rotate: 0,
                  }}
                  animate={{
                    width: phase === 'collapse' ? 0 : [0, 60 + ring * 80, 40 + ring * 60],
                    height: phase === 'collapse' ? 0 : [0, 60 + ring * 80, 40 + ring * 60],
                    opacity: phase === 'collapse' ? 0 : [0, 0.8, 0.4],
                    rotate: 1440,
                  }}
                  transition={{
                    duration: phase === 'collapse' ? 0.5 : 2,
                    ease: 'easeInOut',
                    rotate: { duration: 3, ease: 'linear', repeat: Infinity },
                    delay: ring * 0.08,
                  }}
                />
              ))}

              {/* Glowing core */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  background: 'radial-gradient(circle, hsl(25, 95%, 55%) 0%, hsl(25, 90%, 40%) 40%, transparent 70%)',
                  left: '50%',
                  top: '50%',
                }}
                initial={{ width: 0, height: 0, x: '-50%', y: '-50%', opacity: 0 }}
                animate={{
                  width: phase === 'collapse' ? [120, 800] : [0, 120],
                  height: phase === 'collapse' ? [120, 800] : [0, 120],
                  opacity: phase === 'collapse' ? [1, 0] : [0, 1],
                }}
                transition={{ duration: phase === 'collapse' ? 0.6 : 0.5, ease: 'easeOut' }}
              />

              {/* Particle streams being sucked in */}
              {phase === 'vacuum' && Array.from({ length: 20 }).map((_, i) => {
                const angle = (i / 20) * Math.PI * 2;
                const dist = 300 + Math.random() * 200;
                return (
                  <motion.div
                    key={`p-${i}`}
                    className="absolute w-1.5 h-1.5 rounded-full"
                    style={{
                      background: `hsl(${20 + Math.random() * 20}, 90%, ${50 + Math.random() * 30}%)`,
                      left: '50%',
                      top: '50%',
                      boxShadow: '0 0 6px hsl(25, 95%, 55%)',
                    }}
                    initial={{
                      x: Math.cos(angle) * dist,
                      y: Math.sin(angle) * dist,
                      opacity: 0,
                      scale: 2,
                    }}
                    animate={{
                      x: 0,
                      y: 0,
                      opacity: [0, 1, 1, 0],
                      scale: [2, 1, 0.5, 0],
                      rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                    }}
                    transition={{
                      duration: 1.2,
                      delay: i * 0.05,
                      ease: [0.55, 0.06, 0.68, 0.19],
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Final black screen */}
          {phase === 'black' && (
            <motion.div
              className="absolute inset-0 bg-black flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.p
                className="text-white/60 text-sm font-light tracking-widest"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                ORANGE AI OS
              </motion.p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
