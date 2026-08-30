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

  it('adds expenses and owner draws as separate local records and recomputes the month', async () => {
    const user = userEvent.setup();
    await render(<MockFinanceScreen />);

    await user.press(screen.getByRole('button', { name: 'Catat beban operasional demo' }));
    await user.type(screen.getByLabelText('Jumlah entri keuangan'), '500000');
    await user.press(screen.getByRole('button', { name: 'Pilih kategori utilitas' }));
    await user.type(screen.getByLabelText('Catatan entri keuangan'), 'Tagihan listrik');
    await user.press(screen.getByRole('button', { name: 'Simpan beban demo' }));

    expect(screen.getByText('Rp 13.300.000')).toBeOnTheScreen();
    expect(screen.getByText('Rp 81.200.000')).toBeOnTheScreen();
    expect(screen.getByText('Utilitas · 22 Agu 2026')).toBeOnTheScreen();
    expect(screen.getByText('Tagihan listrik')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Catat pengambilan pemilik demo' }));
    await user.type(screen.getByLabelText('Jumlah entri keuangan'), '2000000');
    await user.type(screen.getByLabelText('Catatan entri keuangan'), 'Pengambilan Agustus');
    await user.press(screen.getByRole('button', { name: 'Simpan pengambilan pemilik demo' }));

    expect(screen.getByText('Rp 13.300.000')).toBeOnTheScreen();
    expect(screen.getByText('Rp 35.000.000')).toBeOnTheScreen();
    expect(screen.getByText('Rp 46.200.000')).toBeOnTheScreen();
    expect(screen.getByText('Pengambilan pemilik · 22 Agu 2026')).toBeOnTheScreen();
    expect(screen.getByText('Pengambilan Agustus')).toBeOnTheScreen();
    expect(screen.getByText(/hanya disimpan di memori layar/i)).toBeOnTheScreen();
  });

  it('saves and presents a local cash-drawer reconciliation', async () => {
    const user = userEvent.setup();
    await render(<MockFinanceScreen />);

    await user.press(screen.getByRole('button', { name: 'Tampilkan ringkasan hari ini' }));
    await user.press(screen.getByRole('button', { name: 'Rekonsiliasi kas demo' }));
    await user.type(screen.getByLabelText('Saldo pembukaan kas'), '2000000');
    await user.type(screen.getByLabelText('Saldo penutupan kas aktual'), '3950000');
    await user.press(screen.getByRole('button', { name: 'Simpan rekonsiliasi kas demo' }));

    expect(screen.getByText('Rekonsiliasi kas')).toBeOnTheScreen();
    expect(screen.getByText('Kas kurang')).toBeOnTheScreen();
    expect(screen.getByText('Pembukaan Rp 2.000.000')).toBeOnTheScreen();
    expect(screen.getByText('Perkiraan Rp 4.000.000')).toBeOnTheScreen();
    expect(screen.getByText('Aktual Rp 3.950.000')).toBeOnTheScreen();
    expect(screen.getByText('Selisih −Rp 50.000')).toBeOnTheScreen();
    expect(screen.getByText(/asumsi demo: seluruh beban harian/i)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Edit rekonsiliasi kas demo' }));
    expect(screen.getByLabelText('Saldo pembukaan kas')).toHaveProp('value', '2000000');
    expect(screen.getByLabelText('Saldo penutupan kas aktual')).toHaveProp('value', '3950000');
    await user.press(screen.getByRole('button', { name: 'Batal rekonsiliasi kas demo' }));
    expect(screen.getByText('Kas kurang')).toBeOnTheScreen();
  });
});
