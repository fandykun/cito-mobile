import { render, screen, userEvent } from '@testing-library/react-native';

import { MockRecordsScreen } from '@/src/records/MockRecordsScreen';

describe('MockRecordsScreen', () => {
  it('renders clearly labeled synthetic patient fixtures', async () => {
    await render(<MockRecordsScreen />);

    expect(screen.getByText('Rekam Medis')).toBeOnTheScreen();
    expect(screen.getByText('Data demo')).toBeOnTheScreen();
    expect(screen.getByText('Milo Demo')).toBeOnTheScreen();
    expect(screen.getByText('Luna Demo')).toBeOnTheScreen();
    expect(screen.getByText('Biscuit Demo')).toBeOnTheScreen();
    expect(screen.getByText('Cleo Demo')).toBeOnTheScreen();
    expect(screen.getByText(/bukan rekam medis nyata/i)).toBeOnTheScreen();
    expect(screen.getByText(/belum disimpan dalam basis data terenkripsi/i)).toBeOnTheScreen();
  });

  it('searches by patient and owner name', async () => {
    const user = userEvent.setup();
    await render(<MockRecordsScreen />);

    await user.type(screen.getByPlaceholderText('Cari pasien atau pemilik…'), 'Marcus Demo');

    expect(screen.getByText('Luna Demo')).toBeOnTheScreen();
    expect(screen.queryByText('Milo Demo')).not.toBeOnTheScreen();
  });

  it('filters patients needing attention and expands the clinical summary', async () => {
    const user = userEvent.setup();
    await render(<MockRecordsScreen />);

    await user.press(screen.getByRole('button', { name: 'Tampilkan pasien perlu perhatian' }));
    expect(screen.getByText('Milo Demo')).toBeOnTheScreen();
    expect(screen.getByText('Biscuit Demo')).toBeOnTheScreen();
    expect(screen.queryByText('Luna Demo')).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Lihat detail Milo Demo' }));

    expect(screen.getByText('Alergi: Penisilin')).toBeOnTheScreen();
    expect(screen.getByText('Berat terkini')).toBeOnTheScreen();
    expect(screen.getAllByText('28,4 kg')).toHaveLength(2);
    expect(screen.getAllByText('Vaksinasi')).toHaveLength(2);
    expect(screen.getByText('DHPP')).toBeOnTheScreen();
    expect(screen.getByText('Jatuh tempo 3 Mei 2027')).toBeOnTheScreen();
    expect(screen.getByText('Riwayat kunjungan')).toBeOnTheScreen();
    expect(screen.getByText('Pemeriksaan tahunan')).toBeOnTheScreen();
    expect(screen.getByText('Sehat; karang gigi ringan.')).toBeOnTheScreen();
  });

  it('shows a truthful empty state and resets discovery controls', async () => {
    const user = userEvent.setup();
    await render(<MockRecordsScreen />);

    await user.type(screen.getByPlaceholderText('Cari pasien atau pemilik…'), 'Tidak Ada');
    expect(screen.getByText('Pasien tidak ditemukan')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Reset pencarian pasien' }));
    expect(screen.getByText('Milo Demo')).toBeOnTheScreen();
  });
});
