import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, ChevronLeft } from 'lucide-react';
import jollibeeLogo from '@/assets/jollibee-logo-new.png';
import jollibeeTextLogo from '@/assets/jollibee-text-logo.png';
import { playCelebrationSound } from '@/hooks/useOSSounds';
import { useJollibeeCart } from '@/hooks/useJollibeeCart';
import JollibeeMenuView from './jollibee/JollibeeMenuView';
import JollibeeCartView from './jollibee/JollibeeCartView';
import JollibeeCheckoutView from './jollibee/JollibeeCheckoutView';
import JollibeeConfirmedView from './jollibee/JollibeeConfirmedView';
import JollibeeZoomOverlay from './jollibee/JollibeeZoomOverlay';

// Re-export for external consumers
export { JOLLIBEE_ASSET_URLS } from './jollibee/data';

type View = 'menu' | 'cart' | 'checkout' | 'confirmed';

interface JollibeeStoreProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JollibeeStore({ isOpen, onClose }: JollibeeStoreProps) {
  const [activeCategory, setActiveCategory] = useState('Chickenjoy');
  const [slideDirection, setSlideDirection] = useState(0);
  const [view, setView] = useState<View>('menu');
  const [zoomImage, setZoomImage] = useState<{ src: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('jollibee-favorites');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const haptic = useCallback((ms: number | number[] = 10) => {
    if (navigator.vibrate) navigator.vibrate(ms);
  }, []);

  const { cart, cartShake, addToCart, updateQuantity, clearCart, totalItems, totalPrice } = useJollibeeCart(haptic);

  useEffect(() => {
    const btn = tabRefs.current[activeCategory];
    if (btn) btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeCategory]);

  const toggleFavorite = useCallback((id: string) => {
    haptic(10);
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('jollibee-favorites', JSON.stringify([...next]));
      return next;
    });
  }, [haptic]);

  const handleCheckout = () => {
    setView('confirmed');
    playCelebrationSound();
    if (navigator.vibrate) navigator.vibrate([80, 50, 80, 50, 200]);
    setTimeout(() => {
      clearCart();
      setView('menu');
      onClose();
    }, 3000);
  };

  const handleClose = () => {
    setView('menu');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ maxWidth: 428, margin: '0 auto' }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={handleClose} />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full h-full bg-white/10 backdrop-blur-2xl border border-white/20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-12 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                {view !== 'menu' ? (
                  <button onClick={() => { haptic(10); setView('menu'); }} className="text-white/80 flex items-center gap-1">
                    <ChevronLeft size={20} />
                    <span className="text-sm">Back</span>
                  </button>
                ) : (
                  <img src={jollibeeTextLogo} alt="Jollibee" className="object-contain" style={{ height: 45, marginTop: -10 }} />
                )}
              </div>
              <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 15 }}>
                <img src={jollibeeLogo} alt="Jollibee" className="object-contain" style={{ width: 58, height: 58 }} />
              </div>
              <div className="flex items-center gap-3 mr-4">
                <button onClick={handleClose} className="text-white/60 hover:text-white">
                  <X size={20} />
                </button>
                <button onClick={() => setView('cart')} className="relative text-white/80">
                  <motion.div
                    animate={cartShake ? { rotate: [0, -12, 10, -8, 6, -3, 0] } : { rotate: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <ShoppingCart size={22} />
                  </motion.div>
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 1.4 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </button>
              </div>
            </div>

            {view === 'menu' && (
              <JollibeeMenuView
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                slideDirection={slideDirection}
                setSlideDirection={setSlideDirection}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                addToCart={addToCart}
                onZoomImage={(src, name) => setZoomImage({ src, name })}
                totalItems={totalItems}
                totalPrice={totalPrice}
                onViewCart={() => setView('cart')}
                haptic={haptic}
                pullDistance={pullDistance}
                setPullDistance={setPullDistance}
                isRefreshing={isRefreshing}
                setIsRefreshing={setIsRefreshing}
                pullStartY={pullStartY}
                scrollRef={scrollRef}
                tabsRef={tabsRef}
                tabRefs={tabRefs}
              />
            )}

            {view === 'cart' && (
              <JollibeeCartView
                cart={cart}
                totalPrice={totalPrice}
                updateQuantity={updateQuantity}
                onCheckout={() => setView('checkout')}
                haptic={haptic}
              />
            )}

            {view === 'checkout' && (
              <JollibeeCheckoutView
                cart={cart}
                totalPrice={totalPrice}
                onPlaceOrder={handleCheckout}
              />
            )}

            {view === 'confirmed' && <JollibeeConfirmedView />}
          </motion.div>

          <JollibeeZoomOverlay zoomImage={zoomImage} onClose={() => setZoomImage(null)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
