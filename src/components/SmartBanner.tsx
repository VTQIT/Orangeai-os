import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Music, Bell, Package, DollarSign, Newspaper, Megaphone, Car, Timer } from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';
import ClockPopup from './ClockPopup';
import face2 from '@/assets/faces/face2.png';
import face5 from '@/assets/faces/face5.png';

interface Widget {
  id: string;
  render: () => React.ReactNode;
}

export default function SmartBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [time, setTime] = useState(new Date());
  const [popupTab, setPopupTab] = useState<'weather' | 'alarm' | 'calendar' | null>(null);
  const { weather, icon } = useWeather();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hours = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const seconds = time.toLocaleTimeString([], { second: '2-digit' }).slice(-2);
  const date = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  const widgets: Widget[] = [
    // 1 — Clock (default)
    {
      id: 'clock',
      render: () => (
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="font-display text-4xl font-thin tracking-tight text-white/90">{hours}<span className="text-lg font-extralight text-white/50">:{seconds}</span></div>
            <div className="text-[11px] font-light text-white/60 tracking-wide mt-0.5">{date}</div>
          </div>
          <Clock size={28} strokeWidth={1} className="text-white/30" />
        </div>
      ),
    },
    // 2 — Weather
    {
      id: 'weather',
      render: () => (
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-[11px] font-light text-white/50 uppercase tracking-widest">Weather</div>
            <div className="font-display text-3xl font-thin text-white/90">{weather?.temperature ?? 28}°<span className="text-lg font-extralight text-white/50">C</span></div>
            <div className="text-[11px] font-light text-white/60">Partly Cloudy · Humidity 72%</div>
          </div>
          <span className="text-3xl">{icon ?? '⛅'}</span>
        </div>
      ),
    },
    // 3 — Music Player
    {
      id: 'music',
      render: () => (
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-[11px] font-light text-white/50 uppercase tracking-widest">Now Playing</div>
            <div className="font-display text-lg font-extralight text-white/90 mt-1">Blinding Lights</div>
            <div className="text-[11px] font-light text-white/50">The Weeknd · 2:34 / 3:22</div>
            <div className="w-32 h-[2px] bg-white/10 rounded-full mt-2 overflow-hidden">
              <div className="w-3/4 h-full bg-white/40 rounded-full" />
            </div>
          </div>
          <Music size={26} strokeWidth={1} className="text-white/30" />
        </div>
      ),
    },
    // 4 — Alarm
    {
      id: 'alarm',
      render: () => (
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-[11px] font-light text-white/50 uppercase tracking-widest">Next Alarm</div>
            <div className="font-display text-3xl font-thin text-white/90 mt-1">06:30<span className="text-sm font-extralight text-white/50 ml-1">AM</span></div>
            <div className="text-[11px] font-light text-white/50">Tomorrow · Weekday routine</div>
          </div>
          <Bell size={26} strokeWidth={1} className="text-white/30" />
        </div>
      ),
    },
    // 5 — Incoming Call
    {
      id: 'call',
      render: () => (
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-[11px] font-light text-emerald-400/80 uppercase tracking-widest">Incoming Call</div>
            <div className="font-display text-lg font-extralight text-white/90 mt-1">Sarah Johnson</div>
            <div className="text-[11px] font-light text-white/50">Mobile · +1 (555) 012-3456</div>
          </div>
          <div className="w-14 h-14 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
            <img src={face2} alt="Caller" className="w-full h-full object-cover" />
          </div>
        </div>
      ),
    },
    // 6 — Text Message
    {
      id: 'message',
      render: () => (
        <div className="flex items-center justify-between w-full">
          <div className="flex-1 min-w-0 mr-3">
            <div className="text-[11px] font-light text-white/50 uppercase tracking-widest">New Message</div>
            <div className="font-display text-sm font-extralight text-white/90 mt-1 truncate">Mike: Hey, are we still on for dinner?</div>
            <div className="text-[11px] font-light text-white/40 mt-0.5">2 min ago</div>
          </div>
          <div className="w-14 h-14 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
            <img src={face5} alt="Sender" className="w-full h-full object-cover" />
          </div>
        </div>
      ),
    },
    // 7 — Ride Status
    {
      id: 'ride',
      render: () => (
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-[11px] font-light text-white/50 uppercase tracking-widest">Grab Ride</div>
            <div className="font-display text-lg font-extralight text-white/90 mt-1">Driver is 3 min away</div>
            <div className="text-[11px] font-light text-white/50">Toyota Vios · ABC 1234</div>
          </div>
          <Car size={26} strokeWidth={1} className="text-white/30" />
        </div>
      ),
    },
    // 8 — Parcel
    {
      id: 'parcel',
      render: () => (
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-[11px] font-light text-white/50 uppercase tracking-widest">Parcel Update</div>
            <div className="font-display text-sm font-extralight text-white/90 mt-1">Out for delivery</div>
            <div className="text-[11px] font-light text-white/50">Estimated arrival: 2:00 PM today</div>
          </div>
          <Package size={26} strokeWidth={1} className="text-white/30" />
        </div>
      ),
    },
    // 9 — Currency
    {
      id: 'currency',
      render: () => (
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-[11px] font-light text-white/50 uppercase tracking-widest">Currency</div>
            <div className="flex items-baseline gap-3 mt-1">
              <div className="font-display text-lg font-thin text-white/90">USD/PHP <span className="text-white/60">56.12</span></div>
            </div>
            <div className="text-[11px] font-light text-emerald-400/70">▲ 0.23 (0.41%)</div>
          </div>
          <DollarSign size={26} strokeWidth={1} className="text-white/30" />
        </div>
      ),
    },
    // 10 — Breaking News
    {
      id: 'news',
      render: () => (
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-[11px] font-light text-red-400/80 uppercase tracking-widest">Breaking News</div>
            <div className="font-display text-sm font-extralight text-white/90 mt-1 leading-snug">Global tech summit announces new AI regulations framework</div>
            <div className="text-[11px] font-light text-white/40 mt-0.5">Reuters · 12 min ago</div>
          </div>
          <Newspaper size={22} strokeWidth={1} className="text-white/30" />
        </div>
      ),
    },
    // 11 — Reminder
    {
      id: 'reminder',
      render: () => (
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-[11px] font-light text-amber-400/80 uppercase tracking-widest">Reminder</div>
            <div className="font-display text-sm font-extralight text-white/90 mt-1">Team standup in 15 minutes</div>
            <div className="text-[11px] font-light text-white/50">Google Meet · 10:00 AM</div>
          </div>
          <Timer size={26} strokeWidth={1} className="text-white/30" />
        </div>
      ),
    },
    // 12 — Ad / Notification
    {
      id: 'ad',
      render: () => (
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-[11px] font-light text-white/50 uppercase tracking-widest">Sponsored</div>
            <div className="font-display text-sm font-extralight text-white/90 mt-1">Upgrade to Premium — 50% off</div>
            <div className="text-[11px] font-light text-white/40">Orange AI OS Pro · Limited offer</div>
          </div>
          <Megaphone size={22} strokeWidth={1} className="text-white/30" />
        </div>
      ),
    },
  ];

  const resetToDefault = useCallback(() => {
    setActiveIndex(0);
  }, []);

  // Auto-rotate every 10 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % widgets.length);
    }, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [widgets.length]);

  const popupMap: Record<string, 'weather' | 'alarm' | 'calendar'> = {
    clock: 'calendar',
    weather: 'weather',
    alarm: 'alarm',
  };

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const currentId = widgets[activeIndex].id;
    const tab = popupMap[currentId];
    if (tab) {
      setPopupTab(tab);
      return;
    }
    // Otherwise cycle to next widget
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveIndex(prev => (prev + 1) % widgets.length);
    intervalRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % widgets.length);
    }, 10000);
  }, [widgets.length, activeIndex]);

  // Expose resetToDefault for parent usage
  useEffect(() => {
    (window as any).__smartBannerReset = resetToDefault;
    return () => { delete (window as any).__smartBannerReset; };
  }, [resetToDefault]);

  return (
    <>
      <div
        className="os-glass-heavy rounded-3xl px-5 py-4 mx-4 cursor-pointer active:scale-[0.98] transition-transform min-h-[88px] flex items-center"
        onClick={handleTap}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={widgets[activeIndex].id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full"
          >
            {widgets[activeIndex].render()}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {popupTab && <ClockPopup onClose={() => setPopupTab(null)} defaultTab={popupTab} />}
      </AnimatePresence>
    </>
  );
}
