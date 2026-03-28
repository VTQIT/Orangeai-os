import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { App } from '@/types';
import { getCachedUrl } from '@/hooks/useVideoCache';

interface AppIconProps {
  app: App;
  size?: number;
  containerSize?: number;
  imageScale?: number;
  glassVariant?: 'default' | 'smoke';
  hideLabel?: boolean;
  onCustomAction?: () => void;
}

const iconMap: Record<string, React.ComponentType<any>> = Icons as any;

export default function AppIcon({ app, size = 32, containerSize = 72, imageScale, glassVariant = 'default', hideLabel = false, onCustomAction }: AppIconProps) {
  const [showName, setShowName] = useState(false);
  const lastTapTime = useRef(0);
  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;
    lastTapTime.current = now;

    if (timeSinceLastTap < 400) {
      // Double tap — show name
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
        tapTimeout.current = null;
      }
      setShowName(true);
      setTimeout(() => setShowName(false), 1500);
    } else {
      // Single tap — delay to check for double tap
      tapTimeout.current = setTimeout(() => {
        if (onCustomAction) {
          onCustomAction();
        } else if (app.url) {
          window.open(app.url, '_blank', 'noopener,noreferrer');
        }
      }, 400);
    }
  }, [app.url, onCustomAction]);

  const IconComponent = iconMap[app.icon];

  return (
    <div className="flex flex-col items-center gap-1 relative">
      <motion.div
        className={`${glassVariant === 'smoke' ? 'bg-white/20 backdrop-blur-xl border border-white/30' : 'os-glass'} rounded-[20px] flex items-center justify-center cursor-pointer overflow-hidden`}
        style={{ width: containerSize, height: containerSize }}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.1 }}
        onClick={handleTap}
      >
        {app.image ? (
          <img
            src={getCachedUrl(app.image)}
            alt={app.name}
            style={app.iconScale ? { width: `${60 * app.iconScale}%`, height: `${60 * app.iconScale}%` } : undefined}
            className={`${app.iconScale ? '' : 'w-[60%] h-[60%]'} object-contain brightness-0 invert drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]`}
            draggable={false}
          />
        ) : (
          IconComponent && (
            <IconComponent size={size} strokeWidth={1.5} className="os-icon" />
          )
        )}
      </motion.div>
      {!hideLabel && (
        <span className="text-[10pt] text-white/80 font-thin tracking-wide text-center leading-tight truncate w-full px-0.5 mt-0.5">
          {app.name}
        </span>
      )}
    </div>
  );
}
