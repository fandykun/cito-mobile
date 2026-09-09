import {
  calculateMonthlySummary,
  type MonthlyFinanceSource,
  type MonthlyFinanceSummary,
} from './calculations';

export type OwnerDrawPlan = {
  projectedDraw: number;
  projectedRetained: number;
  averageMonthlyDraw: number;
};

export type LocalFinanceEntry = { date: string; kind: 'expense' | 'ownerDraw'; amount: number };

function safeMoney(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('Money must be a nonnegative whole-IDR safe integer.');
  }
  return value;
}

/** Apply session entries once, to their own business month, without changing fixtures. */
export function applyLocalFinanceEntries<T extends MonthlyFinanceSource & { id: string }>(
  months: readonly T[],
  entries: readonly LocalFinanceEntry[],
): (T & MonthlyFinanceSummary)[] {
  return months.map((month) => {
    let operatingExpenses = safeMoney(month.operatingExpenses);
    let ownerDraw = safeMoney(month.ownerDraw);
    for (const entry of entries) {
      if (entry.date.slice(0, 7) !== month.id) continue;
      const amount = safeMoney(entry.amount);
      if (entry.kind === 'expense') operatingExpenses = safeMoney(operatingExpenses + amount);
      else ownerDraw = safeMoney(ownerDraw + amount);
    }
    return { ...month, ...calculateMonthlySummary({ ...month, operatingExpenses, ownerDraw }) };
  });
}

export function summarizeFinanceMonths(
  months: readonly MonthlyFinanceSource[],
): MonthlyFinanceSummary {
  const total: MonthlyFinanceSource = {
    medicalIncome: 0,
    retailIncome: 0,
    operatingExpenses: 0,
    ownerDraw: 0,
  };
  for (const month of months) {
    for (const key of [
      'medicalIncome',
      'retailIncome',
      'operatingExpenses',
      'ownerDraw',
    ] as const) {
      total[key] = safeMoney(total[key] + safeMoney(month[key]));
    }
  }
  return calculateMonthlySummary(total);
}

/** Hypothetical replacement scenario, never an actual draw or a persistence payload. */
export function calculateOwnerDrawPlan(
  grossIncome: number,
  operatingExpenses: number,
  percent: number,
  monthCount: number,
): OwnerDrawPlan {
  safeMoney(grossIncome);
  safeMoney(operatingExpenses);
  if (!Number.isInteger(percent) || percent < 10 || percent > 55) {
    throw new Error('Draw percentage must be an integer from 10 to 55.');
  }
  if (monthCount !== 1 && monthCount !== 6)
    throw new Error('Plan period must be one or six months.');
  // Exact integer rounding avoids unsafe intermediate gross * percent multiplication.
  const projectedDraw = Number((BigInt(grossIncome) * BigInt(percent) + BigInt(50)) / BigInt(100));
  const projectedRetained = grossIncome - operatingExpenses - projectedDraw;
  if (!Number.isSafeInteger(projectedRetained))
    throw new Error('Retained must be a whole-IDR safe integer.');
  const divisor = BigInt(monthCount);
  const averageMonthlyDraw = Number((BigInt(projectedDraw) + divisor / BigInt(2)) / divisor);
  return { projectedDraw, projectedRetained, averageMonthlyDraw };
}
