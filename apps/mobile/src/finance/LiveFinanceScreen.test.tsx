import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { LiveFinanceScreen, type FinanceOverviewClient } from '@/src/finance/LiveFinanceScreen';
import type { CashReconciliationPreview, DailySummary, MonthlySummary } from '@/src/finance/api';

const daily: DailySummary = {
  date: '2026-09-15',
  medicalIncome: 100_000,
  retailIncome: 80_000,
  totalExpense: 30_000,
  net: 150_000,
  totalDraw: 20_000,
  paymentBreakdown: {
    cash: { medicalIncome: 50_000, retailIncome: 30_000, totalExpense: 10_000, totalDraw: 5_000 },
    qris: { medicalIncome: 50_000, retailIncome: 20_000, totalExpense: 5_000, totalDraw: 5_000 },
    transfer: { medicalIncome: 0, retailIncome: 20_000, totalExpense: 10_000, totalDraw: 5_000 },
    card: { medicalIncome: 0, retailIncome: 10_000, totalExpense: 5_000, totalDraw: 5_000 },
    unattributed: { medicalIncome: 0, retailIncome: 0, totalExpense: 0, totalDraw: 0 },
    unattributedCounts: { visits: 0, retailTransactions: 0, expenses: 0, ownerDraws: 0 },
  },
};
const monthly: MonthlySummary = {
  month: '2026-09',
  medicalIncome: 1_000_000,
  retailIncome: 800_000,
  grossIncome: 1_800_000,
  operatingExpenses: 300_000,
  netProfit: 1_500_000,
  totalDraw: 200_000,
  retained: 1_300_000,
};
const preview: CashReconciliationPreview = {
  date: daily.date,
  cashOpening: 100_000,
  cashActualClosing: 160_000,
  status: 'ready',
  cashExpectedClosing: 165_000,
  cashVariance: -5_000,
  paymentBreakdown: daily.paymentBreakdown,
};

function client(overrides: Partial<FinanceOverviewClient> = {}): FinanceOverviewClient {
  return {
    getDaily: jest.fn().mockResolvedValue(daily),
    getMonthly: jest.fn().mockResolvedValue(monthly),
    previewCashReconciliation: jest.fn().mockResolvedValue(preview),
    ...overrides,
  };
}

describe('LiveFinanceScreen', () => {
  it('loads and renders authenticated server daily and monthly data', async () => {
    const api = client();
    const view = await render(<LiveFinanceScreen accessToken="token" api={api} initialDate="2026-09-15" isOnline />);

    await waitFor(() => expect(view.getByText('Rp 150.000')).toBeTruthy());
    expect(api.getDaily).toHaveBeenCalledWith('token', '2026-09-15');
    expect(api.getMonthly).toHaveBeenCalledWith('token', '2026-09');
    expect(view.getByText('Server data')).toBeTruthy();
    expect(view.getAllByText('Rp 80.000').length).toBeGreaterThanOrEqual(1);

    await fireEvent.press(view.getByRole('button', { name: 'Show monthly finance' }));
    expect(view.getByText('Rp 1.800.000')).toBeTruthy();
    expect(view.getByText('Rp 1.300.000')).toBeTruthy();
  });

  it('changes clinic dates and reloads both summaries', async () => {
    const api = client();
    const view = await render(<LiveFinanceScreen accessToken="token" api={api} initialDate="2026-09-15" isOnline />);
    await waitFor(() => expect(api.getDaily).toHaveBeenCalledTimes(1));

    await fireEvent.press(view.getByRole('button', { name: 'Previous clinic day' }));
    await waitFor(() => expect(api.getDaily).toHaveBeenLastCalledWith('token', '2026-09-14'));
    expect(api.getMonthly).toHaveBeenCalledTimes(1);
  });

  it('submits cash values to the backend preview and renders shortage', async () => {
    const api = client();
    const view = await render(<LiveFinanceScreen accessToken="token" api={api} initialDate="2026-09-15" isOnline />);
    await waitFor(() => expect(view.getByText('Rp 150.000')).toBeTruthy());

    await fireEvent.changeText(view.getByLabelText('Opening cash in rupiah'), '100000');
    await fireEvent.changeText(view.getByLabelText('Counted closing cash in rupiah'), '160000');
    await fireEvent.press(view.getByRole('button', { name: 'Preview cash reconciliation' }));

    await waitFor(() => expect(api.previewCashReconciliation).toHaveBeenCalledWith('token', '2026-09-15', {
      cashOpening: 100_000,
      cashActualClosing: 160_000,
    }));
    expect(view.getByText('Short by Rp 5.000')).toBeTruthy();
    expect(view.getByText('Expected closing: Rp 165.000')).toBeTruthy();
    expect(view.getByText('Calculated from current server records. This preview is not saved.')).toBeTruthy();
  });

  it('renders incomplete attribution and negative expected states truthfully', async () => {
    const api = client({
      previewCashReconciliation: jest
        .fn()
        .mockResolvedValueOnce({ ...preview, status: 'incomplete_attribution', cashExpectedClosing: null, cashVariance: null })
        .mockResolvedValueOnce({ ...preview, status: 'negative_expected_cash', cashExpectedClosing: -1, cashVariance: null }),
    });
    const view = await render(<LiveFinanceScreen accessToken="token" api={api} initialDate="2026-09-15" isOnline />);
    await waitFor(() => expect(view.getByText('Rp 150.000')).toBeTruthy());
    await fireEvent.changeText(view.getByLabelText('Opening cash in rupiah'), '0');
    await fireEvent.changeText(view.getByLabelText('Counted closing cash in rupiah'), '0');
    await fireEvent.press(view.getByRole('button', { name: 'Preview cash reconciliation' }));
    await waitFor(() => expect(view.getByText('Payment attribution is incomplete.')).toBeTruthy());
    await fireEvent.press(view.getByRole('button', { name: 'Preview cash reconciliation' }));
    await waitFor(() => expect(view.getByText('Recorded cash movements imply negative cash: −Rp 1.')).toBeTruthy());
  });

  it('shows offline, error, retry, and input validation states without stale claims', async () => {
    const offline = await render(<LiveFinanceScreen accessToken="token" api={client()} initialDate="2026-09-15" isOnline={false} />);
    expect(offline.getByText('Online finance is unavailable')).toBeTruthy();

    const api = client({ getDaily: jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(daily) });
    const view = await render(<LiveFinanceScreen accessToken="token" api={api} initialDate="2026-09-15" isOnline />);
    await waitFor(() => expect(view.getByRole('alert')).toHaveTextContent('Financial data could not be loaded.'));
    await fireEvent.press(view.getByRole('button', { name: 'Retry financial summary' }));
    await waitFor(() => expect(view.getByText('Rp 150.000')).toBeTruthy());

    await fireEvent.changeText(view.getByLabelText('Opening cash in rupiah'), '-1');
    await fireEvent.changeText(view.getByLabelText('Counted closing cash in rupiah'), '0');
    await fireEvent.press(view.getByRole('button', { name: 'Preview cash reconciliation' }));
    expect(view.getByText(/Enter whole rupiah amounts from zero/)).toBeTruthy();
    expect(api.previewCashReconciliation).not.toHaveBeenCalled();
  });
});
