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

  it('validates and adds a non-persistent demo item', async () => {
    const user = userEvent.setup();
    await render(<MockInventoryScreen />);

    await user.press(screen.getByRole('button', { name: 'Tambah item demo' }));
    expect(screen.getByText('Tambah item')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Simpan item demo' }));
    expect(screen.getByText('Nama item wajib diisi.')).toBeOnTheScreen();

    await user.type(screen.getByLabelText('Nama item'), 'Vitamin Kucing Demo');
    await user.clear(screen.getByLabelText('Kategori tampilan'));
    await user.type(screen.getByLabelText('Kategori tampilan'), 'Suplemen');
    await user.type(screen.getByLabelText('Satuan item'), 'btl');
    await user.type(screen.getByLabelText('Stok awal'), '6');
    await user.type(screen.getByLabelText('Batas stok menipis'), '3');
    await user.type(screen.getByLabelText('Harga modal'), '45000');
    await user.type(screen.getByLabelText('Harga jual'), '90000');
    await user.type(screen.getByLabelText('Pemasok'), 'Demo Supplier');
    await user.press(screen.getByRole('button', { name: 'Simpan item demo' }));

    expect(screen.getByText('Vitamin Kucing Demo')).toBeOnTheScreen();
    expect(screen.getByText('Rp 90.000/btl')).toBeOnTheScreen();
  });

  it('edits an existing item in local draft state', async () => {
    const user = userEvent.setup();
    await render(<MockInventoryScreen />);

    await user.press(screen.getByRole('button', { name: 'Lihat detail Amoxicillin 250mg' }));
    await user.press(screen.getByRole('button', { name: 'Edit Amoxicillin 250mg' }));
    expect(screen.getByText('Edit item')).toBeOnTheScreen();

    await user.clear(screen.getByLabelText('Nama item'));
    await user.type(screen.getByLabelText('Nama item'), 'Amoxicillin 500mg Demo');
    await user.press(screen.getByRole('button', { name: 'Simpan item demo' }));

    expect(screen.getByText('Amoxicillin 500mg Demo')).toBeOnTheScreen();
    expect(screen.queryByText('Amoxicillin 250mg')).not.toBeOnTheScreen();
  });

  it('requires a reason and records a local stock adjustment', async () => {
    const user = userEvent.setup();
    await render(<MockInventoryScreen />);

    await user.press(screen.getByRole('button', { name: 'Lihat detail Amoxicillin 250mg' }));
    await user.press(screen.getByRole('button', { name: 'Sesuaikan stok Amoxicillin 250mg' }));
    expect(screen.getByText('Sesuaikan stok')).toBeOnTheScreen();

    await user.type(screen.getByLabelText('Jumlah penyesuaian stok'), '5');
    await user.press(screen.getByRole('button', { name: 'Simpan penyesuaian stok demo' }));
    expect(screen.getByText('Alasan penyesuaian wajib dipilih.')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Pilih alasan stok ulang' }));
    await user.press(screen.getByRole('button', { name: 'Simpan penyesuaian stok demo' }));

    expect(screen.getByText('13 tab')).toBeOnTheScreen();
    expect(screen.getByText('Stok ulang · +5 tab')).toBeOnTheScreen();
  });
});
