import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/design/tokens';

export type MockExpenseCategory = 'equipment' | 'misc' | 'rent' | 'restock' | 'utilities';

export type MockExpenseEntryValues = {
  amount: number;
  category: MockExpenseCategory;
  categoryLabel: string;
  date: string;
  kind: 'expense';
  note: string;
};

export type MockOwnerDrawEntryValues = {
  amount: number;
  date: string;
  kind: 'ownerDraw';
  note: string;
};

export type MockFinanceEntryValues = MockExpenseEntryValues | MockOwnerDrawEntryValues;

const expenseCategories: readonly {
  accessibilityLabel: string;
  id: MockExpenseCategory;
  label: string;
}[] = [
  { accessibilityLabel: 'Pilih kategori stok ulang', id: 'restock', label: 'Stok ulang' },
  { accessibilityLabel: 'Pilih kategori utilitas', id: 'utilities', label: 'Utilitas' },
  { accessibilityLabel: 'Pilih kategori sewa', id: 'rent', label: 'Sewa' },
  { accessibilityLabel: 'Pilih kategori peralatan', id: 'equipment', label: 'Peralatan' },
  { accessibilityLabel: 'Pilih kategori lain-lain', id: 'misc', label: 'Lain-lain' },
];

function parsePositiveMoney(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function MockFinanceEntryForm({
  mode,
  onCancel,
  onSave,
}: {
  mode: 'expense' | 'ownerDraw';
  onCancel: () => void;
  onSave: (values: MockFinanceEntryValues) => void;
}) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<MockExpenseCategory | null>(null);
  const [date, setDate] = useState('2026-08-22');
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const isExpense = mode === 'expense';

  function submit(): void {
    const parsedAmount = parsePositiveMoney(amount);
    if (parsedAmount === null) {
      setError('Jumlah harus berupa rupiah bulat lebih dari nol.');
      return;
    }
    if (!isValidIsoDate(date)) {
      setError('Tanggal wajib menggunakan format YYYY-MM-DD yang valid.');
      return;
    }
    if (isExpense && !category) {
      setError('Kategori beban wajib dipilih.');
      return;
    }

    setError(null);
    if (isExpense) {
      const selectedCategory = expenseCategories.find((option) => option.id === category);
      if (!selectedCategory) {
        setError('Kategori beban tidak valid.');
        return;
      }
      onSave({
        amount: parsedAmount,
        category: selectedCategory.id,
        categoryLabel: selectedCategory.label,
        date,
        kind: 'expense',
        note: note.trim(),
      });
      return;
    }

    onSave({ amount: parsedAmount, date, kind: 'ownerDraw', note: note.trim() });
  }

  const title = isExpense ? 'Catat beban operasional' : 'Catat pengambilan pemilik';

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Kembali ke ringkasan keuangan demo"
          accessibilityRole="button"
          onPress={onCancel}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.foreground} name="arrow-back" size={20} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.heading}>{title}</Text>
          <Text style={styles.subtitle}>Entri lokal · Asia/Jakarta</Text>
        </View>
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>Data demo</Text>
        </View>
      </View>

      <View style={[styles.kindCard, !isExpense && styles.ownerDrawCard]}>
        <Ionicons
          color={isExpense ? colors.destructive : '#C2410C'}
          name={isExpense ? 'receipt-outline' : 'wallet-outline'}
          size={22}
        />
        <View style={styles.kindText}>
          <Text style={styles.kindTitle}>{isExpense ? 'Beban klinik' : 'Dana pribadi pemilik'}</Text>
          <Text style={styles.kindDescription}>
            {isExpense
              ? 'Mengurangi laba bersih sebagai biaya operasional.'
              : 'Dikurangkan setelah laba bersih dan tidak masuk beban operasional.'}
          </Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <View>
          <Text style={styles.fieldLabel}>Tanggal bisnis</Text>
          <TextInput
            accessibilityLabel="Tanggal entri keuangan"
            autoCapitalize="none"
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
            style={styles.input}
            value={date}
          />
          <Text style={styles.fieldHelp}>Format YYYY-MM-DD · zona waktu klinik</Text>
        </View>

        <View>
          <Text style={styles.fieldLabel}>Jumlah (Rp)</Text>
          <TextInput
            accessibilityLabel="Jumlah entri keuangan"
            keyboardType="number-pad"
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
            style={styles.input}
            value={amount}
          />
        </View>

        {isExpense ? (
          <View>
            <Text style={styles.fieldLabel}>Kategori beban</Text>
            <View style={styles.categoryGrid}>
              {expenseCategories.map((option) => {
                const selected = category === option.id;
                return (
                  <Pressable
                    accessibilityLabel={option.accessibilityLabel}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={option.id}
                    onPress={() => setCategory(option.id)}
                    style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                  >
                    <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View>
          <Text style={styles.fieldLabel}>Catatan (opsional)</Text>
          <TextInput
            accessibilityLabel="Catatan entri keuangan"
            multiline
            onChangeText={setNote}
            placeholder={isExpense ? 'Contoh: tagihan listrik Agustus' : 'Konteks pengambilan dana'}
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
        <Ionicons color="#9A3412" name="information-circle-outline" size={19} />
        <Text style={styles.noticeText}>
          Entri hanya disimpan di memori layar. Tidak ada catatan produksi, penyimpanan terenkripsi, audit,
          API, atau pekerjaan sinkronisasi yang dibuat.
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          accessibilityLabel="Batal entri keuangan demo"
          accessibilityRole="button"
          onPress={onCancel}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
        >
          <Text style={styles.cancelButtonText}>Batal</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={isExpense ? 'Simpan beban demo' : 'Simpan pengambilan pemilik demo'}
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

const styles = StyleSheet.create({
  actionRow: { flexDirection: 'row', gap: spacing.small },
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
  categoryChip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.medium,
    borderWidth: 1,
    flexBasis: '46%',
    flexGrow: 1,
    padding: spacing.small,
  },
  categoryChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.small, marginTop: spacing.small },
  categoryText: { color: colors.mutedForeground, fontSize: typography.caption, fontWeight: '700' },
  categoryTextSelected: { color: colors.primaryForeground },
  content: { gap: spacing.large, padding: spacing.xlarge, paddingBottom: spacing.xxlarge },
  demoBadge: { backgroundColor: '#E6F7F5', borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6 },
  demoBadgeText: { color: '#0F766E', fontSize: typography.caption, fontWeight: '700' },
  errorText: { color: colors.destructive, fontSize: typography.caption, fontWeight: '700' },
  fieldHelp: { color: colors.mutedForeground, fontSize: 10, marginTop: spacing.xsmall },
  fieldLabel: { color: colors.foreground, fontSize: typography.caption, fontWeight: '700' },
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
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.medium,
    borderWidth: 1,
    color: colors.foreground,
    fontSize: typography.body,
    marginTop: spacing.small,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.medium,
  },
  kindCard: {
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: radii.large,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.small,
    padding: spacing.medium,
  },
  kindDescription: { color: colors.mutedForeground, fontSize: typography.caption, lineHeight: 18, marginTop: 2 },
  kindText: { flex: 1 },
  kindTitle: { color: colors.foreground, fontSize: typography.label, fontWeight: '800' },
  noteInput: { minHeight: 88, textAlignVertical: 'top' },
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
  ownerDrawCard: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  pressed: { opacity: 0.65 },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: radii.medium,
    flex: 1,
    padding: spacing.medium,
  },
  saveButtonText: { color: colors.primaryForeground, fontSize: typography.label, fontWeight: '800' },
  screen: { backgroundColor: colors.background, flex: 1 },
  subtitle: { color: colors.mutedForeground, fontSize: typography.caption, marginTop: spacing.xsmall },
});
