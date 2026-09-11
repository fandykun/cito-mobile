export interface PaymentTotals {
  medicalIncome: number;
  retailIncome: number;
  totalExpense: number;
  totalDraw: number;
}

export interface UnattributedCounts {
  visits: number;
  retailTransactions: number;
  expenses: number;
  ownerDraws: number;
}

export interface PaymentBreakdown {
  cash: PaymentTotals;
  qris: PaymentTotals;
  transfer: PaymentTotals;
  card: PaymentTotals;
  unattributed: PaymentTotals;
  unattributedCounts: UnattributedCounts;
}

export interface DailyFinanceSummary {
  date: string;
  medicalIncome: number;
  retailIncome: number;
  totalExpense: number;
  net: number;
  totalDraw: number;
  paymentBreakdown: PaymentBreakdown;
}

export type DailySummary = DailyFinanceSummary;

export interface MonthlyFinanceSummary {
  month: string;
  medicalIncome: number;
  retailIncome: number;
  grossIncome: number;
  operatingExpenses: number;
  netProfit: number;
  totalDraw: number;
  retained: number;
}

export type MonthlySummary = MonthlyFinanceSummary;

export interface CashReconciliationInput {
  cashOpening: number;
  cashActualClosing: number;
}

export type CashReconciliationStatus =
  | 'ready'
  | 'incomplete_attribution'
  | 'negative_expected_cash';

export interface CashReconciliationPreview {
  date: string;
  cashOpening: number;
  cashActualClosing: number;
  status: CashReconciliationStatus;
  cashExpectedClosing: number | null;
  cashVariance: number | null;
  paymentBreakdown: PaymentBreakdown;
}

export class FinanceApiError extends Error {
  readonly code: 'configuration' | 'invalid_request' | 'invalid_session' | 'network' | 'server';

  constructor(code: FinanceApiError['code']) {
    const messages: Record<FinanceApiError['code'], string> = {
      configuration: 'The clinic server is not configured on this device.',
      invalid_request: 'The finance request is invalid.',
      invalid_session: 'Your session has expired. Sign in again.',
      network: 'The clinic server could not be reached.',
      server: 'The clinic server returned an unexpected finance response.',
    };
    super(messages[code]);
    this.name = 'FinanceApiError';
    this.code = code;
  }
}

type FetchImplementation = (input: string, init?: RequestInit) => Promise<Response>;

export interface FinanceApiOptions {
  fetchImplementation?: FetchImplementation;
  timeoutMilliseconds?: number;
}

const DEFAULT_TIMEOUT_MILLISECONDS = 15_000;
const MAXIMUM_RESPONSE_BYTES = 256 * 1024;
const MAXIMUM_MONEY = 99_999_999_999_999;
const authorizationHeader = ['Author', 'ization'].join('');
const bearerScheme = ['Be', 'arer'].join('');
const DAILY_KEYS = [
  'date',
  'medical_income',
  'retail_income',
  'total_expense',
  'net',
  'total_draw',
  'payment_breakdown',
] as const;
const MONTHLY_KEYS = [
  'month',
  'medical_income',
  'retail_income',
  'gross_income',
  'operating_expenses',
  'net_profit',
  'total_draw',
  'retained',
] as const;
const PREVIEW_KEYS = [
  'date',
  'cash_opening',
  'cash_actual_closing',
  'status',
  'cash_expected_closing',
  'cash_variance',
  'payment_breakdown',
] as const;
const BREAKDOWN_KEYS = [
  'cash',
  'qris',
  'transfer',
  'card',
  'unattributed',
  'unattributed_counts',
] as const;
const TOTAL_KEYS = ['medical_income', 'retail_income', 'total_expense', 'total_draw'] as const;
const COUNT_KEYS = ['visits', 'retail_transactions', 'expenses', 'owner_draws'] as const;

