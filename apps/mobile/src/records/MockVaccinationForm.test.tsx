import { render, screen, userEvent } from '@testing-library/react-native';

import { MockVaccinationForm } from '@/src/records/MockVaccinationForm';
import { mockPatients } from '@/src/records/mockData';

describe('MockVaccinationForm', () => {
  it('requires the next due date', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    await render(
      <MockVaccinationForm patient={mockPatients[0]!} onCancel={jest.fn()} onSave={onSave} />,
    );

    await user.type(screen.getByLabelText('Nama vaksin'), 'Bordetella');
    await user.type(screen.getByLabelText('Tanggal vaksin diberikan'), '20 Agu 2026');
    await user.press(screen.getByRole('button', { name: 'Simpan vaksinasi demo' }));

    expect(screen.getByText('Tanggal vaksin berikutnya wajib diisi.')).toBeOnTheScreen();
    expect(onSave).not.toHaveBeenCalled();
  });
});
