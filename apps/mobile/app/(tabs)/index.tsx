import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/design/tokens';

const modules = [
  { icon: 'cube-outline', label: 'Inventaris', status: 'Planned vertical slice' },
  { icon: 'document-text-outline', label: 'Rekam Medis', status: 'Encryption required' },
  { icon: 'cart-outline', label: 'Kasir', status: 'Offline PDF required' },
  { icon: 'trending-up-outline', label: 'Keuangan', status: 'Derived summaries' },
] as const;

export default function DashboardScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View>
        <Text style={styles.eyebrow}>PRODUCTION MOBILE APP</Text>
        <Text style={styles.heading}>Foundation shell ready</Text>
        <Text style={styles.description}>
          This Expo application is separate from the Figma prototype. Domain data will only appear
          after encrypted persistence, authentication, and sync foundations pass their gates.
        </Text>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusIcon}>
          <Ionicons color={colors.primary} name="shield-checkmark-outline" size={24} />
        </View>
        <View style={styles.statusText}>
          <Text style={styles.statusTitle}>No mock clinic records</Text>
          <Text style={styles.statusDescription}>
            This shell contains navigation and design tokens only.
          </Text>
        </View>
      </View>

      <View>
        <Text style={styles.sectionTitle}>MVP modules</Text>
        <View style={styles.moduleGrid}>
          {modules.map((module) => (
            <View key={module.label} style={styles.moduleCard}>
              <Ionicons color={colors.primary} name={module.icon} size={22} />
              <Text style={styles.moduleLabel}>{module.label}</Text>
              <Text style={styles.moduleStatus}>{module.status}</Text>
            </View>
          ))}
        </View>
      </View>

      <Link href="/debug" asChild>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.debugLink, pressed && styles.pressed]}
        >
          <View>
            <Text style={styles.debugTitle}>Application diagnostics</Text>
            <Text style={styles.debugDescription}>Inspect environment and runtime metadata</Text>
          </View>
          <Ionicons color={colors.mutedForeground} name="chevron-forward" size={20} />
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xlarge,
    padding: spacing.xlarge,
  },
  debugDescription: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    marginTop: spacing.xsmall,
  },
  debugLink: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.large,
  },
  debugTitle: {
    color: colors.foreground,
    fontSize: typography.body,
    fontWeight: '700',
  },
  description: {
    color: colors.mutedForeground,
    fontSize: typography.body,
    lineHeight: 22,
    marginTop: spacing.small,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heading: {
    color: colors.foreground,
    fontSize: typography.title,
    fontWeight: '800',
    marginTop: spacing.xsmall,
  },
  moduleCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.small,
    minHeight: 128,
    padding: spacing.large,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.medium,
  },
  moduleLabel: {
    color: colors.foreground,
    fontSize: typography.label,
    fontWeight: '800',
  },
  moduleStatus: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.65,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: typography.label,
    fontWeight: '800',
    marginBottom: spacing.medium,
  },
  statusCard: {
    alignItems: 'center',
    backgroundColor: '#E6F7F5',
    borderColor: '#B8E8E3',
    borderRadius: radii.large,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.medium,
    padding: spacing.large,
  },
  statusDescription: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    lineHeight: 17,
    marginTop: spacing.xsmall,
  },
  statusIcon: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.medium,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    color: colors.foreground,
    fontSize: typography.label,
    fontWeight: '800',
  },
});
