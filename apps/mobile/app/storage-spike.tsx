import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/design/tokens';
import {
  initializeNativeEncryptedDatabaseSpike,
  verifyNativeEncryptedDatabaseReopen,
  verifyNativeWrongKeyRejection,
} from '@/src/storage/nativeEncryptedDatabaseSpike';

type SpikeAction = 'initialize' | 'reopen' | 'wrong-key';

interface SpikeStatus {
  body: string;
  title: string;
}

const actionLabels: Record<SpikeAction, string> = {
  initialize: 'Reset and initialize encrypted database',
  reopen: 'Verify reopen after app restart',
  'wrong-key': 'Verify wrong-key rejection',
};

export default function StorageSpikeScreen() {
  const [busyAction, setBusyAction] = useState<SpikeAction | null>(null);
  const [key, setKey] = useState('');
  const [status, setStatus] = useState<SpikeStatus>({
    body: 'Enter a temporary test key. The key remains only in component memory and is never displayed in results.',
    title: 'Ready for native verification',
  });

  async function runAction(action: SpikeAction): Promise<void> {
    setBusyAction(action);
    setStatus({ body: 'Running native SQLCipher checks…', title: actionLabels[action] });

    try {
      if (action === 'initialize') {
        const result = await initializeNativeEncryptedDatabaseSpike(key);
        setStatus({
          body: `SQLCipher ${result.cipherVersion}; marker ${result.marker}. Force-close and relaunch the app before running the reopen check.`,
          title: 'Initialization and rollback checks passed',
        });
      } else if (action === 'reopen') {
        const result = await verifyNativeEncryptedDatabaseReopen(key);
        setStatus({
          body: `SQLCipher ${result.cipherVersion}; recovered marker ${result.marker}. The encrypted database survived connection and app restart.`,
          title: 'Correct-key reopen check passed',
        });
      } else {
        await verifyNativeWrongKeyRejection(key);
        setStatus({
          body: 'A derived incorrect key could not query the encrypted database.',
          title: 'Wrong-key rejection passed',
        });
      }
    } catch {
      setStatus({
        body: 'The native database check failed. Confirm this is a SQLCipher-enabled development build and repeat the documented sequence.',
        title: 'Verification failed safely',
      });
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View>
        <Text style={styles.eyebrow}>NATIVE DEVELOPMENT BUILD ONLY</Text>
        <Text style={styles.heading}>Encrypted SQLite proof</Text>
        <Text style={styles.description}>
          This isolated database contains synthetic probe rows only. It does not initialize the Cito
          Petcare domain schema or persist the temporary key.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Temporary test key</Text>
        <TextInput
          accessibilityLabel="Temporary SQLCipher test key"
          autoCapitalize="none"
          autoCorrect={false}
          editable={busyAction === null}
          onChangeText={setKey}
          placeholder="At least 12 printable characters"
          secureTextEntry
          style={styles.input}
          value={key}
        />
        <Text style={styles.help}>
          Do not use a production credential. Authentication-backed secure key provisioning is a
          later phase.
        </Text>
      </View>

      <View style={styles.actions}>
        {(Object.keys(actionLabels) as SpikeAction[]).map((action) => (
          <Pressable
            accessibilityRole="button"
            disabled={busyAction !== null}
            key={action}
            onPress={() => void runAction(action)}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              busyAction !== null && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.buttonText}>
              {busyAction === action ? 'Running…' : actionLabels[action]}
            </Text>
          </Pressable>
        ))}
      </View>

      <View accessibilityLiveRegion="polite" style={styles.statusCard}>
        <Text style={styles.statusTitle}>{status.title}</Text>
        <Text selectable style={styles.statusBody}>
          {status.body}
        </Text>
      </View>

      <View style={styles.sequenceCard}>
        <Text style={styles.sequenceTitle}>Required sequence</Text>
        <Text style={styles.sequenceStep}>1. Initialize and record the synthetic marker.</Text>
        <Text style={styles.sequenceStep}>2. Force-close the app, relaunch it, and re-enter the same key.</Text>
        <Text style={styles.sequenceStep}>3. Verify correct-key reopen.</Text>
        <Text style={styles.sequenceStep}>4. Verify wrong-key rejection.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.medium,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.large,
    padding: spacing.large,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonText: {
    color: colors.primaryForeground,
    fontSize: typography.label,
    fontWeight: '800',
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    gap: spacing.small,
    padding: spacing.large,
  },
  content: {
    backgroundColor: colors.background,
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
  help: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    lineHeight: 17,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.medium,
    borderWidth: 1,
    color: colors.foreground,
    fontSize: typography.body,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.medium,
  },
  label: {
    color: colors.foreground,
    fontSize: typography.label,
    fontWeight: '700',
  },
  sequenceCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    gap: spacing.small,
    padding: spacing.large,
  },
  sequenceStep: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    lineHeight: 20,
  },
  sequenceTitle: {
    color: colors.foreground,
    fontSize: typography.label,
    fontWeight: '800',
    marginBottom: spacing.xsmall,
  },
  statusBody: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    lineHeight: 20,
    marginTop: spacing.small,
  },
  statusCard: {
    backgroundColor: '#E6F7F5',
    borderColor: '#B8E8E3',
    borderRadius: radii.large,
    borderWidth: 1,
    padding: spacing.large,
  },
  statusTitle: {
    color: colors.foreground,
    fontSize: typography.label,
    fontWeight: '800',
  },
});
