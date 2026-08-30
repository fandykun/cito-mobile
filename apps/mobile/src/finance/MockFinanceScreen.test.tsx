import { render, screen, userEvent } from '@testing-library/react-native';

import { MockFinanceScreen } from '@/src/finance/MockFinanceScreen';

describe('MockFinanceScreen', () => {
  it('shows a clearly labeled monthly financial picture with owner draw separated', async () => {
    await render(<MockFinanceScreen />);

    expect(screen.getByText('Keuangan')).toBeOnTheScreen();
    expect(screen.getByText('Data demo')).toBeOnTheScreen();
    expect(screen.getByText('Ringkasan Agustus 2026')).toBeOnTheScreen();
    expect(screen.getByText('Pendapatan kotor')).toBeOnTheScreen();
    expect(screen.getByText('Rp 94.500.000')).toBeOnTheScreen();
    expect(screen.getByText('Beban operasional')).toBeOnTheScreen();
    expect(screen.getByText('Rp 12.800.000')).toBeOnTheScreen();
    expect(screen.getByText('Laba bersih')).toBeOnTheScreen();
    expect(screen.getByText('Rp 81.700.000')).toBeOnTheScreen();
    expect(screen.getByText('Pengambilan pemilik')).toBeOnTheScreen();
    expect(screen.getByText('Rp 33.000.000')).toBeOnTheScreen();
    expect(screen.getByText('Ditahan di klinik')).toBeOnTheScreen();
    expect(screen.getByText('Rp 48.700.000')).toBeOnTheScreen();
    expect(screen.getByText(/bukan beban operasional/i)).toBeOnTheScreen();
    expect(screen.getByText('Tren 6 bulan')).toBeOnTheScreen();
  });

  it('switches to a daily summary with income and payment breakdowns', async () => {
    const user = userEvent.setup();
    await render(<MockFinanceScreen />);

    await user.press(screen.getByRole('button', { name: 'Tampilkan ringkasan hari ini' }));

    expect(screen.getByText('Ringkasan 22 Agustus 2026')).toBeOnTheScreen();
    expect(screen.getByText('Total pendapatan')).toBeOnTheScreen();
    expect(screen.getByText('Rp 7.260.000')).toBeOnTheScreen();
    expect(screen.getByText('Beban hari ini')).toBeOnTheScreen();
    expect(screen.getByText('Rp 1.100.000')).toBeOnTheScreen();
    expect(screen.getByText('Net hari ini')).toBeOnTheScreen();
    expect(screen.getByText('Rp 6.160.000')).toBeOnTheScreen();
    expect(screen.getByText('Pembayaran')).toBeOnTheScreen();
    expect(screen.getByText('Tunai')).toBeOnTheScreen();
    expect(screen.getByText('Rp 3.100.000')).toBeOnTheScreen();
    expect(screen.getByText('QRIS')).toBeOnTheScreen();
    expect(screen.getByText('Rp 2.200.000')).toBeOnTheScreen();
    expect(screen.getByText('Transfer')).toBeOnTheScreen();
    expect(screen.getByText('Rp 1.460.000')).toBeOnTheScreen();
    expect(screen.getByText('Kartu')).toBeOnTheScreen();
    expect(screen.getByText('Rp 500.000')).toBeOnTheScreen();
  });
});
