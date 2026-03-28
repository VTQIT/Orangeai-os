import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { getCachedUrl } from '@/hooks/useVideoCache';
import type { StackedIcon } from './IconStackApp';

interface IconStackManagerProps {
  isOpen: boolean;
  onClose: () => void;
  stack: StackedIcon[];
  onStackChange: (stack: StackedIcon[]) => void;
  intervalMs: number;
  onIntervalChange: (ms: number) => void;
}

function StackIconPreview({ icon }: { icon: StackedIcon }) {
  if (icon.image) {
    return (
      <img
        src={getCachedUrl(icon.image)}
        alt={icon.name}
        className="w-[70%] h-[70%] object-contain brightness-0 invert"
        draggable={false}
      />
    );
  }
  if (icon.lucideIcon) {
    const IconComp = (LucideIcons as any)[icon.lucideIcon];
    if (IconComp) return <IconComp size={18} strokeWidth={1.5} className="text-white/80" />;
  }
  return null;
}

export default function IconStackManager({
  isOpen,
  onClose,
  stack,
  onStackChange,
  intervalMs,
  onIntervalChange,
}: IconStackManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newIconPreview, setNewIconPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setNewIconPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    if (!newName.trim() || !newUrl.trim() || !newIconPreview) return;
    const newIcon: StackedIcon = {
      id: `stack-${Date.now()}`,
      name: newName.trim(),
      url: newUrl.trim(),
      image: newIconPreview,
    };
    onStackChange([...stack, newIcon]);
    setNewName('');
    setNewUrl('');
    setNewIconPreview(null);
    setShowAddForm(false);
  };

  const handleRemove = (id: string) => {
    if (stack.length <= 1) return;
    onStackChange(stack.filter(s => s.id !== id));
  };

  const handleToggleFavorite = (id: string) => {
    onStackChange(
      stack.map(s => ({
        ...s,
        isFavorite: s.id === id ? !s.isFavorite : false,
      }))
    );
  };

  const timerSeconds = Math.round(intervalMs / 1000);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[250] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ maxWidth: 428, margin: '0 auto' }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={onClose} />

          <motion.div
            className="relative w-[90%] max-h-[80vh] bg-white/[0.06] backdrop-blur-2xl border border-white/[0.1] rounded-3xl overflow-hidden flex flex-col"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div>
                <h3 className="text-white/90 text-sm font-extralight tracking-[0.15em] uppercase">
                  Icon Stack
                </h3>
                <p className="text-white/40 text-[10px] font-extralight mt-0.5">
                  {stack.length} icon{stack.length !== 1 ? 's' : ''} stacked
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/50 hover:text-white/90 transition-colors text-sm p-2"
              >
                ✕
              </button>
            </div>

            {/* Timer control */}
            <div className="px-5 pb-3">
              <div className="flex items-center gap-3 bg-white/[0.04] rounded-xl px-4 py-3 border border-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="opacity-50 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="text-white/50 text-[11px] font-extralight tracking-wide shrink-0">
                  {timerSeconds}s
                </span>
                <input
                  type="range"
                  min={7}
                  max={60}
                  value={timerSeconds}
                  onChange={e => onIntervalChange(Number(e.target.value) * 1000)}
                  className="flex-1 h-[2px] appearance-none bg-white/20 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white/80"
                />
              </div>
            </div>

            {/* Icon list */}
            <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-2">
              {stack.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-white/[0.04] rounded-xl px-3 py-2.5 border border-white/[0.06]"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                    <StackIconPreview icon={item} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-xs font-extralight truncate">{item.name}</p>
                    <p className="text-white/30 text-[9px] font-extralight truncate">{item.url}</p>
                  </div>
                  {/* Favorite heart toggle */}
                  <button
                    onClick={() => handleToggleFavorite(item.id)}
                    className="p-1 transition-colors shrink-0"
                  >
                    {item.isFavorite ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="1.5">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="opacity-30 hover:opacity-60">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    )}
                  </button>
                  <span className="text-white/20 text-[9px] font-extralight shrink-0">#{i + 1}</span>
                  {stack.length > 1 && (
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-white/30 hover:text-red-400/80 transition-colors text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  className="px-5 pb-3 space-y-2"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.08] space-y-2.5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-2.5 border border-dashed border-white/[0.12] hover:border-white/[0.2] transition-colors"
                    >
                      {newIconPreview ? (
                        <img src={newIconPreview} alt="preview" className="w-8 h-8 object-contain brightness-0 invert" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="opacity-40">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                          </svg>
                        </div>
                      )}
                      <span className="text-white/40 text-[10px] font-extralight">
                        {newIconPreview ? 'Icon selected' : 'Upload white PNG / SVG'}
                      </span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/svg+xml"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <input
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="App name"
                      className="w-full bg-white/[0.04] rounded-lg px-3 py-2 text-white/80 text-xs font-extralight placeholder:text-white/20 outline-none border border-white/[0.06] focus:border-white/[0.15] transition-colors"
                    />
                    <input
                      type="text"
                      value={newUrl}
                      onChange={e => setNewUrl(e.target.value)}
                      placeholder="URL or file path"
                      className="w-full bg-white/[0.04] rounded-lg px-3 py-2 text-white/80 text-xs font-extralight placeholder:text-white/20 outline-none border border-white/[0.06] focus:border-white/[0.15] transition-colors"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowAddForm(false); setNewName(''); setNewUrl(''); setNewIconPreview(null); }}
                        className="flex-1 py-2 rounded-lg text-white/40 text-[10px] font-extralight tracking-wide hover:text-white/60 transition-colors"
                      >
                        CANCEL
                      </button>
                      <button
                        onClick={handleAdd}
                        disabled={!newName.trim() || !newUrl.trim() || !newIconPreview}
                        className="flex-1 py-2 rounded-lg bg-white/[0.08] text-white/70 text-[10px] font-extralight tracking-wide hover:bg-white/[0.12] transition-colors disabled:opacity-30"
                      >
                        ADD
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="px-5 pb-5 pt-1">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="opacity-60">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="text-white/50 text-[10px] font-extralight tracking-[0.15em] uppercase">
                  Add Icon
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
