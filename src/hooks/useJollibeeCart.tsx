import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { MenuItem, CartItem } from '@/components/jollibee/data';
import jollibeeLogo from '@/assets/jollibee-logo-new.png';

export function useJollibeeCart(haptic: (ms?: number | number[]) => void) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartShake, setCartShake] = useState(false);

  const addToCart = useCallback((item: MenuItem) => {
    haptic(15);
    setCartShake(true);
    setTimeout(() => setCartShake(false), 500);
    toast({
      title: `✓ ${item.name}`,
      description: (
        <div className="flex items-center gap-2">
          <img src={jollibeeLogo} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
          <span>₱{item.price} added to cart</span>
        </div>
      ) as unknown as string,
      duration: 1500,
      className: 'bg-red-600 border-red-700 text-white [&>div]:text-white',
    });
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  }, [haptic]);

  const updateQuantity = useCallback((id: string, delta: number) => {
    haptic(10);
    setCart(prev => prev.map(c => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
  }, [haptic]);

  const clearCart = useCallback(() => setCart([]), []);

  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);
  const totalPrice = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  return { cart, cartShake, addToCart, updateQuantity, clearCart, totalItems, totalPrice };
}
