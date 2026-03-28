import { motion, AnimatePresence } from 'framer-motion';

interface JollibeeZoomOverlayProps {
  zoomImage: { src: string; name: string } | null;
  onClose: () => void;
}

export default function JollibeeZoomOverlay({ zoomImage, onClose }: JollibeeZoomOverlayProps) {
  return (
    <AnimatePresence>
      {zoomImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-[300] flex items-center justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            <div className="w-80 h-80 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/20 overflow-hidden flex items-center justify-center shadow-2xl">
              <img src={zoomImage.src} alt={zoomImage.name} className="w-full h-full object-contain p-3" />
            </div>
            <p className="text-white font-semibold text-sm">{zoomImage.name}</p>
            <p className="text-white/40 text-xs">Tap anywhere to close</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
