import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, Delete } from 'lucide-react';
import face1 from '@/assets/faces/face1.png';
import face2 from '@/assets/faces/face2.png';
import face3 from '@/assets/faces/face3.png';
import face4 from '@/assets/faces/face4.png';
import face5 from '@/assets/faces/face5.png';
import face6 from '@/assets/faces/face6.png';
import viberIcon from '@/assets/call-apps/viber.png';
import telegramIcon from '@/assets/call-apps/telegram.png';
import whatsappIcon from '@/assets/call-apps/whatsapp.png';
import messengerIcon from '@/assets/call-apps/messenger.png';
import phoneIcon from '@/assets/call-apps/phone.png';

const favorites = [
  { name: 'Sarah M.', image: face1 },
  { name: 'Jake R.', image: face2 },
  { name: 'Lina C.', image: face3 },
  { name: 'Omar K.', image: face4 },
  { name: 'Priya D.', image: face5 },
  { name: 'Tom W.', image: face6 },
];

const numpadKeys = ['1','2','3','4','5','6','7','8','9','*','0','#'];
const numpadSub: Record<string,string> = {
  '2':'ABC','3':'DEF','4':'GHI','5':'JKL','6':'MNO','7':'PQRS','8':'TUV','9':'WXYZ',
};

const callApps = [
  { name: 'Phone', bg: 'bg-green-500', icon: phoneIcon },
  { name: 'Viber', bg: 'bg-[#7360F2]', icon: viberIcon },
  { name: 'Telegram', bg: 'bg-[#2AABEE]', icon: telegramIcon },
  { name: 'WhatsApp', bg: 'bg-[#25D366]', icon: whatsappIcon },
  { name: 'Messenger', bg: 'bg-[#A033FF]', icon: messengerIcon },
];

const messagingApps = [
  { name: 'Viber', color: 'from-[#7360F2]/70 to-[#5B48D0]/50', icon: '📞' },
  { name: "WhatsApp", color: 'from-[#25D366]/70 to-[#128C47]/50', icon: '💬' },
  { name: 'Telegram', color: 'from-[#2AABEE]/70 to-[#1A8AC7]/50', icon: '✈️' },
  { name: 'Messenger', color: 'from-[#A033FF]/70 to-[#7B1FCC]/50', icon: '💜' },
  { name: 'Smart', color: 'from-[#E2231A]/60 to-[#B01A13]/40', icon: '📱' },
  { name: 'Globe', color: 'from-[#0050AE]/70 to-[#003B80]/50', icon: '🌐' },
];

const appGlowColors: Record<string, string> = {
  Phone: '76, 175, 80',
  Viber: '115, 96, 242',
  Telegram: '42, 171, 238',
  WhatsApp: '37, 211, 102',
  Messenger: '160, 51, 255',
};

// DTMF frequency pairs for realistic phone tones
const dtmfFreqs: Record<string, [number, number]> = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
};

function playDTMF(key: string) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const freqs = dtmfFreqs[key];
    if (!freqs) return;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    gain.connect(ctx.destination);
    freqs.forEach(f => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      osc.connect(gain);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    });
    setTimeout(() => ctx.close(), 300);
  } catch {}
}

interface PhoneCallPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ITEM_WIDTH = 68;

