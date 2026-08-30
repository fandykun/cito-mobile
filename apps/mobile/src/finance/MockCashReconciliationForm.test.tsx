import { render, screen, userEvent } from '@testing-library/react-native';

import {
  MockCashReconciliationForm,
  type MockCashReconciliationValues,
} from '@/src/finance/MockCashReconciliationForm';

describe('MockCashReconciliationForm', () => {
  it('validates balances and previews expected cash and variance', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn<void, [MockCashReconciliationValues]>();
    await render(
      <MockCashReconciliationForm
        cashExpenses={1_100_000}
        cashIncome={3_100_000}
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await user.press(screen.getByRole('button', { name: 'Simpan rekonsiliasi kas demo' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Saldo pembukaan harus berupa rupiah bulat nol atau lebih.',
    );

    await user.type(screen.getByLabelText('Saldo pembukaan kas'), '2000000');
    await user.press(screen.getByRole('button', { name: 'Simpan rekonsiliasi kas demo' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Saldo aktual harus berupa rupiah bulat nol atau lebih.',
    );

    await user.type(screen.getByLabelText('Saldo penutupan kas aktual'), '3950000');
    expect(screen.getByText('Perkiraan tutup Rp 4.000.000')).toBeOnTheScreen();
    expect(screen.getByText('Selisih −Rp 50.000')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Simpan rekonsiliasi kas demo' }));

    expect(onSave).toHaveBeenCalledWith({
      actualClosing: 3_950_000,
      cashExpenses: 1_100_000,
      cashIncome: 3_100_000,
      expectedClosing: 4_000_000,
      openingBalance: 2_000_000,
      variance: -50_000,
    });
  });
});
