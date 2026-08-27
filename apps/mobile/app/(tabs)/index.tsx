import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuthentication } from '@/src/auth/AuthenticationContext';
import { colors, radii, spacing, typography } from '@/src/design/tokens';

const modules = [
  { icon: 'cube-outline', label: 'Inventaris', status: 'Online list available' },
  { icon: 'document-text-outline', label: 'Rekam Medis', status: 'Encryption required' },
  { icon: 'cart-outline', label: 'Kasir', status: 'Offline PDF required' },
  { icon: 'trending-up-outline', label: 'Keuangan', status: 'Derived summaries' },
] as const;

export default function DashboardScreen() {
  const authentication = useAuthentication();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function signOut(): Promise<void> {
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      await authentication.logout();
    } catch {
      setSignOutError('Secure session storage could not be cleared.');
      setIsSigningOut(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View>
        <Text style={styles.eyebrow}>PRODUCTION MOBILE APP</Text>
        <Text style={styles.heading}>Foundation shell ready</Text>
        <Text style={styles.description}>
          This Expo application is separate from the Figma prototype. Authentication and backend
          foundations are active; clinic data will appear after encrypted local persistence and sync
          pass their gates.
        </Text>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusIcon}>
          <Ionicons color={colors.primary} name="shield-checkmark-outline" size={24} />
        </View>
        <View style={styles.statusText}>
          <Text style={styles.statusTitle}>No mock clinic records</Text>
          <Text style={styles.statusDescription}>
            This authenticated shell contains no prototype clinic data.
          </Text>
        </View>
      </View>

      {authentication.isOfflineSession ? (
        <View style={styles.offlineCard}>
          <Ionicons color={colors.accent} name="cloud-offline-outline" size={22} />
          <Text style={styles.offlineText}>
            Offline session: local access remains available until the saved session expires.
          </Text>
        </View>
      ) : null}

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

      {signOutError ? (
        <Text accessibilityRole="alert" style={styles.signOutError}>
          {signOutError}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={isSigningOut}
        onPress={() => void signOut()}
        style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
      >
        <Ionicons color={colors.destructive} name="log-out-outline" size={20} />
        <Text style={styles.signOutText}>{isSigningOut ? 'Signing out…' : 'Sign out'}</Text>
      </Pressable>
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
  offlineCard: {
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: radii.large,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.medium,
    padding: spacing.large,
  },
  offlineText: {
    color: colors.foreground,
    flex: 1,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.65,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  signOutButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: colors.border,
    borderRadius: radii.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.small,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
  },
  signOutError: {
    color: colors.destructive,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  signOutText: {
    color: colors.destructive,
    fontSize: typography.label,
    fontWeight: '700',
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
