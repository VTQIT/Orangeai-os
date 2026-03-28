import { Sun, Moon, Signal, Battery, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StatusBarProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function StatusBar({ theme, toggleTheme }: StatusBarProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const formatted = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div data-vortex-statusbar className="os-glass rounded-b-2xl px-5 py-2 flex items-center justify-between w-full">
      <span className="text-sm font-medium os-text-primary font-display">{formatted}</span>
      <span className="text-[11px] os-text-primary tracking-widest font-extralight">Orange Ai OS</span>
      <div className="flex items-center gap-3">
        <button onClick={toggleTheme} className="os-icon p-1">
          {theme === 'dark' ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
        </button>
        <Signal size={14} strokeWidth={1.5} className="os-icon" />
        <Wifi size={14} strokeWidth={1.5} className="os-icon" />
        <div className="flex items-center gap-1">
          <Battery size={14} strokeWidth={1.5} className="os-icon" />
          <span className="text-[10px] os-text-secondary">85%</span>
        </div>
      </div>
    </div>
  );
}
