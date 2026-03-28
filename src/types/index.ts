export interface App {
  id: number;
  name: string;
  icon: string;
  image?: string;
  url?: string;
  iconScale?: number;
  category: 'essential' | 'productivity' | 'social' | 'media' | 'utility';
}

export type DrawerDirection = 'left' | 'right' | 'top' | 'bottom';

export interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}