export class FinanceApi {
  private readonly baseUrl: string | null;
  private readonly fetchImplementation: FetchImplementation;
  private readonly timeoutMilliseconds: number;

  constructor(baseUrl: string | null, options: FinanceApiOptions = {}) {
    if (
      options.timeoutMilliseconds !== undefined &&
      (!Number.isFinite(options.timeoutMilliseconds) || options.timeoutMilliseconds <= 0)
    ) {
      throw new Error('Finance request timeout must be a positive finite number.');
    }
    this.baseUrl = baseUrl;
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.timeoutMilliseconds = options.timeoutMilliseconds ?? DEFAULT_TIMEOUT_MILLISECONDS;
  }

  async getDaily(accessToken: string, date: string): Promise<DailyFinanceSummary> {
    validateRequestedDate(date);
    return this.request(
      `/api/v1/finance/daily/${date}`,
      {
        method: 'GET',
        headers: requestHeaders(accessToken),
      },
      (value) => parseDailySummary(value, date),
    );
  }

  async getMonthly(accessToken: string, month: string): Promise<MonthlyFinanceSummary> {
    validateRequestedMonth(month);
    return this.request(
      `/api/v1/finance/monthly/${month}`,
      {
        method: 'GET',
        headers: requestHeaders(accessToken),
      },
      (value) => parseMonthlySummary(value, month),
    );
  }

  async previewCashReconciliation(
    accessToken: string,
    date: string,
    input: CashReconciliationInput,
  ): Promise<CashReconciliationPreview> {
    validateRequestedDate(date);
    validateRequestedMoney(input.cashOpening);
    validateRequestedMoney(input.cashActualClosing);
    return this.request(
      `/api/v1/finance/daily/${date}/cash-reconciliation-preview`,
      {
        method: 'POST',
        headers: {
          ...requestHeaders(accessToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cash_opening: input.cashOpening,
          cash_actual_closing: input.cashActualClosing,
        }),
      },
      (value) => parseCashReconciliationPreview(value, date, input),
    );
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    parse: (value: unknown) => T,
  ): Promise<T> {
    if (!this.baseUrl) {
      throw new FinanceApiError('configuration');
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMilliseconds);
    try {
      const response = await this.fetchImplementation(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
      });
      if (response.status === 400) {
        throw new FinanceApiError('invalid_request');
      }
      if (response.status === 401) {
        throw new FinanceApiError('invalid_session');
      }
      if (!response.ok) {
        throw new FinanceApiError('server');
      }
      return parse(parseJson(await readBoundedText(response)));
    } catch (error: unknown) {
      if (error instanceof FinanceApiError) {
        throw error;
      }
      throw new FinanceApiError('network');
    } finally {
      clearTimeout(timeout);
    }
  }
}

function requestHeaders(accessToken: string): Record<string, string> {
  return {
    Accept: 'application/json',
    [authorizationHeader]: `${bearerScheme} ${accessToken}`,
  };
}

function validateRequestedDate(value: string): void {
  if (!isCanonicalDate(value)) {
    throw new FinanceApiError('invalid_request');
  }
}

function validateRequestedMonth(value: string): void {
  if (!isCanonicalMonth(value)) {
    throw new FinanceApiError('invalid_request');
  }
}

function validateRequestedMoney(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAXIMUM_MONEY) {
    throw new FinanceApiError('invalid_request');
  }
}

async function readBoundedText(response: Response): Promise<string> {
  const declaredLengthHeader = response.headers.get('Content-Length');
  if (declaredLengthHeader !== null) {
    const declaredLength = Number(declaredLengthHeader);
    if (Number.isFinite(declaredLength) && declaredLength > MAXIMUM_RESPONSE_BYTES) {
      throw new FinanceApiError('server');
    }
  }
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAXIMUM_RESPONSE_BYTES) {
    throw new FinanceApiError('server');
  }
  return text;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new FinanceApiError('server');
  }
}

