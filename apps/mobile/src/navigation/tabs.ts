export const tabs = [
  { href: '/', icon: 'home-outline', iconActive: 'home', name: 'index', title: 'Beranda' },
  {
    href: '/inventory',
    icon: 'cube-outline',
    iconActive: 'cube',
    name: 'inventory',
    title: 'Stok',
  },
  {
    href: '/records',
    icon: 'document-text-outline',
    iconActive: 'document-text',
    name: 'records',
    title: 'Rekam',
  },
  { href: '/pos', icon: 'cart-outline', iconActive: 'cart', name: 'pos', title: 'Kasir' },
  {
    href: '/finance',
    icon: 'trending-up-outline',
    iconActive: 'trending-up',
    name: 'finance',
    title: 'Keuangan',
  },
] as const;

export type TabDefinition = (typeof tabs)[number];
