import { useEffect, useState } from 'react';
import { useWeather } from '@/hooks/useWeather';
import { AnimatePresence } from 'framer-motion';
import ClockPopup from './ClockPopup';

export default function ClockWidget() {
  const [time, setTime] = useState(new Date());
  const { weather, icon } = useWeather();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <>
      <div
        className="os-glass-heavy rounded-3xl px-6 py-5 mx-4 text-center cursor-pointer active:scale-95 transition-transform"
        onClick={(e) => { e.stopPropagation(); setShowPopup(true); }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="font-display text-5xl font-thin tracking-tight os-text-primary">{hours}</div>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-sm os-text-secondary font-medium">{date}</span>
          {weather && icon && (
            <span className="text-sm os-text-secondary font-medium">
              {icon} {weather.temperature}°
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showPopup && <ClockPopup onClose={() => setShowPopup(false)} />}
      </AnimatePresence>
    </>
  );
}
