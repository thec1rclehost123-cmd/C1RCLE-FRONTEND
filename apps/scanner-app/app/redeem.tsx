import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchTodaysEvents, redeemDoorCode } from '@/api/scannerApiClient';
import { notifyAuthStateChanged } from '@/auth/authState';
import { getOrCreateDeviceId, getStoredDeviceName } from '@/auth/deviceIdentity';
import { persistSession } from '@/auth/scannerSession';
import { getOrganizationId, getStaffUser } from '@/auth/staffAuth';
import { EventCardArt } from '@/components/decor/EventCardArt';
import { ScatterAccents } from '@/components/decor/ScatterAccents';
import { colors } from '@/theme/tokens';

import type { DoorEvent } from '@/api/schemas';

/**
 * Select Event — transcribed from the `isEvents` block of
 * ui_example/claude_design_ui/Circle Scanner.html (lines 285-352).
 *
 * The reference's four cards each have their own palette, height and 3D
 * composition, cycled by position here since the API carries no styling
 * hint. Its first card is the live one; ours marks whichever event is
 * actually `live` per the contract rather than always the first.
 *
 * One deliberate addition: the reference jumps straight from tapping a card
 * into the app, but a real shift needs a door code redeemed for a scanner
 * session (contract §5), so selecting a card reveals the code field.
 */

const CARD_THEMES = [
  {
    background: colors.primary,
    foreground: colors.background,
    arrowBg: colors.background,
    arrowFg: colors.primary,
    height: 200,
    titleSize: 36,
  },
  {
    background: colors.secondary,
    foreground: colors.background,
    arrowBg: colors.background,
    arrowFg: colors.secondary,
    height: 180,
    titleSize: 32,
  },
  {
    background: colors.surface,
    foreground: colors.onSurface,
    arrowBg: colors.onSurface,
    arrowFg: colors.background,
    height: 180,
    titleSize: 32,
  },
  {
    background: colors.tertiary,
    foreground: colors.onSurface,
    arrowBg: colors.onSurface,
    arrowFg: colors.tertiary,
    height: 180,
    titleSize: 32,
  },
] as const;

const CARD_ACCENTS = [
  { leftPct: 58, topPct: 35, width: 8, height: 14, color: colors.background, rotationDeg: 30 },
  { leftPct: 52, topPct: 56, width: 6, height: 12, color: colors.onSurface, rotationDeg: -20 },
  { leftPct: 92, topPct: 75, width: 8, height: 8, color: colors.tertiary, rotationDeg: 45 },
  { leftPct: 64, topPct: 75, width: 5, height: 14, color: colors.secondary, rotationDeg: 70 },
] as const;

/**
 * Best-effort GPS fix for the server's soft geofence (D-030). Never blocks
 * or fails the redeem — permission denial, a timed-out fix, or a web target
 * with no geolocation all resolve to `undefined`, which the server treats
 * as "skip the check", not "deny". The code is still the real authorization;
 * this only ever narrows an already-authorized redemption.
 */
async function tryGetDeviceLocation(): Promise<{ lat: number; lng: number } | undefined> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) return undefined;
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch {
    return undefined;
  }
}

function formatWhen(startAt: string): string {
  const date = new Date(startAt);
  const day = date.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' });
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
}

