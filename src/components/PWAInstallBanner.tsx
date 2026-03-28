import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if previously dismissed (don't show again for 7 days)
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt && Date.now() - Number(dismissedAt) < 7 * 24 * 60 * 60 * 1000) {
      setDismissed(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  }, []);

  // For iOS Safari (no beforeinstallprompt), show manual instructions
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const showIOSHint = isIOS && !isStandalone && !dismissed;
  const showNativePrompt = !!deferredPrompt && !dismissed && !isStandalone;

  if (!showIOSHint && !showNativePrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-20 left-0 right-0 z-[9999] flex justify-center px-4"
      >
        <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-full max-w-[396px]">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={14} className="text-white/40" />
          </button>

          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20"
            >
              <Download size={20} className="text-white" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-light text-white tracking-wide">Install Orange Ai OS³</p>
              <p className="text-[11px] text-white/40 mt-0.5 leading-snug">
                {isIOS
                  ? 'Tap Share ↗ then "Add to Home Screen"'
                  : 'Add to home screen for the full experience'}
              </p>
            </div>
            {showNativePrompt && (
              <motion.button
                onClick={handleInstall}
                onTouchEnd={(e) => { e.stopPropagation(); handleInstall(); }}
                animate={{
                  scale: [1, 1.08, 1],
                  boxShadow: [
                    '0 0 8px rgba(249,115,22,0.3), 0 0 16px rgba(249,115,22,0.1)',
                    '0 0 16px rgba(249,115,22,0.6), 0 0 32px rgba(249,115,22,0.3)',
                    '0 0 8px rgba(249,115,22,0.3), 0 0 16px rgba(249,115,22,0.1)',
                  ],
                }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold active:scale-95 touch-manipulation"
              >
                Install
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
