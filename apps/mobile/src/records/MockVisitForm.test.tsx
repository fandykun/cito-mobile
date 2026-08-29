import { render, screen, userEvent } from '@testing-library/react-native';

import { MockVisitForm } from '@/src/records/MockVisitForm';
import { mockPatients } from '@/src/records/mockData';

describe('MockVisitForm', () => {
  it('requires the visit date after the visit type', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    await render(<MockVisitForm patient={mockPatients[0]!} onCancel={jest.fn()} onSave={onSave} />);

    await user.type(screen.getByLabelText('Jenis kunjungan'), 'Kontrol');
    await user.press(screen.getByRole('button', { name: 'Simpan kunjungan demo' }));

    expect(screen.getByText('Tanggal kunjungan wajib diisi.')).toBeOnTheScreen();
    expect(onSave).not.toHaveBeenCalled();
  });
});
