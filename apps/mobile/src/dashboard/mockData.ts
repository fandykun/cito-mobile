import { financeMockData } from '@/src/finance/mockData';

const latestMonth = financeMockData.months.at(-1);
if (!latestMonth) {
  throw new Error('Dashboard demo requires a monthly finance fixture.');
}

export type DashboardMetric = {
  label: string;
  value: number;
  supportingText: string;
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
  displayDate: financeMockData.businessDateLabel.toLocaleUpperCase('id-ID'),
  greeting: 'Selamat pagi, drh. Rivera',
  metrics: [
    {
      label: 'Pendapatan Hari Ini',
      supportingText: 'layanan medis + ritel',
      value: financeMockData.daily.totalIncome,
    },
    {
      label: `Ditahan di Klinik (${latestMonth.label})`,
      supportingText: 'laba bersih − pengambilan pemilik',
      value: latestMonth.retained,
    },
  ] satisfies DashboardMetric[],
  ownerDraw: {
    grossIncome: latestMonth.grossIncome,
    month: latestMonth.label,
    value: latestMonth.ownerDraw,
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
