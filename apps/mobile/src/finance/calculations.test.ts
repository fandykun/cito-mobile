import {
  calculateCashReconciliation,
  calculateDailySummary,
  calculateMonthlySummary,
} from '@/src/finance/calculations';

describe('finance calculations', () => {
  it('derives daily income and net without counting payment breakdown twice', () => {
    expect(
      calculateDailySummary({
        expenses: 1_100_000,
        medicalIncome: 5_260_000,
        payments: { card: 500_000, cash: 3_100_000, qris: 2_200_000, transfer: 1_460_000 },
        retailIncome: 2_000_000,
      }),
    ).toEqual({
      expenses: 1_100_000,
      medicalIncome: 5_260_000,
      net: 6_160_000,
      payments: { card: 500_000, cash: 3_100_000, qris: 2_200_000, transfer: 1_460_000 },
      retailIncome: 2_000_000,
      totalIncome: 7_260_000,
    });
  });

  it('keeps owner draw separate from operating expenses when deriving retained funds', () => {
    expect(
      calculateMonthlySummary({
        medicalIncome: 76_500_000,
        operatingExpenses: 12_800_000,
        ownerDraw: 33_000_000,
        retailIncome: 18_000_000,
      }),
    ).toEqual({
      grossIncome: 94_500_000,
      medicalIncome: 76_500_000,
      netProfit: 81_700_000,
      operatingExpenses: 12_800_000,
      ownerDraw: 33_000_000,
      retained: 48_700_000,
      retailIncome: 18_000_000,
    });
  });

  it('rejects invalid money and unreconciled daily payments', () => {
    expect(() =>
      calculateMonthlySummary({
        medicalIncome: -1,
        operatingExpenses: 0,
        ownerDraw: 0,
        retailIncome: 0,
      }),
    ).toThrow('Medical income must be a nonnegative whole-IDR safe integer.');

    expect(() =>
      calculateDailySummary({
        expenses: 0,
        medicalIncome: 10_000,
        payments: { card: 0, cash: 9_000, qris: 0, transfer: 0 },
        retailIncome: 0,
      }),
    ).toThrow('Payment breakdown (9000) must equal total daily income (10000).');
  });

  it('derives expected cash and a signed closing variance', () => {
    expect(
      calculateCashReconciliation({
        actualClosing: 3_950_000,
        cashExpenses: 1_100_000,
        cashIncome: 3_100_000,
        openingBalance: 2_000_000,
      }),
    ).toEqual({
      actualClosing: 3_950_000,
      cashExpenses: 1_100_000,
      cashIncome: 3_100_000,
      expectedClosing: 4_000_000,
      openingBalance: 2_000_000,
      variance: -50_000,
    });

    expect(() =>
      calculateCashReconciliation({
        actualClosing: -1,
        cashExpenses: 0,
        cashIncome: 0,
        openingBalance: 0,
      }),
    ).toThrow('Actual closing balance must be a nonnegative whole-IDR safe integer.');
  });
});
