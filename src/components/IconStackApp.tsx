import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { getCachedUrl } from '@/hooks/useVideoCache';
import IconStackManager from './IconStackManager';

export interface StackedIcon {
  id: string;
  name: string;
  image?: string;
  lucideIcon?: string;
  url: string;
  iconScale?: number;
  isFavorite?: boolean;
}

interface IconStackAppProps {
  initialStack: StackedIcon[];
  containerSize?: number;
  iconSize?: number;
  hideLabel?: boolean;
  glassVariant?: 'default' | 'smoke';
  onCustomAction?: (icon: StackedIcon) => void;
}

export default function IconStackApp({
  initialStack,
  containerSize = 72,
  iconSize = 24,
  hideLabel = false,
  glassVariant = 'default',
  onCustomAction,
}: IconStackAppProps) {
  // Sort so favorite is first
  const sortStack = (s: StackedIcon[]) => {
    const fav = s.find(i => i.isFavorite);
    if (!fav) return s;
    return [fav, ...s.filter(i => i.id !== fav.id)];
  };

  const [stack, setStack] = useState<StackedIcon[]>(() => sortStack(initialStack));
  const [activeIndex, setActiveIndex] = useState(0);
  const [intervalMs, setIntervalMs] = useState(7000);
  const [managerOpen, setManagerOpen] = useState(false);
  const lastTapTime = useRef(0);
  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (stack.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % stack.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [stack.length, intervalMs]);

  useEffect(() => {
    if (activeIndex >= stack.length) setActiveIndex(0);
  }, [stack.length, activeIndex]);

  const activeIcon = stack[activeIndex] || stack[0];

  const handleStackChange = useCallback((newStack: StackedIcon[]) => {
    setStack(sortStack(newStack));
  }, []);

  const handleTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;
    lastTapTime.current = now;

    if (timeSinceLastTap < 400) {
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
        tapTimeout.current = null;
      }
      setManagerOpen(true);
    } else {
      tapTimeout.current = setTimeout(() => {
        if (activeIcon) {
          if (onCustomAction) {
            onCustomAction(activeIcon);
          } else if (activeIcon.url) {
            window.open(activeIcon.url, '_blank', 'noopener,noreferrer');
          }
        }
      }, 400);
    }
  }, [activeIcon, onCustomAction]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const renderIcon = (icon: StackedIcon) => {
    if (icon.image) {
      return (
        <motion.img
          key={icon.id}
          src={getCachedUrl(icon.image)}
          alt={icon.name}
          style={
            icon.iconScale
              ? { width: `${60 * icon.iconScale}%`, height: `${60 * icon.iconScale}%` }
              : undefined
          }
          className={`${icon.iconScale ? '' : 'w-[60%] h-[60%]'} object-contain brightness-0 invert drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]`}
          draggable={false}
          initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.7, rotate: 8 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        />
      );
    }
    if (icon.lucideIcon) {
      const IconComp = (LucideIcons as any)[icon.lucideIcon];
      if (IconComp) {
        return (
          <motion.div
            key={icon.id}
            initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.7, rotate: 8 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <IconComp size={iconSize} strokeWidth={1.5} className="text-white drop-shadow-sm" />
          </motion.div>
        );
      }
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center gap-1 relative">
      <motion.div
        className={`${glassVariant === 'smoke' ? 'bg-white/20 backdrop-blur-xl border border-white/30' : 'os-glass'} rounded-[20px] flex items-center justify-center cursor-pointer overflow-hidden relative`}
        style={{ width: containerSize, height: containerSize, touchAction: 'none', WebkitTouchCallout: 'none', userSelect: 'none' }}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.1 }}
        onClick={handleTap}
        onContextMenu={handleContextMenu}
      >
        <AnimatePresence mode="wait">
          {activeIcon && renderIcon(activeIcon)}
        </AnimatePresence>

        {stack.length > 1 && (
          <div className="absolute bottom-1 right-1 flex gap-[2px]">
            {stack.map((_, i) => (
              <div
                key={i}
                className={`w-[3px] h-[3px] rounded-full transition-all duration-300 ${
                  i === activeIndex ? 'bg-white/90' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>

      {!hideLabel && (
        <AnimatePresence mode="wait">
          <motion.span
            key={activeIcon?.name}
            className="text-[10pt] text-white/80 font-thin tracking-wide text-center leading-tight truncate w-full px-0.5 mt-0.5"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
          >
            {activeIcon?.name}
          </motion.span>
        </AnimatePresence>
      )}

      <IconStackManager
        isOpen={managerOpen}
        onClose={() => setManagerOpen(false)}
        stack={stack}
        onStackChange={handleStackChange}
        intervalMs={intervalMs}
        onIntervalChange={setIntervalMs}
      />
    </div>
  );
}
