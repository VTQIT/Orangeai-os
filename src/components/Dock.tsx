import { useState, useRef, useCallback, useEffect } from 'react';
import calculatorIcon from '@/assets/icons/calculator.png';
import phoneCallIcon from '@/assets/icons/phone-call.png';
import messagesIcon from '@/assets/icons/messages.png';
import cameraIcon from '@/assets/icons/camera.png';
import originLogo from '@/assets/icons/origin-logo.png';
import CalculatorApp from './CalculatorApp';
import PhoneCallPanel from './PhoneCallPanel';
import VortexShutdown from './VortexShutdown';
import NotepadApp from './NotepadApp';
import OrangeAiHub from './OrangeAiHub';

const dockItems = [
  { type: 'image' as const, image: phoneCallIcon, label: 'Call', action: 'phone', imgClass: 'w-[38px] h-[38px]' },
  { type: 'image' as const, image: messagesIcon, label: 'Notes', action: 'notes', imgClass: 'w-[36px] h-[36px]' },
  { type: 'center' as const, image: originLogo, label: 'Origin', action: null },
  { type: 'image' as const, image: cameraIcon, label: 'Camera', action: null, imgClass: 'w-[42px] h-[42px]' },
  { type: 'image' as const, image: calculatorIcon, label: 'Calculator', action: 'calculator', imgClass: 'w-[38px] h-[38px]' },
];

export default function Dock({ onAppActiveChange }: { onAppActiveChange?: (active: boolean) => void }) {
  const [calcOpen, setCalcOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [hubOpen, setHubOpen] = useState(false);
  const [vortexActive, setVortexActive] = useState(false);

  const anyAppOpen = calcOpen || phoneOpen || notesOpen || hubOpen;
  
  useEffect(() => {
    onAppActiveChange?.(anyAppOpen);
  }, [anyAppOpen, onAppActiveChange]);
  const originRef = useRef<HTMLDivElement>(null!);
  const lastTapRef = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOriginTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      // Double tap → Vortex shutdown
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }
      setVortexActive(true);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      // Single tap → open Orange AI Hub (delayed to distinguish from double tap)
      singleTapTimer.current = setTimeout(() => {
        setHubOpen(true);
        singleTapTimer.current = null;
      }, 420);
    }
  }, []);

  const handleTap = (action: string | null) => {
    if (action === 'calculator') setCalcOpen(true);
    if (action === 'phone') setPhoneOpen(true);
    if (action === 'notes') setNotesOpen(true);
  };

  const handleVortexComplete = () => {
    setTimeout(() => {
      setVortexActive(false);
      const container = document.querySelector('[data-vortex-container]');
      if (container) {
        Array.from(container.children).forEach((child) => {
          const el = child as HTMLElement;
          el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
          el.style.transform = '';
          el.style.opacity = '';
          setTimeout(() => { el.style.transition = ''; }, 600);
        });
      }
      const statusBar = document.querySelector('[data-vortex-statusbar]') as HTMLElement;
      if (statusBar) {
        statusBar.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        statusBar.style.transform = '';
        statusBar.style.opacity = '';
        setTimeout(() => { statusBar.style.transition = ''; }, 600);
      }
      const video = document.querySelector('video') as HTMLVideoElement;
      if (video) {
        video.style.transition = 'opacity 0.5s ease';
        video.style.opacity = '1';
        setTimeout(() => { video.style.transition = ''; }, 600);
      }
    }, 2000);
  };

  return (
    <>
      <div className="os-glass-dock rounded-[28px] px-3 py-3 mx-6 mb-2 flex items-center justify-around">
        {dockItems.map(item => (
          item.type === 'center' ? (
            <div
              key={item.label}
              ref={originRef}
              className="flex items-center justify-center w-[78px] h-[78px] rounded-full cursor-pointer -my-2 relative z-[60]"
              onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); handleOriginTap(); }}
              onClick={(e) => { e.stopPropagation(); handleOriginTap(); }}
            >
              <img src={item.image} alt={item.label} className="w-[70px] h-[70px] object-contain pointer-events-none" draggable={false} />
            </div>
          ) : (
            <div
              key={item.label}
              onClick={() => handleTap(item.action)}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 cursor-pointer"
            >
              <img src={item.image} alt={item.label} className={`${item.imgClass || 'w-8 h-8'} object-contain`} draggable={false} />
            </div>
          )
        ))}
      </div>
      <CalculatorApp isOpen={calcOpen} onClose={() => setCalcOpen(false)} />
      <PhoneCallPanel isOpen={phoneOpen} onClose={() => setPhoneOpen(false)} />
      <NotepadApp isOpen={notesOpen} onClose={() => setNotesOpen(false)} />
      <OrangeAiHub isOpen={hubOpen} onClose={() => setHubOpen(false)} />
      <VortexShutdown active={vortexActive} originRef={originRef} onComplete={handleVortexComplete} />
    </>
  );
}
