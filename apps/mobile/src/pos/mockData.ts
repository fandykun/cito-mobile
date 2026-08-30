import { mockInventoryItems, type MockInventoryCategory } from '@/src/inventory/mockData';

export type MockPaymentMethod = 'card' | 'cash' | 'qris' | 'transfer';

export type MockPosCartEntry = {
  costPriceAtTime: number;
  name: string;
  productId: string;
  quantity: number;
  sellingPriceAtTime: number;
  stockLimit: number;
  unit: string;
};

export type MockPosReceipt = {
  items: readonly MockPosCartEntry[];
  paymentMethod: MockPaymentMethod;
  receiptNumber: string;
  timeLabel: string;
  total: number;
};

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
