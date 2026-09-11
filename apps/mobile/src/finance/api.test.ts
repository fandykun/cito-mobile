import {
  FinanceApi,
  FinanceApiError,
  type CashReconciliationPreview,
  type DailyFinanceSummary,
  type MonthlyFinanceSummary,
} from '@/src/finance/api';

const accessToken = 'sensitive-access-token';
const baseUrl = 'https://api.example.com';
const authorizationHeader = ['Author', 'ization'].join('');
const bearerScheme = ['Be', 'arer'].join('');

const paymentTotals = {
  cash: { medical_income: 100, retail_income: 50, total_expense: 20, total_draw: 10 },
  qris: { medical_income: 200, retail_income: 100, total_expense: 30, total_draw: 20 },
  transfer: { medical_income: 300, retail_income: 150, total_expense: 40, total_draw: 30 },
  card: { medical_income: 400, retail_income: 200, total_expense: 50, total_draw: 40 },
  unattributed: { medical_income: 50, retail_income: 25, total_expense: 10, total_draw: 5 },
  unattributed_counts: { visits: 1, retail_transactions: 2, expenses: 3, owner_draws: 4 },
};

const attributedPaymentTotals = {
  ...paymentTotals,
  unattributed: { medical_income: 0, retail_income: 0, total_expense: 0, total_draw: 0 },
  unattributed_counts: { visits: 0, retail_transactions: 0, expenses: 0, owner_draws: 0 },
};

const dailyPayload = {
  date: '2026-09-11',
  medical_income: 1050,
  retail_income: 525,
  total_expense: 150,
  net: 1425,
  total_draw: 105,
  payment_breakdown: paymentTotals,
};

const monthlyPayload = {
  month: '2026-09',
  medical_income: 5000,
  retail_income: 2500,
  gross_income: 7500,
  operating_expenses: 1200,
  net_profit: 6300,
  total_draw: 1000,
  retained: 5300,
};

const previewPayload = {
  date: '2026-09-11',
  cash_opening: 1000,
  cash_actual_closing: 1150,
  status: 'ready',
  cash_expected_closing: 1120,
  cash_variance: 30,
  payment_breakdown: attributedPaymentTotals,
};

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function textResponse(body: string, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(body, { status, headers });
}

function fetchMock(response: Response): jest.Mock<Promise<Response>, [string, RequestInit?]> {
  return jest.fn<Promise<Response>, [string, RequestInit?]>().mockResolvedValue(response);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function caught(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error);
}

