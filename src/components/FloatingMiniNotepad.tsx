import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';

interface FloatingMiniNotepadProps {
  onClose: () => void;
}

export default function FloatingMiniNotepad({ onClose }: FloatingMiniNotepadProps) {
  const [text, setText] = useState('');

  // Dragging
  const [pos, setPos] = useState({ x: 80, y: 160 });
  const dragRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });
  const dragging = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    dragRef.current = { startX: e.clientX, startY: e.clientY, posX: pos.x, posY: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 220, dragRef.current.posX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 280, dragRef.current.posY + dy)),
    });
  }, []);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="fixed z-[300] rounded-2xl border border-white/20 bg-black/80 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden"
      style={{ left: pos.x, top: pos.y, width: 220 }}
    >
      {/* Title bar - draggable */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-white/5 cursor-grab active:cursor-grabbing select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span className="text-white/70 text-[10px] font-light tracking-wider uppercase">Notepad</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setText('')} className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <Trash2 size={9} className="text-white/60" />
          </button>
          <button onClick={onClose} className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-500/40 transition-colors">
            <X size={10} className="text-white" />
          </button>
        </div>
      </div>

      {/* Text area */}
      <div className="p-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your note..."
          className="w-full h-48 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-light placeholder:text-white/30 outline-none resize-none focus:border-white/20"
        />
      </div>

      {/* Character count */}
      <div className="px-3 pb-2">
        <span className="text-white/30 text-[9px]">{text.length} chars</span>
      </div>
    </motion.div>
  );
}
