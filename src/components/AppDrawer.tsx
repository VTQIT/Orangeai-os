import { useRef, useCallback } from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, Brain, Folder, Chrome, Globe2, BookOpen, Zap, ChevronDown, SendHorizontal, Paperclip } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import AppIcon from './AppIcon';
import IconStackApp from './IconStackApp';
import type { StackedIcon } from './IconStackApp';
import SystemUtilitiesPanel from './SystemUtilitiesPanel';
import AdBanner from './AdBanner';
import CortexAdBanner from './CortexAdBanner';
import FolderSlider, { FolderSliderHandle } from './FolderSlider';
import { App, DrawerDirection } from '@/types';
import { FOLDER_APP_CONTENTS, FolderApp } from '@/data/folderContents';
import { playSwoosh, playDrawerSound } from '@/hooks/useOSSounds';

import grokIcon from '@/assets/icons/grok.png';
import chatgptIcon from '@/assets/icons/chatgpt.png';
import claudeIcon from '@/assets/icons/claude.png';
import deepseekIcon from '@/assets/icons/deepseek.png';
import openclawIcon from '@/assets/icons/openclaw.png';
import aiLogo from '@/assets/icons/ai-logo-transparent.png';
import cortexLogo from '@/assets/icons/cortex-logo-transparent.png';
import wwwLogo from '@/assets/icons/www-logo-transparent.png';
import systemUtilitiesLogo from '@/assets/icons/system-utilities-logo-transparent.png';

interface AppDrawerProps {
  apps: App[];
  direction: DrawerDirection;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const variants: Record<DrawerDirection, { initial: any; animate: any; exit: any }> = {
  right: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
  },
  left: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
  },
  bottom: {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '-100%' },
  },
  top: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
  },
};

const positionClasses: Record<DrawerDirection, string> = {
  right: 'left-0 top-0 h-full w-full',
  left: 'right-0 top-0 h-full w-full',
  bottom: 'top-0 left-0 w-full h-full',
  top: 'bottom-0 left-0 w-full h-full',
};

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

const searchUrls: Record<string, (q: string) => string> = {
  internet: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  cortex: (q) => `https://www.google.com/search?q=${encodeURIComponent(q + ' decentralized')}`,
  local: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  bing: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  wikipedia: (q) => `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}`,
  grok: (q) => `https://x.com/i/grok?text=${encodeURIComponent(q)}`,
};

