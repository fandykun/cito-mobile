import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuthentication } from '@/src/auth/AuthenticationContext';
import { appEnvironment } from '@/src/config/env';
import { colors, radii, spacing, typography } from '@/src/design/tokens';
import { FinanceApi } from '@/src/finance/api';
import { LiveFinanceScreen } from '@/src/finance/LiveFinanceScreen';
import { MockFinanceScreen } from '@/src/finance/MockFinanceScreen';

const financeApi = new FinanceApi(appEnvironment.apiUrl);

export default function FinanceScreen() {
  const authentication = useAuthentication();
  if (!authentication.session) {
    return (
      <View style={styles.reviewContainer}>
        <View style={styles.connectionBanner}>
          <View style={styles.connectionText}>
            <Text style={styles.connectionTitle}>Reviewing demo finance</Text>
            <Text style={styles.connectionDescription}>
              Sign in to load daily and monthly totals from the clinic database.
            </Text>
          </View>
          <Link href="/login" asChild>
            <Pressable
              accessibilityLabel="Sign in to connected finance"
              accessibilityRole="button"
              style={({ pressed }) => [styles.signInButton, pressed && styles.pressed]}
            >
              <Text style={styles.signInButtonText}>Sign in</Text>
            </Pressable>
          </Link>
        </View>
        <View style={styles.reviewContent}>
          <MockFinanceScreen />
        </View>
      </View>
    );
  }
  return (
    <LiveFinanceScreen
      accessToken={authentication.session.accessToken}
      api={financeApi}
      isOnline={!authentication.isOfflineSession}
    />
  );
}

const styles = StyleSheet.create({
  connectionBanner: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.medium,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
  },
  connectionDescription: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    lineHeight: 17,
  },
  connectionText: {
    flex: 1,
    gap: spacing.xsmall,
  },
  connectionTitle: {
    color: colors.foreground,
    fontSize: typography.label,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
  reviewContainer: {
    backgroundColor: colors.background,
    flex: 1,
  },
  reviewContent: {
    flex: 1,
  },
  signInButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.medium,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.large,
  },
  signInButtonText: {
    color: colors.primaryForeground,
    fontSize: typography.label,
    fontWeight: '800',
  },
});
