import { render, screen, userEvent } from '@testing-library/react-native';

import { MockInventoryForm } from '@/src/inventory/MockInventoryForm';
import { mockInventoryItems } from '@/src/inventory/mockData';

describe('MockInventoryForm', () => {
  it('requires an expiry value for medical items', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    await render(
      <MockInventoryForm
        initialItem={{ ...mockInventoryItems[0]!, expiryLabel: null }}
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await user.press(screen.getByRole('button', { name: 'Simpan item demo' }));

    expect(screen.getByText('Tanggal kedaluwarsa wajib untuk item medis.')).toBeOnTheScreen();
    expect(onSave).not.toHaveBeenCalled();
  });
});
