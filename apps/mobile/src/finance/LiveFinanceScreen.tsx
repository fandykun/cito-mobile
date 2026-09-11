import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radii, spacing, typography } from '@/src/design/tokens';
import type {
  CashReconciliationInput,
  CashReconciliationPreview,
  DailySummary,
  MonthlySummary,
} from '@/src/finance/api';

export interface FinanceOverviewClient {
  getDaily(accessToken: string, date: string): Promise<DailySummary>;
  getMonthly(accessToken: string, month: string): Promise<MonthlySummary>;
  previewCashReconciliation(
    accessToken: string,
    date: string,
    input: CashReconciliationInput,
  ): Promise<CashReconciliationPreview>;
}

interface LiveFinanceScreenProps {
  accessToken: string;
  api: FinanceOverviewClient;
  initialDate?: string;
  isOnline: boolean;
}

type Period = 'daily' | 'monthly';
type Status = 'loading' | 'ready' | 'error';
const MAXIMUM_MONEY = 99_999_999_999_999;
const idrFormatter = new Intl.NumberFormat('id-ID');

function formatMoney(value: number): string {
  return `Rp ${idrFormatter.format(value)}`;
}

function formatSignedMoney(value: number): string {
  return value < 0 ? `−${formatMoney(Math.abs(value))}` : value > 0 ? `+${formatMoney(value)}` : formatMoney(0);
}

function clinicToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function shiftDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseMoneyInput(value: string): number | null {
  if (!/^(0|[1-9]\d*)$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= MAXIMUM_MONEY ? parsed : null;
}

export function LiveFinanceScreen({
  accessToken,
  api,
  initialDate = clinicToday(),
  isOnline,
}: LiveFinanceScreenProps) {
  const [date, setDate] = useState(initialDate);
  const [daily, setDaily] = useState<DailySummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlySummary | null>(null);
  const [period, setPeriod] = useState<Period>('daily');
  const [dailyStatus, setDailyStatus] = useState<Status>('loading');
  const [monthlyStatus, setMonthlyStatus] = useState<Status>('loading');
  const [opening, setOpening] = useState('');
  const [actual, setActual] = useState('');
  const [preview, setPreview] = useState<CashReconciliationPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const month = date.slice(0, 7);

  const load = useCallback(async (): Promise<void> => {
    if (!isOnline) return;
    setDailyStatus('loading');
    setMonthlyStatus('loading');
    setPreview(null);
    setPreviewError(null);
    const results = await Promise.allSettled([
      api.getDaily(accessToken, date),
      api.getMonthly(accessToken, month),
    ]);
    const dailyResult = results[0];
    const monthlyResult = results[1];
    if (dailyResult.status === 'fulfilled') {
      setDaily(dailyResult.value);
      setDailyStatus('ready');
    } else {
      setDaily(null);
      setDailyStatus('error');
    }
    if (monthlyResult.status === 'fulfilled') {
      setMonthly(monthlyResult.value);
      setMonthlyStatus('ready');
    } else {
      setMonthly(null);
      setMonthlyStatus('error');
    }
  }, [accessToken, api, date, isOnline, month]);

  useEffect(() => {
    let cancelled = false;
    if (!isOnline) return () => { cancelled = true; };
    void api.getDaily(accessToken, date).then((value) => {
      if (!cancelled) { setDaily(value); setDailyStatus('ready'); setPreview(null); }
    }).catch(() => {
      if (!cancelled) { setDaily(null); setDailyStatus('error'); }
    });
    return () => { cancelled = true; };
  }, [accessToken, api, date, isOnline]);

  useEffect(() => {
    let cancelled = false;
    if (!isOnline) return () => { cancelled = true; };
    void api.getMonthly(accessToken, month).then((value) => {
      if (!cancelled) { setMonthly(value); setMonthlyStatus('ready'); }
    }).catch(() => {
      if (!cancelled) { setMonthly(null); setMonthlyStatus('error'); }
    });
    return () => { cancelled = true; };
  }, [accessToken, api, isOnline, month]);

  const status: Status = dailyStatus === 'error' || monthlyStatus === 'error'
    ? 'error'
    : dailyStatus === 'ready' && monthlyStatus === 'ready' ? 'ready' : 'loading';

  const paymentRows = useMemo(() => daily ? [
    ['Cash', daily.paymentBreakdown.cash],
    ['QRIS', daily.paymentBreakdown.qris],
    ['Transfer', daily.paymentBreakdown.transfer],
    ['Card', daily.paymentBreakdown.card],
  ] as const : [], [daily]);

  function changeDate(days: number): void {
    const next = shiftDate(date, days);
    setDailyStatus('loading');
    if (next.slice(0, 7) !== month) setMonthlyStatus('loading');
    setDate(next);
  }

  async function submitPreview(): Promise<void> {
    const cashOpening = parseMoneyInput(opening);
    const cashActualClosing = parseMoneyInput(actual);
    if (cashOpening === null || cashActualClosing === null) {
      setPreviewError('Enter whole rupiah amounts from zero through Rp 99.999.999.999.999.');
      return;
    }
    setIsPreviewing(true);
    setPreviewError(null);
    try {
      setPreview(await api.previewCashReconciliation(accessToken, date, { cashOpening, cashActualClosing }));
    } catch {
      setPreview(null);
      setPreviewError('Cash reconciliation could not be previewed. Check the server and try again.');
    } finally {
      setIsPreviewing(false);
    }
  }

  if (!isOnline) {
    return <State icon="cloud-offline-outline" title="Online finance is unavailable" description="Encrypted offline finance remains disabled until the physical-device storage gate passes." />;
  }
  if (status === 'loading') {
    return <View accessibilityLabel="Loading financial summary" style={styles.state}><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.stateTitle}>Loading server finance</Text></View>;
  }
  if (status === 'error' || !daily || !monthly) {
    return <View style={styles.state}><Ionicons color={colors.destructive} name="alert-circle-outline" size={36} /><Text accessibilityRole="alert" style={styles.stateTitle}>Financial data could not be loaded.</Text><Text style={styles.stateDescription}>Check the clinic server connection and session.</Text><Pressable accessibilityLabel="Retry financial summary" accessibilityRole="button" onPress={() => void load()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Retry</Text></Pressable></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={styles.screen}>
      <View style={styles.header}><View><Text style={styles.eyebrow}>ONLINE FINANCE</Text><Text style={styles.heading}>{date}</Text></View><View style={styles.badge}><View style={styles.dot} /><Text style={styles.badgeText}>Server data</Text></View></View>
      <View style={styles.dateControls}>
        <Pressable accessibilityLabel="Previous clinic day" accessibilityRole="button" onPress={() => changeDate(-1)} style={styles.iconButton}><Ionicons color={colors.foreground} name="chevron-back" size={20} /></Pressable>
        <Text style={styles.dateHint}>Clinic day · Asia/Jakarta</Text>
        <Pressable accessibilityLabel="Next clinic day" accessibilityRole="button" onPress={() => changeDate(1)} style={styles.iconButton}><Ionicons color={colors.foreground} name="chevron-forward" size={20} /></Pressable>
      </View>
      <View style={styles.tabs}>
        <PeriodButton active={period === 'daily'} label="Daily" accessibilityLabel="Show daily finance" onPress={() => setPeriod('daily')} />
        <PeriodButton active={period === 'monthly'} label="Monthly" accessibilityLabel="Show monthly finance" onPress={() => setPeriod('monthly')} />
      </View>
      {period === 'daily' ? <>
        <View style={styles.grid}><Metric label="Medical income" value={daily.medicalIncome} /><Metric label="Retail income" value={daily.retailIncome} /><Metric label="Operating expenses" value={daily.totalExpense} /><Metric label="Daily net" value={daily.net} accent /></View>
        <View style={styles.card}><Text style={styles.cardTitle}>Payment methods</Text><Text style={styles.cardHelp}>Income · expenses · owner draw</Text>{paymentRows.map(([label, values]) => <View key={label} style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{formatMoney(values.medicalIncome + values.retailIncome)} · −{formatMoney(values.totalExpense)} · −{formatMoney(values.totalDraw)}</Text></View>)}</View>
        <View style={styles.card}><Text style={styles.cardTitle}>Cash reconciliation preview</Text><Text style={styles.cardHelp}>Calculated from current server records. This preview is not saved.</Text><TextInput accessibilityLabel="Opening cash in rupiah" keyboardType="number-pad" onChangeText={setOpening} placeholder="Opening cash" placeholderTextColor={colors.mutedForeground} style={styles.input} value={opening} /><TextInput accessibilityLabel="Counted closing cash in rupiah" keyboardType="number-pad" onChangeText={setActual} placeholder="Counted closing cash" placeholderTextColor={colors.mutedForeground} style={styles.input} value={actual} />{previewError ? <Text accessibilityRole="alert" style={styles.error}>{previewError}</Text> : null}<Pressable accessibilityLabel="Preview cash reconciliation" accessibilityRole="button" disabled={isPreviewing} onPress={() => void submitPreview()} style={styles.primaryButton}>{isPreviewing ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={styles.primaryButtonText}>Calculate from server</Text>}</Pressable>{preview ? <PreviewResult preview={preview} /> : null}</View>
      </> : <><View style={styles.grid}><Metric label="Gross income" value={monthly.grossIncome} /><Metric label="Operating expenses" value={monthly.operatingExpenses} /><Metric label="Net profit" value={monthly.netProfit} accent /><Metric label="Owner draw" value={monthly.totalDraw} /><Metric label="Retained in clinic" value={monthly.retained} accent /></View><View style={styles.card}><Text style={styles.cardTitle}>Income sources</Text><View style={styles.row}><Text style={styles.rowLabel}>Medical</Text><Text style={styles.rowValue}>{formatMoney(monthly.medicalIncome)}</Text></View><View style={styles.row}><Text style={styles.rowLabel}>Retail</Text><Text style={styles.rowValue}>{formatMoney(monthly.retailIncome)}</Text></View></View></>}
    </ScrollView>
  );
}

function PreviewResult({ preview }: { preview: CashReconciliationPreview }) {
  if (preview.status === 'incomplete_attribution') return <View style={styles.result}><Text style={styles.warning}>Payment attribution is incomplete.</Text><Text style={styles.cardHelp}>Resolve legacy unknown payment methods before relying on drawer cash.</Text></View>;
  if (preview.status === 'negative_expected_cash') return <View style={styles.result}><Text style={styles.warning}>Recorded cash movements imply negative cash: {formatSignedMoney(preview.cashExpectedClosing!)}.</Text><Text style={styles.cardHelp}>Correct the opening balance or source records. No variance is presented.</Text></View>;
  const variance = preview.cashVariance!;
  const result = variance < 0 ? `Short by ${formatMoney(Math.abs(variance))}` : variance > 0 ? `Over by ${formatMoney(variance)}` : 'Cash matches expected closing';
  return <View style={styles.result}><Text style={variance < 0 ? styles.error : styles.success}>{result}</Text><Text style={styles.resultText}>Expected closing: {formatMoney(preview.cashExpectedClosing!)}</Text><Text style={styles.resultText}>Counted closing: {formatMoney(preview.cashActualClosing)}</Text></View>;
}

function PeriodButton({ active, accessibilityLabel, label, onPress }: { active: boolean; accessibilityLabel: string; label: string; onPress: () => void }) { return <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.tab, active && styles.tabActive]}><Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text></Pressable>; }
function Metric({ accent = false, label, value }: { accent?: boolean; label: string; value: number }) { return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, accent && styles.accent]}>{formatMoney(value)}</Text></View>; }
function State({ description, icon, title }: { description: string; icon: keyof typeof Ionicons.glyphMap; title: string }) { return <View style={styles.state}><Ionicons color={colors.mutedForeground} name={icon} size={36} /><Text style={styles.stateTitle}>{title}</Text><Text style={styles.stateDescription}>{description}</Text></View>; }

