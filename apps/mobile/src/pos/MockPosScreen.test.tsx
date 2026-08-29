import { render, screen, userEvent } from '@testing-library/react-native';

import { MockPosScreen } from '@/src/pos/MockPosScreen';

describe('MockPosScreen', () => {
  it('renders a clearly labeled searchable synthetic catalog', async () => {
    await render(<MockPosScreen />);

    expect(screen.getByText('Kasir')).toBeOnTheScreen();
    expect(screen.getByText('Data demo')).toBeOnTheScreen();
    expect(screen.getByText('Amoxicillin 250mg')).toBeOnTheScreen();
    expect(screen.getByText('Royal Canin Adult 4kg')).toBeOnTheScreen();
    expect(screen.getByText(/tidak mengurangi stok nyata/i)).toBeOnTheScreen();
  });

  it('searches and filters products with truthful empty recovery', async () => {
    const user = userEvent.setup();
    await render(<MockPosScreen />);

    await user.type(screen.getByPlaceholderText('Cari produk…'), 'Royal Canin');
    expect(screen.getByText('Royal Canin Adult 4kg')).toBeOnTheScreen();
    expect(screen.queryByText('Amoxicillin 250mg')).not.toBeOnTheScreen();

    await user.clear(screen.getByPlaceholderText('Cari produk…'));
    await user.press(screen.getByRole('button', { name: 'Tampilkan produk ritel' }));
    expect(screen.getByText('Anti-Kutu Kucing (L)')).toBeOnTheScreen();
    expect(screen.queryByText('Amoxicillin 250mg')).not.toBeOnTheScreen();

    await user.type(screen.getByPlaceholderText('Cari produk…'), 'Tidak Ada');
    expect(screen.getByText('Produk tidak ditemukan')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Reset pencarian produk' }));
    expect(screen.getByText('Amoxicillin 250mg')).toBeOnTheScreen();
  });

  it('adds price snapshots, updates quantities, and calculates cart totals', async () => {
    const user = userEvent.setup();
    await render(<MockPosScreen />);

    await user.press(
      screen.getByRole('button', { name: 'Tambah Amoxicillin 250mg ke keranjang' }),
    );
    await user.press(
      screen.getByRole('button', { name: 'Tambah Amoxicillin 250mg ke keranjang' }),
    );

    expect(screen.getByText('Keranjang demo')).toBeOnTheScreen();
    expect(screen.getByText('2 × Rp 8.000')).toBeOnTheScreen();
    expect(screen.getByText('Total Rp 16.000')).toBeOnTheScreen();
    expect(screen.getByText('Modal tersimpan Rp 5.000')).toBeOnTheScreen();
    expect(screen.getByText('Laba kotor demo Rp 11.000')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Kurangi jumlah Amoxicillin 250mg' }));
    expect(screen.getByText('1 × Rp 8.000')).toBeOnTheScreen();
    expect(screen.getByText('Total Rp 8.000')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Hapus Amoxicillin 250mg dari keranjang' }));
    expect(screen.getByText('Keranjang masih kosong')).toBeOnTheScreen();
  });

  it('caps cart quantity at the synthetic reference stock', async () => {
    const user = userEvent.setup();
    await render(<MockPosScreen />);

    await user.press(screen.getByRole('button', { name: 'Tambah Metacam 1,5 mg/ml ke keranjang' }));

    expect(screen.getByRole('button', { name: 'Tambah jumlah Metacam 1,5 mg/ml' })).toBeDisabled();
    expect(screen.getByText('Batas stok demo tercapai')).toBeOnTheScreen();
  });
});
