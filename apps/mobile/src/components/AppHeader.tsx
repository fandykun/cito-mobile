import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/design/tokens';

interface AppHeaderProps {
  subtitle?: string | undefined;
  title: string;
}

export function AppHeader({ subtitle, title }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <Image
        accessibilityLabel="Cito Petcare logo"
        source={require('@/assets/images/cito-logo.jpg')}
        style={styles.logo}
      />
      <View style={styles.textContainer}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Link href="/debug" asChild>
        <Pressable
          accessibilityLabel="Open application diagnostics"
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => [styles.debugButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.mutedForeground} name="settings-outline" size={20} />
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.small,
  },
  debugButton: {
    alignItems: 'center',
    borderRadius: radii.medium,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  logo: {
    backgroundColor: colors.card,
    borderRadius: radii.medium,
    height: 36,
    width: 36,
  },
  pressed: {
    backgroundColor: colors.secondary,
    opacity: 0.8,
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.body,
    fontWeight: '800',
  },
});
