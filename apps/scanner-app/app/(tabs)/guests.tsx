import { useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { fetchGuests, manualCheckIn } from '@/api/scannerApiClient';
import { getSessionMeta } from '@/auth/scannerSession';
import { canOverride, getStaffUser } from '@/auth/staffAuth';
import { showToast } from '@/features/toast/toastStore';
import { colors } from '@/theme/tokens';

import type { DoorEvent, Guest } from '@/api/schemas';

/**
 * Guests — transcribed from the `isGuests` block of
 * ui_example/claude_design_ui/Circle Scanner.html (lines 536-556).
 *
 * The reference's five filter chips (All/Checked in/Pending/VIP/Guestlist)
 * assume a "tier" concept that `DoorGuest` does not have — the real schema
 * is `id`/`name`/`ticketType`/`entryType`/`quantity`/`source`/`status`, with
 * `status` being exactly `entered` or `not_entered`. VIP/Guestlist were
 * invented mock data; filtering by them here would be fabricating a
 * category the server never sends. Filters are the three that map onto
 * real fields: All, Entered, Not entered.
 *
 * Search hits the server (`GET /door/guests?search=`), server-side, per the
 * contract — a festival roster is tens of thousands of names, not something
 * to filter client-side after downloading in full.
 */

const FILTERS = ['All', 'Entered', 'Not entered'] as const;
type Filter = (typeof FILTERS)[number];

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * A dedicated, unmistakable admit action — a filled circle that pops on
 * press rather than the whole row silently doubling as a button (the
 * previous behaviour: the entire row was pressable with no distinct
 * affordance, easy to tap by accident and hard to notice you even could).
 * `disabled` renders as the same static "PENDING" pill the row used to
 * show unconditionally, for staff without override rights.
 */
function AdmitButton({
  onPress,
  disabled,
  label,
}: {
  readonly onPress: () => void;
  readonly disabled: boolean;
  readonly label: string;
}): React.JSX.Element {
  const [scale] = useState(() => new Animated.Value(1));

  if (disabled) {
    return (
      <View style={[styles.statusPill, styles.statusPillPending]}>
        <Text style={[styles.statusLabel, styles.statusLabelPending]}>PENDING</Text>
      </View>
    );
  }

  const animateTo = (value: number): void => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 12,
    }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => {
        animateTo(0.88);
      }}
      onPressOut={() => {
        animateTo(1);
      }}
      hitSlop={8}
    >
      <Animated.View style={[styles.admitButton, { transform: [{ scale }] }]}>
        <Text style={styles.admitCheck}>✓</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function GuestsScreen(): React.JSX.Element {
  const [event, setEvent] = useState<DoorEvent | null>(null);
  const [search, setSearch] = useState('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('All');
  const [pendingAdmission, setPendingAdmission] = useState<Guest | null>(null);
  const [admitting, setAdmitting] = useState(false);
  const staffCanOverride = canOverride(getStaffUser()?.role);

  useEffect(() => {
    void getSessionMeta().then((meta) => {
      setEvent(meta?.event ?? null);
    });
  }, []);

  useEffect(() => {
    if (event === null) {
      return;
    }
    const trimmed = search.trim();
    const handle = setTimeout(() => {
      void fetchGuests({
        eventId: event.id,
        ...(trimmed.length > 0 ? { search: trimmed } : {}),
        ...(filter === 'Entered' ? { status: 'entered' as const } : {}),
        ...(filter === 'Not entered' ? { status: 'not_entered' as const } : {}),
      })
        .then((result) => {
          setGuests(result.items);
          setTruncated(result.truncated);
          setError(null);
        })
        .catch((cause: unknown) => {
          setError(cause instanceof Error ? cause.message : 'Could not load guests.');
        });
    }, 300);
    return () => {
      clearTimeout(handle);
    };
  }, [event, search, filter]);

  const visible = useMemo(() => guests, [guests]);

  const handleCheckIn = (guest: Guest): void => {
    if (event === null || !staffCanOverride) {
      return;
    }
    setPendingAdmission(guest);
  };

  const confirmManualAdmission = () => {
    if (!pendingAdmission || !event || admitting) return;
    setAdmitting(true);
    void manualCheckIn(pendingAdmission.id, event.id, {
      eligibilityVerified: true,
      coupleConfirmed: pendingAdmission.quantity === 2,
      reason: 'QR unavailable; door staff confirmed eligibility',
    })
      .then((result) => {
        setGuests((current) =>
          current.map((guest) => (guest.id === result.guest.id ? result.guest : guest)),
        );
        setPendingAdmission(null);
        showToast(`${result.guest.name} admitted`);
      })
      .catch((cause: unknown) => {
        showToast(cause instanceof Error ? cause.message : 'Check-in failed');
      })
      .finally(() => {
        setAdmitting(false);
      });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Guests</Text>
        <Text style={styles.titleMeta}>{guests.length} on list</Text>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search name, phone or ticket…"
        placeholderTextColor={colors.onSurfaceFaint}
        style={styles.search}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((entry) => {
          const active = entry === filter;
          return (
            <Pressable
              key={entry}
              onPress={() => {
                setFilter(entry);
              }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{entry}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {truncated ? (
        <Text style={styles.notice}>More results not shown — refine your search.</Text>
      ) : null}
      {error !== null ? <Text style={styles.error}>{error}</Text> : null}
      {!staffCanOverride ? (
        <Text style={styles.notice}>
          Your role can't manually check guests in — tap does nothing.
        </Text>
      ) : null}

      {pendingAdmission ? (
        <View style={[styles.listCard, styles.confirmationCard]} accessibilityLiveRegion="polite">
          <Text style={styles.guestName}>Confirm manual admission: {pendingAdmission.name}</Text>
          <Text style={styles.notice}>
            {pendingAdmission.requirement
              ? `REQUIREMENT: ${pendingAdmission.requirement}`
              : 'Confirm this guest is present and meets the ticket requirement.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={admitting}
            onPress={confirmManualAdmission}
            style={styles.chip}
          >
            <Text style={styles.chipLabel}>
              {admitting ? 'ADMITTING…' : 'REQUIREMENT MET — ADMIT'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={admitting}
            onPress={() => {
              setPendingAdmission(null);
            }}
            style={styles.chip}
          >
            <Text style={styles.chipLabel}>REJECT — KEEP TICKET UNUSED</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.listCard}>
        {visible.length === 0 ? <Text style={styles.empty}>No guests match.</Text> : null}
        {visible.map((guest) => {
          const entered = guest.status === 'entered';
          return (
            <View key={guest.id} style={styles.row}>
              <View style={[styles.avatar, guest.source === 'online' && styles.avatarOnline]}>
                <Text style={styles.avatarLabel}>{initials(guest.name)}</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.guestName} numberOfLines={1}>
                  {guest.name || 'Awaiting assignment'}
                </Text>
                <Text style={styles.guestMeta} numberOfLines={1}>
                  {guest.ticketType} · {guest.requirement ?? guest.entryType}
                  {guest.quantity > 1 ? ` · ×${String(guest.quantity)}` : ''}
                </Text>
              </View>
              {entered ? (
                <View style={[styles.statusPill, styles.statusPillIn]}>
                  <Text style={[styles.statusLabel, styles.statusLabelIn]}>IN</Text>
                </View>
              ) : (
                <AdmitButton
                  label={`Admit ${guest.name || 'guest'}`}
                  disabled={!staffCanOverride || guest.ownershipStatus === 'unassigned'}
                  onPress={() => {
                    handleCheckIn(guest);
                  }}
                />
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  confirmationCard: { padding: 16, gap: 12 },
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, paddingBottom: 110, gap: 12 },
  titleRow: {
    paddingHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 44,
    lineHeight: 40,
    textTransform: 'uppercase',
    color: colors.onSurface,
  },
  titleMeta: { fontFamily: 'Archivo_400Regular', fontSize: 13, color: colors.onSurfaceMuted },

  search: {
    height: 50,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.onSurface,
    paddingHorizontal: 20,
    fontSize: 14,
    fontFamily: 'Archivo_400Regular',
  },

  filterRow: { gap: 8, paddingBottom: 2 },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { fontFamily: 'Archivo_700Bold', fontSize: 12, color: colors.onSurface },
  chipLabelActive: { color: colors.background },

  notice: { fontFamily: 'Archivo_400Regular', fontSize: 12, color: colors.onSurfaceMuted },
  error: { fontFamily: 'Archivo_600SemiBold', fontSize: 12, color: colors.primary },

  listCard: {
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  empty: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    textAlign: 'center',
    fontSize: 13,
    color: colors.onSurfaceMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceRaised,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  avatarOnline: { backgroundColor: colors.tertiary },
  avatarLabel: { fontFamily: 'Archivo_800ExtraBold', fontSize: 13, color: colors.onSurface },
  rowText: { flex: 1 },
  guestName: { fontFamily: 'Archivo_700Bold', fontSize: 14, color: colors.onSurface },
  guestMeta: { fontFamily: 'Archivo_400Regular', fontSize: 12, color: colors.onSurfaceMuted },
  statusPill: { paddingVertical: 5, paddingHorizontal: 9, borderRadius: 999 },
  statusPillIn: { backgroundColor: '#12202f' },
  statusPillPending: { backgroundColor: colors.surfaceRaised },
  statusLabel: { fontFamily: 'Archivo_800ExtraBold', fontSize: 10, letterSpacing: 0.8 },
  statusLabelIn: { color: colors.secondary },
  statusLabelPending: { color: colors.onSurfaceMuted },

  admitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4,
  },
  admitCheck: { color: colors.background, fontSize: 17, fontFamily: 'Archivo_800ExtraBold' },
});
