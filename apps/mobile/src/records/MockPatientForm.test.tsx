import { render, screen, userEvent } from '@testing-library/react-native';

import { MockPatientForm } from '@/src/records/MockPatientForm';
import { mockPatients } from '@/src/records/mockData';

describe('MockPatientForm', () => {
  it('rejects an invalid patient weight', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    await render(
      <MockPatientForm
        initialPatient={mockPatients[0]!}
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await user.clear(screen.getByLabelText('Berat pasien'));
    await user.type(screen.getByLabelText('Berat pasien'), '0');
    await user.press(screen.getByRole('button', { name: 'Simpan profil pasien demo' }));

    expect(screen.getByText('Berat harus lebih dari 0 dan tidak lebih dari 500 kg.')).toBeOnTheScreen();
    expect(onSave).not.toHaveBeenCalled();
  });
});
