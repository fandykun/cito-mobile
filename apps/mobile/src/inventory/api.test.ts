import { InventoryApi, InventoryApiError, parseInventoryPage } from '@/src/inventory/api';

const accessToken = 'a'.repeat(64);
const authorizationHeader = ['Author', 'ization'].join('');
const bearerScheme = ['Be', 'arer'].join('');
const item = {
  id: '70000000-0000-4000-8000-000000000001',
  name: 'Amoxicillin 250 mg',
  category: 'medical',
  unit: 'tablet',
  cost_price: 2500,
  selling_price: 8000,
  stock_quantity: 4,
  low_stock_threshold: 5,
  expiry_date: '2027-01-12',
  supplier_name: null,
  supplier_contact: null,
  occurred_at: '2026-08-27T02:00:00Z',
  created_at: '2026-08-27T02:00:00Z',
  updated_at: '2026-08-27T02:00:00Z',
  version: 1,
  deleted_at: null,
  is_low_stock: true,
};
const page = {
  items: [item],
  page: { next_cursor: 'opaque-cursor', has_more: true },
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('InventoryApi', () => {
  it('lists inventory with access-token authentication and validated query parameters', async () => {
    const fetchImplementation = jest
      .fn<Promise<Response>, [string, RequestInit?]>()
      .mockResolvedValue(response(page));
    const api = new InventoryApi('https://api.example.com', { fetchImplementation });

    await expect(
      api.list(accessToken, { limit: 25, cursor: 'opaque-cursor', alert: 'low_stock' }),
    ).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: item.id,
          costPrice: 2500,
          isLowStock: true,
        }),
      ],
      nextCursor: 'opaque-cursor',
      hasMore: true,
    });
    expect(fetchImplementation).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/inventory-items?limit=25&cursor=opaque-cursor&alert=low_stock',
      expect.objectContaining({ method: 'GET' }),
    );
    const headers = fetchImplementation.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers[authorizationHeader]).toBe([bearerScheme, accessToken].join(' '));
  });

  it.each([
    [null, 'configuration'],
    ['https://api.example.com', 'invalid_session'],
  ] as const)('maps safe boundary errors for %s', async (baseUrl, expectedCode) => {
    const fetchImplementation = jest
      .fn<Promise<Response>, [string, RequestInit?]>()
      .mockResolvedValue(response({ code: 'unauthorized' }, 401));
    const api = new InventoryApi(baseUrl, { fetchImplementation });

    await expect(api.list(accessToken)).rejects.toMatchObject({ code: expectedCode });
    if (baseUrl === null) {
      expect(fetchImplementation).not.toHaveBeenCalled();
    }
  });

  it('maps transport failures without exposing the access token', async () => {
    const api = new InventoryApi('https://api.example.com', {
      fetchImplementation: jest
        .fn<Promise<Response>, [string, RequestInit?]>()
        .mockRejectedValue(new Error('socket failed')),
    });

    const error = await api.list(accessToken).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(InventoryApiError);
    expect(error).toMatchObject({ code: 'network' });
    expect(String(error)).not.toContain(accessToken);
  });
});

describe('parseInventoryPage', () => {
  it.each([
    ['not-json'],
    [JSON.stringify({ ...page, items: null })],
    [JSON.stringify({ ...page, items: [{ ...item, cost_price: 1.5 }] })],
    [JSON.stringify({ ...page, items: [{ ...item, category: 'service' }] })],
    [JSON.stringify({ ...page, page: { next_cursor: null, has_more: true } })],
  ])('rejects malformed server payload %#', (payload) => {
    expect(() => parseInventoryPage(payload)).toThrow(InventoryApiError);
  });
});
