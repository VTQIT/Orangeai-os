import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

export default function PWAUpdateNotification() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const sw = (e as CustomEvent).detail as ServiceWorker;
      setWaitingWorker(sw);
      setShow(true);
    };
    window.addEventListener('sw-update-available', handler);
    return () => window.removeEventListener('sw-update-available', handler);
  }, []);

  const handleUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      waitingWorker.addEventListener('statechange', () => {
        if (waitingWorker.state === 'activated') {
          window.location.reload();
        }
      });
    }
  }, [waitingWorker]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-12 left-1/2 -translate-x-1/2 z-[250] w-[calc(100%-2rem)] max-w-[396px]"
      >
        <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <button
            onClick={() => setShow(false)}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={14} className="text-white/40" />
          </button>

          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20"
            >
              <RefreshCw size={20} className="text-white" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-light text-white tracking-wide">Update Available</p>
              <p className="text-[11px] text-white/40 mt-0.5 leading-snug">
                A new version of Orange Ai OS³ is ready
              </p>
            </div>
            <button
              onClick={handleUpdate}
              className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-medium hover:from-orange-400 hover:to-orange-500 transition-all shadow-lg shadow-orange-500/20"
            >
              Update
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