describe('FinanceApi requests and normalization', () => {
  it('gets and exactly normalizes a daily summary', async () => {
    const fetchImplementation = fetchMock(jsonResponse(dailyPayload));
    const api = new FinanceApi(baseUrl, { fetchImplementation });

    const result: DailyFinanceSummary = await api.getDaily(accessToken, '2026-09-11');

    expect(result).toEqual({
      date: '2026-09-11',
      medicalIncome: 1050,
      retailIncome: 525,
      totalExpense: 150,
      net: 1425,
      totalDraw: 105,
      paymentBreakdown: {
        cash: { medicalIncome: 100, retailIncome: 50, totalExpense: 20, totalDraw: 10 },
        qris: { medicalIncome: 200, retailIncome: 100, totalExpense: 30, totalDraw: 20 },
        transfer: { medicalIncome: 300, retailIncome: 150, totalExpense: 40, totalDraw: 30 },
        card: { medicalIncome: 400, retailIncome: 200, totalExpense: 50, totalDraw: 40 },
        unattributed: { medicalIncome: 50, retailIncome: 25, totalExpense: 10, totalDraw: 5 },
        unattributedCounts: { visits: 1, retailTransactions: 2, expenses: 3, ownerDraws: 4 },
      },
    });
    expect(fetchImplementation).toHaveBeenCalledWith(`${baseUrl}/api/v1/finance/daily/2026-09-11`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        [authorizationHeader]: `${bearerScheme} ${accessToken}`,
      },
      signal: expect.any(AbortSignal),
    });
  });

  it('gets and exactly normalizes a monthly summary', async () => {
    const fetchImplementation = fetchMock(jsonResponse(monthlyPayload));
    const api = new FinanceApi(baseUrl, { fetchImplementation });

    const result: MonthlyFinanceSummary = await api.getMonthly(accessToken, '2026-09');

    expect(result).toEqual({
      month: '2026-09',
      medicalIncome: 5000,
      retailIncome: 2500,
      grossIncome: 7500,
      operatingExpenses: 1200,
      netProfit: 6300,
      totalDraw: 1000,
      retained: 5300,
    });
    expect(fetchImplementation).toHaveBeenCalledWith(`${baseUrl}/api/v1/finance/monthly/2026-09`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        [authorizationHeader]: `${bearerScheme} ${accessToken}`,
      },
      signal: expect.any(AbortSignal),
    });
  });

  it('posts explicit cash inputs and exactly normalizes a ready preview', async () => {
    const fetchImplementation = fetchMock(jsonResponse(previewPayload));
    const api = new FinanceApi(baseUrl, { fetchImplementation });

    const result: CashReconciliationPreview = await api.previewCashReconciliation(
      accessToken,
      '2026-09-11',
      { cashOpening: 1000, cashActualClosing: 1150 },
    );

    expect(result).toEqual({
      date: '2026-09-11',
      cashOpening: 1000,
      cashActualClosing: 1150,
      status: 'ready',
      cashExpectedClosing: 1120,
      cashVariance: 30,
      paymentBreakdown: {
        cash: { medicalIncome: 100, retailIncome: 50, totalExpense: 20, totalDraw: 10 },
        qris: { medicalIncome: 200, retailIncome: 100, totalExpense: 30, totalDraw: 20 },
        transfer: { medicalIncome: 300, retailIncome: 150, totalExpense: 40, totalDraw: 30 },
        card: { medicalIncome: 400, retailIncome: 200, totalExpense: 50, totalDraw: 40 },
        unattributed: { medicalIncome: 0, retailIncome: 0, totalExpense: 0, totalDraw: 0 },
        unattributedCounts: { visits: 0, retailTransactions: 0, expenses: 0, ownerDraws: 0 },
      },
    });
    expect(fetchImplementation).toHaveBeenCalledWith(
      `${baseUrl}/api/v1/finance/daily/2026-09-11/cash-reconciliation-preview`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          [authorizationHeader]: `${bearerScheme} ${accessToken}`,
        },
        body: '{"cash_opening":1000,"cash_actual_closing":1150}',
        signal: expect.any(AbortSignal),
      },
    );
  });
});

