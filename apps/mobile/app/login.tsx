import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthenticationError } from '@/src/auth/api';
import { useAuthentication } from '@/src/auth/AuthenticationContext';
import { colors, radii, spacing, typography } from '@/src/design/tokens';

export default function LoginScreen() {
  const authentication = useAuthentication();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = username.trim().length >= 3 && password.length >= 12 && !isSubmitting;

  async function submit(): Promise<void> {
    if (!canSubmit) {
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      await authentication.login(username.trim(), password);
      setPassword('');
    } catch (error: unknown) {
      setMessage(
        error instanceof AuthenticationError
          ? error.message
          : 'The secure session could not be saved on this device.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.card}>
          <View style={styles.brandMark}>
            <Text style={styles.brandLetter}>C</Text>
          </View>
          <View style={styles.headingGroup}>
            <Text style={styles.title}>Sign in to Cito Petcare</Text>
            <Text style={styles.subtitle}>
              Use the clinic account provisioned by the system administrator.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                accessibilityLabel="Username"
                autoCapitalize="none"
                autoComplete="username"
                autoCorrect={false}
                editable={!isSubmitting}
                maxLength={100}
                onChangeText={setUsername}
                returnKeyType="next"
                style={styles.input}
                textContentType="username"
                value={username}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                accessibilityLabel="Password"
                autoCapitalize="none"
                autoComplete="current-password"
                editable={!isSubmitting}
                maxLength={1024}
                onChangeText={setPassword}
                onSubmitEditing={() => void submit()}
                returnKeyType="done"
                secureTextEntry
                style={styles.input}
                textContentType="password"
                value={password}
              />
            </View>

            {message ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {message}
              </Text>
            ) : null}
            {authentication.errorMessage ? (
              <View style={styles.storageError}>
                <Text accessibilityRole="alert" style={styles.error}>
                  {authentication.errorMessage}
                </Text>
                <Pressable accessibilityRole="button" onPress={() => void authentication.retryRestore()}>
                  <Text style={styles.retry}>Retry secure storage</Text>
                </Pressable>
              </View>
            ) : null}
            {authentication.noticeMessage ? (
              <Text style={styles.noticeMessage}>{authentication.noticeMessage}</Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={!canSubmit}
              onPress={() => void submit()}
              style={({ pressed }) => [
                styles.button,
                !canSubmit && styles.buttonDisabled,
                pressed && canSubmit && styles.buttonPressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </Pressable>
          </View>
          <Text style={styles.notice}>
            The first sign-in requires a connection to the clinic server. Credentials are never
            stored on this device.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brandLetter: {
    color: colors.primaryForeground,
    fontSize: 28,
    fontWeight: '800',
  },
  brandMark: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.medium,
    height: 50,
    justifyContent: 'center',
    marginTop: spacing.small,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: colors.primaryForeground,
    fontSize: typography.body,
    fontWeight: '800',
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    gap: spacing.xlarge,
    padding: spacing.xxlarge,
    width: '100%',
  },
  error: {
    color: colors.destructive,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  field: {
    gap: spacing.small,
  },
  form: {
    gap: spacing.large,
  },
  headingGroup: {
    gap: spacing.small,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.medium,
    borderWidth: 1,
    color: colors.foreground,
    fontSize: typography.body,
    minHeight: 48,
    paddingHorizontal: spacing.large,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xlarge,
  },
  label: {
    color: colors.foreground,
    fontSize: typography.label,
    fontWeight: '700',
  },
  notice: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    lineHeight: 18,
    textAlign: 'center',
  },
  noticeMessage: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  retry: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: spacing.small,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  storageError: {
    backgroundColor: '#FFF1F1',
    borderRadius: radii.small,
    padding: spacing.medium,
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  title: {
    color: colors.foreground,
    fontSize: typography.title,
    fontWeight: '800',
    textAlign: 'center',
  },
});
