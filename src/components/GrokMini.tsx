import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import grokLogo from '@/assets/grok-logo.png';

interface GrokMiniProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GrokMini({ isOpen, onClose }: GrokMiniProps) {
  const [activeTab, setActiveTab] = useState<'ask' | 'imagine'>('ask');
  const [prompt, setPrompt] = useState('');
  const [logoOffset, setLogoOffset] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const initialViewportHeight = useRef<number | null>(null);

  // Keep header pinned + detect keyboard for logo offset
  const syncHeader = useCallback(() => {
    if (!headerRef.current) return;
    const vv = window.visualViewport;
    if (vv) {
      headerRef.current.style.transform = `translateY(${vv.offsetTop}px)`;
      // Store initial height on first call
      if (initialViewportHeight.current === null) {
        initialViewportHeight.current = vv.height;
      }
      // If viewport shrunk significantly, keyboard is open → push logo down
      const heightDiff = (initialViewportHeight.current ?? vv.height) - vv.height;
      const keyboardOpen = heightDiff > 100;
      setLogoOffset(keyboardOpen ? 150 : 0);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      initialViewportHeight.current = null;
      setLogoOffset(0);
      return;
    }
    const vv = window.visualViewport;
    if (!vv) return;
    initialViewportHeight.current = vv.height;
    syncHeader();
    vv.addEventListener('resize', syncHeader);
    vv.addEventListener('scroll', syncHeader);
    return () => {
      vv.removeEventListener('resize', syncHeader);
      vv.removeEventListener('scroll', syncHeader);
    };
  }, [isOpen, syncHeader]);

  const handleSend = () => {
    if (!prompt.trim()) return;
    const query = encodeURIComponent(prompt.trim());
    const url =
      activeTab === 'ask'
        ? `https://grok.com/?q=${query}`
        : `https://grok.com/?q=${query}&mode=imagine`;
    window.open(url, '_blank');
    setPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ maxWidth: 428, margin: '0 auto' }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={onClose} />

          {/* Main panel */}
          <motion.div
            className="relative w-full h-full flex flex-col"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Glass container */}
            <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08]" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Fixed Header + Tabs — uses visualViewport to stay pinned when keyboard opens */}
              <div
                ref={headerRef}
                className="absolute top-0 left-0 right-0 z-20 bg-black/40 backdrop-blur-xl"
                style={{ willChange: 'transform' }}
              >
                <div className="flex items-center justify-center px-5 pt-14 pb-3 relative">
                  <span className="text-white/80 text-sm font-extralight tracking-[0.2em] uppercase">
                    GROK
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="absolute right-5 top-14 text-white/60 text-sm font-light tracking-wide hover:text-white/90 transition-colors p-2"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1 px-5 pb-4">
                  {(['ask', 'imagine'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-2 rounded-full text-xs font-light tracking-[0.15em] uppercase transition-all duration-300 ${
                        activeTab === tab
                          ? 'bg-white/15 text-white border border-white/20'
                          : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacer for fixed header */}
              <div className="h-32" />

              {/* Middle spacer for content flow */}
              <div className="pointer-events-none flex-1" aria-hidden="true" />

              {/* Input bar */}
              <div className="px-4 pb-8 pt-3 mt-auto">
                <div className="flex items-end gap-2 bg-white/[0.06] backdrop-blur-lg border border-white/[0.1] rounded-2xl px-4 py-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-white/40 hover:text-white/70 transition-colors pb-0.5"
                  >
                    📎
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={activeTab === 'ask' ? 'Ask Grok...' : 'Describe what to imagine...'}
                    rows={1}
                    className="flex-1 bg-transparent text-white/90 text-sm font-light placeholder:text-white/25 outline-none resize-none leading-relaxed"
                    style={{ maxHeight: 100 }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!prompt.trim()}
                    className={`pb-0.5 transition-all duration-200 ${
                      prompt.trim()
                        ? 'text-white/80 hover:text-white scale-100'
                        : 'text-white/20 scale-95'
                    }`}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 2L11 13" />
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Logo placeholder — smoothly shifts down when keyboard opens */}
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            aria-hidden="true"
          >
            <div
              className="flex flex-col items-center gap-4"
              style={{
                transform: `translateY(${logoOffset}px)`,
                transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-white/[0.04] blur-2xl animate-[pulse_4s_ease-in-out_infinite]" />
                <img
                  src={grokLogo}
                  alt="Grok"
                  className="relative w-28 h-28 object-contain opacity-[0.08] animate-[pulse_4s_ease-in-out_infinite]"
                  style={{ animationDelay: '0.5s' }}
                  draggable={false}
                />
              </div>
              <p className="text-white/20 text-xs font-extralight tracking-[0.15em]">
                {activeTab === 'ask' ? 'Ask anything' : 'Imagine anything'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
