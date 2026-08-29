import { mockInventoryItems, type MockInventoryCategory } from '@/src/inventory/mockData';

export type MockPosProduct = {
  category: MockInventoryCategory;
  categoryLabel: string;
  costPrice: number;
  id: string;
  name: string;
  sellingPrice: number;
  stockLimit: number;
  unit: string;
};

export const mockPosProducts: readonly MockPosProduct[] = mockInventoryItems.map((item) => ({
  category: item.category,
  categoryLabel: item.categoryLabel,
  costPrice: item.costPrice,
  id: item.id,
  name: item.name,
  sellingPrice: item.sellingPrice,
  stockLimit: item.stockQuantity,
  unit: item.unit,
}));
