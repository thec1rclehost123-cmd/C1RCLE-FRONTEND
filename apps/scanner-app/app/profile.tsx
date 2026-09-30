import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { SettingsPanel } from '@/features/settings/SettingsPanel';
import { colors } from '@/theme/tokens';

/**
 * Profile — reached by tapping the brand mark (the "C" circle) in the
 * header before a shift is open, e.g. `redeem.tsx`. Renders the exact same
 * `SettingsPanel` as `(tabs)/settings.tsx` (reached via the tab bar,
 * in-session) — one screen, two entry points, so the pre-session and
 * in-session views never drift apart. Staff identity and log-out need to
 * be reachable from login onward, not gated behind having already
 * redeemed a door code.
 *
 * A peer screen, not a state-transition target: visiting or leaving it
 * (via the back button) never changes auth state, so `router.back()` is
 * safe here — only `SettingsPanel`'s own log-out/switch-event actions go
 * through the notify-then-passive-redirect pattern the rest of this app
 * uses to avoid a stale-state race.
 */
export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Pressable
        onPress={() => {
          router.back();
        }}
        style={styles.backButton}
      >
        <Text style={styles.backLabel}>←</Text>
      </Pressable>
      <SettingsPanel />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, paddingBottom: 32, gap: 12 },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLabel: { color: colors.onSurface, fontSize: 16 },
});
