import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreenHeader } from '@/components/AppScreenHeader';
import { DoorIcon, GuestsIcon, ScanIcon, SettingsIcon, StatsIcon } from '@/components/TabIcons';
import { useHeartbeat } from '@/features/heartbeat/useHeartbeat';
import { ToastHost } from '@/features/toast/ToastHost';
import { colors } from '@/theme/tokens';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

/**
 * The floating pill nav, transcribed from lines 559-576 of the reference
 * (ui_example/claude_design_ui/Circle Scanner.html).
 *
 * Built as a custom `tabBar` rather than configured through `screenOptions`
 * because two details can't be expressed there: the active state is a pill
 * behind the WHOLE cell (icon and label together), not a highlight around
 * the icon, and the bar sits over a 120px gradient scrim that fades content
 * out beneath it.
 */

const TABS = [
  { name: 'scan', label: 'Scan', Icon: ScanIcon },
  { name: 'door', label: 'Door Entry', Icon: DoorIcon },
  { name: 'stats', label: 'Stats', Icon: StatsIcon },
  { name: 'guests', label: 'Guests', Icon: GuestsIcon },
  { name: 'settings', label: 'Settings', Icon: SettingsIcon },
] as const;

function CircleTabBar({ state, navigation }: BottomTabBarProps): React.JSX.Element {
  return (
    <View style={styles.host} pointerEvents="box-none">
      <LinearGradient
        colors={['rgba(11,10,10,0)', 'rgba(11,10,10,0.85)']}
        locations={[0, 0.7]}
        style={styles.scrim}
        pointerEvents="none"
      />
      <BlurView intensity={40} tint="dark" style={styles.bar}>
        {TABS.map((tab, index) => {
          const focused = state.index === index;
          const tint = focused ? colors.primary : colors.onSurfaceMuted;
          return (
            <Pressable
              key={tab.name}
              accessibilityRole="tab"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={() => {
                const route = state.routes[index];
                if (route === undefined) {
                  return;
                }
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={[styles.cell, focused && styles.cellActive]}
            >
              <tab.Icon color={tint} />
              <Text style={[styles.label, { color: tint }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

export default function TabsLayout(): React.JSX.Element {
  useHeartbeat();
  return (
    <View style={styles.root}>
      <ToastHost />
      <AppScreenHeader />
      <Tabs screenOptions={{ headerShown: false, sceneStyle: styles.scene }} tabBar={(props) => <CircleTabBar {...props} />}>
        {TABS.map((tab) => (
          <Tabs.Screen key={tab.name} name={tab.name} />
        ))}
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scene: {
    backgroundColor: colors.background,
  },
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  bar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 24,
    height: 66,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(38,34,33,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    flexDirection: 'row',
    gap: 2,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 16,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: 999,
  },
  cellActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  label: {
    fontFamily: 'Archivo_700Bold',
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
