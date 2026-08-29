import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/design/tokens';
import type { MockInventoryItem } from '@/src/inventory/mockData';

export type MockStockAdjustmentReason = 'restock' | 'spoilage' | 'breakage' | 'correction';

export type MockStockAdjustmentValues = {
  delta: number;
  note: string;
  reason: MockStockAdjustmentReason;
  reasonLabel: string;
};

interface MockStockAdjustmentFormProps {
  item: MockInventoryItem;
  onCancel: () => void;
  onSave: (values: MockStockAdjustmentValues) => void;
}

const reasons: readonly {
  accessibilityLabel: string;
  id: MockStockAdjustmentReason;
  label: string;
}[] = [
  { accessibilityLabel: 'Pilih alasan stok ulang', id: 'restock', label: 'Stok ulang' },
  { accessibilityLabel: 'Pilih alasan barang rusak', id: 'breakage', label: 'Barang rusak' },
  { accessibilityLabel: 'Pilih alasan kedaluwarsa', id: 'spoilage', label: 'Kedaluwarsa' },
  { accessibilityLabel: 'Pilih alasan koreksi data', id: 'correction', label: 'Koreksi data' },
];

function positiveWholeNumber(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function MockStockAdjustmentForm({ item, onCancel, onSave }: MockStockAdjustmentFormProps) {
  const [direction, setDirection] = useState<'increase' | 'decrease'>('increase');
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState<MockStockAdjustmentReason | null>(null);

  const parsedQuantity = positiveWholeNumber(quantity);
  const projectedStock = useMemo(() => {
    if (parsedQuantity === null) {
      return item.stockQuantity;
    }
    return item.stockQuantity + (direction === 'increase' ? parsedQuantity : -parsedQuantity);
  }, [direction, item.stockQuantity, parsedQuantity]);

  function submit(): void {
    if (parsedQuantity === null) {
      setError('Jumlah harus berupa bilangan bulat lebih dari nol.');
      return;
    }
    if (!reason) {
      setError('Alasan penyesuaian wajib dipilih.');
      return;
    }
    if (projectedStock < 0) {
      setError('Stok hasil tidak boleh negatif.');
      return;
    }
    const selectedReason = reasons.find((candidate) => candidate.id === reason);
    if (!selectedReason) {
      setError('Alasan penyesuaian tidak valid.');
      return;
    }
    setError(null);
    onSave({
      delta: direction === 'increase' ? parsedQuantity : -parsedQuantity,
      note: note.trim(),
      reason,
      reasonLabel: selectedReason.label,
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Kembali ke detail inventaris demo"
          accessibilityRole="button"
          onPress={onCancel}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.foreground} name="arrow-back" size={20} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.heading}>Sesuaikan stok</Text>
          <Text style={styles.subtitle}>{item.name}</Text>
        </View>
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>Data demo</Text>
        </View>
      </View>

      <View style={styles.stockSummary}>
        <View>
          <Text style={styles.summaryLabel}>Stok saat ini</Text>
          <Text style={styles.summaryValue}>
            {item.stockQuantity} {item.unit}
          </Text>
        </View>
        <Ionicons color={colors.mutedForeground} name="arrow-forward" size={20} />
        <View style={styles.projectedGroup}>
          <Text style={styles.summaryLabel}>Setelah penyesuaian</Text>
          <Text style={[styles.summaryValue, projectedStock < 0 && styles.invalidValue]}>
            {projectedStock} {item.unit}
          </Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <View>
          <Text style={styles.fieldLabel}>Arah penyesuaian</Text>
          <View style={styles.segmentRow}>
            <DirectionButton
              accessibilityLabel="Pilih penambahan stok"
              active={direction === 'increase'}
              label="Tambah"
              onPress={() => setDirection('increase')}
            />
            <DirectionButton
              accessibilityLabel="Pilih pengurangan stok"
              active={direction === 'decrease'}
              label="Kurangi"
              onPress={() => setDirection('decrease')}
            />
          </View>
        </View>

        <View>
          <Text style={styles.fieldLabel}>Jumlah ({item.unit})</Text>
          <TextInput
            accessibilityLabel="Jumlah penyesuaian stok"
            keyboardType="number-pad"
            onChangeText={setQuantity}
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
            style={styles.input}
            value={quantity}
          />
        </View>

        <View>
          <Text style={styles.fieldLabel}>Alasan wajib</Text>
          <View style={styles.reasonGrid}>
            {reasons.map((option) => {
              const selected = reason === option.id;
              return (
                <Pressable
                  accessibilityLabel={option.accessibilityLabel}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={option.id}
                  onPress={() => setReason(option.id)}
                  style={[styles.reasonChip, selected && styles.reasonChipSelected]}
                >
                  <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Text style={styles.fieldLabel}>Catatan (opsional)</Text>
          <TextInput
            accessibilityLabel="Catatan penyesuaian stok"
            multiline
            onChangeText={setNote}
            placeholder="Tambahkan konteks singkat"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, styles.noteInput]}
            value={note}
          />
        </View>

        {error ? (
          <Text accessibilityRole="alert" style={styles.errorText}>
            {error}
          </Text>
        ) : null}
      </View>

      <View style={styles.notice}>
        <Ionicons color="#C2410C" name="information-circle-outline" size={19} />
        <Text style={styles.noticeText}>
          Penyesuaian ini hanya disimpan di memori layar untuk meninjau alur UI. Tidak ada audit API atau
          perubahan stok produksi.
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          accessibilityLabel="Batal penyesuaian stok demo"
          accessibilityRole="button"
          onPress={onCancel}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
        >
          <Text style={styles.cancelButtonText}>Batal</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Simpan penyesuaian stok demo"
          accessibilityRole="button"
          onPress={submit}
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
        >
          <Text style={styles.saveButtonText}>Terapkan lokal</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function DirectionButton({
  accessibilityLabel,
  active,
  label,
  onPress,
}: {
  accessibilityLabel: string;
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.segment, active && styles.segmentSelected]}
    >
      <Text style={[styles.segmentText, active && styles.segmentTextSelected]}>{label}</Text>
    </Pressable>
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
  invalidValue: { color: colors.destructive },
  noteInput: { minHeight: 84, textAlignVertical: 'top' },
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
  projectedGroup: { alignItems: 'flex-end' },
  reasonChip: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  reasonChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.small },
  reasonText: { color: colors.mutedForeground, fontSize: typography.caption, fontWeight: '700' },
  reasonTextSelected: { color: colors.primaryForeground },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.medium,
    flex: 1,
    padding: spacing.medium,
  },
  saveButtonText: { color: colors.primaryForeground, fontSize: typography.label, fontWeight: '700' },
  screen: { backgroundColor: colors.background, flex: 1 },
  segment: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    flex: 1,
    padding: spacing.medium,
  },
  segmentRow: { borderRadius: radii.medium, flexDirection: 'row', overflow: 'hidden' },
  segmentSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentText: { color: colors.mutedForeground, fontSize: typography.label, fontWeight: '700' },
  segmentTextSelected: { color: colors.primaryForeground },
  stockSummary: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.large,
  },
  subtitle: { color: colors.mutedForeground, fontSize: typography.caption, marginTop: spacing.xsmall },
  summaryLabel: { color: colors.mutedForeground, fontSize: typography.caption },
  summaryValue: {
    color: colors.foreground,
    fontSize: typography.heading,
    fontWeight: '800',
    marginTop: spacing.xsmall,
  },
});
