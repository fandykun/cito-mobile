import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/design/tokens';
import type { MockPatient, MockVaccination, MockVaccinationStatus } from '@/src/records/mockData';

interface MockVaccinationFormProps {
  patient: MockPatient;
  onCancel: () => void;
  onSave: (vaccination: MockVaccination) => void;
}

const statuses: readonly {
  accessibilityLabel: string;
  id: MockVaccinationStatus;
  label: string;
}[] = [
  { accessibilityLabel: 'Pilih status aktif', id: 'current', label: 'Aktif' },
  {
    accessibilityLabel: 'Pilih status segera jatuh tempo',
    id: 'due-soon',
    label: 'Segera jatuh tempo',
  },
  { accessibilityLabel: 'Pilih status terlambat', id: 'overdue', label: 'Terlambat' },
];

export function MockVaccinationForm({ patient, onCancel, onSave }: MockVaccinationFormProps) {
  const [administeredLabel, setAdministeredLabel] = useState('');
  const [dueLabel, setDueLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<MockVaccinationStatus>('current');

  function submit(): void {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Nama vaksin wajib diisi.');
      return;
    }
    const trimmedAdministered = administeredLabel.trim();
    if (!trimmedAdministered) {
      setError('Tanggal vaksin diberikan wajib diisi.');
      return;
    }
    const trimmedDue = dueLabel.trim();
    if (!trimmedDue) {
      setError('Tanggal vaksin berikutnya wajib diisi.');
      return;
    }

    setError(null);
    onSave({
      administeredLabel: trimmedAdministered,
      dueLabel: trimmedDue,
      name: trimmedName,
      status,
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Kembali ke detail pasien demo"
          accessibilityRole="button"
          onPress={onCancel}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.foreground} name="arrow-back" size={20} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.heading}>Tambah vaksinasi</Text>
          <Text style={styles.subtitle}>{patient.name}</Text>
        </View>
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>Demo</Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <Field
          accessibilityLabel="Nama vaksin"
          label="Nama vaksin"
          onChangeText={setName}
          placeholder="Contoh: Rabies"
          value={name}
        />
        <Field
          accessibilityLabel="Tanggal vaksin diberikan"
          label="Tanggal diberikan"
          onChangeText={setAdministeredLabel}
          placeholder="Contoh: 20 Agu 2026"
          value={administeredLabel}
        />
        <Field
          accessibilityLabel="Tanggal vaksin berikutnya"
          label="Tanggal berikutnya"
          onChangeText={setDueLabel}
          placeholder="Contoh: 20 Agu 2027"
          value={dueLabel}
        />

        <View>
          <Text style={styles.fieldLabel}>Status pengingat</Text>
          <View style={styles.statusGrid}>
            {statuses.map((option) => {
              const selected = status === option.id;
              return (
                <Pressable
                  accessibilityLabel={option.accessibilityLabel}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={option.id}
                  onPress={() => setStatus(option.id)}
                  style={[styles.statusButton, selected && styles.statusButtonSelected]}
                >
                  <Text style={[styles.statusText, selected && styles.statusTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {error ? (
          <Text accessibilityRole="alert" style={styles.errorText}>
            {error}
          </Text>
        ) : null}
      </View>

      <View style={styles.notice}>
        <Ionicons color="#9A3412" name="information-circle-outline" size={19} />
        <Text style={styles.noticeText}>
          Status dipilih manual untuk mockup. Simpan hanya memperbarui memori layar dan tidak membuat
          rekam medis, pengingat perangkat, audit, API, atau sinkronisasi.
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          accessibilityLabel="Batal vaksinasi demo"
          accessibilityRole="button"
          onPress={onCancel}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
        >
          <Text style={styles.cancelButtonText}>Batal</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Simpan vaksinasi demo"
          accessibilityRole="button"
          onPress={submit}
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
        >
          <Text style={styles.saveButtonText}>Simpan lokal</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Field({
  accessibilityLabel,
  label,
  onChangeText,
  placeholder,
  value,
}: {
  accessibilityLabel: string;
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
  backButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.medium,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
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
  content: { gap: spacing.large, padding: spacing.xlarge, paddingBottom: spacing.xxlarge },
  demoBadge: {
    backgroundColor: '#E6F7F5',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  demoBadgeText: { color: '#0F766E', fontSize: typography.caption, fontWeight: '700' },
  errorText: { color: colors.destructive, fontSize: typography.caption, fontWeight: '700' },
  fieldLabel: {
    color: colors.foreground,
    fontSize: typography.caption,
    fontWeight: '700',
    marginBottom: spacing.xsmall,
  },
  formCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    gap: spacing.large,
    padding: spacing.large,
  },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.medium },
  headerText: { flex: 1 },
  heading: { color: colors.foreground, fontSize: typography.heading, fontWeight: '800' },
  input: {
    backgroundColor: colors.background,
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
  screen: { backgroundColor: colors.background, flex: 1 },
  statusButton: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  statusButtonSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.small },
  statusText: { color: colors.mutedForeground, fontSize: typography.caption, fontWeight: '700' },
  statusTextSelected: { color: colors.primaryForeground },
  subtitle: { color: colors.mutedForeground, fontSize: typography.caption, marginTop: spacing.xsmall },
});