const styles = StyleSheet.create({
  accent: { color: colors.primary }, badge: { alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: radii.pill, flexDirection: 'row', gap: spacing.xsmall, paddingHorizontal: spacing.small, paddingVertical: spacing.xsmall }, badgeText: { color: colors.primary, fontSize: typography.caption, fontWeight: '700' }, card: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radii.large, borderWidth: 1, gap: spacing.medium, padding: spacing.large }, cardHelp: { color: colors.mutedForeground, fontSize: typography.caption, lineHeight: 18 }, cardTitle: { color: colors.foreground, fontSize: typography.body, fontWeight: '800' }, content: { gap: spacing.large, padding: spacing.xlarge }, dateControls: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, dateHint: { color: colors.mutedForeground, fontSize: typography.caption }, dot: { backgroundColor: colors.primary, borderRadius: radii.pill, height: 7, width: 7 }, error: { color: colors.destructive, fontSize: typography.label, fontWeight: '700' }, eyebrow: { color: colors.primary, fontSize: typography.caption, fontWeight: '800', letterSpacing: 0.7 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.medium }, header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, heading: { color: colors.foreground, fontSize: typography.heading, fontWeight: '800', marginTop: spacing.xsmall }, iconButton: { alignItems: 'center', borderColor: colors.border, borderRadius: radii.medium, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 }, input: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radii.medium, borderWidth: 1, color: colors.foreground, fontSize: typography.body, minHeight: 48, paddingHorizontal: spacing.medium }, metric: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radii.large, borderWidth: 1, flexBasis: '47%', flexGrow: 1, gap: spacing.small, minWidth: 145, padding: spacing.large }, metricLabel: { color: colors.mutedForeground, fontSize: typography.caption }, metricValue: { color: colors.foreground, fontSize: typography.body, fontWeight: '800' }, primaryButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radii.medium, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.large }, primaryButtonText: { color: colors.primaryForeground, fontSize: typography.label, fontWeight: '800' }, result: { backgroundColor: colors.background, borderRadius: radii.medium, gap: spacing.small, padding: spacing.medium }, resultText: { color: colors.foreground, fontSize: typography.label }, row: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: spacing.medium, justifyContent: 'space-between', paddingTop: spacing.medium }, rowLabel: { color: colors.foreground, fontSize: typography.label, fontWeight: '700' }, rowValue: { color: colors.mutedForeground, flexShrink: 1, fontSize: typography.caption, textAlign: 'right' }, screen: { backgroundColor: colors.background }, state: { alignItems: 'center', backgroundColor: colors.background, flex: 1, gap: spacing.medium, justifyContent: 'center', padding: spacing.xxlarge }, stateDescription: { color: colors.mutedForeground, fontSize: typography.body, lineHeight: 22, maxWidth: 420, textAlign: 'center' }, stateTitle: { color: colors.foreground, fontSize: typography.heading, fontWeight: '800', textAlign: 'center' }, success: { color: colors.primary, fontSize: typography.label, fontWeight: '800' }, tab: { alignItems: 'center', borderRadius: radii.medium, flex: 1, minHeight: 44, padding: spacing.medium }, tabActive: { backgroundColor: colors.primary }, tabs: { backgroundColor: colors.muted, borderRadius: radii.medium, flexDirection: 'row', padding: spacing.xsmall }, tabText: { color: colors.mutedForeground, fontSize: typography.label, fontWeight: '700' }, tabTextActive: { color: colors.primaryForeground }, warning: { color: '#C2410C', fontSize: typography.label, fontWeight: '800' },
});
