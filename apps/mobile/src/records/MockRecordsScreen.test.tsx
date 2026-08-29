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

  it('validates and adds a synthetic patient in local state', async () => {
    const user = userEvent.setup();
    await render(<MockRecordsScreen />);

    await user.press(screen.getByRole('button', { name: 'Tambah pasien demo' }));
    expect(screen.getByText('Tambah pasien')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Simpan profil pasien demo' }));
    expect(screen.getByText('Nama pasien wajib diisi.')).toBeOnTheScreen();

    await user.type(screen.getByLabelText('Nama pasien'), 'Koda Demo');
    await user.type(screen.getByLabelText('Ras pasien'), 'Mixed Breed');
    await user.type(screen.getByLabelText('Tanggal lahir pasien'), '4 Apr 2024');
    await user.type(screen.getByLabelText('Nama pemilik'), 'Nadia Demo');
    await user.type(screen.getByLabelText('Nomor telepon pemilik'), '08xx-0000-2001');
    await user.type(screen.getByLabelText('Berat pasien'), '12.5');
    await user.type(screen.getByLabelText('Alergi pasien'), 'Ayam');
    await user.press(screen.getByRole('button', { name: 'Simpan profil pasien demo' }));

    expect(screen.getByText('Koda Demo')).toBeOnTheScreen();
    expect(screen.getByText(/Nadia Demo/)).toBeOnTheScreen();
    expect(screen.getAllByText('12,5 kg')).toHaveLength(2);
    expect(screen.getByText('Alergi: Ayam')).toBeOnTheScreen();
  });

  it('edits profile and weight history in local state', async () => {
    const user = userEvent.setup();
    await render(<MockRecordsScreen />);

    await user.press(screen.getByRole('button', { name: 'Lihat detail Milo Demo' }));
    await user.press(screen.getByRole('button', { name: 'Edit profil Milo Demo' }));
    expect(screen.getByText('Edit pasien')).toBeOnTheScreen();

    await user.clear(screen.getByLabelText('Nama pasien'));
    await user.type(screen.getByLabelText('Nama pasien'), 'Milo Demo Updated');
    await user.clear(screen.getByLabelText('Berat pasien'));
    await user.type(screen.getByLabelText('Berat pasien'), '29');
    await user.clear(screen.getByLabelText('Alergi pasien'));
    await user.type(screen.getByLabelText('Alergi pasien'), 'Penisilin, Debu');
    await user.press(screen.getByRole('button', { name: 'Simpan profil pasien demo' }));

    expect(screen.getByText('Milo Demo Updated')).toBeOnTheScreen();
    expect(screen.getAllByText('29,0 kg')).toHaveLength(2);
    expect(screen.getByText('Entri demo terbaru · 29,0 kg')).toBeOnTheScreen();
    expect(screen.getByText('14 Agu 2026 · 28,4 kg')).toBeOnTheScreen();
    expect(screen.getByText('Alergi: Penisilin, Debu')).toBeOnTheScreen();
    expect(screen.queryByText('Milo Demo')).not.toBeOnTheScreen();
  });

  it('validates and adds a vaccination to the local patient timeline', async () => {
    const user = userEvent.setup();
    await render(<MockRecordsScreen />);

    await user.press(screen.getByRole('button', { name: 'Lihat detail Luna Demo' }));
    await user.press(screen.getByRole('button', { name: 'Tambah vaksinasi Luna Demo' }));
    expect(screen.getByText('Tambah vaksinasi')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Simpan vaksinasi demo' }));
    expect(screen.getByText('Nama vaksin wajib diisi.')).toBeOnTheScreen();

    await user.type(screen.getByLabelText('Nama vaksin'), 'FeLV');
    await user.type(screen.getByLabelText('Tanggal vaksin diberikan'), '20 Agu 2026');
    await user.type(screen.getByLabelText('Tanggal vaksin berikutnya'), '20 Agu 2027');
    await user.press(screen.getByRole('button', { name: 'Pilih status segera jatuh tempo' }));
    await user.press(screen.getByRole('button', { name: 'Simpan vaksinasi demo' }));

    expect(screen.getByText('FeLV')).toBeOnTheScreen();
    expect(screen.getByText('Diberikan 20 Agu 2026')).toBeOnTheScreen();
    expect(screen.getByText('Jatuh tempo 20 Agu 2027')).toBeOnTheScreen();
    expect(screen.getByText('Segera jatuh tempo')).toBeOnTheScreen();
  });

  it('creates and edits a structured visit in local state', async () => {
    const user = userEvent.setup();
    await render(<MockRecordsScreen />);

    await user.press(screen.getByRole('button', { name: 'Lihat detail Luna Demo' }));
    await user.press(screen.getByRole('button', { name: 'Tambah kunjungan Luna Demo' }));
    expect(screen.getByText('Tambah kunjungan')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Simpan kunjungan demo' }));
    expect(screen.getByText('Jenis kunjungan wajib diisi.')).toBeOnTheScreen();

    await user.type(screen.getByLabelText('Jenis kunjungan'), 'Kontrol kulit');
    await user.type(screen.getByLabelText('Tanggal kunjungan'), '21 Agu 2026');
    await user.type(screen.getByLabelText('Keluhan kunjungan'), 'Gatal ringan.');
    await user.type(screen.getByLabelText('Observasi kunjungan'), 'Kulit sedikit kemerahan.');
    await user.type(screen.getByLabelText('Diagnosis kunjungan'), 'Dermatitis ringan.');
    await user.type(screen.getByLabelText('Rencana terapi kunjungan'), 'Sampo medikasi dua kali seminggu.');
    await user.type(screen.getByLabelText('Obat kunjungan'), 'Sampo demo, Omega 3 demo');
    await user.type(screen.getByLabelText('Catatan dokter'), 'Evaluasi ulang dalam dua minggu.');
    await user.press(screen.getByRole('button', { name: 'Simpan kunjungan demo' }));

    expect(screen.getByText('Kontrol kulit')).toBeOnTheScreen();
    expect(screen.getByText('21 Agu 2026')).toBeOnTheScreen();
    expect(screen.getByText('Dermatitis ringan.')).toBeOnTheScreen();
    expect(screen.getByText('Sampo demo')).toBeOnTheScreen();
    expect(screen.getByText('Omega 3 demo')).toBeOnTheScreen();
    expect(screen.getByText('Evaluasi ulang dalam dua minggu.')).toBeOnTheScreen();

    await user.press(
      screen.getByRole('button', { name: 'Edit kunjungan Kontrol kulit 21 Agu 2026' }),
    );
    expect(screen.getByText('Edit kunjungan')).toBeOnTheScreen();
    await user.clear(screen.getByLabelText('Diagnosis kunjungan'));
    await user.type(screen.getByLabelText('Diagnosis kunjungan'), 'Dermatitis membaik.');
    await user.press(screen.getByRole('button', { name: 'Simpan kunjungan demo' }));

    expect(screen.getByText('Dermatitis membaik.')).toBeOnTheScreen();
    expect(screen.queryByText('Dermatitis ringan.')).not.toBeOnTheScreen();
  });
});
