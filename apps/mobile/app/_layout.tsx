import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/src/design/tokens';
import { appEnvironment } from '@/src/config/env';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

const citoTheme = {
  dark: false,
  colors: {
    background: colors.background,
    border: colors.border,
    card: colors.card,
    notification: colors.destructive,
    primary: colors.primary,
    text: colors.foreground,
  },
  fonts: {
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '800' as const },
    medium: { fontFamily: 'System', fontWeight: '600' as const },
    regular: { fontFamily: 'System', fontWeight: '400' as const },
  },
};

export default function RootLayout() {
  void appEnvironment;

  return (
    <ThemeProvider value={citoTheme}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.foreground,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="debug" options={{ title: 'Application diagnostics' }} />
        <Stack.Screen name="storage-spike" options={{ title: 'Encrypted storage proof' }} />
      </Stack>
    </ThemeProvider>
  );
}