export default function PhoneCallPanel({ isOpen, onClose }: PhoneCallPanelProps) {
  const [dialedNumber, setDialedNumber] = useState('');
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);

  const getContainerPadding = useCallback(() => {
    if (!scrollRef.current) return 0;
    return (scrollRef.current.offsetWidth / 2) - (ITEM_WIDTH / 2);
  }, []);

  const snapToIndex = useCallback((index: number) => {
    if (!scrollRef.current) return;
    const pad = getContainerPadding();
    scrollRef.current.scrollTo({ left: index * ITEM_WIDTH - pad + pad, behavior: 'smooth' });
    setActiveIndex(index);
  }, [getContainerPadding]);

  const handleScrollEnd = useCallback(() => {
    if (!scrollRef.current) return;
    const pad = getContainerPadding();
    const scrollLeft = scrollRef.current.scrollLeft;
    const idx = Math.round(scrollLeft / ITEM_WIDTH);
    const clamped = Math.max(0, Math.min(idx, callApps.length - 1));
    setActiveIndex(clamped);
    scrollRef.current.scrollTo({ left: clamped * ITEM_WIDTH, behavior: 'smooth' });
  }, [getContainerPadding]);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      // Initialize scroll to first item (centered)
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = 0;
          setActiveIndex(0);
        }
      }, 100);
    }
  }, [isOpen]);

  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    scrollStart.current = scrollRef.current?.scrollLeft ?? 0;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    const dx = startX.current - e.clientX;
    scrollRef.current.scrollLeft = scrollStart.current + dx;
  };

  const onPointerUp = () => {
    isDragging.current = false;
    handleScrollEnd();
  };

  const glowColor = useMemo(() => appGlowColors[callApps[activeIndex]?.name] || '76, 175, 80', [activeIndex]);

  const handleKey = (key: string) => {
    setDialedNumber(prev => prev + key);
    playDTMF(key);
    setPressedKey(key);
    setTimeout(() => setPressedKey(null), 200);
  };

  const handleDelete = () => {
    setDialedNumber(prev => prev.slice(0, -1));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); setDialedNumber(''); } }}>
      <DialogContent
        className="p-0 border-0 bg-transparent shadow-none max-w-[380px] w-[92vw] gap-0 overflow-hidden rounded-[32px] [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Phone Call</DialogTitle>
        <div className="relative rounded-[32px] flex flex-col max-h-[88vh] overflow-hidden border border-white/20 shadow-[0_8px_60px_rgba(0,0,0,0.25)]">
          
          {/* Light smoke glass background */}
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[60px] rounded-[32px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.15] to-white/[0.05] rounded-[32px]" />
          
          <div className="relative z-10 flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-end px-5 pt-3 pb-0">
              <button
                onClick={() => { onClose(); setDialedNumber(''); }}
                className="w-7 h-7 rounded-full bg-white/60 border border-white/80 flex items-center justify-center active:scale-95 transition-transform"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>

            {/* Favorites */}
            <div className="px-4 pb-1">

              <div className="grid grid-cols-3 gap-1">
                {favorites.map(fav => (
                  <button
                    key={fav.name}
                    className="flex flex-col items-center gap-1 py-1.5 rounded-2xl hover:bg-white/20 active:scale-[0.97] transition-all"
                  >
                  <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm">
                    <img src={fav.image} alt={fav.name} className="w-full h-full object-cover" draggable={false} />
                  </div>
                    <span className="text-black/50 text-[10px] font-light truncate max-w-[70px]">{fav.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Separator */}
            <div className="mx-6 h-px bg-gradient-to-r from-transparent via-black/[0.08] to-transparent" />

            {/* Dialed Number Display */}
            <div className="px-5 py-2 flex items-center justify-center min-h-[48px]">
              <span className="text-white text-[30px] font-thin tracking-[4px] text-center drop-shadow-sm">
                {dialedNumber || <span className="text-black/20 text-base tracking-[3px]"></span>}
              </span>
              {dialedNumber && (
                <button onClick={handleDelete} className="ml-3 active:scale-90 transition-transform">
                  <Delete className="w-7 h-7 text-white drop-shadow-sm" />
                </button>
              )}
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-y-1 gap-x-3 px-8 py-0">
              {numpadKeys.map(key => (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  className="flex flex-col items-center justify-center w-[58px] h-[58px] mx-auto rounded-full bg-white/30 border border-white/40 hover:bg-white/40 active:scale-[0.96] transition-all duration-150 backdrop-blur-sm"
                  style={pressedKey === key ? {
                    boxShadow: `0 0 18px 6px rgba(${glowColor}, 0.45), inset 0 0 12px rgba(${glowColor}, 0.2)`,
                    backgroundColor: `rgba(${glowColor}, 0.18)`,
                    borderColor: `rgba(${glowColor}, 0.4)`,
                  } : undefined}
                >
                  <span className="text-black/70 text-[28px] font-light leading-none">{key}</span>
                  {numpadSub[key] && (
                    <span className="text-gray-600 text-[9px] tracking-[2px] mt-0.5 font-light">{numpadSub[key]}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Call App Carousel */}
            <div className="py-2 overflow-visible">

              <div className="relative h-[100px] flex flex-col items-center overflow-visible">
                <div
                  ref={scrollRef}
                  className="flex items-center overflow-x-auto overflow-y-visible no-scrollbar cursor-grab active:cursor-grabbing w-full"
                  style={{
                    scrollSnapType: 'x mandatory',
                    paddingLeft: `calc(50% - ${ITEM_WIDTH / 2}px)`,
                    paddingRight: `calc(50% - ${ITEM_WIDTH / 2}px)`,
                    paddingTop: 10,
                    paddingBottom: 10,
                    clipPath: 'inset(-10px 0px -10px 0px)',
                  }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerLeave={onPointerUp}
                  onScroll={() => {
                    if (!isDragging.current) return;
                  }}
                  onTouchEnd={handleScrollEnd}
                >
                  {callApps.map((app, i) => {
                    const distance = Math.abs(i - activeIndex);
                    const opacity = distance === 0 ? 1 : distance === 1 ? 0.45 : 0.2;
                    const glowRgb = appGlowColors[app.name] || '255,255,255';
                    return (
                      <div
                        key={app.name}
                        className="flex flex-col items-center shrink-0"
                        style={{ width: ITEM_WIDTH, scrollSnapAlign: 'center' }}
                        onClick={() => snapToIndex(i)}
                      >
                        <div className="relative flex items-center justify-center">
                          {activeIndex === i && (
                            <div
                              className="absolute w-[100px] h-[100px] rounded-full animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
                              style={{
                                background: `radial-gradient(circle, rgba(${glowRgb}, 0.45) 0%, rgba(${glowRgb}, 0.2) 40%, rgba(${glowRgb}, 0.05) 70%, transparent 100%)`,
                                boxShadow: `0 0 30px 14px rgba(${glowRgb}, 0.35), 0 0 60px 28px rgba(${glowRgb}, 0.15)`,
                              }}
                            />
                          )}
                          <div
                            className={`relative w-[80px] h-[80px] rounded-full ${app.bg} flex items-center justify-center transition-all duration-200 ${
                              activeIndex === i ? 'scale-110' : 'scale-90'
                            }`}
                            style={{ opacity }}
                          >
                            <img src={app.icon} alt={app.name} className="w-full h-full object-cover rounded-full" draggable={false} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Active app name below carousel */}
                <span className="text-white text-[14px] font-thin tracking-[2px] uppercase mt-1 drop-shadow-sm">
                  {callApps[activeIndex]?.name}
                </span>
              </div>
            </div>

            <div className="pb-3" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
