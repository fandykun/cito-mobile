export type CashReconciliationSource = {
  actualClosing: number;
  cashExpenses: number;
  cashIncome: number;
  openingBalance: number;
};

export type CashReconciliation = CashReconciliationSource & {
  expectedClosing: number;
  variance: number;
};

export type PaymentBreakdown = {
  card: number;
  cash: number;
  qris: number;
  transfer: number;
};

export type DailyFinanceSource = {
  expenses: number;
  medicalIncome: number;
  payments: PaymentBreakdown;
  retailIncome: number;
};

export type DailyFinanceSummary = DailyFinanceSource & {
  net: number;
  totalIncome: number;
};

export type MonthlyFinanceSource = {
  medicalIncome: number;
  operatingExpenses: number;
  ownerDraw: number;
  retailIncome: number;
};

export type MonthlyFinanceSummary = MonthlyFinanceSource & {
  grossIncome: number;
  netProfit: number;
  retained: number;
};

function assertMoney(label: string, value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative whole-IDR safe integer.`);
  }
}

export function calculateCashReconciliation(
  source: CashReconciliationSource,
): CashReconciliation {
  assertMoney('Opening balance', source.openingBalance);
  assertMoney('Cash income', source.cashIncome);
  assertMoney('Cash expenses', source.cashExpenses);
  assertMoney('Actual closing balance', source.actualClosing);

  const expectedClosing = source.openingBalance + source.cashIncome - source.cashExpenses;
  if (!Number.isSafeInteger(expectedClosing) || expectedClosing < 0) {
    throw new Error('Expected closing balance must be a nonnegative whole-IDR safe integer.');
  }
  const variance = source.actualClosing - expectedClosing;
  if (!Number.isSafeInteger(variance)) {
    throw new Error('Cash variance must be a whole-IDR safe integer.');
  }

  return { ...source, expectedClosing, variance };
}

export function calculateDailySummary(source: DailyFinanceSource): DailyFinanceSummary {
  assertMoney('Medical income', source.medicalIncome);
  assertMoney('Retail income', source.retailIncome);
  assertMoney('Expenses', source.expenses);
  assertMoney('Cash payments', source.payments.cash);
  assertMoney('QRIS payments', source.payments.qris);
  assertMoney('Transfer payments', source.payments.transfer);
  assertMoney('Card payments', source.payments.card);

  const totalIncome = source.medicalIncome + source.retailIncome;
  const paymentTotal =
    source.payments.cash + source.payments.qris + source.payments.transfer + source.payments.card;
  if (paymentTotal !== totalIncome) {
    throw new Error(
      `Payment breakdown (${paymentTotal}) must equal total daily income (${totalIncome}).`,
    );
  }

  return {
    ...source,
    net: totalIncome - source.expenses,
    totalIncome,
  };
}

export function calculateMonthlySummary(source: MonthlyFinanceSource): MonthlyFinanceSummary {
  assertMoney('Medical income', source.medicalIncome);
  assertMoney('Retail income', source.retailIncome);
  assertMoney('Operating expenses', source.operatingExpenses);
  assertMoney('Owner draw', source.ownerDraw);

  const grossIncome = source.medicalIncome + source.retailIncome;
  const netProfit = grossIncome - source.operatingExpenses;

  return {
    ...source,
    grossIncome,
    netProfit,
    retained: netProfit - source.ownerDraw,
  };
}
