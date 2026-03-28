import { CartItem } from './data';

interface JollibeeCheckoutViewProps {
  cart: CartItem[];
  totalPrice: number;
  onPlaceOrder: () => void;
}

export default function JollibeeCheckoutView({ cart, totalPrice, onPlaceOrder }: JollibeeCheckoutViewProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-white font-bold text-lg">Checkout</h2>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 px-4 space-y-4 pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Order summary */}
        <div className="rounded-2xl bg-white/10 border border-white/10 p-4 space-y-3">
          <h3 className="text-white/60 text-xs uppercase tracking-wider font-medium">Order Summary</h3>
          {cart.map(item => (
            <div key={item.id} className="flex justify-between text-white text-sm">
              <span className="text-white/80">{item.quantity}x {item.name}</span>
              <span className="font-medium">₱{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="border-t border-white/10 pt-2 flex justify-between text-white font-bold">
            <span>Total</span>
            <span>₱{totalPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* Delivery info */}
        <div className="rounded-2xl bg-white/10 border border-white/10 p-4 space-y-3">
          <h3 className="text-white/60 text-xs uppercase tracking-wider font-medium">Delivery Details</h3>
          <input type="text" placeholder="Full Name" className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-red-500/50" />
          <input type="text" placeholder="Delivery Address" className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-red-500/50" />
          <input type="tel" placeholder="Phone Number" className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-red-500/50" />
        </div>

        {/* Payment */}
        <div className="rounded-2xl bg-white/10 border border-white/10 p-4 space-y-3">
          <h3 className="text-white/60 text-xs uppercase tracking-wider font-medium">Payment Method</h3>
          <div className="flex gap-2">
            {['Cash on Delivery', 'GCash', 'Card'].map(method => (
              <button key={method} className="flex-1 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-xs font-medium hover:bg-red-600/30 hover:border-red-500/30 transition-colors">
                {method}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-white/10">
        <button
          onClick={onPlaceOrder}
          className="w-full py-3 rounded-2xl bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-600/30"
        >
          Place Order • ₱{totalPrice.toLocaleString()}
        </button>
      </div>
    </div>
  );
}
