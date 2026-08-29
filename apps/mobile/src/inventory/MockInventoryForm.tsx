import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/design/tokens';
import type { MockInventoryCategory, MockInventoryItem } from '@/src/inventory/mockData';

export type MockInventoryFormValues = Omit<MockInventoryItem, 'id'>;

interface MockInventoryFormProps {
  initialItem?: MockInventoryItem;
  onCancel: () => void;
  onSave: (values: MockInventoryFormValues) => void;
}

function wholeNumber(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function MockInventoryForm({ initialItem, onCancel, onSave }: MockInventoryFormProps) {
  const [category, setCategory] = useState<MockInventoryCategory>(initialItem?.category ?? 'retail');
  const [categoryLabel, setCategoryLabel] = useState(initialItem?.categoryLabel ?? 'Ritel');
  const [costPrice, setCostPrice] = useState(initialItem ? String(initialItem.costPrice) : '');
  const [error, setError] = useState<string | null>(null);
  const [expiryLabel, setExpiryLabel] = useState(initialItem?.expiryLabel ?? '');
  const [lowStockThreshold, setLowStockThreshold] = useState(
    initialItem ? String(initialItem.lowStockThreshold) : '',
  );
  const [name, setName] = useState(initialItem?.name ?? '');
  const [sellingPrice, setSellingPrice] = useState(initialItem ? String(initialItem.sellingPrice) : '');
  const [stockQuantity, setStockQuantity] = useState(initialItem ? String(initialItem.stockQuantity) : '');
  const [supplier, setSupplier] = useState(initialItem?.supplier ?? '');
  const [unit, setUnit] = useState(initialItem?.unit ?? '');

  function submit(): void {
    const trimmedName = name.trim();
    const trimmedCategoryLabel = categoryLabel.trim();
    const trimmedUnit = unit.trim();
    const trimmedSupplier = supplier.trim();
    if (!trimmedName) {
      setError('Nama item wajib diisi.');
      return;
    }
    if (!trimmedCategoryLabel || !trimmedUnit) {
      setError('Kategori tampilan dan satuan wajib diisi.');
      return;
    }

    const parsedStock = wholeNumber(stockQuantity);
    const parsedThreshold = wholeNumber(lowStockThreshold);
    const parsedCost = wholeNumber(costPrice);
    const parsedSelling = wholeNumber(sellingPrice);
    if (parsedStock === null || parsedThreshold === null) {
      setError('Stok dan batas stok harus berupa bilangan bulat tidak negatif.');
      return;
    }
    if (parsedCost === null || parsedSelling === null) {
      setError('Harga harus berupa rupiah bulat tidak negatif.');
      return;
    }
    if (category === 'medical' && !expiryLabel.trim()) {
      setError('Tanggal kedaluwarsa wajib untuk item medis.');
      return;
    }

    setError(null);
    onSave({
      category,
      categoryLabel: trimmedCategoryLabel,
      costPrice: parsedCost,
      expiryLabel: expiryLabel.trim() || null,
      lowStockThreshold: parsedThreshold,
      name: trimmedName,
      sellingPrice: parsedSelling,
      stockQuantity: parsedStock,
      supplier: trimmedSupplier || 'Belum diisi',
      unit: trimmedUnit,
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Kembali ke inventaris demo"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onCancel}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.foreground} name="arrow-back" size={20} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.heading}>{initialItem ? 'Edit item' : 'Tambah item'}</Text>
          <Text style={styles.subtitle}>Perubahan lokal sementara</Text>
        </View>
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>Data demo</Text>
        </View>
      </View>

      <View style={styles.notice}>
        <Ionicons color="#C2410C" name="information-circle-outline" size={19} />
        <Text style={styles.noticeText}>
          Form ini tidak menulis ke API atau penyimpanan. Data akan hilang saat layar dimuat ulang.
        </Text>
      </View>

      <View style={styles.formCard}>
        <FormField accessibilityLabel="Nama item" label="Nama item" onChangeText={setName} value={name} />

        <View>
          <Text style={styles.fieldLabel}>Jenis inventaris</Text>
          <View style={styles.segmentRow}>
            {(['medical', 'retail'] as const).map((option) => {
              const selected = category === option;
              return (
                <Pressable
                  accessibilityLabel={option === 'medical' ? 'Pilih item medis' : 'Pilih item ritel'}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={option}
                  onPress={() => setCategory(option)}
                  style={[styles.segment, selected && styles.segmentSelected]}
                >
                  <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                    {option === 'medical' ? 'Medis' : 'Ritel'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.twoColumnRow}>
          <FormField
            accessibilityLabel="Kategori tampilan"
            containerStyle={styles.column}
            label="Kategori tampilan"
            onChangeText={setCategoryLabel}
            value={categoryLabel}
          />
          <FormField
            accessibilityLabel="Satuan item"
            containerStyle={styles.column}
            label="Satuan"
            onChangeText={setUnit}
            value={unit}
          />
        </View>

        <View style={styles.twoColumnRow}>
          <FormField
            accessibilityLabel="Stok awal"
            containerStyle={styles.column}
            keyboardType="number-pad"
            label="Stok"
            onChangeText={setStockQuantity}
            value={stockQuantity}
          />
          <FormField
            accessibilityLabel="Batas stok menipis"
            containerStyle={styles.column}
            keyboardType="number-pad"
            label="Batas menipis"
            onChangeText={setLowStockThreshold}
            value={lowStockThreshold}
          />
        </View>

        <View style={styles.twoColumnRow}>
          <FormField
            accessibilityLabel="Harga modal"
            containerStyle={styles.column}
            keyboardType="number-pad"
            label="Harga modal (Rp)"
            onChangeText={setCostPrice}
            value={costPrice}
          />
          <FormField
            accessibilityLabel="Harga jual"
            containerStyle={styles.column}
            keyboardType="number-pad"
            label="Harga jual (Rp)"
            onChangeText={setSellingPrice}
            value={sellingPrice}
          />
        </View>

        <FormField
          accessibilityLabel="Pemasok"
          label="Pemasok"
          onChangeText={setSupplier}
          value={supplier}
        />
        <FormField
          accessibilityLabel="Tanggal kedaluwarsa"
          label={category === 'medical' ? 'Kedaluwarsa (wajib)' : 'Kedaluwarsa (opsional)'}
          onChangeText={setExpiryLabel}
          placeholder="contoh: 18 Okt 2026"
          value={expiryLabel}
        />

        {error ? (
          <Text accessibilityRole="alert" style={styles.errorText}>
            {error}
          </Text>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        <Pressable
          accessibilityLabel="Batal edit item demo"
          accessibilityRole="button"
          onPress={onCancel}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
        >
          <Text style={styles.cancelButtonText}>Batal</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Simpan item demo"
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

function FormField({
  accessibilityLabel,
  containerStyle,
  keyboardType,
  label,
  onChangeText,
  placeholder,
  value,
}: {
  accessibilityLabel: string;
  containerStyle?: object;
  keyboardType?: 'default' | 'number-pad';
  label: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <View style={containerStyle}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCorrect={false}
        keyboardType={keyboardType}
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
  column: { flex: 1 },
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
  subtitle: { color: colors.mutedForeground, fontSize: typography.caption, marginTop: spacing.xsmall },
  twoColumnRow: { flexDirection: 'row', gap: spacing.medium },
});