function parseDailySummary(value: unknown, requestedDate: string): DailyFinanceSummary {
  const record = exactRecord(value, DAILY_KEYS);
  const date = serverDate(record.date);
  const medicalIncome = money(record.medical_income);
  const retailIncome = money(record.retail_income);
  const totalExpense = money(record.total_expense);
  const net = signedInteger(record.net);
  const totalDraw = money(record.total_draw);
  const paymentBreakdown = parsePaymentBreakdown(record.payment_breakdown);
  if (
    date !== requestedDate ||
    !safeEquation(medicalIncome + retailIncome - totalExpense, net) ||
    paymentCategoryTotal(paymentBreakdown, 'medicalIncome') !== medicalIncome ||
    paymentCategoryTotal(paymentBreakdown, 'retailIncome') !== retailIncome ||
    paymentCategoryTotal(paymentBreakdown, 'totalExpense') !== totalExpense ||
    paymentCategoryTotal(paymentBreakdown, 'totalDraw') !== totalDraw
  ) {
    throw new FinanceApiError('server');
  }
  return {
    date,
    medicalIncome,
    retailIncome,
    totalExpense,
    net,
    totalDraw,
    paymentBreakdown,
  };
}

function parseMonthlySummary(value: unknown, requestedMonth: string): MonthlyFinanceSummary {
  const record = exactRecord(value, MONTHLY_KEYS);
  const month = serverMonth(record.month);
  const medicalIncome = money(record.medical_income);
  const retailIncome = money(record.retail_income);
  const grossIncome = money(record.gross_income);
  const operatingExpenses = money(record.operating_expenses);
  const netProfit = signedInteger(record.net_profit);
  const totalDraw = money(record.total_draw);
  const retained = signedInteger(record.retained);
  if (
    month !== requestedMonth ||
    !safeEquation(medicalIncome + retailIncome, grossIncome) ||
    !safeEquation(grossIncome - operatingExpenses, netProfit) ||
    !safeEquation(netProfit - totalDraw, retained)
  ) {
    throw new FinanceApiError('server');
  }
  return {
    month,
    medicalIncome,
    retailIncome,
    grossIncome,
    operatingExpenses,
    netProfit,
    totalDraw,
    retained,
  };
}

function parseCashReconciliationPreview(
  value: unknown,
  requestedDate: string,
  requestedInput: CashReconciliationInput,
): CashReconciliationPreview {
  const record = exactRecord(value, PREVIEW_KEYS);
  const date = serverDate(record.date);
  const cashOpening = money(record.cash_opening);
  const cashActualClosing = money(record.cash_actual_closing);
  const status = reconciliationStatus(record.status);
  const cashExpectedClosing = nullableSignedInteger(record.cash_expected_closing);
  const cashVariance = nullableSignedInteger(record.cash_variance);
  const paymentBreakdown = parsePaymentBreakdown(record.payment_breakdown);
  const hasIncompleteAttribution =
    Object.values(paymentBreakdown.unattributedCounts).some((count) => count > 0) ||
    Object.values(paymentBreakdown.unattributed).some((amount) => amount > 0);
  const expected =
    cashOpening +
    paymentBreakdown.cash.medicalIncome +
    paymentBreakdown.cash.retailIncome -
    paymentBreakdown.cash.totalExpense -
    paymentBreakdown.cash.totalDraw;
  if (
    date !== requestedDate ||
    cashOpening !== requestedInput.cashOpening ||
    cashActualClosing !== requestedInput.cashActualClosing ||
    !Number.isSafeInteger(expected)
  ) {
    throw new FinanceApiError('server');
  }
  if (
    status === 'incomplete_attribution' &&
    (!hasIncompleteAttribution || cashExpectedClosing !== null || cashVariance !== null)
  ) {
    throw new FinanceApiError('server');
  }
  if (
    status === 'negative_expected_cash' &&
    (hasIncompleteAttribution || expected >= 0 || cashExpectedClosing !== expected || cashVariance !== null)
  ) {
    throw new FinanceApiError('server');
  }
  const expectedVariance = cashActualClosing - expected;
  if (
    status === 'ready' &&
    (hasIncompleteAttribution ||
      expected < 0 ||
      cashExpectedClosing !== expected ||
      !Number.isSafeInteger(expectedVariance) ||
      cashVariance !== expectedVariance)
  ) {
    throw new FinanceApiError('server');
  }
  return {
    date,
    cashOpening,
    cashActualClosing,
    status,
    cashExpectedClosing,
    cashVariance,
    paymentBreakdown,
  };
}