export default function RedeemScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<DoorEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const organizationId = getOrganizationId();
  const user = getStaffUser();

  useEffect(() => {
    if (organizationId === null) {
      return;
    }
    void fetchTodaysEvents(organizationId)
      .then(setEvents)
      .catch((cause: unknown) => {
        setEventsError(cause instanceof Error ? cause.message : 'Could not load events.');
      });
  }, [organizationId]);

  const handleRedeem = (): void => {
    if (selectedEventId === null) {
      setError('Select tonight’s event first.');
      return;
    }
    setError(null);
    setLoading(true);
    void Promise.all([getOrCreateDeviceId(), getStoredDeviceName(), tryGetDeviceLocation()])
      .then(([deviceId, deviceName, deviceLocation]) =>
        redeemDoorCode({
          eventId: selectedEventId,
          code: code.trim(),
          deviceId,
          deviceName: deviceName ?? deviceId,
          sessionType: 'staff',
          ...(deviceLocation === undefined ? {} : { deviceLocation }),
        }),
      )
      .then((session) =>
        persistSession({
          sessionToken: session.sessionToken,
          sessionId: session.sessionId,
          sessionExpiresAt: session.sessionExpiresAt,
          event: session.event,
          permissions: session.permissions,
          gate: session.gate,
          tiers: session.tiers,
        }),
      )
      .then(() => {
        // See authState.ts: the root layout re-checks and navigates itself.
        notifyAuthStateChanged();
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Could not redeem this code.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const initial = (user?.displayName ?? user?.email ?? '?').slice(0, 1).toUpperCase();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}
    >
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <Pressable
            onPress={() => {
              router.push('/profile');
            }}
            style={styles.brandMark}
          >
            <Text style={styles.brandMarkLabel}>C</Text>
          </Pressable>
          <View>
            <Text style={styles.brandName}>THE C1RCLE</Text>
            <Text style={styles.brandSub}>SCANNER</Text>
          </View>
        </View>
        <View style={styles.gateChip}>
          <Text style={styles.gateChipLabel}>ALL GATES</Text>
          <View style={styles.gateChipAvatar}>
            <Text style={styles.gateChipAvatarLabel}>{initial}</Text>
          </View>
        </View>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>Select{'\n'}Event</Text>
        <Text style={styles.titleMeta}>
          Tonight &amp;{'\n'}upcoming · {events.length}
        </Text>
      </View>

      {organizationId === null ? <Text style={styles.error}>No active staff session.</Text> : null}
      {eventsError !== null ? <Text style={styles.error}>{eventsError}</Text> : null}
      {eventsError === null && events.length === 0 ? (
        <Text style={styles.empty}>No events today.</Text>
      ) : null}

      <View style={styles.cardList}>
        {events.map((event, index) => {
          const theme = CARD_THEMES[index % CARD_THEMES.length] ?? CARD_THEMES[0];
          const selected = event.id === selectedEventId;
          const live = event.status === 'live';
          return (
            <Pressable
              key={event.id}
              onPress={() => {
                setSelectedEventId(event.id);
                setError(null);
              }}
              style={[
                styles.card,
                { backgroundColor: theme.background, height: theme.height },
                // The reference's only bordered card is the dark/surface one
                // (index 2 — "Afro House") — a `border:1px solid #2A2626` it
                // always has, not a selection state (the reference has no
                // selected-card concept; this app adds one below purely
                // because tapping reveals the door-code field instead of
                // navigating immediately).
                index % CARD_THEMES.length === 2 && styles.cardSurfaceBorder,
                selected && styles.cardSelected,
              ]}
            >
              <ScatterAccents accents={CARD_ACCENTS} />
              <EventCardArt variant={index % CARD_THEMES.length} />

              {/* `gap:8`, not space-between — the reference packs the date
                  pill and LIVE badge together at the left, it does not
                  spread them across the card. */}
              <View style={styles.cardTopRow}>
                <View style={[styles.datePill, { borderColor: theme.foreground }]}>
                  <Text style={[styles.datePillLabel, { color: theme.foreground }]}>
                    {formatWhen(event.startAt)}
                  </Text>
                </View>
                {live ? (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveLabel}>LIVE</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.cardBottomRow}>
                <View style={styles.cardTitleBlock}>
                  <Text
                    style={[
                      styles.cardTitle,
                      {
                        color: theme.foreground,
                        fontSize: theme.titleSize,
                        lineHeight: theme.titleSize * 0.95,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {event.title}
                  </Text>
                  <Text style={[styles.cardMeta, { color: theme.foreground }]} numberOfLines={1}>
                    {event.capacity === null
                      ? 'Capacity not set'
                      : `${String(event.capacity)} capacity`}
                  </Text>
                </View>
                <View style={[styles.cardArrow, { backgroundColor: theme.arrowBg }]}>
                  <Text style={[styles.cardArrowLabel, { color: theme.arrowFg }]}>→</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {selectedEventId !== null ? (
        <View style={styles.form}>
          <Text style={styles.formLabel}>DOOR CODE</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            placeholder="C1R-XXXXXXXX"
            placeholderTextColor={colors.onSurfaceFaint}
            style={styles.input}
          />
          {error !== null ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            onPress={handleRedeem}
            disabled={loading || code.trim().length === 0}
            style={[styles.submit, code.trim().length === 0 && styles.submitDisabled]}
          >
            <Text style={styles.submitLabel}>
              {loading ? 'OPENING SHIFT…' : 'REDEEM & OPEN SHIFT'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkLabel: { fontFamily: 'Anton_400Regular', fontSize: 18, color: colors.background },
  brandName: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 14,
    letterSpacing: 0.28,
    color: colors.onSurface,
  },
  brandSub: {
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 10,
    letterSpacing: 2,
    color: colors.onSurfaceMuted,
  },
  gateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingLeft: 12,
    padding: 5,
  },
  gateChipLabel: { fontFamily: 'Archivo_700Bold', fontSize: 12, color: colors.onSurface },
  gateChipAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.onSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateChipAvatarLabel: { fontFamily: 'Archivo_700Bold', fontSize: 12, color: colors.background },

  titleRow: {
    paddingTop: 26,
    paddingHorizontal: 4,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 62,
    lineHeight: 56,
    // -.01em of a 62px face — RN letterSpacing is absolute points, not em.
    letterSpacing: -0.62,
    textTransform: 'uppercase',
    color: colors.onSurface,
  },
  titleMeta: {
    fontFamily: 'Archivo_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.onSurfaceMuted,
    textAlign: 'right',
    paddingBottom: 6,
  },

  cardList: { gap: 10 },
  card: {
    position: 'relative',
    borderRadius: 30,
    padding: 20,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  cardSurfaceBorder: { borderWidth: 1, borderColor: colors.border },
  cardSelected: { borderWidth: 2, borderColor: colors.onSurface },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  datePill: { borderWidth: 1.5, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14 },
  datePillLabel: { fontFamily: 'Archivo_600SemiBold', fontSize: 13 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  liveLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 11,
    letterSpacing: 0.88,
    color: colors.primary,
  },

  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  // The reference's mock titles ("Neon Nights Vol. 04") are short enough to
  // never reach the card's decorative art in the top-right corner. Real
  // event titles aren't bounded that way, so a `flex: 1` block was letting
  // a long title's second line run underneath the art. `maxWidth` keeps
  // text clear of that zone regardless of length.
  cardTitleBlock: { flex: 1, maxWidth: '62%' },
  cardTitle: { fontFamily: 'Anton_400Regular', lineHeight: 34, textTransform: 'uppercase' },
  cardMeta: { fontFamily: 'Archivo_500Medium', fontSize: 13, marginTop: 6 },
  cardArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArrowLabel: { fontSize: 20 },

  form: { gap: 10, paddingTop: 20 },
  formLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.54,
    color: colors.onSurfaceMuted,
  },
  input: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.onSurface,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
  },
  submit: {
    height: 56,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 14,
    letterSpacing: 1.96,
    color: colors.background,
  },

  error: {
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    color: colors.primary,
    paddingHorizontal: 4,
  },
  empty: {
    fontFamily: 'Archivo_400Regular',
    fontSize: 13,
    color: colors.onSurfaceMuted,
    paddingHorizontal: 4,
  },
});
