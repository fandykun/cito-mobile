export type MockPatientSpecies = 'cat' | 'dog' | 'rabbit';
export type MockVaccinationStatus = 'current' | 'due-soon' | 'overdue';

export type MockWeightEntry = {
  dateLabel: string;
  kilograms: number;
};

export type MockVaccination = {
  administeredLabel: string;
  dueLabel: string;
  name: string;
  status: MockVaccinationStatus;
};

export type MockVisit = {
  complaint: string;
  dateLabel: string;
  diagnosis: string;
  medications: readonly string[];
  observations: string;
  treatment: string;
  type: string;
  vetNotes: string;
};

export type MockPatient = {
  allergies: readonly string[];
  birthDateLabel: string;
  breed: string;
  chronicConditions: readonly string[];
  id: string;
  name: string;
  owner: {
    name: string;
    phone: string;
  };
  species: MockPatientSpecies;
  vaccinations: readonly MockVaccination[];
  visits: readonly MockVisit[];
  weightHistory: readonly MockWeightEntry[];
};

export const mockPatients: readonly MockPatient[] = [
  {
    allergies: ['Penisilin'],
    birthDateLabel: '12 Mar 2019',
    breed: 'Labrador Retriever',
    chronicConditions: [],
    id: 'demo-patient-milo',
    name: 'Milo Demo',
    owner: { name: 'Sarah Demo', phone: '08xx-0000-1001' },
    species: 'dog',
    vaccinations: [
      {
        administeredLabel: '3 Mei 2026',
        dueLabel: '3 Mei 2027',
        name: 'DHPP',
        status: 'current',
      },
      {
        administeredLabel: '14 Agu 2025',
        dueLabel: '14 Agu 2026',
        name: 'Rabies',
        status: 'due-soon',
      },
    ],
    visits: [
      {
        complaint: 'Pemeriksaan kesehatan rutin.',
        dateLabel: '14 Agu 2026',
        diagnosis: 'Sehat; karang gigi ringan.',
        medications: ['Heartgard Plus — 1 dosis'],
        observations: 'Berat stabil, suhu dan denyut dalam batas normal.',
        treatment: 'Perawatan gigi rumahan dan kontrol enam bulan.',
        type: 'Pemeriksaan tahunan',
        vetNotes: 'Pantau kondisi geraham atas.',
      },
      {
        complaint: 'Booster vaksin terjadwal.',
        dateLabel: '3 Mei 2026',
        diagnosis: 'Layak vaksinasi.',
        medications: ['Vaksin DHPP — 1 dosis'],
        observations: 'Tidak ada demam atau reaksi alergi aktif.',
        treatment: 'Booster DHPP diberikan.',
        type: 'Vaksinasi',
        vetNotes: 'Tidak ada reaksi pascavaksin yang dilaporkan.',
      },
    ],
    weightHistory: [
      { dateLabel: '14 Agu 2026', kilograms: 28.4 },
      { dateLabel: '3 Mei 2026', kilograms: 28.1 },
    ],
  },
  {
    allergies: [],
    birthDateLabel: '25 Jul 2021',
    breed: 'Domestic Shorthair',
    chronicConditions: [],
    id: 'demo-patient-luna',
    name: 'Luna Demo',
    owner: { name: 'Marcus Demo', phone: '08xx-0000-1002' },
    species: 'cat',
    vaccinations: [
      {
        administeredLabel: '14 Jul 2026',
        dueLabel: '14 Jul 2027',
        name: 'FVRCP + Rabies',
        status: 'current',
      },
    ],
    visits: [
      {
        complaint: 'Pemeriksaan kesehatan rutin.',
        dateLabel: '30 Jul 2026',
        diagnosis: 'Penyakit gigi ringan grade 1.',
        medications: ['Revolution Plus — 1 dosis'],
        observations: 'Nafsu makan dan aktivitas normal.',
        treatment: 'Jadwalkan pembersihan gigi pada kontrol berikutnya.',
        type: 'Pemeriksaan tahunan',
        vetNotes: 'Pasien indoor dan sudah disterilkan.',
      },
    ],
    weightHistory: [{ dateLabel: '30 Jul 2026', kilograms: 3.9 }],
  },
  {
    allergies: [],
    birthDateLabel: '2 Nov 2023',
    breed: 'Holland Lop',
    chronicConditions: ['Rentan stasis gastrointestinal'],
    id: 'demo-patient-biscuit',
    name: 'Biscuit Demo',
    owner: { name: 'Priya Demo', phone: '08xx-0000-1003' },
    species: 'rabbit',
    vaccinations: [],
    visits: [
      {
        complaint: 'Tidak makan dan produksi feses menurun.',
        dateLabel: '20 Agu 2026',
        diagnosis: 'Stasis gastrointestinal ringan.',
        medications: ['Metoklopramid', 'Critical Care Herbivore'],
        observations: 'Motilitas usus menurun; hidrasi ringan.',
        treatment: 'Cairan, dukungan nutrisi, dan pemantauan di rumah.',
        type: 'Pemeriksaan stasis GI',
        vetNotes: 'Diet jerami harus tersedia tanpa batas.',
      },
    ],
    weightHistory: [{ dateLabel: '20 Agu 2026', kilograms: 1.8 }],
  },
  {
    allergies: [],
    birthDateLabel: '14 Feb 2020',
    breed: 'Siamese',
    chronicConditions: ['Hipertiroid'],
    id: 'demo-patient-cleo',
    name: 'Cleo Demo',
    owner: { name: 'Angela Demo', phone: '08xx-0000-1004' },
    species: 'cat',
    vaccinations: [
      {
        administeredLabel: '2 Agu 2025',
        dueLabel: '2 Agu 2026',
        name: 'FVRCP',
        status: 'overdue',
      },
    ],
    visits: [
      {
        complaint: 'Kontrol pengobatan hipertiroid.',
        dateLabel: '18 Agu 2026',
        diagnosis: 'Hipertiroid terkontrol dengan terapi.',
        medications: ['Methimazole 2,5 mg — 30 hari'],
        observations: 'Berat meningkat dan kadar T4 mendekati normal.',
        treatment: 'Lanjutkan dosis dan ulang pemeriksaan darah tiga bulan.',
        type: 'Kontrol tiroid',
        vetNotes: 'Pantau nafsu makan dan berat badan mingguan.',
      },
    ],
    weightHistory: [
      { dateLabel: '18 Agu 2026', kilograms: 4.2 },
      { dateLabel: '12 Mei 2026', kilograms: 3.8 },
    ],
  },
] as const;