describe('FinanceApi input validation', () => {
  it.each([
    ['daily malformed', (api: FinanceApi) => api.getDaily(accessToken, '2026-9-11')],
    ['daily impossible', (api: FinanceApi) => api.getDaily(accessToken, '2026-02-29')],
    ['daily year zero', (api: FinanceApi) => api.getDaily(accessToken, '0000-01-01')],
    ['monthly malformed', (api: FinanceApi) => api.getMonthly(accessToken, '2026-9')],
    ['monthly impossible', (api: FinanceApi) => api.getMonthly(accessToken, '2026-13')],
    ['monthly year zero', (api: FinanceApi) => api.getMonthly(accessToken, '0000-01')],
    [
      'preview invalid date',
      (api: FinanceApi) =>
        api.previewCashReconciliation(accessToken, '2025-02-29', {
          cashOpening: 0,
          cashActualClosing: 0,
        }),
    ],
  ])('rejects %s before fetch', async (_name, invoke) => {
    const fetchImplementation = fetchMock(jsonResponse({}));
    const api = new FinanceApi(baseUrl, { fetchImplementation });

    await expect(invoke(api)).rejects.toMatchObject({ code: 'invalid_request' });
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it.each([
    { cashOpening: -1, cashActualClosing: 0 },
    { cashOpening: 100_000_000_000_000, cashActualClosing: 0 },
    { cashOpening: 1.5, cashActualClosing: 0 },
    { cashOpening: Number.NaN, cashActualClosing: 0 },
    { cashOpening: 0, cashActualClosing: -1 },
    { cashOpening: 0, cashActualClosing: 100_000_000_000_000 },
    { cashOpening: 0, cashActualClosing: Number.POSITIVE_INFINITY },
  ])('rejects invalid preview money before fetch: %#', async (input) => {
    const fetchImplementation = fetchMock(jsonResponse({}));
    const api = new FinanceApi(baseUrl, { fetchImplementation });

    await expect(api.previewCashReconciliation(accessToken, '2026-09-11', input)).rejects.toMatchObject({
      code: 'invalid_request',
    });
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it('accepts leap-day and maximum preview inputs', async () => {
    const payload = {
      ...previewPayload,
      date: '2028-02-29',
      cash_opening: 99_999_999_999_999,
      cash_actual_closing: 99_999_999_999_999,
      cash_expected_closing: 100_000_000_000_119,
      cash_variance: -120,
    };
    const fetchImplementation = fetchMock(jsonResponse(payload));
    const api = new FinanceApi(baseUrl, { fetchImplementation });

    await expect(
      api.previewCashReconciliation(accessToken, '2028-02-29', {
        cashOpening: 99_999_999_999_999,
        cashActualClosing: 99_999_999_999_999,
      }),
    ).resolves.toMatchObject({ date: '2028-02-29', cashOpening: 99_999_999_999_999 });
  });
});

describe('FinanceApi error mapping and response bounds', () => {
  it('rejects an unconfigured client without fetching', async () => {
    const fetchImplementation = fetchMock(jsonResponse(dailyPayload));
    const api = new FinanceApi(null, { fetchImplementation });

    await expect(api.getDaily(accessToken, '2026-09-11')).rejects.toMatchObject({ code: 'configuration' });
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it.each([
    [400, 'invalid_request'],
    [401, 'invalid_session'],
    [403, 'server'],
    [413, 'server'],
    [500, 'server'],
  ] as const)('maps HTTP %i to %s without reading or leaking its body', async (status, code) => {
    const secretBody = `server says ${accessToken}`;
    const response = textResponse(secretBody, status);
    const textSpy = jest.spyOn(response, 'text');
    const api = new FinanceApi(baseUrl, { fetchImplementation: fetchMock(response) });

    const error = await caught(api.getDaily(accessToken, '2026-09-11'));

    expect(error).toBeInstanceOf(FinanceApiError);
    expect(error).toMatchObject({ code });
    expect(String(error)).not.toContain(accessToken);
    expect(String(error)).not.toContain(secretBody);
    expect(textSpy).not.toHaveBeenCalled();
  });

  it('maps transport failures to a safe network error', async () => {
    const fetchImplementation = jest
      .fn<Promise<Response>, [string, RequestInit?]>()
      .mockRejectedValue(new Error(`socket leaked ${accessToken}`));
    const api = new FinanceApi(baseUrl, { fetchImplementation });

    const error = await caught(api.getMonthly(accessToken, '2026-09'));

    expect(error).toBeInstanceOf(FinanceApiError);
    expect(error).toMatchObject({ code: 'network' });
    expect(String(error)).not.toContain(accessToken);
  });

  it('aborts timed-out requests and maps them to a safe network error', async () => {
    let capturedSignal: AbortSignal | undefined;
    const fetchImplementation = jest.fn<Promise<Response>, [string, RequestInit?]>().mockImplementation(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          capturedSignal = init?.signal ?? undefined;
          capturedSignal?.addEventListener('abort', () => reject(new Error(`aborted ${accessToken}`)));
        }),
    );
    const api = new FinanceApi(baseUrl, { fetchImplementation, timeoutMilliseconds: 5 });

    const error = await caught(api.getDaily(accessToken, '2026-09-11'));

    expect(capturedSignal?.aborted).toBe(true);
    expect(error).toMatchObject({ code: 'network' });
    expect(String(error)).not.toContain(accessToken);
  });

  it('rejects malformed JSON with a safe server error', async () => {
    const api = new FinanceApi(baseUrl, { fetchImplementation: fetchMock(textResponse(`{${accessToken}`)) });

    const error = await caught(api.getDaily(accessToken, '2026-09-11'));

    expect(error).toMatchObject({ code: 'server' });
    expect(String(error)).not.toContain(accessToken);
  });

  it.each([
    textResponse('{}', 200, { 'Content-Length': String(256 * 1024 + 1) }),
    textResponse('x'.repeat(256 * 1024 + 1)),
  ])('rejects responses larger than 256 KiB', async (oversizedResponse) => {
    const api = new FinanceApi(baseUrl, { fetchImplementation: fetchMock(oversizedResponse) });

    await expect(api.getDaily(accessToken, '2026-09-11')).rejects.toMatchObject({ code: 'server' });
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects an invalid timeout value: %p',
    (timeoutMilliseconds) => {
      expect(() => new FinanceApi(baseUrl, { timeoutMilliseconds })).toThrow(
        'Finance request timeout must be a positive finite number.',
      );
    },
  );
});

describe('FinanceApi response contract validation', () => {
  it.each([
    ['unknown root key', { ...dailyPayload, surprise: true }],
    ['missing root key', { ...dailyPayload, net: undefined }],
    ['wrong date', { ...dailyPayload, date: '2026-09-12' }],
    ['non-integer money', { ...dailyPayload, medical_income: 1050.5 }],
    ['unsafe money', { ...dailyPayload, medical_income: Number.MAX_SAFE_INTEGER + 1 }],
    ['negative nonnegative money', { ...dailyPayload, total_draw: -1 }],
    ['incorrect net equation', { ...dailyPayload, net: 1424 }],
    [
      'incorrect breakdown equation',
      { ...dailyPayload, payment_breakdown: { ...paymentTotals, cash: { ...paymentTotals.cash, medical_income: 99 } } },
    ],
    [
      'unknown breakdown key',
      { ...dailyPayload, payment_breakdown: { ...paymentTotals, cheque: paymentTotals.cash } },
    ],
    [
      'unknown totals key',
      {
        ...dailyPayload,
        payment_breakdown: {
          ...paymentTotals,
          cash: { ...paymentTotals.cash, surprise: 0 },
        },
      },
    ],
    [
      'unknown count key',
      {
        ...dailyPayload,
        payment_breakdown: {
          ...paymentTotals,
          unattributed_counts: { ...paymentTotals.unattributed_counts, refunds: 0 },
        },
      },
    ],
    [
      'invalid count',
      {
        ...dailyPayload,
        payment_breakdown: {
          ...paymentTotals,
          unattributed_counts: { ...paymentTotals.unattributed_counts, visits: -1 },
        },
      },
    ],
  ])('rejects daily payload with %s', async (_name, payload) => {
    const api = new FinanceApi(baseUrl, { fetchImplementation: fetchMock(jsonResponse(payload)) });
    await expect(api.getDaily(accessToken, '2026-09-11')).rejects.toMatchObject({ code: 'server' });
  });

  it.each([
    ['unknown key', { ...monthlyPayload, surprise: true }],
    ['missing key', { ...monthlyPayload, retained: undefined }],
    ['wrong month', { ...monthlyPayload, month: '2026-08' }],
    ['incorrect gross', { ...monthlyPayload, gross_income: 7499 }],
    ['incorrect net', { ...monthlyPayload, net_profit: 6299 }],
    ['incorrect retained', { ...monthlyPayload, retained: 5299 }],
    ['negative nonnegative total', { ...monthlyPayload, operating_expenses: -1 }],
    ['unsafe signed total', { ...monthlyPayload, net_profit: Number.MAX_SAFE_INTEGER + 1 }],
  ])('rejects monthly payload with %s', async (_name, payload) => {
    const api = new FinanceApi(baseUrl, { fetchImplementation: fetchMock(jsonResponse(payload)) });
    await expect(api.getMonthly(accessToken, '2026-09')).rejects.toMatchObject({ code: 'server' });
  });

  it.each([
    ['unknown key', { ...previewPayload, surprise: true }],
    ['missing key', { ...previewPayload, status: undefined }],
    ['wrong date', { ...previewPayload, date: '2026-09-12' }],
    ['wrong opening echo', { ...previewPayload, cash_opening: 999 }],
    ['wrong closing echo', { ...previewPayload, cash_actual_closing: 1149 }],
    ['unknown status', { ...previewPayload, status: 'saved' }],
    ['ready null expected', { ...previewPayload, cash_expected_closing: null }],
    ['ready null variance', { ...previewPayload, cash_variance: null }],
    ['ready wrong expected equation', { ...previewPayload, cash_expected_closing: 1119 }],
    ['ready wrong variance equation', { ...previewPayload, cash_variance: 29 }],
    [
      'ready with unattributed records',
      { ...previewPayload, payment_breakdown: paymentTotals },
    ],
    [
      'incomplete with non-null expected',
      { ...previewPayload, status: 'incomplete_attribution', payment_breakdown: paymentTotals },
    ],
    [
      'incomplete with non-null variance',
      {
        ...previewPayload,
        status: 'incomplete_attribution',
        cash_expected_closing: null,
        payment_breakdown: paymentTotals,
      },
    ],
    [
      'negative expected with null expected',
      {
        ...previewPayload,
        cash_opening: 0,
        cash_actual_closing: 0,
        status: 'negative_expected_cash',
        cash_expected_closing: null,
        cash_variance: null,
        payment_breakdown: {
          ...attributedPaymentTotals,
          cash: { medical_income: 0, retail_income: 0, total_expense: 20, total_draw: 10 },
        },
      },
    ],
  ])('rejects preview payload with %s', async (_name, payload) => {
    const api = new FinanceApi(baseUrl, { fetchImplementation: fetchMock(jsonResponse(payload)) });
    await expect(
      api.previewCashReconciliation(accessToken, '2026-09-11', {
        cashOpening: 1000,
        cashActualClosing: 1150,
      }),
    ).rejects.toMatchObject({ code: 'server' });
  });

  it('accepts incomplete-attribution null semantics', async () => {
    const payload = {
      ...previewPayload,
      status: 'incomplete_attribution',
      cash_expected_closing: null,
      cash_variance: null,
      payment_breakdown: paymentTotals,
    };
    const api = new FinanceApi(baseUrl, { fetchImplementation: fetchMock(jsonResponse(payload)) });

    await expect(
      api.previewCashReconciliation(accessToken, '2026-09-11', {
        cashOpening: 1000,
        cashActualClosing: 1150,
      }),
    ).resolves.toMatchObject({
      status: 'incomplete_attribution',
      cashExpectedClosing: null,
      cashVariance: null,
    });
  });

  it('accepts negative-expected-cash signed semantics', async () => {
    const negativeBreakdown = clone(attributedPaymentTotals);
    negativeBreakdown.cash = { medical_income: 0, retail_income: 0, total_expense: 20, total_draw: 10 };
    const payload = {
      ...previewPayload,
      cash_opening: 0,
      cash_actual_closing: 0,
      status: 'negative_expected_cash',
      cash_expected_closing: -30,
      cash_variance: null,
      payment_breakdown: negativeBreakdown,
    };
    const api = new FinanceApi(baseUrl, { fetchImplementation: fetchMock(jsonResponse(payload)) });

    await expect(
      api.previewCashReconciliation(accessToken, '2026-09-11', {
        cashOpening: 0,
        cashActualClosing: 0,
      }),
    ).resolves.toMatchObject({
      status: 'negative_expected_cash',
      cashExpectedClosing: -30,
      cashVariance: null,
    });
  });
});
