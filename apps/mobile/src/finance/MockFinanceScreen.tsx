import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/design/tokens';
import {
  calculateDailySummary,
  type CashReconciliation,
  type DailyFinanceSummary,
  type MonthlyFinanceSummary,
} from '@/src/finance/calculations';
import {
  MockCashReconciliationForm,
  type MockCashReconciliationValues,
} from '@/src/finance/MockCashReconciliationForm';
import {
  MockFinanceEntryForm,
  type MockFinanceEntryValues,
} from '@/src/finance/MockFinanceEntryForm';
import { financeMockData, type MonthlyFinanceFixture } from '@/src/finance/mockData';

import { OwnerDrawPlanner } from './OwnerDrawPlanner';
import { applyLocalFinanceEntries, summarizeFinanceMonths } from './planning';

type FinancePeriod = 'day' | 'month' | 'sixMonths';
type FinanceEntryMode = 'expense' | 'ownerDraw';
type StoredFinanceEntry = MockFinanceEntryValues & { id: string };

const idrFormatter = new Intl.NumberFormat('id-ID');
const compactFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });

function formatCurrency(amount: number): string {
  return `Rp ${idrFormatter.format(amount)}`;
}

function formatSignedCurrency(amount: number): string {
  if (amount < 0) {
    return `−${formatCurrency(Math.abs(amount))}`;
  }
  if (amount > 0) {
    return `+${formatCurrency(amount)}`;
  }
  return formatCurrency(0);
}

function formatCompact(amount: number): string {
  return `${compactFormatter.format(amount / 1_000_000)} jt`;
}

function formatEntryDate(value: string): string {
  const [year, month, day] = value.split('-');
  const monthLabels: Record<string, string> = {
    '01': 'Jan',
    '02': 'Feb',
    '03': 'Mar',
    '04': 'Apr',
    '05': 'Mei',
    '06': 'Jun',
    '07': 'Jul',
    '08': 'Agu',
    '09': 'Sep',
    '10': 'Okt',
    '11': 'Nov',
    '12': 'Des',
  };
  return `${Number(day)} ${monthLabels[month!] ?? month} ${year}`;
}

function MetricCard({
  accent = 'default',
  label,
  supportingText,
  value,
}: {
  accent?: 'default' | 'orange' | 'teal';
  label: string;
  supportingText: string;
  value: number;
}) {
  return (
    <View
      style={[
        styles.metricCard,
        accent === 'orange' && styles.metricCardOrange,
        accent === 'teal' && styles.metricCardTeal,
      ]}
    >
      <Text style={styles.metricLabel}>{label}</Text>
      <Text
        style={[
          styles.metricValue,
          accent === 'orange' && styles.metricValueOrange,
          accent === 'teal' && styles.metricValueTeal,
        ]}
      >
        {formatCurrency(value)}
      </Text>
      <Text style={styles.metricSupporting}>{supportingText}</Text>
    </View>
  );
}

function IncomeBreakdown({ medical, retail }: { medical: number; retail: number }) {
  const total = medical + retail;
  const medicalPercent = total > 0 ? Math.round((medical / total) * 100) : 0;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Sumber pendapatan</Text>
      <View style={styles.breakdownRow}>
        <View style={styles.breakdownIdentity}>
          <View style={[styles.legendDot, styles.medicalDot]} />
          <View>
            <Text style={styles.breakdownLabel}>Layanan medis</Text>
            <Text style={styles.breakdownShare}>{medicalPercent}% dari pendapatan</Text>
          </View>
        </View>
        <Text style={styles.breakdownValue}>{formatCurrency(medical)}</Text>
      </View>
      <View style={styles.breakdownTrack}>
        <View style={[styles.breakdownFill, { width: `${medicalPercent}%` }]} />
      </View>
      <View style={styles.breakdownRow}>
        <View style={styles.breakdownIdentity}>
          <View style={[styles.legendDot, styles.retailDot]} />
          <View>
            <Text style={styles.breakdownLabel}>Penjualan ritel</Text>
            <Text style={styles.breakdownShare}>{100 - medicalPercent}% dari pendapatan</Text>
          </View>
        </View>
        <Text style={styles.breakdownValue}>{formatCurrency(retail)}</Text>
      </View>
    </View>
  );
}

