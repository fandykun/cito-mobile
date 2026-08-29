export type DashboardMetric = {
  label: string;
  value: number;
  supportingText: string;
  trend?: string;
};

export type DashboardShortcut = {
  accessibilityLabel: string;
  href: '/inventory' | '/records' | '/pos';
  icon: 'cube-outline' | 'document-text-outline' | 'cart-outline';
  label: string;
};

export type LowStockItem = {
  id: string;
  name: string;
  stock: number;
  unit: string;
};

export const dashboardMockData = {
  displayDate: "JUM'AT, 22 AGUSTUS 2026",
  greeting: 'Selamat pagi, drh. Rivera',
  metrics: [
    {
      label: 'Pendapatan Hari Ini',
      supportingText: 'dibanding rata-rata harian',
      trend: '+12%',
      value: 7_260_000,
    },
    {
      label: 'Net Klinik (Agu)',
      supportingText: 'setelah pengambilan pribadi',
      value: 61_500_000,
    },
  ] satisfies DashboardMetric[],
  ownerDraw: {
    grossIncome: 94_500_000,
    month: 'Agu',
    value: 33_000_000,
  },
  shortcuts: [
    {
      accessibilityLabel: 'Buka inventaris',
      href: '/inventory',
      icon: 'cube-outline',
      label: 'Inventaris',
    },
    {
      accessibilityLabel: 'Buka rekam medis',
      href: '/records',
      icon: 'document-text-outline',
      label: 'Rekam Medis',
    },
    {
      accessibilityLabel: 'Buka kasir',
      href: '/pos',
      icon: 'cart-outline',
      label: 'Kasir',
    },
  ] satisfies DashboardShortcut[],
  lowStockItems: [
    { id: 'inventory-1', name: 'Amoxicillin 250mg', stock: 8, unit: 'tab' },
    { id: 'inventory-3', name: 'Metacam 1,5 mg/ml', stock: 1, unit: 'btl' },
    { id: 'inventory-6', name: 'Vaksin Rabies 1 tahun', stock: 4, unit: 'vial' },
    { id: 'inventory-9', name: 'Anti-Kutu Kucing (L)', stock: 2, unit: 'pcs' },
  ] satisfies LowStockItem[],
} as const;
