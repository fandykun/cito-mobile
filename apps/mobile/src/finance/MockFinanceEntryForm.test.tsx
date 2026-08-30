import { render, screen, userEvent } from '@testing-library/react-native';

import {
  MockFinanceEntryForm,
  type MockFinanceEntryValues,
} from '@/src/finance/MockFinanceEntryForm';

describe('MockFinanceEntryForm', () => {
  it('validates and saves an expense with a required category', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn<void, [MockFinanceEntryValues]>();
    await render(<MockFinanceEntryForm mode="expense" onCancel={jest.fn()} onSave={onSave} />);

    await user.press(screen.getByRole('button', { name: 'Simpan beban demo' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Jumlah harus berupa rupiah bulat lebih dari nol.');

    await user.type(screen.getByLabelText('Jumlah entri keuangan'), '500000');
    await user.clear(screen.getByLabelText('Tanggal entri keuangan'));
    await user.type(screen.getByLabelText('Tanggal entri keuangan'), '2026-02-30');
    await user.press(screen.getByRole('button', { name: 'Simpan beban demo' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Tanggal wajib menggunakan format YYYY-MM-DD yang valid.',
    );

    await user.clear(screen.getByLabelText('Tanggal entri keuangan'));
    await user.type(screen.getByLabelText('Tanggal entri keuangan'), '2026-08-22');
    await user.press(screen.getByRole('button', { name: 'Simpan beban demo' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Kategori beban wajib dipilih.');

    await user.press(screen.getByRole('button', { name: 'Pilih kategori utilitas' }));
    await user.type(screen.getByLabelText('Catatan entri keuangan'), 'Tagihan listrik');
    await user.press(screen.getByRole('button', { name: 'Simpan beban demo' }));

    expect(onSave).toHaveBeenCalledWith({
      amount: 500_000,
      category: 'utilities',
      categoryLabel: 'Utilitas',
      date: '2026-08-22',
      kind: 'expense',
      note: 'Tagihan listrik',
    });
  });

  it('saves an owner draw without treating it as an expense category', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn<void, [MockFinanceEntryValues]>();
    await render(<MockFinanceEntryForm mode="ownerDraw" onCancel={jest.fn()} onSave={onSave} />);

    expect(screen.getByText('Catat pengambilan pemilik')).toBeOnTheScreen();
    expect(screen.queryByText('Kategori beban')).not.toBeOnTheScreen();
    await user.type(screen.getByLabelText('Jumlah entri keuangan'), '2000000');
    await user.type(screen.getByLabelText('Catatan entri keuangan'), 'Pengambilan Agustus');
    await user.press(screen.getByRole('button', { name: 'Simpan pengambilan pemilik demo' }));

    expect(onSave).toHaveBeenCalledWith({
      amount: 2_000_000,
      date: '2026-08-22',
      kind: 'ownerDraw',
      note: 'Pengambilan Agustus',
    });
  });
});