function DrawerSearchBar() {
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

  const handleSearch = () => {
    if (!query.trim()) return;
    const buildUrl = searchUrls[selected.id];
    if (buildUrl) {
      window.open(buildUrl(query.trim()), '_blank', 'noopener,noreferrer');
    }
  };

  const SelectedIcon = selected.icon;

  return (
    <div
      className="mx-4 relative"
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl flex items-center h-12 px-1">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors shrink-0"
        >
          <SelectedIcon size={16} strokeWidth={1.5} className="text-white drop-shadow-sm" />
          <ChevronDown size={12} strokeWidth={2} className="text-white/60" />
        </button>

        <div className="w-px h-5 bg-white/20 shrink-0" />

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={selected.name}
          className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-white placeholder:text-white/50 font-medium"
        />

        <button
          onClick={handleSearch}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
        >
          <Search size={18} strokeWidth={1.5} className="text-white drop-shadow-sm" />
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full left-0 right-0 mt-2 bg-black/60 backdrop-blur-2xl border border-white/20 rounded-2xl py-2 z-[60] overflow-hidden"
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
                      ? 'bg-white/15 text-white'
                      : 'text-white/80 hover:bg-white/10'
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

interface AIProvider {
  id: string;
  name: string;
  image?: string;
  url: (q: string) => string;
}

const aiProviders: AIProvider[] = [
  { id: 'grok', name: 'Grok', image: grokIcon, url: (q) => `https://grok.com/?q=${encodeURIComponent(q)}` },
  { id: 'chatgpt', name: 'ChatGPT', image: chatgptIcon, url: (q) => `https://chat.openai.com/?q=${encodeURIComponent(q)}` },
  { id: 'claude', name: 'Claude', image: claudeIcon, url: (q) => `https://claude.ai/new?q=${encodeURIComponent(q)}` },
  { id: 'deepseek', name: 'DeepSeek', image: deepseekIcon, url: (q) => `https://chat.deepseek.com/?q=${encodeURIComponent(q)}` },
  { id: 'openclaw', name: 'Open Claw', image: openclawIcon, url: (q) => `https://openclaw.ai/?q=${encodeURIComponent(q)}` },
  { id: 'lovable', name: 'Lovable', url: (q) => `https://lovable.dev/?q=${encodeURIComponent(q)}` },
  { id: 'bolt', name: 'Bolt', url: (q) => `https://bolt.new/?q=${encodeURIComponent(q)}` },
  { id: 'higgsfield', name: 'Higgsfield', url: (q) => `https://higgsfield.ai/?q=${encodeURIComponent(q)}` },
  { id: 'veo', name: 'VEO', url: (q) => `https://deepmind.google/technologies/veo/?q=${encodeURIComponent(q)}` },
  { id: 'gemini', name: 'Gemini', url: (q) => `https://gemini.google.com/app?q=${encodeURIComponent(q)}` },
  { id: 'sora', name: 'Sora', url: (q) => `https://sora.com/?q=${encodeURIComponent(q)}` },
  { id: 'openrouter', name: 'Open Router', url: (q) => `https://openrouter.ai/?q=${encodeURIComponent(q)}` },
  { id: 'cursor', name: 'Cursor', url: (q) => `https://cursor.com/?q=${encodeURIComponent(q)}` },
  { id: 'perplexity', name: 'Perplexity', url: (q) => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}` },
  { id: 'replit', name: 'Replit', url: (q) => `https://replit.com/?q=${encodeURIComponent(q)}` },
  { id: 'emergent', name: 'Emergent', url: (q) => `https://www.emergentmind.com/?q=${encodeURIComponent(q)}` },
  { id: 'kling', name: 'Kling', url: (q) => `https://klingai.com/?q=${encodeURIComponent(q)}` },
  { id: 'midjourney', name: 'Midjourney', url: (q) => `https://www.midjourney.com/?q=${encodeURIComponent(q)}` },
  { id: 'suno', name: 'Suno', url: (q) => `https://suno.com/?q=${encodeURIComponent(q)}` },
];

function AIPromptBar() {
  const [selected, setSelected] = useState(aiProviders[0]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
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

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    window.open(selected.url(prompt.trim()), '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="mx-4 mt-3 relative"
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl flex flex-col px-2 py-2 gap-1">
        {/* Row 1: Provider selector */}
        <div className="flex items-center h-11 bg-white/10 rounded-xl px-1">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-white/10 transition-colors shrink-0 w-full"
          >
            {selected.image ? (
              <img src={selected.image} alt={selected.name} className="w-5 h-5 rounded-sm object-contain" />
            ) : (
              <Zap size={16} strokeWidth={1.5} className="text-white drop-shadow-sm" />
            )}
            <span className="text-white text-xs font-medium truncate">{selected.name}</span>
            <ChevronDown size={12} strokeWidth={2} className="text-white/60 ml-auto" />
          </button>
        </div>

        {/* Row 2: Text input */}
        <div className="flex items-center h-11 bg-white/5 rounded-xl px-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={`Ask ${selected.name}...`}
            className="flex-1 bg-transparent border-none outline-none px-1 text-sm text-white placeholder:text-white/40 font-medium"
          />
        </div>

        {/* Row 3: Attach + Send buttons */}
        <div className="flex items-center justify-between h-11 px-1">
          <button
            onClick={() => {/* file attach placeholder */}}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <Paperclip size={16} strokeWidth={1.5} className="text-white/70" />
            <span className="text-white/60 text-xs font-medium">Attach</span>
          </button>

          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors"
          >
            <span className="text-white text-xs font-medium">Send</span>
            <SendHorizontal size={14} strokeWidth={1.5} className="text-white drop-shadow-sm" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full left-0 right-0 mt-2 bg-black/70 backdrop-blur-2xl border border-white/20 rounded-2xl py-2 z-[60] max-h-64 overflow-y-auto"
          >
            {aiProviders.map((provider) => {
              const isActive = selected.id === provider.id;
              return (
                <button
                  key={provider.id}
                  onClick={() => {
                    setSelected(provider);
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  {provider.image ? (
                    <img src={provider.image} alt={provider.name} className="w-4 h-4 rounded-sm object-contain" />
                  ) : (
                    <Zap size={16} strokeWidth={1.5} />
                  )}
                  <span className="font-medium">{provider.name}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AppDrawer({ apps, direction, isOpen, onClose, title }: AppDrawerProps) {
  const v = variants[direction];
  const [reshuffleKey, setReshuffleKey] = useState(0);
  const [hideNames, setHideNames] = useState(false);
  const [activeFolderKey, setActiveFolderKey] = useState<string | null>(null);
  const folderNavRef = useRef<{ navigate: (dir: 'prev' | 'next') => void } | null>(null);

  // Swipe detection for icon area to change folder category
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleIconAreaTouchStart = useCallback((e: React.TouchEvent) => {
    swipeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleIconAreaTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swipeStartRef.current || !folderNavRef.current) return;
    const dx = e.changedTouches[0].clientX - swipeStartRef.current.x;
    const dy = e.changedTouches[0].clientY - swipeStartRef.current.y;
    swipeStartRef.current = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) folderNavRef.current.navigate('next');
      else folderNavRef.current.navigate('prev');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setReshuffleKey(prev => prev + 1);
      playDrawerSound(true);
    }
  }, [isOpen]);

  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleDrawerPointerDownCapture = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleDrawerPointerUpCapture = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-drawer-interactive]')) return;

    const start = pointerStartRef.current;
    if (!start) {
      playDrawerSound(false);
      onClose();
      return;
    }

    const movedDistance = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    if (movedDistance <= 8) {
      playDrawerSound(false);
      onClose();
    }
  }, [onClose]);

  const hasFolders = title === 'World Wide Web' || title === 'Decentralized Cortex';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed z-50 ${positionClasses[direction]} os-glass-heavy backdrop-blur-2xl flex flex-col ${hasFolders ? 'overflow-hidden' : 'overflow-y-auto'}`}
          initial={v.initial}
          animate={v.animate}
          exit={v.exit}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          onPointerDownCapture={handleDrawerPointerDownCapture}
          onPointerUpCapture={handleDrawerPointerUpCapture}
        >
          {/* Sticky header area */}
          <div className="pt-5 pb-2 w-full relative z-20 shrink-0">
            <h2 className="text-center text-white font-light text-xl tracking-widest mb-2 drop-shadow-lg flex items-center justify-center gap-2" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              {title === 'Artificial Intelligence' && (
                <img src={aiLogo} alt="AI" className="w-7 h-7 inline-block drop-shadow-lg object-contain" />
              )}
              {title === 'Decentralized Cortex' && (
                <img src={cortexLogo} alt="Cortex" className="w-7 h-7 inline-block drop-shadow-lg" />
              )}
              {title === 'World Wide Web' && (
                <img src={wwwLogo} alt="WWW" className="w-7 h-7 inline-block drop-shadow-lg" />
              )}
              {title === 'System Utilities' && (
                <img src={systemUtilitiesLogo} alt="System Utilities" className="w-9 h-9 inline-block drop-shadow-lg" />
              )}
              {title || 'Drawer'}
            </h2>
            {title !== 'System Utilities' && (
              <div data-drawer-interactive>
                <DrawerSearchBar />
              </div>
            )}
            {title === 'Artificial Intelligence' && (
              <div data-drawer-interactive>
                <AIPromptBar />
              </div>
            )}
            {title === 'World Wide Web' && (
              <div data-drawer-interactive>
                <AdBanner reshuffleKey={reshuffleKey} />
              </div>
            )}
            {title === 'Decentralized Cortex' && (
              <div data-drawer-interactive>
                <CortexAdBanner reshuffleKey={reshuffleKey} />
              </div>
            )}
            {hasFolders && (
              <div data-drawer-interactive>
                <FolderSlider ref={folderNavRef} drawerId={title === 'World Wide Web' ? 'www' : 'cortex'} hideNames={hideNames} onToggleHideNames={() => setHideNames(h => !h)} onFolderSelect={setActiveFolderKey} />
              </div>
            )}
          </div>

          {/* Scrollable icons area with glassmorphic fade at top */}
          {title === 'System Utilities' ? (
            <div className="flex-1 min-h-0">
              <SystemUtilitiesPanel />
            </div>
          ) : hasFolders ? (
            <div className="flex-1 relative overflow-hidden min-h-0">
              {/* Glassmorphism gradient fade overlay */}
              <div
                className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
                style={{
                  height: '40px',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.15) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.05) 75%, transparent 100%)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
                }}
              />
              <div className="h-full overflow-y-auto px-6 py-4"
                onTouchStart={(e) => { e.stopPropagation(); handleIconAreaTouchStart(e); }}
                onTouchEnd={(e) => { e.stopPropagation(); handleIconAreaTouchEnd(e); }}
              >
                <div className="grid grid-cols-4 gap-4 w-full max-w-[320px] mx-auto py-2">
                  {(() => {
                    const folderApps = activeFolderKey ? FOLDER_APP_CONTENTS[activeFolderKey] : null;
                    if (folderApps) {
                      return folderApps.map((fApp: FolderApp) => {
                        const initialStack: StackedIcon[] = [{
                          id: fApp.id,
                          name: fApp.name,
                          lucideIcon: fApp.icon,
                          url: '',
                        }];
                        return (
                          <div key={fApp.id} data-drawer-interactive>
                            <IconStackApp
                              initialStack={initialStack}
                              containerSize={56}
                              iconSize={24}
                              glassVariant="smoke"
                              hideLabel={hideNames}
                            />
                          </div>
                        );
                      });
                    }
                    return apps.map(app => {
                      const initialStack: StackedIcon[] = [{
                        id: String(app.id),
                        name: app.name,
                        image: app.image,
                        url: app.url || '',
                        iconScale: app.iconScale,
                      }];
                      return (
                        <div key={app.id} className="flex justify-center" data-drawer-interactive>
                          <IconStackApp
                            initialStack={initialStack}
                            containerSize={56}
                            iconSize={24}
                            glassVariant="smoke"
                            hideLabel={hideNames}
                          />
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center px-8 py-6">
              <div className="grid grid-cols-4 gap-4 w-full max-w-[320px] mx-auto">
                {apps.map(app => {
                  const initialStack: StackedIcon[] = [{
                    id: String(app.id),
                    name: app.name,
                    image: app.image,
                    url: app.url || '',
                    iconScale: app.iconScale,
                  }];
                  return (
                    <div key={app.id} className="flex justify-center" data-drawer-interactive>
                      <IconStackApp
                        initialStack={initialStack}
                        containerSize={56}
                        iconSize={24}
                        glassVariant="smoke"
                        hideLabel={hideNames}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
