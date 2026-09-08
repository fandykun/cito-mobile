import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

import { EditorScreen } from '@/src/components/EditorScreen';
import { colors, radii, spacing, typography } from '@/src/design/tokens';
import { mockInventoryItems } from '@/src/inventory/mockData';
import type { MockPatient, MockVisit, MockVisitItem } from '@/src/records/mockData';

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

const medicalInventory = mockInventoryItems.filter((item) => item.category === 'medical');
const idrFormatter = new Intl.NumberFormat('id-ID');

function formatCurrency(amount: number): string {
  return `Rp ${idrFormatter.format(amount)}`;
}

export function MockVisitForm({ initialVisit, patient, onCancel, onSave }: MockVisitFormProps) {
  const [complaint, setComplaint] = useState(initialVisit?.complaint ?? '');
  const [dateLabel, setDateLabel] = useState(initialVisit?.dateLabel ?? '');
  const [diagnosis, setDiagnosis] = useState(initialVisit?.diagnosis ?? '');
  const [error, setError] = useState<string | null>(null);
  const [medications, setMedications] = useState(initialVisit?.medications.join(', ') ?? '');
  const [observations, setObservations] = useState(initialVisit?.observations ?? '');
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialVisit?.items.map((item) => [item.inventoryItemId, item.quantity]) ?? []),
  );
  const [serviceFee, setServiceFee] = useState(String(initialVisit?.serviceFee ?? 0));
  const [treatment, setTreatment] = useState(initialVisit?.treatment ?? '');
  const [type, setType] = useState(initialVisit?.type ?? '');
  const [vetNotes, setVetNotes] = useState(initialVisit?.vetNotes ?? '');

  const selectedItems = useMemo<MockVisitItem[]>(() => {
    const previousItems = new Map(
      initialVisit?.items.map((item) => [item.inventoryItemId, item] as const) ?? [],
    );
    return medicalInventory.flatMap((inventoryItem) => {
      const quantity = selectedQuantities[inventoryItem.id] ?? 0;
      if (quantity <= 0) {
        return [];
      }
      const previous = previousItems.get(inventoryItem.id);
      return [
        {
          costPriceAtTime: previous?.costPriceAtTime ?? inventoryItem.costPrice,
          inventoryItemId: inventoryItem.id,
          name: previous?.name ?? inventoryItem.name,
          quantity,
          sellingPriceAtTime: previous?.sellingPriceAtTime ?? inventoryItem.sellingPrice,
          unit: previous?.unit ?? inventoryItem.unit,
        },
      ];
    });
  }, [initialVisit?.items, selectedQuantities]);

  const parsedServiceFee = Number(serviceFee);
  const validServiceFee =
    serviceFee.trim().length > 0 && Number.isSafeInteger(parsedServiceFee) && parsedServiceFee >= 0;
  const itemIncome = selectedItems.reduce(
    (total, item) => total + item.sellingPriceAtTime * item.quantity,
    0,
  );
  const itemCost = selectedItems.reduce(
    (total, item) => total + item.costPriceAtTime * item.quantity,
    0,
  );
  const visitIncome = (validServiceFee ? parsedServiceFee : 0) + itemIncome;
  const visitProfit = visitIncome - itemCost;

  function adjustQuantity(inventoryItemId: string, change: 1 | -1): void {
    const inventoryItem = medicalInventory.find((item) => item.id === inventoryItemId);
    if (!inventoryItem) {
      return;
    }
    setSelectedQuantities((current) => {
      const nextQuantity = Math.min(
        inventoryItem.stockQuantity,
        Math.max(0, (current[inventoryItemId] ?? 0) + change),
      );
      return { ...current, [inventoryItemId]: nextQuantity };
    });
  }

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
    if (!validServiceFee) {
      setError('Biaya jasa harus berupa rupiah bulat nol atau lebih.');
      return;
    }

    setError(null);
    onSave({
      ...values,
      items: selectedItems,
      medications: medications
        .split(',')
        .map((medication) => medication.trim())
        .filter(Boolean),
      serviceFee: parsedServiceFee,
      vetNotes: vetNotes.trim(),
    });
  }

  return (
    <EditorScreen
      backLabel="Kembali ke detail pasien demo"
      error={error}
      onCancel={onCancel}
      title={initialVisit ? `Edit kunjungan — ${patient.name}` : `Tambah kunjungan — ${patient.name}`}
      footer={
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
      }
    >
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
          accessibilityLabel="Biaya jasa kunjungan"
          keyboardType="number-pad"
          label="Biaya jasa demo (Rp)"
          onChangeText={setServiceFee}
          placeholder="0"
          value={serviceFee}
        />

        <View>
          <Text style={styles.fieldLabel}>Item inventaris demo</Text>
          <Text style={styles.helperText}>
            Harga modal dan jual disalin sebagai snapshot. Kuantitas stok di layar Inventaris tidak berubah.
          </Text>
          <View style={styles.inventoryList}>
            {medicalInventory.map((item) => {
              const quantity = selectedQuantities[item.id] ?? 0;
              return (
                <View key={item.id} style={styles.inventoryCard}>
                  <View style={styles.inventoryIdentity}>
                    <Text style={styles.inventoryName}>{item.name}</Text>
                    <Text style={styles.inventoryMeta}>
                      {formatCurrency(item.sellingPrice)} / {item.unit} · stok referensi {item.stockQuantity}
                    </Text>
                  </View>
                  <View style={styles.quantityControls}>
                    <Pressable
                      accessibilityLabel={`Kurangi ${item.name} dari kunjungan`}
                      accessibilityRole="button"
                      disabled={quantity === 0}
                      onPress={() => adjustQuantity(item.id, -1)}
                      style={[styles.quantityButton, quantity === 0 && styles.quantityButtonDisabled]}
                    >
                      <Ionicons color={colors.foreground} name="remove" size={15} />
                    </Pressable>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <Pressable
                      accessibilityLabel={`Tambah ${item.name} ke kunjungan`}
                      accessibilityRole="button"
                      disabled={quantity >= item.stockQuantity}
                      onPress={() => adjustQuantity(item.id, 1)}
                      style={[
                        styles.quantityButton,
                        quantity >= item.stockQuantity && styles.quantityButtonDisabled,
                      ]}
                    >
                      <Ionicons color={colors.foreground} name="add" size={15} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.financialPreview}>
          <Text style={styles.previewTitle}>Ringkasan harga demo</Text>
          <PreviewRow label="Biaya jasa" value={formatCurrency(validServiceFee ? parsedServiceFee : 0)} />
          <PreviewRow label="Penjualan item" value={formatCurrency(itemIncome)} />
          <PreviewRow label="Modal item" value={formatCurrency(itemCost)} />
          <PreviewRow emphasize label="Pendapatan" value={formatCurrency(visitIncome)} />
          <PreviewRow emphasize label="Laba kotor" value={formatCurrency(visitProfit)} />
        </View>

        <Field
          accessibilityLabel="Obat kunjungan"
          label="Catatan obat bebas (opsional, pisahkan dengan koma)"
          onChangeText={setMedications}
          placeholder="Contoh: Obat di luar inventaris demo"
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
      </View>

      <View style={styles.notice}>
        <Ionicons color="#9A3412" name="shield-checkmark-outline" size={19} />
        <Text style={styles.noticeText}>
          Draft ini hanya mengubah memori layar. Snapshot dan angka finansial hanya pratinjau; tidak ada
          rekam medis terenkripsi, audit, pengurangan stok, transaksi keuangan, API, atau sinkronisasi.
        </Text>
      </View>
    </EditorScreen>
  );
}

function Field({
  accessibilityLabel,
  keyboardType = 'default',
  label,
  multiline = false,
  onChangeText,
  placeholder,
  value,
}: {
  accessibilityLabel: string;
  keyboardType?: KeyboardTypeOptions;
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
        keyboardType={keyboardType}
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

function PreviewRow({
  emphasize = false,
  label,
  value,
}: {
  emphasize?: boolean;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.previewRow}>
      <Text style={[styles.previewLabel, emphasize && styles.previewEmphasized]}>{label}</Text>
      <Text style={[styles.previewValue, emphasize && styles.previewEmphasized]}>{value}</Text>
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
  fieldLabel: {
    color: colors.mutedForeground,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: spacing.xsmall,
  },
  financialPreview: {
    backgroundColor: '#E6F7F5',
    borderColor: '#99E2DB',
    borderRadius: radii.large,
    borderWidth: 1,
    gap: spacing.small,
    padding: spacing.medium,
  },
  formCard: { gap: spacing.xlarge },
  helperText: { color: colors.mutedForeground, fontSize: typography.caption, lineHeight: 18 },
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
  inventoryCard: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.small,
    padding: spacing.small,
  },
  inventoryIdentity: { flex: 1 },
  inventoryList: { gap: spacing.small, marginTop: spacing.small },
  inventoryMeta: { color: colors.mutedForeground, fontSize: 11, marginTop: 2 },
  inventoryName: { color: colors.foreground, fontSize: typography.caption, fontWeight: '700' },
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
  previewEmphasized: { color: '#0F766E', fontWeight: '800' },
  previewLabel: { color: colors.mutedForeground, fontSize: typography.caption },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  previewTitle: { color: '#0F766E', fontSize: typography.label, fontWeight: '800' },
  previewValue: { color: colors.foreground, fontSize: typography.caption, fontWeight: '700' },
  quantityButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.medium,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  quantityButtonDisabled: { opacity: 0.35 },
  quantityControls: { alignItems: 'center', flexDirection: 'row', gap: spacing.small },
  quantityText: { color: colors.foreground, fontSize: typography.caption, fontWeight: '800', minWidth: 18, textAlign: 'center' },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.medium,
    flex: 1,
    padding: spacing.medium,
  },
  saveButtonText: { color: colors.primaryForeground, fontSize: typography.label, fontWeight: '700' },
});
