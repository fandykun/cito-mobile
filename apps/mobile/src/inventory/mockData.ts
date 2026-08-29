export type MockInventoryCategory = 'medical' | 'retail';

export type MockInventoryItem = {
  category: MockInventoryCategory;
  categoryLabel: string;
  costPrice: number;
  expiryLabel: string | null;
  id: string;
  lowStockThreshold: number;
  name: string;
  sellingPrice: number;
  stockQuantity: number;
  supplier: string;
  unit: string;
};

export const mockInventoryItems: readonly MockInventoryItem[] = [
  {
    category: 'medical',
    categoryLabel: 'Obat',
    costPrice: 2_500,
    expiryLabel: '12 Jan 2027',
    id: 'demo-inventory-1',
    lowStockThreshold: 20,
    name: 'Amoxicillin 250mg',
    sellingPrice: 8_000,
    stockQuantity: 8,
    supplier: 'PT Vet Farma',
    unit: 'tab',
  },
  {
    category: 'medical',
    categoryLabel: 'Obat',
    costPrice: 2_000,
    expiryLabel: '4 Mar 2027',
    id: 'demo-inventory-2',
    lowStockThreshold: 25,
    name: 'Doxycycline 100mg',
    sellingPrice: 7_500,
    stockQuantity: 34,
    supplier: 'PT Vet Farma',
    unit: 'kap',
  },
  {
    category: 'medical',
    categoryLabel: 'Obat',
    costPrice: 180_000,
    expiryLabel: '18 Okt 2026',
    id: 'demo-inventory-3',
    lowStockThreshold: 5,
    name: 'Metacam 1,5 mg/ml',
    sellingPrice: 450_000,
    stockQuantity: 1,
    supplier: 'CV Satwa Sehat',
    unit: 'btl',
  },
  {
    category: 'medical',
    categoryLabel: 'Vaksin',
    costPrice: 35_000,
    expiryLabel: '10 Nov 2026',
    id: 'demo-inventory-4',
    lowStockThreshold: 10,
    name: 'Vaksin Rabies 1 tahun',
    sellingPrice: 120_000,
    stockQuantity: 4,
    supplier: 'PT Biovet Indonesia',
    unit: 'vial',
  },
  {
    category: 'medical',
    categoryLabel: 'Vaksin',
    costPrice: 45_000,
    expiryLabel: '22 Feb 2027',
    id: 'demo-inventory-5',
    lowStockThreshold: 8,
    name: 'Vaksin DHPP',
    sellingPrice: 135_000,
    stockQuantity: 12,
    supplier: 'PT Biovet Indonesia',
    unit: 'vial',
  },
  {
    category: 'retail',
    categoryLabel: 'Preventif',
    costPrice: 195_000,
    expiryLabel: '30 Jun 2027',
    id: 'demo-inventory-6',
    lowStockThreshold: 12,
    name: 'Anti-Kutu Kucing (L)',
    sellingPrice: 580_000,
    stockQuantity: 2,
    supplier: 'CV Satwa Sehat',
    unit: 'pcs',
  },
  {
    category: 'retail',
    categoryLabel: 'Perlengkapan',
    costPrice: 30_000,
    expiryLabel: null,
    id: 'demo-inventory-7',
    lowStockThreshold: 6,
    name: 'Cairan Pembersih Telinga',
    sellingPrice: 120_000,
    stockQuantity: 18,
    supplier: 'UD Pet Supply',
    unit: 'btl',
  },
  {
    category: 'retail',
    categoryLabel: 'Pakan',
    costPrice: 250_000,
    expiryLabel: '8 Des 2026',
    id: 'demo-inventory-8',
    lowStockThreshold: 8,
    name: 'Royal Canin Adult 4kg',
    sellingPrice: 490_000,
    stockQuantity: 3,
    supplier: 'UD Pet Supply',
    unit: 'sak',
  },
] as const;
