import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Heart, Search } from 'lucide-react';
import { getCachedUrl } from '@/hooks/useVideoCache';
import { MenuItem, ALL_CATEGORIES, MENU_ITEMS, highlightMatch } from './data';

interface JollibeeMenuViewProps {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  slideDirection: number;
  setSlideDirection: (dir: number) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  addToCart: (item: MenuItem) => void;
  onZoomImage: (src: string, name: string) => void;
  totalItems: number;
  totalPrice: number;
  onViewCart: () => void;
  haptic: (ms?: number | number[]) => void;
  pullDistance: number;
  setPullDistance: (d: number) => void;
  isRefreshing: boolean;
  setIsRefreshing: (r: boolean) => void;
  pullStartY: React.MutableRefObject<number>;
  scrollRef: React.RefObject<HTMLDivElement>;
  tabsRef: React.RefObject<HTMLDivElement>;
  tabRefs: React.MutableRefObject<Record<string, HTMLButtonElement | null>>;
}

export default function JollibeeMenuView({
  activeCategory, setActiveCategory, slideDirection, setSlideDirection,
  searchQuery, setSearchQuery, favorites, toggleFavorite, addToCart,
  onZoomImage, totalItems, totalPrice, onViewCart, haptic,
  pullDistance, setPullDistance, isRefreshing, setIsRefreshing,
  pullStartY, scrollRef, tabsRef, tabRefs,
}: JollibeeMenuViewProps) {
  const filteredItems = (() => {
    let items = activeCategory === '❤️ Favorites'
      ? MENU_ITEMS.filter(i => favorites.has(i.id))
      : MENU_ITEMS.filter(i => i.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = MENU_ITEMS.filter(i => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    return items;
  })();

  return (
    <>
      {/* Search bar */}
      <div className="px-3 pt-2 pb-1">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu..."
            className="w-full bg-white/10 border border-white/10 rounded-xl pl-8 pr-8 py-2 text-white text-xs placeholder:text-white/30 outline-none focus:border-red-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div ref={tabsRef} className="flex gap-2 px-3 py-3 overflow-x-auto no-scrollbar border-b border-white/5">
        {ALL_CATEGORIES.map(cat => (
          <button
            ref={el => { tabRefs.current[cat] = el; }}
            key={cat}
            onClick={() => {
              haptic(8);
              const oldIdx = ALL_CATEGORIES.indexOf(activeCategory);
              const newIdx = ALL_CATEGORIES.indexOf(cat);
              setSlideDirection(newIdx > oldIdx ? 1 : -1);
              setActiveCategory(cat);
            }}
            className={`relative whitespace-nowrap px-3 pt-1.5 pb-3 rounded-full text-xs font-medium transition-all ${
              activeCategory === cat
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {cat}
            {activeCategory === cat && (
              <motion.div
                layoutId="category-dot"
                className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            {cat === '❤️ Favorites' && favorites.size > 0 && (
              <motion.span
                key={favorites.size}
                initial={{ scale: 1.6, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-[9px] font-bold"
              >
                {favorites.size}
              </motion.span>
            )}
          </button>
        ))}
      </div>

      {/* Menu items grid */}
      <div
        ref={scrollRef as React.RefObject<HTMLDivElement>}
        className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2 relative"
        onTouchStart={(e) => {
          if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
            pullStartY.current = e.touches[0].clientY;
          } else {
            pullStartY.current = 0;
          }
        }}
        onTouchMove={(e) => {
          if (!pullStartY.current || isRefreshing) return;
          const delta = e.touches[0].clientY - pullStartY.current;
          if (delta > 0 && scrollRef.current && scrollRef.current.scrollTop <= 0) {
            setPullDistance(Math.min(delta * 0.4, 80));
          }
        }}
        onTouchEnd={() => {
          if (pullDistance > 50 && !isRefreshing) {
            setIsRefreshing(true);
            haptic([30, 20, 30]);
            setTimeout(() => {
              setIsRefreshing(false);
              setPullDistance(0);
              const cat = activeCategory;
              setActiveCategory('');
              requestAnimationFrame(() => setActiveCategory(cat));
            }, 1000);
          } else {
            setPullDistance(0);
          }
          pullStartY.current = 0;
        }}
      >
        {/* Pull-to-refresh indicator */}
        {(pullDistance > 0 || isRefreshing) && (
          <div
            className="flex items-center justify-center"
            style={{ height: isRefreshing ? 40 : pullDistance * 0.5, transition: isRefreshing ? 'height 0.3s' : 'none' }}
          >
            <motion.div
              animate={isRefreshing ? { rotate: 360 } : { rotate: pullDistance * 3 }}
              transition={isRefreshing ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
              className="w-6 h-6 rounded-full border-2 border-white/30 border-t-red-500"
              style={{ opacity: Math.min(pullDistance / 50, 1) }}
            />
          </div>
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeCategory}
            initial={{ x: slideDirection * 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: slideDirection * -80, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_e, info) => {
              const curIdx = ALL_CATEGORIES.indexOf(activeCategory);
              if (info.offset.x < -50 && curIdx < ALL_CATEGORIES.length - 1) {
                setSlideDirection(1);
                setActiveCategory(ALL_CATEGORIES[curIdx + 1]);
              } else if (info.offset.x > 50 && curIdx > 0) {
                setSlideDirection(-1);
                setActiveCategory(ALL_CATEGORIES[curIdx - 1]);
              }
            }}
            className="space-y-2"
          >
            {filteredItems.length === 0 && searchQuery.trim() && (
              <div className="flex flex-col items-center justify-center py-12 text-white/40">
                <Search size={32} className="mb-3" />
                <p className="text-sm font-medium">No results found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            )}
            {filteredItems.length === 0 && !searchQuery.trim() && activeCategory === '❤️ Favorites' && (
              <div className="flex flex-col items-center justify-center py-12 text-white/40">
                <Heart size={32} className="mb-3" />
                <p className="text-sm font-medium">No favorites yet</p>
                <p className="text-xs mt-1">Tap the ♥ on any item to save it here</p>
              </div>
            )}
            {filteredItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: idx * 0.035, duration: 0.3, type: 'spring', stiffness: 400, damping: 22 }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10"
              >
                <button
                  className="w-20 h-20 rounded-xl bg-white/20 overflow-hidden flex-shrink-0 flex items-center justify-center active:scale-95 transition-transform"
                  onClick={() => onZoomImage(getCachedUrl(item.image), item.name)}
                >
                  <img
                    src={getCachedUrl(item.image)}
                    alt={item.name}
                    className="w-full h-full object-contain p-1"
                    loading="lazy"
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h3 className="text-white text-sm font-semibold truncate">
                      {highlightMatch(item.name, searchQuery)}
                    </h3>
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className="flex-shrink-0 active:scale-90 transition-transform"
                    >
                      <Heart
                        size={14}
                        className={favorites.has(item.id) ? 'fill-red-400 text-red-400' : 'text-white/30'}
                      />
                    </button>
                  </div>
                  {item.description && (
                    <p className="text-white/50 text-[11px] mt-0.5 line-clamp-1">
                      {highlightMatch(item.description, searchQuery)}
                    </p>
                  )}
                  <p className="text-red-400 font-bold text-sm mt-1">₱{item.price}</p>
                </div>
                <button
                  onClick={() => addToCart(item)}
                  className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30 flex-shrink-0 active:scale-90 transition-transform"
                >
                  <Plus size={18} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Cart bar */}
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 60 }}
          animate={{ y: 0 }}
          className="px-4 py-3 border-t border-white/10"
        >
          <button
            onClick={() => { haptic(12); onViewCart(); }}
            className="w-full py-3 rounded-2xl bg-red-600 text-white font-bold text-sm flex items-center justify-between px-5 shadow-lg shadow-red-600/30"
          >
            <span>View Cart ({totalItems})</span>
            <span>₱{totalPrice.toLocaleString()}</span>
          </button>
        </motion.div>
      )}
    </>
  );
}
