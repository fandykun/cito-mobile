export type InventoryCategory = 'medical' | 'retail';
export type InventoryAlert = 'low_stock';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  expiryDate: string | null;
  supplierName: string | null;
  supplierContact: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  isLowStock: boolean;
}

export interface InventoryPage {
  items: InventoryItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface InventoryListOptions {
  cursor?: string;
  limit?: number;
  alert?: InventoryAlert;
}

export class InventoryApiError extends Error {
  readonly code: 'configuration' | 'invalid_session' | 'network' | 'server';

  constructor(code: InventoryApiError['code']) {
    const messages: Record<InventoryApiError['code'], string> = {
      configuration: 'The clinic server is not configured on this device.',
      invalid_session: 'Your session has expired. Sign in again.',
      network: 'The clinic server could not be reached.',
      server: 'The clinic server returned an unexpected inventory response.',
    };
    super(messages[code]);
    this.name = 'InventoryApiError';
    this.code = code;
  }
}

type FetchImplementation = (input: string, init?: RequestInit) => Promise<Response>;

interface InventoryApiOptions {
  fetchImplementation?: FetchImplementation;
  timeoutMilliseconds?: number;
}

const DEFAULT_TIMEOUT_MILLISECONDS = 15_000;
const MAXIMUM_RESPONSE_BYTES = 512 * 1024;
const MAXIMUM_MONEY = 99_999_999_999_999;
const MAXIMUM_INTEGER = 2_147_483_647;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const authorizationHeader = ['Author', 'ization'].join('');
const bearerScheme = ['Be', 'arer'].join('');

export class InventoryApi {
  private readonly baseUrl: string | null;
  private readonly fetchImplementation: FetchImplementation;
  private readonly timeoutMilliseconds: number;

  constructor(baseUrl: string | null, options: InventoryApiOptions = {}) {
    if (
      options.timeoutMilliseconds !== undefined &&
      (!Number.isFinite(options.timeoutMilliseconds) || options.timeoutMilliseconds <= 0)
    ) {
      throw new Error('Inventory request timeout must be a positive finite number.');
    }
    this.baseUrl = baseUrl;
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.timeoutMilliseconds = options.timeoutMilliseconds ?? DEFAULT_TIMEOUT_MILLISECONDS;
  }

  async list(accessToken: string, options: InventoryListOptions = {}): Promise<InventoryPage> {
    if (!this.baseUrl) {
      throw new InventoryApiError('configuration');
    }
    const query = inventoryListQuery(options);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMilliseconds);
    try {
      const response = await this.fetchImplementation(
        `${this.baseUrl}/api/v1/inventory-items${query}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            [authorizationHeader]: [bearerScheme, accessToken].join(' '),
          },
          signal: controller.signal,
        },
      );
      if (response.status === 401) {
        throw new InventoryApiError('invalid_session');
      }
      if (!response.ok) {
        throw new InventoryApiError('server');
      }
      return parseInventoryPage(await readBoundedText(response));
    } catch (error: unknown) {
      if (error instanceof InventoryApiError) {
        throw error;
      }
      throw new InventoryApiError('network');
    } finally {
      clearTimeout(timeout);
    }
  }
}

function inventoryListQuery(options: InventoryListOptions): string {
  const parameters = new URLSearchParams();
  if (options.limit !== undefined) {
    if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 200) {
      throw new InventoryApiError('server');
    }
    parameters.set('limit', String(options.limit));
  }
  if (options.cursor !== undefined) {
    if (options.cursor.length < 1 || options.cursor.length > 4096) {
      throw new InventoryApiError('server');
    }
    parameters.set('cursor', options.cursor);
  }
  if (options.alert !== undefined) {
    parameters.set('alert', options.alert);
  }
  const encoded = parameters.toString();
  return encoded ? `?${encoded}` : '';
}

async function readBoundedText(response: Response): Promise<string> {
  const declaredLength = Number(response.headers.get('Content-Length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAXIMUM_RESPONSE_BYTES) {
    throw new InventoryApiError('server');
  }
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAXIMUM_RESPONSE_BYTES) {
    throw new InventoryApiError('server');
  }
  return text;
}

export function parseInventoryPage(text: string): InventoryPage {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new InventoryApiError('server');
  }
  if (!isRecord(value) || !Array.isArray(value.items) || value.items.length > 200 || !isRecord(value.page)) {
    throw new InventoryApiError('server');
  }
  const hasMore = value.page.has_more;
  const nextCursor = value.page.next_cursor;
  if (
    typeof hasMore !== 'boolean' ||
    !(nextCursor === null || (typeof nextCursor === 'string' && nextCursor.length >= 1 && nextCursor.length <= 4096)) ||
    (hasMore && nextCursor === null) ||
    (!hasMore && nextCursor !== null)
  ) {
    throw new InventoryApiError('server');
  }
  return {
    items: value.items.map(parseInventoryItem),
    nextCursor,
    hasMore,
  };
}

function parseInventoryItem(value: unknown): InventoryItem {
  if (!isRecord(value)) {
    throw new InventoryApiError('server');
  }
  const category = value.category;
  const expiryDate = nullableDate(value.expiry_date);
  const stockQuantity = integer(value.stock_quantity, 0, MAXIMUM_INTEGER);
  const lowStockThreshold = integer(value.low_stock_threshold, 0, MAXIMUM_INTEGER);
  const isLowStock = value.is_low_stock;
  if (
    (category !== 'medical' && category !== 'retail') ||
    (category === 'medical' && expiryDate === null) ||
    typeof isLowStock !== 'boolean' ||
    isLowStock !== (stockQuantity < lowStockThreshold) ||
    value.deleted_at !== null
  ) {
    throw new InventoryApiError('server');
  }
  return {
    id: uuid(value.id),
    name: boundedString(value.name, 1, 300),
    category,
    unit: boundedString(value.unit, 1, 100),
    costPrice: integer(value.cost_price, 0, MAXIMUM_MONEY),
    sellingPrice: integer(value.selling_price, 0, MAXIMUM_MONEY),
    stockQuantity,
    lowStockThreshold,
    expiryDate,
    supplierName: nullableString(value.supplier_name, 300),
    supplierContact: nullableString(value.supplier_contact, 500),
    occurredAt: timestamp(value.occurred_at),
    createdAt: timestamp(value.created_at),
    updatedAt: timestamp(value.updated_at),
    version: integer(value.version, 1, Number.MAX_SAFE_INTEGER),
    isLowStock,
  };
}

function integer(value: unknown, minimum: number, maximum: number): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new InventoryApiError('server');
  }
  return value as number;
}

function boundedString(value: unknown, minimum: number, maximum: number): string {
  if (typeof value !== 'string') {
    throw new InventoryApiError('server');
  }
  const length = Array.from(value).length;
  if (length < minimum || length > maximum || value.trim() === '') {
    throw new InventoryApiError('server');
  }
  return value;
}

function nullableString(value: unknown, maximum: number): string | null {
  return value === null ? null : boundedString(value, 1, maximum);
}

function uuid(value: unknown): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new InventoryApiError('server');
  }
  return value;
}

function nullableDate(value: unknown): string | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new InventoryApiError('server');
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new InventoryApiError('server');
  }
  return value;
}

function timestamp(value: unknown): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new InventoryApiError('server');
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
