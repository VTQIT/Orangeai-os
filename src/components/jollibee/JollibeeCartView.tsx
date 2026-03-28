import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { getCachedUrl } from '@/hooks/useVideoCache';
import { CartItem } from './data';

interface JollibeeCartViewProps {
  cart: CartItem[];
  totalPrice: number;
  updateQuantity: (id: string, delta: number) => void;
  onCheckout: () => void;
  haptic: (ms?: number | number[]) => void;
}

export default function JollibeeCartView({ cart, totalPrice, updateQuantity, onCheckout, haptic }: JollibeeCartViewProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-white font-bold text-lg">Your Order</h2>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 px-4 space-y-2 pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-white/40">
            <ShoppingCart size={40} className="mb-2" />
            <p className="text-sm">Your cart is empty</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 border border-white/10">
              <div className="w-14 h-14 rounded-xl bg-white/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
                <img src={getCachedUrl(item.image)} alt={item.name} className="w-full h-full object-contain p-1" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-sm font-semibold truncate">{item.name}</h3>
                <p className="text-red-400 font-bold text-xs">₱{(item.price * item.quantity).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60">
                  {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                </button>
                <span className="text-white text-sm font-medium w-5 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-full bg-red-600/80 flex items-center justify-center text-white">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {cart.length > 0 && (
        <div className="px-4 py-3 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between text-white">
            <span className="text-sm text-white/60">Subtotal</span>
            <span className="font-bold">₱{totalPrice.toLocaleString()}</span>
          </div>
          <button
            onClick={() => { haptic(12); onCheckout(); }}
            className="w-full py-3 rounded-2xl bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-600/30"
          >
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
}
