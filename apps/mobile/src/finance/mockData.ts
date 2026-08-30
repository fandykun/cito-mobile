import {
  calculateDailySummary,
  calculateMonthlySummary,
  type DailyFinanceSource,
  type MonthlyFinanceSource,
} from '@/src/finance/calculations';

export type MonthlyFinanceFixture = ReturnType<typeof calculateMonthlySummary> & {
  id: string;
  label: string;
};

const monthlySources: readonly (MonthlyFinanceSource & { id: string; label: string })[] = [
  {
    id: '2026-03',
    label: 'Mar',
    medicalIncome: 93_000_000,
    operatingExpenses: 20_000_000,
    ownerDraw: 37_500_000,
    retailIncome: 21_000_000,
  },
  {
    id: '2026-04',
    label: 'Apr',
    medicalIncome: 107_000_000,
    operatingExpenses: 22_000_000,
    ownerDraw: 37_500_000,
    retailIncome: 27_000_000,
  },
  {
    id: '2026-05',
    label: 'Mei',
    medicalIncome: 102_000_000,
    operatingExpenses: 21_500_000,
    ownerDraw: 42_000_000,
    retailIncome: 24_000_000,
  },
  {
    id: '2026-06',
    label: 'Jun',
    medicalIncome: 117_000_000,
    operatingExpenses: 25_200_000,
    ownerDraw: 42_000_000,
    retailIncome: 31_500_000,
  },
  {
    id: '2026-07',
    label: 'Jul',
    medicalIncome: 123_000_000,
    operatingExpenses: 27_400_000,
    ownerDraw: 45_000_000,
    retailIncome: 36_000_000,
  },
  {
    id: '2026-08',
    label: 'Agu',
    medicalIncome: 76_500_000,
    operatingExpenses: 12_800_000,
    ownerDraw: 33_000_000,
    retailIncome: 18_000_000,
  },
];

const dailySource: DailyFinanceSource = {
  expenses: 1_100_000,
  medicalIncome: 5_260_000,
  payments: {
    card: 500_000,
    cash: 3_100_000,
    qris: 2_200_000,
    transfer: 1_460_000,
  },
  retailIncome: 2_000_000,
};

export const financeMockData = {
  businessDateLabel: '22 Agustus 2026',
  businessTimezone: 'Asia/Jakarta',
  daily: calculateDailySummary(dailySource),
  monthLabel: 'Agustus 2026',
  months: monthlySources.map(
    ({ id, label, ...source }): MonthlyFinanceFixture => ({
      id,
      label,
      ...calculateMonthlySummary(source),
    }),
  ),
} as const;
