import { render, screen, userEvent } from '@testing-library/react-native';

import { MockInventoryScreen } from '@/src/inventory/MockInventoryScreen';

describe('MockInventoryScreen', () => {
  it('renders clearly labeled typed demo inventory', async () => {
    await render(<MockInventoryScreen />);

    expect(screen.getByText('Data demo')).toBeOnTheScreen();
    expect(screen.getByText('Amoxicillin 250mg')).toBeOnTheScreen();
    expect(screen.getByText('Royal Canin Adult 4kg')).toBeOnTheScreen();
    expect(screen.getByText(/belum terhubung ke penyimpanan/i)).toBeOnTheScreen();
  });

  it('searches inventory by name and category label', async () => {
    const user = userEvent.setup();
    await render(<MockInventoryScreen />);

    const search = screen.getByPlaceholderText('Cari item atau kategori…');
    await user.type(search, 'rabies');

    expect(screen.getByText('Vaksin Rabies 1 tahun')).toBeOnTheScreen();
    expect(screen.queryByText('Amoxicillin 250mg')).not.toBeOnTheScreen();

    await user.clear(search);
    await user.type(search, 'pakan');
    expect(screen.getByText('Royal Canin Adult 4kg')).toBeOnTheScreen();
    expect(screen.queryByText('Vaksin Rabies 1 tahun')).not.toBeOnTheScreen();
  });

  it('filters low stock and expands item details', async () => {
    const user = userEvent.setup();
    await render(<MockInventoryScreen />);

    await user.press(screen.getByRole('button', { name: 'Tampilkan stok menipis' }));
    expect(screen.getByText('Metacam 1,5 mg/ml')).toBeOnTheScreen();
    expect(screen.queryByText('Doxycycline 100mg')).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Lihat detail Metacam 1,5 mg/ml' }));
    expect(screen.getByText('Harga modal')).toBeOnTheScreen();
    expect(screen.getByText('Rp 180.000')).toBeOnTheScreen();
    expect(screen.getByText('Kedaluwarsa 18 Okt 2026')).toBeOnTheScreen();
  });

  it('shows an empty result without inventing additional records', async () => {
    const user = userEvent.setup();
    await render(<MockInventoryScreen />);

    await user.type(screen.getByPlaceholderText('Cari item atau kategori…'), 'tidak-ada');

    expect(screen.getByText('Item tidak ditemukan')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Reset filter inventaris' })).toBeOnTheScreen();
  });
});
