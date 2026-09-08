import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { EditorScreen } from '@/src/components/EditorScreen';
import { colors, radii, spacing, typography } from '@/src/design/tokens';
import type { MockPatient, MockPatientSpecies } from '@/src/records/mockData';

export type MockPatientFormValues = {
  allergies: readonly string[];
  birthDateLabel: string;
  breed: string;
  chronicConditions: readonly string[];
  name: string;
  ownerName: string;
  ownerPhone: string;
  species: MockPatientSpecies;
  weightKilograms: number;
};

interface MockPatientFormProps {
  initialPatient?: MockPatient;
  onCancel: () => void;
  onSave: (values: MockPatientFormValues) => void;
}

const speciesOptions: readonly { id: MockPatientSpecies; label: string }[] = [
  { id: 'dog', label: 'Anjing' },
  { id: 'cat', label: 'Kucing' },
  { id: 'rabbit', label: 'Kelinci' },
];

function parseFlags(value: string): readonly string[] {
  return [...new Set(value.split(',').map((entry) => entry.trim()).filter(Boolean))];
}

function parseWeight(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 500 ? parsed : null;
}

export function MockPatientForm({ initialPatient, onCancel, onSave }: MockPatientFormProps) {
  const currentWeight = initialPatient?.weightHistory.at(0)?.kilograms;
  const [allergies, setAllergies] = useState(initialPatient?.allergies.join(', ') ?? '');
  const [birthDate, setBirthDate] = useState(initialPatient?.birthDateLabel ?? '');
  const [breed, setBreed] = useState(initialPatient?.breed ?? '');
  const [chronicConditions, setChronicConditions] = useState(
    initialPatient?.chronicConditions.join(', ') ?? '',
  );
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(initialPatient?.name ?? '');
  const [ownerName, setOwnerName] = useState(initialPatient?.owner.name ?? '');
  const [ownerPhone, setOwnerPhone] = useState(initialPatient?.owner.phone ?? '');
  const [species, setSpecies] = useState<MockPatientSpecies>(initialPatient?.species ?? 'dog');
  const [weight, setWeight] = useState(currentWeight === undefined ? '' : String(currentWeight));

  function submit(): void {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Nama pasien wajib diisi.');
      return;
    }
    const trimmedBreed = breed.trim();
    if (!trimmedBreed) {
      setError('Ras pasien wajib diisi.');
      return;
    }
    const trimmedBirthDate = birthDate.trim();
    if (!trimmedBirthDate) {
      setError('Tanggal lahir atau umur pasien wajib diisi.');
      return;
    }
    const trimmedOwnerName = ownerName.trim();
    if (!trimmedOwnerName) {
      setError('Nama pemilik wajib diisi.');
      return;
    }
    const trimmedOwnerPhone = ownerPhone.trim();
    if (!trimmedOwnerPhone) {
      setError('Nomor telepon pemilik wajib diisi.');
      return;
    }
    const parsedWeight = parseWeight(weight);
    if (parsedWeight === null) {
      setError('Berat harus lebih dari 0 dan tidak lebih dari 500 kg.');
      return;
    }

    setError(null);
    onSave({
      allergies: parseFlags(allergies),
      birthDateLabel: trimmedBirthDate,
      breed: trimmedBreed,
      chronicConditions: parseFlags(chronicConditions),
      name: trimmedName,
      ownerName: trimmedOwnerName,
      ownerPhone: trimmedOwnerPhone,
      species,
      weightKilograms: parsedWeight,
    });
  }

  return (
    <EditorScreen
      backLabel="Kembali ke daftar pasien demo"
      error={error}
      onCancel={onCancel}
      title={initialPatient ? `Edit: ${initialPatient.name}` : 'Tambah pasien'}
      footer={
        <View style={styles.actionRow}>
          <Pressable
            accessibilityLabel="Batal profil pasien demo"
            accessibilityRole="button"
            onPress={onCancel}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
          >
            <Text style={styles.cancelButtonText}>Batal</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Simpan profil pasien demo"
            accessibilityRole="button"
            onPress={submit}
            style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
          >
            <Text style={styles.saveButtonText}>Simpan lokal</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.formCard}>
        <Field
          accessibilityLabel="Nama pasien"
          label="Nama pasien"
          onChangeText={setName}
          placeholder="Contoh: Koda Demo"
          value={name}
        />

        <View>
          <Text style={styles.fieldLabel}>Spesies</Text>
          <View style={styles.speciesRow}>
            {speciesOptions.map((option) => {
              const selected = species === option.id;
              return (
                <Pressable
                  accessibilityLabel={`Pilih spesies ${option.label.toLocaleLowerCase('id-ID')}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={option.id}
                  onPress={() => setSpecies(option.id)}
                  style={[styles.speciesButton, selected && styles.speciesButtonSelected]}
                >
                  <Text style={[styles.speciesText, selected && styles.speciesTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Field
          accessibilityLabel="Ras pasien"
          label="Ras"
          onChangeText={setBreed}
          placeholder="Ras atau campuran"
          value={breed}
        />
        <Field
          accessibilityLabel="Tanggal lahir pasien"
          label="Tanggal lahir atau umur"
          onChangeText={setBirthDate}
          placeholder="Contoh: 4 Apr 2024"
          value={birthDate}
        />
        <Field
          accessibilityLabel="Berat pasien"
          keyboardType="decimal-pad"
          label="Berat terkini (kg)"
          onChangeText={setWeight}
          placeholder="0,0"
          value={weight}
        />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Pemilik</Text>
        <Field
          accessibilityLabel="Nama pemilik"
          label="Nama pemilik"
          onChangeText={setOwnerName}
          placeholder="Nama pemilik sintetis"
          value={ownerName}
        />
        <Field
          accessibilityLabel="Nomor telepon pemilik"
          keyboardType="phone-pad"
          label="Nomor telepon"
          onChangeText={setOwnerPhone}
          placeholder="08xx-0000-0000"
          value={ownerPhone}
        />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Penanda kesehatan</Text>
        <Text style={styles.cardDescription}>Pisahkan beberapa nilai dengan koma.</Text>
        <Field
          accessibilityLabel="Alergi pasien"
          label="Alergi"
          onChangeText={setAllergies}
          placeholder="Kosongkan jika tidak ada"
          value={allergies}
        />
        <Field
          accessibilityLabel="Kondisi kronis pasien"
          label="Kondisi kronis"
          onChangeText={setChronicConditions}
          placeholder="Kosongkan jika tidak ada"
          value={chronicConditions}
        />
      </View>

      <View style={styles.notice}>
        <Ionicons color="#9A3412" name="information-circle-outline" size={19} />
        <Text style={styles.noticeText}>
          Simpan hanya memperbarui memori layar. Tidak ada data medis nyata, penyimpanan terenkripsi,
          pencatatan audit, API, atau sinkronisasi.
        </Text>
      </View>
    </EditorScreen>
  );
}

function Field({
  accessibilityLabel,
  keyboardType,
  label,
  onChangeText,
  placeholder,
  value,
}: {
  accessibilityLabel: string;
  keyboardType?: 'decimal-pad' | 'phone-pad';
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        {...(keyboardType ? { keyboardType } : {})}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: { flexDirection: 'row', gap: spacing.medium },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.medium,
    borderWidth: 1,
    flex: 1,
    padding: spacing.medium,
  },
  cancelButtonText: { color: colors.foreground, fontSize: typography.label, fontWeight: '700' },
  cardDescription: { color: colors.mutedForeground, fontSize: typography.caption, marginTop: -spacing.small },
  cardTitle: { color: colors.foreground, fontSize: typography.body, fontWeight: '800' },
  fieldLabel: {
    color: colors.mutedForeground,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: spacing.xsmall,
  },
  formCard: { gap: spacing.xlarge },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.medium,
    borderWidth: 1,
    color: colors.foreground,
    fontSize: typography.body,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.medium,
  },
  notice: {
    alignItems: 'flex-start',
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: radii.large,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.small,
    padding: spacing.medium,
  },
  noticeText: { color: '#9A3412', flex: 1, fontSize: typography.caption, lineHeight: 18 },
  pressed: { opacity: 0.65 },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.medium,
    flex: 1,
    padding: spacing.medium,
  },
  saveButtonText: { color: colors.primaryForeground, fontSize: typography.label, fontWeight: '700' },
  speciesButton: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.medium,
    borderWidth: 1,
    flex: 1,
    paddingVertical: spacing.small,
  },
  speciesButtonSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  speciesRow: { flexDirection: 'row', gap: spacing.small },
  speciesText: { color: colors.mutedForeground, fontSize: typography.caption, fontWeight: '700' },
  speciesTextSelected: { color: colors.primaryForeground },
});
