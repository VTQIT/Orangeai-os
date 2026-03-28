import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Minus } from 'lucide-react';

interface FloatingMiniCalculatorProps {
  onClose: () => void;
}

export default function FloatingMiniCalculator({ onClose }: FloatingMiniCalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  // Dragging
  const [pos, setPos] = useState({ x: 60, y: 120 });
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
      x: Math.max(0, Math.min(window.innerWidth - 200, dragRef.current.posX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 300, dragRef.current.posY + dy)),
    });
  }, []);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  const inputDigit = (d: string) => {
    if (waitingForOperand) {
      setDisplay(d);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? d : display + d);
    }
  };

  const inputDot = () => {
    if (waitingForOperand) { setDisplay('0.'); setWaitingForOperand(false); return; }
    if (!display.includes('.')) setDisplay(display + '.');
  };

  const clear = () => { setDisplay('0'); setPrevValue(null); setOperator(null); setWaitingForOperand(false); };

  const performOp = (nextOp: string) => {
    const current = parseFloat(display);
    if (prevValue !== null && operator && !waitingForOperand) {
      let result = prevValue;
      if (operator === '+') result = prevValue + current;
      else if (operator === '-') result = prevValue - current;
      else if (operator === '×') result = prevValue * current;
      else if (operator === '÷') result = current !== 0 ? prevValue / current : 0;
      setDisplay(String(parseFloat(result.toFixed(8))));
      setPrevValue(result);
    } else {
      setPrevValue(current);
    }
    setOperator(nextOp);
    setWaitingForOperand(true);
  };

  const equals = () => {
    if (prevValue === null || !operator) return;
    performOp('=');
    setOperator(null);
  };

  const toggleSign = () => setDisplay(String(-parseFloat(display)));
  const percent = () => setDisplay(String(parseFloat(display) / 100));

  const buttons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  const handleBtn = (btn: string) => {
    if (btn === 'C') clear();
    else if (btn === '±') toggleSign();
    else if (btn === '%') percent();
    else if (['+', '-', '×', '÷'].includes(btn)) performOp(btn);
    else if (btn === '=') equals();
    else if (btn === '.') inputDot();
    else inputDigit(btn);
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="fixed z-[300] rounded-2xl border border-white/20 bg-black/80 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden"
      style={{ left: pos.x, top: pos.y, width: 200 }}
    >
      {/* Title bar - draggable */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-white/5 cursor-grab active:cursor-grabbing select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span className="text-white/70 text-[10px] font-light tracking-wider uppercase">Calculator</span>
        <button onClick={onClose} className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-500/40 transition-colors">
          <X size={10} className="text-white" />
        </button>
      </div>

      {/* Display */}
      <div className="px-3 py-2 text-right">
        <div className="text-white text-xl font-light truncate">{display}</div>
      </div>

      {/* Buttons */}
      <div className="px-2 pb-2 space-y-1">
        {buttons.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map(btn => {
              const isOp = ['+', '-', '×', '÷'].includes(btn);
              const isEquals = btn === '=';
              const isZero = btn === '0';
              const isActive = isOp && operator === btn && waitingForOperand;
              return (
                <button
                  key={btn}
                  onClick={() => handleBtn(btn)}
                  className={`${isZero ? 'flex-[2]' : 'flex-1'} h-8 rounded-lg text-xs font-medium transition-colors ${
                    isEquals ? 'bg-orange-500 text-white hover:bg-orange-400' :
                    isOp ? (isActive ? 'bg-white text-orange-500' : 'bg-orange-500/80 text-white hover:bg-orange-400') :
                    ['C', '±', '%'].includes(btn) ? 'bg-white/20 text-white hover:bg-white/30' :
                    'bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  {btn}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
