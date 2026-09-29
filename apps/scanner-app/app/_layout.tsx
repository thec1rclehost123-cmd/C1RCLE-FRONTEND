import { Anton_400Regular } from '@expo-google-fonts/anton';
import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
} from '@expo-google-fonts/archivo';
import { useFonts } from 'expo-font';
import { Redirect, Slot, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useScannerAuthState } from '@/auth/authState';
import { colors } from '@/theme/tokens';
import { injectAutofillStyle } from '@/web/injectAutofillStyle';

// Module scope, not inside the component — this only ever needs to run
// once per page load, and `injectAutofillStyle` is itself idempotent
// (checks for its own `<style>` tag before adding another).
injectAutofillStyle();

const ROUTE_BY_STATE: Record<string, string> = {
  logged_out: '/login',
  needs_pairing: '/pairing',
  needs_redeem: '/redeem',
  active_session: '/(tabs)/scan',
};

/**
 * Path prefixes that count as "already satisfied" for a given state —
 * broader than `ROUTE_BY_STATE`'s single default landing route.
 * `active_session` covers five separate tab screens (only one of which is
 * `/scan`) plus stepping back to `/redeem` to switch events (the same
 * pattern `settings.tsx`'s "Switch event" row already uses) — comparing
 * against `ROUTE_BY_STATE`'s single route alone made every one of those
 * navigations look "not there yet" and forced an immediate `<Redirect>`
 * straight back to `/scan`, which is what made the tab bar look stuck and
 * both back buttons look broken: they DID navigate, then got bounced.
 */
// `/profile` is a peer screen reachable from any state (staff identity
// exists from login onward, before a shift is ever opened — see
// `profile.tsx`'s own doc comment) — appended to every state's list below
// rather than repeated inline.
const PROFILE_PREFIX = '/profile';

const SATISFIED_PREFIXES: Record<string, readonly string[]> = {
  logged_out: ['/login'],
  needs_pairing: ['/pairing', PROFILE_PREFIX],
  needs_redeem: ['/redeem', PROFILE_PREFIX],
  // Deliberately NOT '/redeem' here. `/redeem` is also `needs_redeem`'s own
  // route — if it counted as satisfied for `active_session` too, the very
  // moment a redeem succeeds (state -> active_session while pathname is
  // still '/redeem', mid-transition) this check would read "already
  // satisfied" and suppress the forward redirect to `/scan` that's meant
  // to happen. "Switch event" ends the current session (see
  // `settings.tsx`/`AppScreenHeader`'s back button) so the state itself
  // genuinely becomes `needs_redeem` before navigating, rather than trying
  // to make one path double as valid for two different states.
  active_session: ['/scan', '/door', '/stats', '/guests', '/settings', '/wallet', PROFILE_PREFIX],
};

// Module-level, not a fresh object literal per render — `useFonts` re-runs
// its loading effect whenever the map it's given is a new reference, and
// an inline object literal here is a NEW reference on every RootLayout
// render, which flips `fontsLoaded` false->true repeatedly and re-mounts
// the whole tree (the actual cause of the reported "blinking").
const FONT_MAP = {
  Anton_400Regular,
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
};

export default function RootLayout(): React.JSX.Element {
  const [fontsLoaded] = useFonts(FONT_MAP);
  const { state } = useScannerAuthState();
  const pathname = usePathname();

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const targetRoute = state === 'checking' ? null : (ROUTE_BY_STATE[state] ?? '/login');
  // Only issue a Redirect while we're actually NOT on the target route yet.
  // Rendering <Redirect> unconditionally for the lifetime of the matched
  // route re-fires router.replace() on every layout re-render (any
  // navigation, any state change anywhere below) — a self-redirect loop
  // to the page already showing, which is what "blinking" was.
  //
  // Checked against the broader `SATISFIED_PREFIXES` set, not just
  // `targetRoute` itself — a state can have more than one legitimate
  // screen (every tab under `active_session`), and comparing against only
  // the single default landing route forced a redirect back to it from
  // every other one.
  const satisfiedPrefixes = state === 'checking' ? [] : (SATISFIED_PREFIXES[state] ?? []);
  const alreadyThere = satisfiedPrefixes.some((prefix) => pathname.startsWith(prefix));

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style="light" />
        {targetRoute !== null && !alreadyThere ? <Redirect href={targetRoute} /> : null}
        <Slot />
      </View>
    </SafeAreaProvider>
  );
}
