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

  it('rejects a negative service fee', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    await render(
      <MockVisitForm
        initialVisit={mockPatients[0]!.visits[0]!}
        patient={mockPatients[0]!}
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await user.clear(screen.getByLabelText('Biaya jasa kunjungan'));
    await user.type(screen.getByLabelText('Biaya jasa kunjungan'), '-1');
    await user.press(screen.getByRole('button', { name: 'Simpan kunjungan demo' }));

    expect(screen.getByText('Biaya jasa harus berupa rupiah bulat nol atau lebih.')).toBeOnTheScreen();
    expect(onSave).not.toHaveBeenCalled();
  });
});
