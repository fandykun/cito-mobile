import { render, screen } from '@testing-library/react-native';

import DashboardScreen from '../../app/(tabs)';

describe('DashboardScreen', () => {
  it('renders the UI-first dashboard with clearly labeled mock data', async () => {
    await render(<DashboardScreen />);

    expect(screen.getByText('Selamat pagi, drh. Rivera')).toBeOnTheScreen();
    expect(screen.getByText('Data demo')).toBeOnTheScreen();
    expect(screen.getByText('Rp 7,3 jt')).toBeOnTheScreen();
    expect(screen.getByText('Rp 61,5 jt')).toBeOnTheScreen();
    expect(screen.getByText('Pengambilan Pribadi — Agu')).toBeOnTheScreen();
    expect(screen.getByText('Amoxicillin 250mg')).toBeOnTheScreen();
    expect(screen.getByText('Metacam 1,5 mg/ml')).toBeOnTheScreen();
  });

  it('keeps every dashboard action navigable and excludes appointment UI', async () => {
    await render(<DashboardScreen />);

    expect(screen.getByRole('link', { name: /buka inventaris/i })).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: /buka rekam medis/i })).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: /buka kasir/i })).toBeOnTheScreen();
    expect(screen.queryByText(/jadwal hari ini/i)).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeOnTheScreen();
  });
});
