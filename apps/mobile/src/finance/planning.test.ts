import {
  calculateOwnerDrawPlan,
  summarizeFinanceMonths,
  applyLocalFinanceEntries,
} from './planning';
import { financeMockData } from './mockData';
import { calculateMonthlySummary } from './calculations';

describe('finance periods and hypothetical planner', () => {
  it('totals all six months and applies only matching local months without mutation', () => {
    const months = applyLocalFinanceEntries(financeMockData.months, [
      { date: '2026-03-01', kind: 'expense', amount: 100 },
      { date: '2026-07-31', kind: 'ownerDraw', amount: 200 },
      { date: '2026-08-22', kind: 'expense', amount: 300 },
      { date: '2026-02-28', kind: 'expense', amount: 999 },
      { date: '2026-09-01', kind: 'ownerDraw', amount: 999 },
    ]);
    expect(summarizeFinanceMonths(months)).toMatchObject({
      grossIncome: 776000000,
      operatingExpenses: 128900400,
      netProfit: 647099600,
      ownerDraw: 237000200,
      retained: 410099400,
    });
    expect(months[0]!.operatingExpenses).toBe(20000100);
    expect(months[4]!.ownerDraw).toBe(45000200);
    expect(months[5]!.operatingExpenses).toBe(12800300);
    expect(financeMockData.months[0]!.operatingExpenses).toBe(20000000);
  });

  it('projects from gross, subtracts operating expenses, and separates totals and averages', () => {
    expect(calculateOwnerDrawPlan(94500000, 12800000, 28, 1)).toEqual({
      projectedDraw: 26460000,
      projectedRetained: 55240000,
      averageMonthlyDraw: 26460000,
    });
    expect(calculateOwnerDrawPlan(776000000, 128900000, 28, 6)).toEqual({
      projectedDraw: 217280000,
      projectedRetained: 429820000,
      averageMonthlyDraw: 36213333,
    });
    expect(calculateOwnerDrawPlan(100, 100, 55, 1).projectedRetained).toBe(-55);
    expect(calculateOwnerDrawPlan(0, 0, 10, 6).projectedDraw).toBe(0);
  });

  it('rounds exact percentages at the safe integer boundary', () => {
    const max = Number.MAX_SAFE_INTEGER;
    expect(calculateOwnerDrawPlan(max, 0, 55, 1).projectedDraw).toBe(
      Number((BigInt(max) * BigInt(55) + BigInt(50)) / BigInt(100)),
    );
  });

  it('rejects unsafe aggregates, retained amounts, and invalid planner inputs', () => {
    const max = Number.MAX_SAFE_INTEGER;
    const base = { medicalIncome: max, retailIncome: 0, operatingExpenses: 0, ownerDraw: 0 };
    expect(() => summarizeFinanceMonths([base, base])).toThrow(/safe integer/);
    expect(() => calculateMonthlySummary({ ...base, retailIncome: 1 })).toThrow(/safe integer/);
    expect(() =>
      calculateMonthlySummary({ ...base, medicalIncome: 0, operatingExpenses: max, ownerDraw: 1 }),
    ).toThrow(/safe integer/);
    for (const percent of [9, 56, 28.5, NaN, Infinity]) {
      expect(() => calculateOwnerDrawPlan(100, 0, percent, 6)).toThrow();
    }
    expect(() => calculateOwnerDrawPlan(max + 1, 0, 28, 6)).toThrow();
    expect(() => calculateOwnerDrawPlan(0, max, 28, 0)).toThrow();
    expect(() => calculateOwnerDrawPlan(max, max, 28, 6)).not.toThrow();
    expect(() =>
      applyLocalFinanceEntries(financeMockData.months, [
        { date: '2026-03-01', kind: 'expense', amount: max },
      ]),
    ).toThrow(/safe integer/);
  });
});