function MonthlyTrend({ months }: { months: readonly MonthlyFinanceFixture[] }) {
  const maxGross = Math.max(...months.map((month) => month.grossIncome));

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Tren 6 bulan</Text>
      <Text style={styles.cardSubtitle}>Pendapatan kotor, beban operasional, dan dana ditahan</Text>
      <View style={styles.trendLegend}>
        <Legend color={colors.primary} label="Kotor" />
        <Legend color="#F97316" label="Beban" />
        <Legend color="#3B82F6" label="Ditahan" />
      </View>
      <View style={styles.trendList}>
        {months.map((month) => (
          <View
            accessibilityLabel={`${month.label}: kotor ${formatCurrency(month.grossIncome)}, beban ${formatCurrency(month.operatingExpenses)}, ditahan ${formatCurrency(month.retained)}`}
            key={month.id}
            style={styles.trendRow}
          >
            <Text style={styles.trendMonth}>{month.label}</Text>
            <View style={styles.trendBars}>
              <TrendBar color={colors.primary} max={maxGross} value={month.grossIncome} />
              <TrendBar color="#F97316" max={maxGross} value={month.operatingExpenses} />
              <TrendBar color="#3B82F6" max={maxGross} value={Math.max(month.retained, 0)} />
            </View>
            <Text style={styles.trendValue}>{formatCompact(month.grossIncome)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function TrendBar({ color, max, value }: { color: string; max: number; value: number }) {
  const width = max > 0 ? Math.max((value / max) * 100, 2) : 0;
  return <View style={[styles.trendBar, { backgroundColor: color, width: `${width}%` }]} />;
}

function CashReconciliationCard({
  onReconcile,
  reconciliation,
}: {
  onReconcile: () => void;
  reconciliation: CashReconciliation | null;
}) {
  const status =
    reconciliation?.variance === 0
      ? 'Kas sesuai'
      : reconciliation && reconciliation.variance < 0
        ? 'Kas kurang'
        : reconciliation
          ? 'Kas lebih'
          : null;

  return (
    <View style={styles.card}>
      <View style={styles.reconciliationHeader}>
        <View>
          <Text style={styles.cardTitle}>Rekonsiliasi kas</Text>
          <Text style={styles.cardSubtitle}>Uang fisik terhadap perkiraan penutupan</Text>
        </View>
        {status ? (
          <Text
            style={[
              styles.reconciliationStatus,
              reconciliation!.variance < 0 && styles.reconciliationStatusNegative,
              reconciliation!.variance > 0 && styles.reconciliationStatusPositive,
            ]}
          >
            {status}
          </Text>
        ) : null}
      </View>
      {reconciliation ? (
        <View style={styles.reconciliationGrid}>
          <Text style={styles.reconciliationMetric}>
            Pembukaan {formatCurrency(reconciliation.openingBalance)}
          </Text>
          <Text style={styles.reconciliationMetric}>
            Perkiraan {formatCurrency(reconciliation.expectedClosing)}
          </Text>
          <Text style={styles.reconciliationMetric}>
            Aktual {formatCurrency(reconciliation.actualClosing)}
          </Text>
          <Text
            style={[
              styles.reconciliationMetric,
              styles.reconciliationVariance,
              reconciliation.variance < 0 && styles.reconciliationVarianceNegative,
            ]}
          >
            Selisih {formatSignedCurrency(reconciliation.variance)}
          </Text>
        </View>
      ) : (
        <Text style={styles.emptyActivity}>Belum ada penutupan kas lokal untuk tanggal ini.</Text>
      )}
      <Text style={styles.assumptionText}>
        Asumsi demo: seluruh beban harian dianggap sebagai arus kas keluar tunai karena metode pembayaran
        Expense belum ditentukan.
      </Text>
      <Pressable
        accessibilityLabel={reconciliation ? 'Edit rekonsiliasi kas demo' : 'Rekonsiliasi kas demo'}
        accessibilityRole="button"
        onPress={onReconcile}
        style={styles.reconciliationButton}
      >
        <Ionicons color={colors.primaryForeground} name="calculator-outline" size={17} />
        <Text style={styles.reconciliationButtonText}>
          {reconciliation ? 'Edit rekonsiliasi' : 'Mulai rekonsiliasi'}
        </Text>
      </Pressable>
    </View>
  );
}

function DailyView({
  daily,
  onReconcile,
  reconciliation,
}: {
  daily: DailyFinanceSummary;
  onReconcile: () => void;
  reconciliation: CashReconciliation | null;
}) {
  const payments = [
    { id: 'cash', label: 'Tunai', value: daily.payments.cash },
    { id: 'qris', label: 'QRIS', value: daily.payments.qris },
    { id: 'transfer', label: 'Transfer', value: daily.payments.transfer },
    { id: 'card', label: 'Kartu', value: daily.payments.card },
  ] as const;

  return (
    <>
      <Text style={styles.periodTitle}>Ringkasan {financeMockData.businessDateLabel}</Text>
      <View style={styles.metricGrid}>
        <MetricCard
          label="Total pendapatan"
          supportingText="medis + ritel"
          value={daily.totalIncome}
        />
        <MetricCard label="Beban hari ini" supportingText="beban operasional" value={daily.expenses} />
        <MetricCard accent="teal" label="Net hari ini" supportingText="pendapatan − beban" value={daily.net} />
      </View>
      <IncomeBreakdown medical={daily.medicalIncome} retail={daily.retailIncome} />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pembayaran</Text>
        <Text style={styles.cardSubtitle}>Rincian metode untuk pendapatan hari ini</Text>
        <View style={styles.paymentList}>
          {payments.map((payment) => (
            <View key={payment.id} style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>{payment.label}</Text>
              <Text style={styles.paymentValue}>{formatCurrency(payment.value)}</Text>
            </View>
          ))}
        </View>
      </View>
      <CashReconciliationCard onReconcile={onReconcile} reconciliation={reconciliation} />
    </>
  );
}

function FinanceActivity({
  entries,
  onAddExpense,
  onAddOwnerDraw,
}: {
  entries: readonly StoredFinanceEntry[];
  onAddExpense: () => void;
  onAddOwnerDraw: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.activityHeader}>
        <View>
          <Text style={styles.cardTitle}>Aktivitas lokal</Text>
          <Text style={styles.activitySubtitle}>{entries.length} entri demo sesi ini</Text>
        </View>
      </View>
      <View style={styles.entryActions}>
        <Pressable
          accessibilityLabel="Catat beban operasional demo"
          accessibilityRole="button"
          onPress={onAddExpense}
          style={styles.entryActionButton}
        >
          <Ionicons color={colors.destructive} name="receipt-outline" size={18} />
          <Text style={styles.entryActionText}>Catat beban</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Catat pengambilan pemilik demo"
          accessibilityRole="button"
          onPress={onAddOwnerDraw}
          style={[styles.entryActionButton, styles.ownerDrawAction]}
        >
          <Ionicons color="#C2410C" name="wallet-outline" size={18} />
          <Text style={styles.entryActionText}>Pengambilan</Text>
        </Pressable>
      </View>
      {entries.length > 0 ? (
        <View style={styles.activityList}>
          {[...entries].reverse().map((entry) => (
            <View key={entry.id} style={styles.activityRow}>
              <View style={styles.activityIdentity}>
                <Text style={styles.activityLabel}>
                  {entry.kind === 'expense' ? entry.categoryLabel : 'Pengambilan pemilik'} ·{' '}
                  {formatEntryDate(entry.date)}
                </Text>
                <Text style={styles.activityNote}>{entry.note || 'Tanpa catatan'}</Text>
              </View>
              <Text style={[styles.activityAmount, entry.kind === 'ownerDraw' && styles.ownerDrawAmount]}>
                −{formatCurrency(entry.amount)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyActivity}>Belum ada entri lokal pada sesi ini.</Text>
      )}
      <Text style={styles.localOnlyText}>
        Entri hanya disimpan di memori layar dan hilang saat layar dimuat ulang.
      </Text>
    </View>
  );
}

function MonthlyView({
  entries,
  months,
  onAddExpense,
  onAddOwnerDraw,
  summary,
  periodLabel,
  monthCount,
  drawPercent,
  onDrawPercentChange,
}: {
  periodLabel: string;
  monthCount: 1 | 6;
  drawPercent: number;
  onDrawPercentChange: (value: number) => void;
  entries: readonly StoredFinanceEntry[];
  months: readonly MonthlyFinanceFixture[];
  onAddExpense: () => void;
  onAddOwnerDraw: () => void;
  summary: MonthlyFinanceSummary;
}) {
  return (
    <>
      <Text style={styles.periodTitle}>Ringkasan {periodLabel}</Text>
      <View style={styles.metricGrid}>
        <MetricCard
          label="Pendapatan kotor"
          supportingText="layanan medis + ritel"
          value={summary.grossIncome}
        />
        <MetricCard
          label="Beban operasional"
          supportingText="tidak termasuk pengambilan pemilik"
          value={summary.operatingExpenses}
        />
        <MetricCard
          accent="teal"
          label="Laba bersih"
          supportingText="pendapatan kotor − beban"
          value={summary.netProfit}
        />
        <MetricCard
          accent="orange"
          label="Pengambilan pemilik"
          supportingText="transaksi pribadi terpisah"
          value={summary.ownerDraw}
        />
        <MetricCard
          accent="teal"
          label="Ditahan di klinik"
          supportingText="laba bersih − pengambilan"
          value={summary.retained}
        />
      </View>
      <View style={styles.ownerDrawNotice}>
        <Ionicons color="#C2410C" name="wallet-outline" size={20} />
        <Text style={styles.ownerDrawText}>
          Pengambilan pemilik bukan beban operasional. Nilainya dikurangkan setelah laba bersih agar biaya
          menjalankan klinik tetap terbaca dengan benar.
        </Text>
      </View>
      <OwnerDrawPlanner
        grossIncome={summary.grossIncome}
        operatingExpenses={summary.operatingExpenses}
        monthCount={monthCount}
        percent={drawPercent}
        onChange={onDrawPercentChange}
      />
      <FinanceActivity
        entries={entries}
        onAddExpense={onAddExpense}
        onAddOwnerDraw={onAddOwnerDraw}
      />
      <IncomeBreakdown medical={summary.medicalIncome} retail={summary.retailIncome} />
      <MonthlyTrend months={months} />
    </>
  );
}

export function MockFinanceScreen() {
  const [cashReconciliation, setCashReconciliation] = useState<MockCashReconciliationValues | null>(null);
  const [entries, setEntries] = useState<StoredFinanceEntry[]>([]);
  const [entryMode, setEntryMode] = useState<FinanceEntryMode | null>(null);
  const [isReconcilingCash, setIsReconcilingCash] = useState(false);
  const [period, setPeriod] = useState<FinancePeriod>('month');
  const [drawPercent, setDrawPercent] = useState(28);
  const displayedMonths = useMemo(
    () => applyLocalFinanceEntries(financeMockData.months, entries),
    [entries],
  );
  const monthlySummary = displayedMonths[displayedMonths.length - 1]!;
  const sixMonthSummary = useMemo(() => summarizeFinanceMonths(displayedMonths), [displayedMonths]);

  const dailySummary = useMemo(() => {
    const localExpenses = entries.reduce(
      (total, entry) =>
        total + (entry.kind === 'expense' && entry.date === '2026-08-22' ? entry.amount : 0),
      0,
    );
    return calculateDailySummary({
      expenses: financeMockData.daily.expenses + localExpenses,
      medicalIncome: financeMockData.daily.medicalIncome,
      payments: financeMockData.daily.payments,
      retailIncome: financeMockData.daily.retailIncome,
    });
  }, [entries]);

  function saveEntry(values: MockFinanceEntryValues): void {
    setEntries((current) => [
      ...current,
      { ...values, id: `finance-local-${current.length + 1}` },
    ]);
    setEntryMode(null);
    setPeriod('month');
  }

  if (isReconcilingCash) {
    return (
      <MockCashReconciliationForm
        cashExpenses={dailySummary.expenses}
        cashIncome={dailySummary.payments.cash}
        {...(cashReconciliation ? { initialValues: cashReconciliation } : {})}
        onCancel={() => setIsReconcilingCash(false)}
        onSave={(values) => {
          setCashReconciliation(values);
          setIsReconcilingCash(false);
          setPeriod('day');
        }}
      />
    );
  }

  if (entryMode) {
    return (
      <MockFinanceEntryForm
        mode={entryMode}
        onCancel={() => setEntryMode(null)}
        onSave={saveEntry}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Keuangan</Text>
          <Text style={styles.subtitle}>Ringkasan lokal · {financeMockData.businessTimezone}</Text>
        </View>
        <View style={styles.demoBadge}>
          <View style={styles.demoDot} />
          <Text style={styles.demoBadgeText}>Data demo</Text>
        </View>
      </View>

      <View style={styles.notice}>
        <Ionicons color="#9A3412" name="information-circle-outline" size={20} />
        <Text style={styles.noticeText}>
          Angka sintetis ini hanya memvalidasi tampilan dan rumus. Belum membaca transaksi produksi,
          penyimpanan terenkripsi, API, atau antrean sinkronisasi.
        </Text>
      </View>

      <View style={styles.periodSwitcher}>
        <Pressable
          accessibilityLabel="Tampilkan ringkasan bulan ini"
          accessibilityRole="button"
          accessibilityState={{ selected: period === 'month' }}
          onPress={() => setPeriod('month')}
          style={[styles.periodButton, period === 'month' && styles.periodButtonSelected]}
        >
          <Text style={[styles.periodButtonText, period === 'month' && styles.periodButtonTextSelected]}>
            Bulan ini
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Tampilkan ringkasan 6 bulan"
          accessibilityRole="button"
          accessibilityState={{ selected: period === 'sixMonths' }}
          onPress={() => setPeriod('sixMonths')}
          style={[styles.periodButton, period === 'sixMonths' && styles.periodButtonSelected]}
        >
          <Text style={[styles.periodButtonText, period === 'sixMonths' && styles.periodButtonTextSelected]}>
            6 bulan
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Tampilkan ringkasan hari ini"
          accessibilityRole="button"
          accessibilityState={{ selected: period === 'day' }}
          onPress={() => setPeriod('day')}
          style={[styles.periodButton, period === 'day' && styles.periodButtonSelected]}
        >
          <Text style={[styles.periodButtonText, period === 'day' && styles.periodButtonTextSelected]}>
            Hari ini
          </Text>
        </Pressable>
      </View>

      {period !== 'day' ? (
        <MonthlyView
          periodLabel={period === 'sixMonths' ? 'Mar–Agu 2026 · total 6 bulan' : financeMockData.monthLabel}
          monthCount={period === 'sixMonths' ? 6 : 1}
          drawPercent={drawPercent}
          onDrawPercentChange={setDrawPercent}
          entries={entries}
          months={displayedMonths}
          onAddExpense={() => setEntryMode('expense')}
          onAddOwnerDraw={() => setEntryMode('ownerDraw')}
          summary={period === 'sixMonths' ? sixMonthSummary : monthlySummary}
        />
      ) : (
        <DailyView
          daily={dailySummary}
          onReconcile={() => setIsReconcilingCash(true)}
          reconciliation={cashReconciliation}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  activityAmount: { color: colors.destructive, fontSize: typography.caption, fontWeight: '800' },
  activityHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  activityIdentity: { flex: 1 },
  activityLabel: { color: colors.foreground, fontSize: typography.caption, fontWeight: '700' },
  activityList: { gap: spacing.small },
  activityNote: { color: colors.mutedForeground, fontSize: 10, marginTop: 2 },
  activityRow: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.small,
    paddingTop: spacing.small,
  },
  activitySubtitle: { color: colors.mutedForeground, fontSize: 10, marginTop: 2 },
  assumptionText: {
    backgroundColor: '#FFF7ED',
    borderRadius: radii.medium,
    color: '#9A3412',
    fontSize: 10,
    lineHeight: 15,
    padding: spacing.small,
  },
  breakdownFill: { backgroundColor: colors.primary, borderRadius: radii.pill, height: '100%' },
  breakdownIdentity: { alignItems: 'center', flexDirection: 'row', gap: spacing.small },
  breakdownLabel: { color: colors.foreground, fontSize: typography.label, fontWeight: '700' },
  breakdownRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  breakdownShare: { color: colors.mutedForeground, fontSize: 10, marginTop: 2 },
  breakdownTrack: { backgroundColor: colors.secondary, borderRadius: radii.pill, height: 5, overflow: 'hidden' },
  breakdownValue: { color: colors.foreground, fontSize: typography.caption, fontWeight: '800' },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    gap: spacing.medium,
    padding: spacing.large,
  },
  cardSubtitle: { color: colors.mutedForeground, fontSize: typography.caption, marginTop: -spacing.small },
  cardTitle: { color: colors.foreground, fontSize: typography.body, fontWeight: '800' },
  content: { gap: spacing.large, padding: spacing.xlarge, paddingBottom: spacing.xxlarge },
  demoBadge: {
    alignItems: 'center',
    backgroundColor: '#E6F7F5',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  demoBadgeText: { color: '#0F766E', fontSize: typography.caption, fontWeight: '700' },
  demoDot: { backgroundColor: colors.primary, borderRadius: radii.pill, height: 6, width: 6 },
  emptyActivity: { color: colors.mutedForeground, fontSize: typography.caption, textAlign: 'center' },
  entryActionButton: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: radii.medium,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xsmall,
    justifyContent: 'center',
    padding: spacing.small,
  },
  entryActionText: { color: colors.foreground, fontSize: typography.caption, fontWeight: '700' },
  entryActions: { flexDirection: 'row', gap: spacing.small },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  heading: { color: colors.foreground, fontSize: typography.heading, fontWeight: '800' },
  legendDot: { borderRadius: radii.pill, height: 8, width: 8 },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: spacing.xsmall },
  legendLabel: { color: colors.mutedForeground, fontSize: 10 },
  localOnlyText: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  medicalDot: { backgroundColor: colors.primary },
  metricCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.xsmall,
    minHeight: 112,
    padding: spacing.medium,
  },
  metricCardOrange: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  metricCardTeal: { backgroundColor: '#F0FDFA', borderColor: '#99E2DB' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.small },
  metricLabel: { color: colors.mutedForeground, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  metricSupporting: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15 },
  metricValue: { color: colors.foreground, fontSize: typography.body, fontWeight: '800', marginTop: spacing.xsmall },
  metricValueOrange: { color: '#C2410C' },
  metricValueTeal: { color: '#0F766E' },
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
  ownerDrawAction: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  ownerDrawAmount: { color: '#C2410C' },
  ownerDrawNotice: {
    alignItems: 'flex-start',
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: radii.large,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.small,
    padding: spacing.medium,
  },
  ownerDrawText: { color: '#9A3412', flex: 1, fontSize: typography.caption, lineHeight: 18 },
  paymentLabel: { color: colors.mutedForeground, fontSize: typography.caption },
  paymentList: { gap: spacing.small },
  paymentRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  paymentValue: { color: colors.foreground, fontSize: typography.caption, fontWeight: '800' },
  periodButton: { alignItems: 'center', borderRadius: radii.medium, flex: 1, padding: spacing.small },
  periodButtonSelected: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
  periodButtonText: { color: colors.mutedForeground, fontSize: typography.caption, fontWeight: '700' },
  periodButtonTextSelected: { color: colors.foreground },
  periodSwitcher: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: radii.medium,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 3,
  },
  periodTitle: { color: colors.foreground, fontSize: typography.body, fontWeight: '800' },
  reconciliationButton: {
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: radii.medium,
    flexDirection: 'row',
    gap: spacing.xsmall,
    justifyContent: 'center',
    padding: spacing.medium,
  },
  reconciliationButtonText: { color: colors.primaryForeground, fontSize: typography.caption, fontWeight: '800' },
  reconciliationGrid: { gap: spacing.small },
  reconciliationHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  reconciliationMetric: { color: colors.foreground, fontSize: typography.caption, fontWeight: '700' },
  reconciliationStatus: {
    backgroundColor: colors.secondary,
    borderRadius: radii.pill,
    color: colors.foreground,
    fontSize: 10,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.xsmall,
  },
  reconciliationStatusNegative: { backgroundColor: '#FEF2F2', color: colors.destructive },
  reconciliationStatusPositive: { backgroundColor: '#F0FDFA', color: '#0F766E' },
  reconciliationVariance: { color: '#0F766E' },
  reconciliationVarianceNegative: { color: colors.destructive },
  retailDot: { backgroundColor: '#3B82F6' },
  screen: { backgroundColor: colors.background, flex: 1 },
  subtitle: { color: colors.mutedForeground, fontSize: typography.caption, marginTop: spacing.xsmall },
  trendBar: { borderRadius: radii.pill, height: 4 },
  trendBars: { flex: 1, gap: 3 },
  trendLegend: { flexDirection: 'row', gap: spacing.medium },
  trendList: { gap: spacing.medium },
  trendMonth: { color: colors.mutedForeground, fontSize: 10, fontWeight: '700', width: 24 },
  trendRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.small },
  trendValue: { color: colors.foreground, fontSize: 10, fontWeight: '700', textAlign: 'right', width: 50 },
});
