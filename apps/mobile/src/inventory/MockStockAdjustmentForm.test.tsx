import { render, screen, userEvent } from '@testing-library/react-native';

import { MockStockAdjustmentForm } from '@/src/inventory/MockStockAdjustmentForm';
import { mockInventoryItems } from '@/src/inventory/mockData';

describe('MockStockAdjustmentForm', () => {
  it('rejects a decrease that would make stock negative', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    await render(
      <MockStockAdjustmentForm
        item={mockInventoryItems[2]!}
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await user.press(screen.getByRole('button', { name: 'Pilih pengurangan stok' }));
    await user.type(screen.getByLabelText('Jumlah penyesuaian stok'), '2');
    await user.press(screen.getByRole('button', { name: 'Pilih alasan barang rusak' }));
    await user.press(screen.getByRole('button', { name: 'Simpan penyesuaian stok demo' }));

    expect(screen.getByText('Stok hasil tidak boleh negatif.')).toBeOnTheScreen();
    expect(onSave).not.toHaveBeenCalled();
  });
});
