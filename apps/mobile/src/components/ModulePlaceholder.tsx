import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/design/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface ModulePlaceholderProps {
  description: string;
  icon: IconName;
  title: string;
}

export function ModulePlaceholder({ description, icon, title }: ModulePlaceholderProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons color={colors.primary} name={icon} size={28} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Foundation shell</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.secondary,
    borderRadius: radii.pill,
    marginTop: spacing.small,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  badgeText: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.large,
    borderWidth: 1,
    gap: spacing.medium,
    padding: spacing.xxlarge,
  },
  description: {
    color: colors.mutedForeground,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: '#E6F7F5',
    borderRadius: radii.large,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xlarge,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.heading,
    fontWeight: '800',
  },
});
