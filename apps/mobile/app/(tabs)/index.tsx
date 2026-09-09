import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { dashboardMockData } from '@/src/dashboard/mockData';
import { colors, radii, spacing, typography } from '@/src/design/tokens';

const idrFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });

function formatShortIdr(value: number): string {
  if (value >= 1_000_000_000) {
    return `Rp ${idrFormatter.format(value / 1_000_000_000)} M`;
  }
  if (value >= 1_000_000) {
    return `Rp ${idrFormatter.format(value / 1_000_000)} jt`;
  }
  if (value >= 1_000) {
    return `Rp ${idrFormatter.format(value / 1_000)} rb`;
  }
  return `Rp ${idrFormatter.format(value)}`;
}

export default function DashboardScreen() {
  const drawPercentage = Math.round(
    (dashboardMockData.ownerDraw.value / dashboardMockData.ownerDraw.grossIncome) * 100,
  );

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.welcomeRow}>
        <View style={styles.welcomeText}>
          <Text style={styles.date}>{dashboardMockData.displayDate}</Text>
          <Text style={styles.greeting}>{dashboardMockData.greeting}</Text>
        </View>
        <View style={styles.demoBadge}>
          <View style={styles.demoDot} />
          <Text style={styles.demoBadgeText}>Data demo</Text>
        </View>
      </View>

      <View style={styles.metricGrid}>
        {dashboardMockData.metrics.map((metric) => (
          <View key={metric.label} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{formatShortIdr(metric.value)}</Text>
            <View style={styles.metricSupportingRow}>
              {metric.trend ? (
                <>
                  <Ionicons color={colors.primary} name="arrow-up-outline" size={13} />
                  <Text style={styles.metricTrend}>{metric.trend}</Text>
                </>
              ) : null}
              <Text numberOfLines={2} style={styles.metricSupportingText}>
                {metric.supportingText}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.drawCard}>
        <View style={styles.drawHeader}>
          <View style={styles.drawTitleRow}>
            <Ionicons color="#C2410C" name="wallet-outline" size={18} />
            <Text style={styles.drawTitle}>
              Pengambilan Pribadi — {dashboardMockData.ownerDraw.month}
            </Text>
          </View>
          <Text style={styles.drawValue}>{formatShortIdr(dashboardMockData.ownerDraw.value)}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { flex: drawPercentage }]} />
          <View style={{ flex: 100 - drawPercentage }} />
        </View>
        <Text style={styles.drawDescription}>{drawPercentage}% dari total pendapatan kotor</Text>
      </View>

      <View>
        <Text style={styles.sectionTitle}>Akses cepat</Text>
        <View style={styles.shortcutGrid}>
          {dashboardMockData.shortcuts.map((shortcut) => (
            <Link key={shortcut.href} href={shortcut.href} asChild>
              <Pressable
                accessibilityLabel={shortcut.accessibilityLabel}
                accessibilityRole="link"
                style={styles.shortcut}
              >
                <View style={styles.shortcutIcon}>
                  <Ionicons color={colors.primary} name={shortcut.icon} size={21} />
                </View>
                <Text style={styles.shortcutLabel}>{shortcut.label}</Text>
                <Ionicons color={colors.mutedForeground} name="chevron-forward" size={17} />
              </Pressable>
            </Link>
          ))}
        </View>
      </View>

      <View>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons color={colors.destructive} name="warning-outline" size={17} />
            <Text style={styles.sectionTitle}>Stok Menipis</Text>
          </View>
          <Text style={styles.sectionCount}>{dashboardMockData.lowStockItems.length} item</Text>
        </View>
        <View style={styles.listCard}>
          {dashboardMockData.lowStockItems.map((item, index) => (
            <View
              key={item.id}
              style={[styles.stockRow, index > 0 ? styles.stockRowBorder : undefined]}
            >
              <Text style={styles.stockName}>{item.name}</Text>
              <View style={[styles.stockBadge, item.stock <= 2 && styles.stockBadgeUrgent]}>
                <Text
                  style={[styles.stockBadgeText, item.stock <= 2 && styles.stockBadgeTextUrgent]}
                >
                  {item.stock} {item.unit}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.disclaimer}>
        Angka dan nama pada beranda ini hanya untuk pengembangan tampilan. Belum terhubung ke data
        klinik atau API produksi.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xlarge,
    padding: spacing.xlarge,
    paddingBottom: spacing.xxlarge,
  },
  date: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  demoBadge: {
    alignItems: 'center',
    backgroundColor: '#E6F7F5',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  demoBadgeText: {
    color: '#0F766E',
    fontSize: typography.caption,
    fontWeight: '700',
  },
  demoDot: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: 6,
    width: 6,
  },
  disclaimer: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    lineHeight: 18,
    textAlign: 'center',
  },
  drawCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: radii.large,
    borderWidth: 1,
    padding: spacing.large,
  },
  drawDescription: {
    color: '#EA580C',
    fontSize: typography.caption,
    fontWeight: '600',
    marginTop: spacing.small,
  },
  drawHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  drawTitle: {
    color: '#9A3412',
    flexShrink: 1,
    fontSize: typography.label,
    fontWeight: '700',
  },
  drawTitleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.small,
  },
  drawValue: {
    color: '#C2410C',
    fontSize: typography.body,
    fontWeight: '800',
    marginLeft: spacing.small,
  },
  greeting: {
    color: colors.foreground,
    fontSize: typography.heading,
    fontWeight: '800',
    marginTop: spacing.xsmall,
  },
  listCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    overflow: 'hidden',
  },
  metricCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    flex: 1,
    minHeight: 132,
    padding: spacing.large,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: spacing.medium,
  },
  metricLabel: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.55,
    minHeight: 28,
    textTransform: 'uppercase',
  },
  metricSupportingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginTop: spacing.small,
  },
  metricSupportingText: {
    color: colors.mutedForeground,
    fontSize: 10,
    lineHeight: 14,
  },
  metricTrend: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  metricValue: {
    color: colors.foreground,
    fontSize: typography.heading,
    fontWeight: '800',
    marginTop: spacing.small,
  },
  progressFill: {
    backgroundColor: '#FB923C',
    borderRadius: radii.pill,
  },
  progressTrack: {
    backgroundColor: '#FFEDD5',
    borderRadius: radii.pill,
    flexDirection: 'row',
    height: 6,
    marginTop: spacing.medium,
    overflow: 'hidden',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionCount: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.medium,
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: typography.label,
    fontWeight: '800',
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.small,
  },
  shortcut: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.medium,
    padding: spacing.medium,
  },
  shortcutGrid: {
    gap: spacing.small,
    marginTop: spacing.medium,
  },
  shortcutIcon: {
    alignItems: 'center',
    backgroundColor: '#E6F7F5',
    borderRadius: radii.medium,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  shortcutLabel: {
    color: colors.foreground,
    flex: 1,
    fontSize: typography.label,
    fontWeight: '700',
  },
  stockBadge: {
    backgroundColor: '#FFF7ED',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stockBadgeText: {
    color: '#C2410C',
    fontSize: typography.caption,
    fontWeight: '700',
  },
  stockBadgeTextUrgent: {
    color: colors.destructive,
  },
  stockBadgeUrgent: {
    backgroundColor: '#FEE2E2',
  },
  stockName: {
    color: colors.foreground,
    flex: 1,
    fontSize: typography.label,
    fontWeight: '600',
    marginRight: spacing.medium,
  },
  stockRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
  },
  stockRowBorder: {
    borderColor: colors.border,
    borderTopWidth: 1,
  },
  welcomeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  welcomeText: {
    flex: 1,
    marginRight: spacing.medium,
  },
});
