import { render, screen } from '@testing-library/react-native';

import DashboardScreen from '../../app/(tabs)';
import { dashboardMockData } from './mockData';
import { financeMockData } from '@/src/finance/mockData';

describe('DashboardScreen', () => {
  it('renders the UI-first dashboard with clearly labeled mock data', async () => {
    await render(<DashboardScreen />);

    expect(screen.getByText('Selamat pagi, drh. Rivera')).toBeOnTheScreen();
    expect(screen.getByText('Data demo')).toBeOnTheScreen();
    expect(screen.getByText('Rp 7,3 jt')).toBeOnTheScreen();
    expect(screen.getByText('Rp 48,7 jt')).toBeOnTheScreen();
    expect(screen.getByText('Ditahan di Klinik (Agu)')).toBeOnTheScreen();
    expect(screen.getByText('laba bersih − pengambilan pemilik')).toBeOnTheScreen();
    expect(screen.queryByText('Net Klinik (Agu)')).not.toBeOnTheScreen();
    expect(screen.queryByText('+12%')).not.toBeOnTheScreen();
    expect(screen.getByText('22 AGUSTUS 2026')).toBeOnTheScreen();
    expect(screen.getByText('Pengambilan Pribadi — Agu')).toBeOnTheScreen();
    expect(screen.getByText('Amoxicillin 250mg')).toBeOnTheScreen();
    expect(screen.getByText('Metacam 1,5 mg/ml')).toBeOnTheScreen();
  });

  it('uses the same baseline amounts as Finance without confusing retained funds and profit', () => {
    const month = financeMockData.months.at(-1)!;
    expect(dashboardMockData.metrics[0]!.value).toBe(financeMockData.daily.totalIncome);
    expect(dashboardMockData.metrics[1]!.value).toBe(month.retained);
    expect(dashboardMockData.metrics[1]!.value).toBe(month.netProfit - month.ownerDraw);
    expect(dashboardMockData.metrics[1]!.value).not.toBe(month.grossIncome - month.ownerDraw);
    expect(dashboardMockData.ownerDraw).toEqual({
      grossIncome: month.grossIncome,
      month: month.label,
      value: month.ownerDraw,
    });
    expect(dashboardMockData.displayDate).toBe(financeMockData.businessDateLabel.toLocaleUpperCase('id-ID'));
  });

  it('keeps every dashboard action navigable and excludes appointment UI', async () => {
    await render(<DashboardScreen />);

    expect(screen.getByRole('link', { name: /buka inventaris/i })).toHaveStyle({
      borderWidth: 1,
      flexDirection: 'row',
    });
    expect(screen.getByRole('link', { name: /buka rekam medis/i })).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: /buka kasir/i })).toBeOnTheScreen();
    expect(screen.queryByText(/jadwal hari ini/i)).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeOnTheScreen();
  });
});
