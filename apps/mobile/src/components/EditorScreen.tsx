import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing, typography } from '@/src/design/tokens';

interface EditorScreenProps {
  backLabel: string;
  children: ReactNode;
  error?: string | null;
  footer: ReactNode;
  onCancel: () => void;
  title: string;
}

export function EditorScreen({ backLabel, children, error, footer, onCancel, title }: EditorScreenProps) {
  return (
    <Modal animationType="slide" onRequestClose={onCancel} presentationStyle="fullScreen" testID="editor-modal" visible>
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
          <View style={styles.header}>
            <Pressable
              accessibilityLabel={backLabel}
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <Ionicons color={colors.foreground} name="arrow-back" size={20} />
            </Pressable>
            <Text accessibilityRole="header" style={styles.title}>{title}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Data demo</Text>
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={styles.screen}>
            {children}
          </ScrollView>
          <View style={styles.footer}>
            {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
            {footer}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  badge: { backgroundColor: '#E6F7F5', borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { color: '#0F766E', fontSize: 10, fontWeight: '700' },
  content: { gap: spacing.xlarge, padding: spacing.xlarge, paddingBottom: spacing.xxlarge },
  error: { color: colors.destructive, fontSize: typography.caption, fontWeight: '700', marginBottom: spacing.small },
  footer: { backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 1, padding: spacing.large },
  header: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.small,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  pressed: { opacity: 0.65 },
  screen: { backgroundColor: colors.background, flex: 1 },
  title: { color: colors.foreground, flex: 1, fontSize: typography.body, fontWeight: '800' },
});
