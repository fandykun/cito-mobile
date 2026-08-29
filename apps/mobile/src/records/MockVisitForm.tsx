import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/design/tokens';
import type { MockPatient, MockVisit } from '@/src/records/mockData';

interface MockVisitFormProps {
  initialVisit?: MockVisit;
  patient: MockPatient;
  onCancel: () => void;
  onSave: (visit: MockVisit) => void;
}

type VisitField = 'complaint' | 'dateLabel' | 'diagnosis' | 'observations' | 'treatment' | 'type';

const requiredFields: readonly { field: VisitField; message: string }[] = [
  { field: 'type', message: 'Jenis kunjungan wajib diisi.' },
  { field: 'dateLabel', message: 'Tanggal kunjungan wajib diisi.' },
  { field: 'complaint', message: 'Keluhan wajib diisi.' },
  { field: 'observations', message: 'Observasi wajib diisi.' },
  { field: 'diagnosis', message: 'Diagnosis wajib diisi.' },
  { field: 'treatment', message: 'Rencana terapi wajib diisi.' },
];

export function MockVisitForm({ initialVisit, patient, onCancel, onSave }: MockVisitFormProps) {
  const [complaint, setComplaint] = useState(initialVisit?.complaint ?? '');
  const [dateLabel, setDateLabel] = useState(initialVisit?.dateLabel ?? '');
  const [diagnosis, setDiagnosis] = useState(initialVisit?.diagnosis ?? '');
  const [error, setError] = useState<string | null>(null);
  const [medications, setMedications] = useState(initialVisit?.medications.join(', ') ?? '');
  const [observations, setObservations] = useState(initialVisit?.observations ?? '');
  const [treatment, setTreatment] = useState(initialVisit?.treatment ?? '');
  const [type, setType] = useState(initialVisit?.type ?? '');
  const [vetNotes, setVetNotes] = useState(initialVisit?.vetNotes ?? '');

  function submit(): void {
    const values: Record<VisitField, string> = {
      complaint: complaint.trim(),
      dateLabel: dateLabel.trim(),
      diagnosis: diagnosis.trim(),
      observations: observations.trim(),
      treatment: treatment.trim(),
      type: type.trim(),
    };
    const missing = requiredFields.find(({ field }) => !values[field]);
    if (missing) {
      setError(missing.message);
      return;
    }

    setError(null);
    onSave({
      ...values,
      medications: medications
        .split(',')
        .map((medication) => medication.trim())
        .filter(Boolean),
      vetNotes: vetNotes.trim(),
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
          <Text style={styles.heading}>{initialVisit ? 'Edit kunjungan' : 'Tambah kunjungan'}</Text>
          <Text style={styles.subtitle}>{patient.name}</Text>
        </View>
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>Demo</Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <Field
          accessibilityLabel="Jenis kunjungan"
          label="Jenis kunjungan"
          onChangeText={setType}
          placeholder="Contoh: Kontrol kesehatan"
          value={type}
        />
        <Field
          accessibilityLabel="Tanggal kunjungan"
          label="Tanggal kunjungan"
          onChangeText={setDateLabel}
          placeholder="Contoh: 21 Agu 2026"
          value={dateLabel}
        />
        <Field
          accessibilityLabel="Keluhan kunjungan"
          label="Keluhan"
          multiline
          onChangeText={setComplaint}
          placeholder="Alasan pasien dibawa ke klinik"
          value={complaint}
        />
        <Field
          accessibilityLabel="Observasi kunjungan"
          label="Observasi"
          multiline
          onChangeText={setObservations}
          placeholder="Temuan pemeriksaan"
          value={observations}
        />
        <Field
          accessibilityLabel="Diagnosis kunjungan"
          label="Diagnosis"
          multiline
          onChangeText={setDiagnosis}
          placeholder="Diagnosis klinis"
          value={diagnosis}
        />
        <Field
          accessibilityLabel="Rencana terapi kunjungan"
          label="Rencana terapi"
          multiline
          onChangeText={setTreatment}
          placeholder="Tindakan dan tindak lanjut"
          value={treatment}
        />
        <Field
          accessibilityLabel="Obat kunjungan"
          label="Obat demo (opsional, pisahkan dengan koma)"
          onChangeText={setMedications}
          placeholder="Contoh: Obat A, Obat B"
          value={medications}
        />
        <Field
          accessibilityLabel="Catatan dokter"
          label="Catatan dokter (opsional)"
          multiline
          onChangeText={setVetNotes}
          placeholder="Catatan tambahan"
          value={vetNotes}
        />

        {error ? (
          <Text accessibilityRole="alert" style={styles.errorText}>
            {error}
          </Text>
        ) : null}
      </View>

      <View style={styles.notice}>
        <Ionicons color="#9A3412" name="shield-checkmark-outline" size={19} />
        <Text style={styles.noticeText}>
          Draft klinis ini hanya mengubah memori layar. Tidak ada rekam medis terenkripsi, audit,
          pengurangan stok, perhitungan biaya, API, atau sinkronisasi yang dibuat.
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          accessibilityLabel="Batal kunjungan demo"
          accessibilityRole="button"
          onPress={onCancel}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
        >
          <Text style={styles.cancelButtonText}>Batal</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Simpan kunjungan demo"
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
  multiline = false,
  onChangeText,
  placeholder,
  value,
}: {
  accessibilityLabel: string;
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, multiline && styles.multilineInput]}
        textAlignVertical={multiline ? 'top' : 'center'}
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
  multilineInput: { minHeight: 88 },
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
  subtitle: { color: colors.mutedForeground, fontSize: typography.caption, marginTop: spacing.xsmall },
});
