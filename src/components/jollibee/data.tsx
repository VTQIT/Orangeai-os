export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  category: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export const CATEGORIES = [
  'Chickenjoy',
  'Burgers',
  'Jolly Spaghetti',
  'Burger Steak',
  'Fries & Sides',
  'Beverages',
  'Desserts',
];

export const ALL_CATEGORIES = ['❤️ Favorites', ...CATEGORIES];

export const MENU_ITEMS: MenuItem[] = [
  // Chickenjoy
  { id: 'cj1', name: '1-pc Chickenjoy Solo', price: 99, image: '/images/jollibee/chickenjoy-solo.jpg', category: 'Chickenjoy' },
  { id: 'cj2', name: '1-pc Chickenjoy w/ Drink', price: 129, image: '/images/jollibee/chickenjoy-drink.jpg', category: 'Chickenjoy' },
  { id: 'cj3', name: '2-pc Chickenjoy Solo', price: 169, image: '/images/jollibee/chickenjoy-solo.jpg', category: 'Chickenjoy' },
  { id: 'cj4', name: '1-pc Chickenjoy Spicy Solo', price: 109, image: '/images/jollibee/chickenjoy-spicy.jpg', category: 'Chickenjoy', description: 'Crispy, juicy, spicy chicken' },
  { id: 'cj5', name: '1-pc Chickenjoy Spicy w/ Drink', price: 139, image: '/images/jollibee/chickenjoy-spicy-drink.jpg', category: 'Chickenjoy' },
  { id: 'cj6', name: '6-pc Chickenjoy Bucket', price: 499, image: '/images/jollibee/chickenjoy-solo.jpg', category: 'Chickenjoy', description: 'Perfect for sharing!' },
  // Burgers
  { id: 'bg1', name: 'Yumburger Solo', price: 49, image: '/images/jollibee/yumburger-solo.jpg', category: 'Burgers', description: 'The classic Jollibee burger' },
  { id: 'bg2', name: 'Cheesy Yumburger', price: 69, image: '/images/jollibee/cheesy-yumburger.jpg', category: 'Burgers' },
  { id: 'bg3', name: 'Yumburger w/ Fries & Drink', price: 110, image: '/images/jollibee/yumburger-fries-drink.jpg', category: 'Burgers', description: 'Classic burger combo meal' },
  { id: 'bg4', name: 'Dbl Cheesy Yumburger', price: 130, image: '/images/jollibee/dbl-cheesy-yumburger.jpg', category: 'Burgers', description: 'Double patty with cheese' },
  // Jolly Spaghetti
  { id: 'sp1', name: 'Jolly Spaghetti Solo', price: 75, image: '/images/jollibee/spaghetti-solo.jpg', category: 'Jolly Spaghetti', description: 'Sweet-style spaghetti with hotdog slices' },
  { id: 'sp2', name: 'Jolly Spaghetti w/ Drink', price: 105, image: '/images/jollibee/spaghetti-drink.jpg', category: 'Jolly Spaghetti', description: 'Meaty, cheesy, sweet-sarap spaghetti' },
  { id: 'sp3', name: 'Palabok Family Pan', price: 280, image: '/images/jollibee/palabok-family.jpg', category: 'Jolly Spaghetti', description: 'Filipino-style noodles with shrimp sauce' },
  // Burger Steak
  { id: 'bs1', name: '1-pc Burger Steak Solo', price: 75, image: '/images/jollibee/burger-steak-1pc.jpg', category: 'Burger Steak', description: 'Beef patty with mushroom gravy & rice' },
  { id: 'bs2', name: '2-pc Burger Steak Solo', price: 115, image: '/images/jollibee/burger-steak-2pc.jpg', category: 'Burger Steak' },
  // Fries & Sides
  { id: 'fs1', name: 'Jolly Crispy Fries Regular', price: 49, image: '/images/jollibee/fries-regular.jpg', category: 'Fries & Sides' },
  { id: 'fs2', name: 'Jolly Crispy Fries Large', price: 75, image: '/images/jollibee/fries-large.jpg', category: 'Fries & Sides' },
  { id: 'fs3', name: 'Mashed Potato', price: 45, image: '/images/jollibee/mashed-potato.jpg', category: 'Fries & Sides', description: 'Soft, creamy, buttery mashed potatoes' },
  // Beverages
  { id: 'bv1', name: 'Coke Float', price: 55, image: '/images/jollibee/coke-float.jpg', category: 'Beverages', description: 'Vanilla soft serve on ice-cold Coke' },
  { id: 'bv2', name: 'Iced Mocha Regular', price: 69, image: '/images/jollibee/iced-mocha.jpg', category: 'Beverages', description: '100% Arabica beans with creamy chocolate' },
  { id: 'bv3', name: 'Iced Vanilla Regular', price: 69, image: '/images/jollibee/iced-vanilla.jpg', category: 'Beverages', description: 'Vanilla-flavored iced coffee' },
  // Desserts
  { id: 'ds1', name: 'Peach Mango Pie', price: 45, image: '/images/jollibee/peach-mango-pie.jpg', category: 'Desserts', description: 'Golden flaky crust with peach mango filling' },
  { id: 'ds2', name: 'Chocolate Sundae', price: 39, image: '/images/jollibee/chocolate-sundae.jpg', category: 'Desserts', description: 'Vanilla soft serve with chocolate fudge' },
  { id: 'ds3', name: 'Cookies & Cream Sundae', price: 59, image: '/images/jollibee/cookies-cream-sundae.jpg', category: 'Desserts', description: 'Crushed Oreo cookies & choco coating' },
];

/** All Jollibee image URLs for Memcache precaching */
export const JOLLIBEE_ASSET_URLS: string[] = [
  ...new Set(MENU_ITEMS.map(i => i.image)),
];

/** Highlight matching search text in a string */
export function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const q = query.trim().toLowerCase();
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-red-400">{text.slice(idx, idx + q.length)}</span>
      {text.slice(idx + q.length)}
    </>
  );
}
