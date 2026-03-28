import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, Brain, Folder, Chrome, Globe2, BookOpen, Zap, ChevronDown } from 'lucide-react';

interface SearchEngine {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
}

const engines: SearchEngine[] = [
  { id: 'internet', name: 'Search Internet', icon: Globe },
  { id: 'cortex', name: 'Decentralized Cortex', icon: Brain },
  { id: 'local', name: 'Search Local Desk', icon: Folder },
  { id: 'google', name: 'Google', icon: Chrome },
  { id: 'bing', name: 'Bing', icon: Globe2 },
  { id: 'wikipedia', name: 'Wikipedia', icon: BookOpen },
  { id: 'grok', name: 'Grok', icon: Zap },
];

export default function SearchBar() {
  const [selected, setSelected] = useState(engines[0]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const searchUrls: Record<string, (q: string) => string> = {
    internet: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    cortex: (q) => `https://www.google.com/search?q=${encodeURIComponent(q + ' decentralized')}`,
    local: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    bing: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
    wikipedia: (q) => `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}`,
    grok: (q) => `https://x.com/i/grok?text=${encodeURIComponent(q)}`,
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    const buildUrl = searchUrls[selected.id];
    if (buildUrl) {
      window.open(buildUrl(query.trim()), '_blank', 'noopener,noreferrer');
    }
  };

  const SelectedIcon = selected.icon;

  return (
    <div className="mx-4 relative" ref={menuRef}>
      <div className="os-glass rounded-2xl flex items-center h-12 px-1">
        {/* Engine selector */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors shrink-0"
        >
          <SelectedIcon size={16} strokeWidth={1.5} className="os-icon" />
          <ChevronDown size={12} strokeWidth={2} className="os-icon opacity-60" />
        </button>

        <div className="w-px h-5 bg-white/20 shrink-0" />

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={selected.name}
          className="flex-1 bg-transparent border-none outline-none px-3 text-sm os-text-primary placeholder:text-[hsl(var(--os-text-secondary))] font-medium"
        />

        {/* Search button */}
        <button
          onClick={handleSearch}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
        >
          <Search size={18} strokeWidth={1.5} className="os-icon" />
        </button>
      </div>

      {/* Dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full left-0 right-0 mt-2 os-glass-heavy rounded-2xl py-2 z-50 overflow-hidden"
          >
            {engines.map((engine) => {
              const Icon = engine.icon;
              const isActive = selected.id === engine.id;
              return (
                <button
                  key={engine.id}
                  onClick={() => {
                    setSelected(engine);
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-[hsl(var(--os-accent)/0.15)] os-accent'
                      : 'os-text-primary hover:bg-white/10'
                  }`}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  <span className="font-medium">{engine.name}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
