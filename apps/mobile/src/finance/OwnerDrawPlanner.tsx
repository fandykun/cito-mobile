import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing } from '@/src/design/tokens';
import { calculateOwnerDrawPlan } from './planning';

const idrFormatter = new Intl.NumberFormat('id-ID');
const currency = (value: number): string => `Rp ${idrFormatter.format(value)}`;

export function OwnerDrawPlanner({
  grossIncome,
  operatingExpenses,
  monthCount,
  percent,
  onChange,
}: {
  grossIncome: number;
  operatingExpenses: number;
  monthCount: 1 | 6;
  percent: number;
  onChange: (percent: number) => void;
}) {
  const plan = calculateOwnerDrawPlan(grossIncome, operatingExpenses, percent, monthCount);
  const adjust = (delta: number) => onChange(Math.min(55, Math.max(10, percent + delta)));
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Perencana Tarif Pengambilan</Text>
      <Text style={styles.copy}>
        Simulasi hipotetis dari pendapatan kotor, bukan anjuran penarikan. Tidak mencatat atau
        mengubah pengambilan aktual.
      </Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kurangi persentase pengambilan"
          disabled={percent === 10}
          accessibilityState={{ disabled: percent === 10 }}
          onPress={() => adjust(-1)}
          style={[styles.button, percent === 10 && styles.disabled]}
        >
          <Text style={styles.title}>−</Text>
        </Pressable>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Persentase pengambilan hipotetis"
          accessibilityHint="Naikkan atau turunkan satu persen, dari 10 hingga 55 persen."
          accessibilityValue={{ min: 10, max: 55, now: percent, text: `${percent}%` }}
          accessibilityActions={[
            { name: 'increment', label: 'Tambah satu persen' },
            { name: 'decrement', label: 'Kurangi satu persen' },
          ]}
          onAccessibilityAction={({ nativeEvent }) => {
            if (nativeEvent.actionName === 'increment') adjust(1);
            if (nativeEvent.actionName === 'decrement') adjust(-1);
          }}
          style={styles.control}
        >
          <Text style={styles.percent}>{percent}%</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${((percent - 10) / 45) * 100}%` }]} />
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tambah persentase pengambilan"
          disabled={percent === 55}
          accessibilityState={{ disabled: percent === 55 }}
          onPress={() => adjust(1)}
          style={[styles.button, percent === 55 && styles.disabled]}
        >
          <Text style={styles.title}>+</Text>
        </Pressable>
      </View>
      <Text style={styles.copy}>10–55% · langkah 1% dari pendapatan kotor</Text>
      <Text style={styles.result}>
        Proyeksi pengambilan: {currency(plan.projectedDraw)} /{' '}
        {monthCount === 6 ? '6 bulan' : 'bulan'}
      </Text>
      {monthCount === 6 ? (
        <Text style={styles.copy}>
          Rata-rata pengambilan: {currency(plan.averageMonthlyDraw)} / bulan
        </Text>
      ) : null}
      <Text style={styles.result}>
        Proyeksi ditahan setelah beban: {currency(plan.projectedRetained)}
      </Text>
      <Text style={styles.copy}>
        Pendapatan kotor − beban operasional − pengambilan hipotetis; bukan sisa setelah pengambilan
        aktual.
      </Text>
      {plan.projectedRetained < 0 ? (
        <Text accessibilityRole="alert" style={styles.result}>
          Simulasi melebihi laba: dana ditahan negatif.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderWidth: 1,
    borderRadius: radii.medium,
    padding: spacing.large,
    gap: spacing.medium,
  },
  title: { color: '#9A3412', fontSize: 14, fontWeight: '800' },
  copy: { color: '#9A3412', fontSize: 12, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  control: { flex: 1, minHeight: 48, justifyContent: 'center', gap: 8 },
  percent: { color: '#C2410C', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  track: { height: 6, backgroundColor: '#FED7AA', borderRadius: 3 },
  fill: { height: 6, backgroundColor: '#F97316', borderRadius: 3 },
  button: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.medium,
    backgroundColor: '#FFEDD5',
  },
  disabled: { opacity: 0.4 },
  result: { color: '#9A3412', fontSize: 13, fontWeight: '700' },
});
