import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/src/design/tokens';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen does not exist.</Text>
        <Link href="/" style={styles.link}>
          Return to Cito Petcare
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.large,
    justifyContent: 'center',
    padding: spacing.xlarge,
  },
  link: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '700',
  },
  title: {
    color: colors.foreground,
    fontSize: typography.heading,
    fontWeight: '800',
  },
});
