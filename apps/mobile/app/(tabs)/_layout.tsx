import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { AppHeader } from '@/src/components/AppHeader';
import { colors } from '@/src/design/tokens';
import { tabs } from '@/src/navigation/tabs';

const screenTitles: Record<(typeof tabs)[number]['name'], string> = {
  finance: 'Keuangan',
  index: 'Cito Petcare',
  inventory: 'Inventaris',
  pos: 'Kasir',
  records: 'Rekam Medis',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.card },
        headerTitleContainerStyle: { left: 16, right: 16 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 68,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            headerTitle: () => (
              <AppHeader
                subtitle={tab.name === 'index' ? 'Klinik Hewan' : undefined}
                title={screenTitles[tab.name]}
              />
            ),
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons color={color} name={focused ? tab.iconActive : tab.icon} size={size} />
            ),
            title: tab.title,
          }}
        />
      ))}
    </Tabs>
  );
}
