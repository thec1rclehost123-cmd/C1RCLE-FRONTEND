import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { notifyAuthStateChanged } from '@/auth/authState';
import { clearSession, getSessionMeta } from '@/auth/scannerSession';
import { colors } from '@/theme/tokens';

/**
 * The app-shell header shared by every in-app tab, transcribed from lines
 * 357-363 of ui_example/claude_design_ui/Circle Scanner.html — back button,
 * event name/venue, and a pulsing LIVE badge.
 *
 * It reads the event from the active scanner session rather than taking it
 * as a prop: every tab shows the same event, and passing it in five places
 * invited them to drift (the Door tab was passing its own screen title
 * here, so the header read "Door" instead of the event name).
 *
 * Rendered once by `(tabs)/_layout.tsx`, so it stays put while a tab
 * scrolls. In the reference it sits inside the scroll container and scrolls
 * away — the only deliberate difference here.
 */
export function AppScreenHeader(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<{ title: string; gate: string } | null>(null);
  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    void getSessionMeta()
      .then((meta) => {
        if (meta !== null) {
          // The reference reads "{venue} · All Gates", but the contract's
          // event payload carries only `venueId` (an opaque id, not a
          // display name), so this shows the gate this shift is actually
          // scoped to instead of printing an id at staff.
          setEvent({ title: meta.event.title, gate: meta.gate ?? 'All Gates' });
        }
      })
      .catch(() => {
        setEvent(null);
      });
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [pulse]);

  return (
    // `insets.top` is genuinely 0 in a plain web browser (no notch/status
    // bar to avoid there) — the crop the user reported wasn't really about
    // notch-avoidance, it was just too little breathing room in general.
    // `+ 20` (was `+ 6`) is the part that actually shows up in a browser;
    // `insets.top` still adds real device safe-area on top of it natively.
    <View style={[styles.row, { paddingTop: insets.top + 20 }]}>
      <View style={styles.left}>
        <Pressable
          onPress={() => {
            // Ends the current shift rather than just navigating to
            // `/redeem` — the root layout's redirect only suppresses
            // itself for `/redeem` while state is `needs_redeem`, not
            // `active_session` (see `_layout.tsx`'s `SATISFIED_PREFIXES`
            // comment for why one path can't validly mean two different
            // things there). Clearing the session first makes the state
            // genuinely resolve to `needs_redeem`, so the existing
            // notify-then-passive-redirect pattern lands here correctly
            // instead of needing a direct `router.replace`, which raced
            // the stale-state redirect the same way login/pairing did
            // earlier.
            void clearSession().then(() => {
              notifyAuthStateChanged();
            });
          }}
          style={styles.backButton}
        >
          <Text style={styles.backLabel}>←</Text>
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {event?.title ?? 'No event'}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {event === null ? 'No active shift' : event.gate}
          </Text>
        </View>
      </View>
      <View style={styles.liveBadge}>
        <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
        <Text style={styles.liveLabel}>LIVE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Top inset (status bar / notch) is added inline via useSafeAreaInsets
    // — this base value is the extra breathing room below it.
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceRaised,
    gap: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLabel: {
    color: colors.onSurface,
    fontSize: 16,
  },
  titleBlock: {
    flexShrink: 1,
  },
  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    lineHeight: 23,
    textTransform: 'uppercase',
    color: colors.onSurface,
  },
  meta: {
    fontFamily: 'Archivo_400Regular',
    fontSize: 12,
    color: colors.onSurfaceMuted,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.badgeLiveBg,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  liveLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 11,
    letterSpacing: 0.88,
    color: colors.primary,
  },
});
