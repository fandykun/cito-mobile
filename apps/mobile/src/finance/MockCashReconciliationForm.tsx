import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/design/tokens';
import {
  calculateCashReconciliation,
  type CashReconciliation,
} from '@/src/finance/calculations';

export type MockCashReconciliationValues = CashReconciliation;

const idrFormatter = new Intl.NumberFormat('id-ID');

function formatCurrency(amount: number): string {
  return `Rp ${idrFormatter.format(amount)}`;
}

function formatVariance(amount: number): string {
  if (amount < 0) {
    return `−${formatCurrency(Math.abs(amount))}`;
  }
  if (amount > 0) {
    return `+${formatCurrency(amount)}`;
  }
  return formatCurrency(0);
}

function parseNonnegativeMoney(value: string): number | null {
  if (!/^(0|[1-9]\d*)$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function MockCashReconciliationForm({
  cashExpenses,
  cashIncome,
  initialValues,
  onCancel,
  onSave,
}: {
  cashExpenses: number;
  cashIncome: number;
  initialValues?: MockCashReconciliationValues;
  onCancel: () => void;
  onSave: (values: MockCashReconciliationValues) => void;
}) {
  const [actualClosing, setActualClosing] = useState(
    initialValues ? String(initialValues.actualClosing) : '',
  );
  const [error, setError] = useState<string | null>(null);
  const [openingBalance, setOpeningBalance] = useState(
    initialValues ? String(initialValues.openingBalance) : '',
  );

  const parsedActual = parseNonnegativeMoney(actualClosing);
  const parsedOpening = parseNonnegativeMoney(openingBalance);
  const preview = useMemo(() => {
    if (parsedActual === null || parsedOpening === null) {
      return null;
    }
    try {
      return calculateCashReconciliation({
        actualClosing: parsedActual,
        cashExpenses,
        cashIncome,
        openingBalance: parsedOpening,
      });
    } catch {
      return null;
    }
  }, [cashExpenses, cashIncome, parsedActual, parsedOpening]);

  function submit(): void {
    if (parsedOpening === null) {
      setError('Saldo pembukaan harus berupa rupiah bulat nol atau lebih.');
      return;
    }
    if (parsedActual === null) {
      setError('Saldo aktual harus berupa rupiah bulat nol atau lebih.');
      return;
    }
    try {
      const values = calculateCashReconciliation({
        actualClosing: parsedActual,
        cashExpenses,
        cashIncome,
        openingBalance: parsedOpening,
      });
      setError(null);
      onSave(values);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Rekonsiliasi kas tidak valid.');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Kembali ke ringkasan kas demo"
          accessibilityRole="button"
          onPress={onCancel}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.foreground} name="arrow-back" size={20} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.heading}>Rekonsiliasi kas</Text>
          <Text style={styles.subtitle}>22 Agustus 2026 · Asia/Jakarta</Text>
        </View>
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>Data demo</Text>
        </View>
      </View>

      <View style={styles.formulaCard}>
        <Text style={styles.formulaTitle}>Rumus perkiraan penutupan</Text>
        <FormulaRow label="Saldo pembukaan" value={parsedOpening === null ? null : parsedOpening} />
        <FormulaRow label="Pendapatan tunai" prefix="+" value={cashIncome} />
        <FormulaRow label="Beban tunai demo" prefix="−" value={cashExpenses} />
        <View style={styles.divider} />
        <Text style={styles.formulaHelp}>
          Perkiraan = pembukaan + pendapatan tunai − beban tunai demo
        </Text>
      </View>

      <View style={styles.formCard}>
        <View>
          <Text style={styles.fieldLabel}>Saldo pembukaan (Rp)</Text>
          <TextInput
            accessibilityLabel="Saldo pembukaan kas"
            keyboardType="number-pad"
            onChangeText={setOpeningBalance}
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
            style={styles.input}
            value={openingBalance}
          />
        </View>
        <View>
          <Text style={styles.fieldLabel}>Saldo penutupan aktual (Rp)</Text>
          <TextInput
            accessibilityLabel="Saldo penutupan kas aktual"
            keyboardType="number-pad"
            onChangeText={setActualClosing}
            placeholder="Hitung uang fisik"
            placeholderTextColor={colors.mutedForeground}
            style={styles.input}
            value={actualClosing}
          />
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>Perkiraan tutup</Text>
          <Text style={styles.previewValue}>
            Perkiraan tutup {preview ? formatCurrency(preview.expectedClosing) : '—'}
          </Text>
          <View style={styles.divider} />
          <Text style={styles.previewLabel}>Selisih aktual</Text>
          <Text
            style={[
              styles.varianceValue,
              preview && preview.variance < 0 && styles.negativeVariance,
              preview && preview.variance > 0 && styles.positiveVariance,
            ]}
          >
            Selisih {preview ? formatVariance(preview.variance) : '—'}
          </Text>
        </View>

        {error ? (
          <Text accessibilityRole="alert" style={styles.errorText}>
            {error}
          </Text>
        ) : null}
      </View>

      <View style={styles.assumptionNotice}>
        <Ionicons color="#9A3412" name="warning-outline" size={19} />
        <Text style={styles.assumptionText}>
          Asumsi demo: seluruh beban harian dianggap dibayar tunai karena entitas Expense saat ini belum
          menyimpan metode pembayaran. Integrasi produksi harus menyelesaikan aturan ini sebelum digunakan.
        </Text>
      </View>

      <View style={styles.notice}>
        <Ionicons color="#9A3412" name="information-circle-outline" size={19} />
        <Text style={styles.noticeText}>
          Rekonsiliasi hanya disimpan di memori layar. Tidak ada penutupan kas produksi, penyimpanan
          terenkripsi, audit, API, atau pekerjaan sinkronisasi.
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          accessibilityLabel="Batal rekonsiliasi kas demo"
          accessibilityRole="button"
          onPress={onCancel}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
        >
          <Text style={styles.cancelButtonText}>Batal</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Simpan rekonsiliasi kas demo"
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

function FormulaRow({ label, prefix = '', value }: { label: string; prefix?: string; value: number | null }) {
  return (
    <View style={styles.formulaRow}>
      <Text style={styles.formulaLabel}>{label}</Text>
      <Text style={styles.formulaValue}>
        {prefix}
        {value === null ? '—' : formatCurrency(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: { flexDirection: 'row', gap: spacing.small },
  assumptionNotice: {
    alignItems: 'flex-start',
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: radii.large,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.small,
    padding: spacing.medium,
  },
  assumptionText: { color: '#9A3412', flex: 1, fontSize: typography.caption, lineHeight: 18 },
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
  demoBadge: { backgroundColor: '#E6F7F5', borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6 },
  demoBadgeText: { color: '#0F766E', fontSize: typography.caption, fontWeight: '700' },
  divider: { backgroundColor: colors.border, height: 1 },
  errorText: { color: colors.destructive, fontSize: typography.caption, fontWeight: '700' },
  fieldLabel: { color: colors.foreground, fontSize: typography.caption, fontWeight: '700' },
  formCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    gap: spacing.large,
    padding: spacing.large,
  },
  formulaCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    gap: spacing.small,
    padding: spacing.large,
  },
  formulaHelp: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15 },
  formulaLabel: { color: colors.mutedForeground, fontSize: typography.caption },
  formulaRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  formulaTitle: { color: colors.foreground, fontSize: typography.label, fontWeight: '800' },
  formulaValue: { color: colors.foreground, fontSize: typography.caption, fontWeight: '700' },
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
  negativeVariance: { color: colors.destructive },
  notice: {
    alignItems: 'flex-start',
    backgroundColor: '#FFF7ED',
    borderRadius: radii.large,
    flexDirection: 'row',
    gap: spacing.small,
    padding: spacing.medium,
  },
  noticeText: { color: '#9A3412', flex: 1, fontSize: typography.caption, lineHeight: 18 },
  positiveVariance: { color: '#0F766E' },
  pressed: { opacity: 0.65 },
  previewCard: { backgroundColor: colors.secondary, borderRadius: radii.medium, gap: spacing.small, padding: spacing.medium },
  previewLabel: { color: colors.mutedForeground, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  previewValue: { color: colors.foreground, fontSize: typography.body, fontWeight: '800' },
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
  varianceValue: { color: colors.foreground, fontSize: typography.body, fontWeight: '800' },
});