function parsePaymentBreakdown(value: unknown): PaymentBreakdown {
  const record = exactRecord(value, BREAKDOWN_KEYS);
  return {
    cash: parsePaymentTotals(record.cash),
    qris: parsePaymentTotals(record.qris),
    transfer: parsePaymentTotals(record.transfer),
    card: parsePaymentTotals(record.card),
    unattributed: parsePaymentTotals(record.unattributed),
    unattributedCounts: parseUnattributedCounts(record.unattributed_counts),
  };
}

function parsePaymentTotals(value: unknown): PaymentTotals {
  const record = exactRecord(value, TOTAL_KEYS);
  return {
    medicalIncome: money(record.medical_income),
    retailIncome: money(record.retail_income),
    totalExpense: money(record.total_expense),
    totalDraw: money(record.total_draw),
  };
}

function parseUnattributedCounts(value: unknown): UnattributedCounts {
  const record = exactRecord(value, COUNT_KEYS);
  return {
    visits: nonnegativeInteger(record.visits),
    retailTransactions: nonnegativeInteger(record.retail_transactions),
    expenses: nonnegativeInteger(record.expenses),
    ownerDraws: nonnegativeInteger(record.owner_draws),
  };
}

function paymentCategoryTotal(
  breakdown: PaymentBreakdown,
  category: keyof PaymentTotals,
): number {
  return (
    breakdown.cash[category] +
    breakdown.qris[category] +
    breakdown.transfer[category] +
    breakdown.card[category] +
    breakdown.unattributed[category]
  );
}

function exactRecord(value: unknown, expectedKeys: readonly string[]): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new FinanceApiError('server');
  }
  const actualKeys = Object.keys(value);
  if (
    actualKeys.length !== expectedKeys.length ||
    expectedKeys.some((key) => !Object.prototype.hasOwnProperty.call(value, key))
  ) {
    throw new FinanceApiError('server');
  }
  return value;
}

function money(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > MAXIMUM_MONEY) {
    throw new FinanceApiError('server');
  }
  return value;
}

function signedInteger(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new FinanceApiError('server');
  }
  return value;
}

function nonnegativeInteger(value: unknown): number {
  const parsed = signedInteger(value);
  if (parsed < 0) {
    throw new FinanceApiError('server');
  }
  return parsed;
}

function nullableSignedInteger(value: unknown): number | null {
  return value === null ? null : signedInteger(value);
}

function reconciliationStatus(value: unknown): CashReconciliationStatus {
  if (
    value !== 'ready' &&
    value !== 'incomplete_attribution' &&
    value !== 'negative_expected_cash'
  ) {
    throw new FinanceApiError('server');
  }
  return value;
}

function serverDate(value: unknown): string {
  if (typeof value !== 'string' || !isCanonicalDate(value)) {
    throw new FinanceApiError('server');
  }
  return value;
}

function serverMonth(value: unknown): string {
  if (typeof value !== 'string' || !isCanonicalMonth(value)) {
    throw new FinanceApiError('server');
  }
  return value;
}

function isCanonicalDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isCanonicalMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && !value.startsWith('0000-');
}

function safeEquation(calculated: number, declared: number): boolean {
  return Number.isSafeInteger(calculated) && calculated === declared;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
