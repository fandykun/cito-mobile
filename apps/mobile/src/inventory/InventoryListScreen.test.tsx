import { render, userEvent, waitFor } from '@testing-library/react-native';

import { InventoryListScreen } from '@/src/inventory/InventoryListScreen';
import type { InventoryItem, InventoryPage } from '@/src/inventory/api';

const medicine: InventoryItem = {
  id: '70000000-0000-4000-8000-000000000001',
  name: 'Amoxicillin 250 mg',
  category: 'medical',
  unit: 'tablet',
  costPrice: 2500,
  sellingPrice: 8000,
  stockQuantity: 4,
  lowStockThreshold: 5,
  expiryDate: '2027-01-12',
  supplierName: null,
  supplierContact: null,
  occurredAt: '2026-08-27T02:00:00Z',
  createdAt: '2026-08-27T02:00:00Z',
  updatedAt: '2026-08-27T02:00:00Z',
  version: 1,
  isLowStock: true,
};

function page(items: InventoryItem[], nextCursor: string | null = null): InventoryPage {
  return { items, nextCursor, hasMore: nextCursor !== null };
}

describe('InventoryListScreen', () => {
  it('renders real online inventory and appends the next page', async () => {
    const retail: InventoryItem = {
      ...medicine,
      id: '70000000-0000-4000-8000-000000000002',
      name: 'Pet Shampoo',
      category: 'retail',
      expiryDate: null,
      isLowStock: false,
      stockQuantity: 10,
    };
    const api = {
      list: jest
        .fn<Promise<InventoryPage>, [string, { cursor?: string }?]>()
        .mockResolvedValueOnce(page([medicine], 'next-page'))
        .mockResolvedValueOnce(page([retail])),
    };
    const view = await render(
      <InventoryListScreen accessToken="synthetic-access-token" api={api} isOnline />,
    );

    await waitFor(() => expect(view.getByText('Amoxicillin 250 mg')).toBeOnTheScreen());
    expect(view.getByText('Low stock')).toBeOnTheScreen();
    expect(view.queryByText('Pet Shampoo')).not.toBeOnTheScreen();

    const user = userEvent.setup();
    await user.press(view.getByRole('button', { name: 'Load more inventory' }));
    await waitFor(() => expect(view.getByText('Pet Shampoo')).toBeOnTheScreen());
    expect(api.list).toHaveBeenLastCalledWith('synthetic-access-token', {
      cursor: 'next-page',
    });
  });

  it('shows a truthful empty state without prototype records', async () => {
    const api = { list: jest.fn().mockResolvedValue(page([])) };
    const view = await render(
      <InventoryListScreen accessToken="synthetic-access-token" api={api} isOnline />,
    );

    await waitFor(() => expect(view.getByText('No inventory items yet')).toBeOnTheScreen());
    expect(view.queryByText('Amoxicillin 250 mg')).not.toBeOnTheScreen();
  });

  it('does not call the API for a restored offline session', async () => {
    const api = { list: jest.fn() };
    const view = await render(
      <InventoryListScreen accessToken="synthetic-access-token" api={api} isOnline={false} />,
    );

    expect(view.getByText('Online inventory is unavailable')).toBeOnTheScreen();
    expect(api.list).not.toHaveBeenCalled();
  });

  it('retries a failed online request', async () => {
    const api = {
      list: jest
        .fn()
        .mockRejectedValueOnce(new Error('network'))
        .mockResolvedValueOnce(page([medicine])),
    };
    const view = await render(
      <InventoryListScreen accessToken="synthetic-access-token" api={api} isOnline />,
    );
    await waitFor(() => expect(view.getByText('Inventory could not be loaded.')).toBeOnTheScreen());

    const user = userEvent.setup();
    await user.press(view.getByRole('button', { name: 'Retry inventory' }));
    await waitFor(() => expect(view.getByText('Amoxicillin 250 mg')).toBeOnTheScreen());
    expect(api.list).toHaveBeenCalledTimes(2);
  });
});
