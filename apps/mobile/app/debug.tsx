import Constants from 'expo-constants';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { appEnvironment } from '@/src/config/env';
import { colors, radii, spacing, typography } from '@/src/design/tokens';

interface DiagnosticRowProps {
  label: string;
  value: string;
}

function DiagnosticRow({ label, value }: DiagnosticRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text selectable style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

export default function DebugScreen() {
  const appVersion = Constants.expoConfig?.version ?? 'unknown';
  const sdkVersion = Constants.expoConfig?.sdkVersion ?? 'unknown';

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View>
        <Text style={styles.eyebrow}>SAFE RUNTIME METADATA</Text>
        <Text style={styles.heading}>Application diagnostics</Text>
        <Text style={styles.description}>
          This screen intentionally excludes credentials, tokens, device identifiers, and clinic
          records.
        </Text>
      </View>

      <View style={styles.card}>
        <DiagnosticRow label="Application" value="Cito Petcare" />
        <DiagnosticRow label="App version" value={appVersion} />
        <DiagnosticRow label="Expo SDK" value={sdkVersion} />
        <DiagnosticRow label="Environment" value={appEnvironment.name} />
        <DiagnosticRow label="API" value={appEnvironment.apiUrl ?? 'Not configured'} />
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Foundation status</Text>
        <Text style={styles.noticeBody}>
          Navigation, environment validation, tests, and design tokens are active. Authentication,
          encrypted persistence, API connectivity, and sync are not implemented yet.
        </Text>
      </View>

      <Link href="/storage-spike" style={styles.spikeLink}>
        Open native encrypted-storage verification
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    paddingHorizontal: spacing.large,
  },
  content: {
    gap: spacing.xlarge,
    padding: spacing.xlarge,
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
  label: {
    color: colors.mutedForeground,
    fontSize: typography.label,
  },
  notice: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: radii.large,
    borderWidth: 1,
    padding: spacing.large,
  },
  noticeBody: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    lineHeight: 20,
    marginTop: spacing.small,
  },
  noticeTitle: {
    color: '#9A3412',
    fontSize: typography.label,
    fontWeight: '800',
  },
  row: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.small,
    paddingVertical: spacing.large,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  spikeLink: {
    backgroundColor: colors.primary,
    borderRadius: radii.large,
    color: colors.primaryForeground,
    fontSize: typography.label,
    fontWeight: '800',
    overflow: 'hidden',
    padding: spacing.large,
    textAlign: 'center',
  },
  value: {
    color: colors.foreground,
    fontSize: typography.body,
    fontWeight: '600',
  },
});
