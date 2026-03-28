import { motion } from 'framer-motion';
import jollibeeConfirmedGif from '@/assets/jollibee-confirmed.gif';

export default function JollibeeConfirmedView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center relative overflow-hidden">
      {/* Confetti particles */}
      {Array.from({ length: 30 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 1.5;
        const duration = 2 + Math.random() * 2;
        const size = 6 + Math.random() * 8;
        const colors = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#ff6b6b', '#ffd93d'];
        const color = colors[i % colors.length];
        const rotation = Math.random() * 360;
        const drift = (Math.random() - 0.5) * 60;
        return (
          <motion.div
            key={i}
            initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
            animate={{ y: 600, x: drift, opacity: [1, 1, 0], rotate: rotation + 360 }}
            transition={{ duration, delay, ease: 'linear', repeat: Infinity }}
            className="absolute top-0 pointer-events-none"
            style={{
              left: `${left}%`,
              width: size,
              height: size * (Math.random() > 0.5 ? 1 : 0.6),
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
          />
        );
      })}
      {/* Sparkle bursts */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * 360;
        const rad = (angle * Math.PI) / 180;
        const dist = 120;
        return (
          <motion.div
            key={`sparkle-${i}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 1, 0],
              x: [0, Math.cos(rad) * dist],
              y: [0, Math.sin(rad) * dist],
            }}
            transition={{ duration: 1, delay: 0.3 + i * 0.08, ease: 'easeOut' }}
            className="absolute pointer-events-none"
            style={{ left: '50%', top: '40%', marginLeft: -4, marginTop: -4 }}
          >
            <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50" />
          </motion.div>
        );
      })}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.15, 0.95, 1.05, 1] }}
        transition={{ duration: 0.8, times: [0, 0.4, 0.6, 0.8, 1], ease: 'easeOut' }}
        className="relative z-10 w-40 h-40 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center mb-6 overflow-hidden"
      >
        <motion.img
          src={jollibeeConfirmedGif}
          alt="Jollibee"
          className="w-36 h-36 object-contain"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
      <h2 className="relative z-10 text-white font-bold text-xl mb-2">Order Confirmed!</h2>
      <p className="relative z-10 text-white/50 text-sm">Thank you for ordering from Jollibee. Your food will be prepared shortly!</p>
    </div>
  );
}
