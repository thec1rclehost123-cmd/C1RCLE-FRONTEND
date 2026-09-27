import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { fetchDoorSales, fetchStats, openStatsStream } from '@/api/scannerApiClient';
import { getSessionMeta } from '@/auth/scannerSession';
import { Turntable } from '@/components/decor/Turntable';
import { colors } from '@/theme/tokens';

import type { DoorSale, DoorStats } from '@/api/schemas';
import type { DimensionValue } from 'react-native';

/** RN types percentage strings as the opaque `DimensionValue`, so a computed
 * `${n}%` needs the cast even though the value is well-formed. */
function percentWidth(value: number): DimensionValue {
  return `${String(value)}%` as DimensionValue;
}

/**
 * Stats — transcribed from the `isStats` block of
 * ui_example/claude_design_ui/Circle Scanner.html (lines 470-508).
 *
 * The layout is the reference's in full. The numbers are not all available:
 * `GET /door/stats` returns only `occupancy` (inside / capacity / remaining
 * / prebooked). Everything else here is either derived from real door-sale
 * records or shown as unavailable — deliberately never invented, since a
 * fabricated headcount at a door is worse than a blank one. Each such card
 * says what it's missing rather than rendering a plausible number.
 */

interface Derived {
  readonly doorHeads: number;
  readonly tables: number;
  readonly takenPaise: number;
}

/**
 * Gender and average age are NOT derivable. They are write-only inputs on
 * walk-in/dine-in — `DoorSaleResponse` returns headcount and money only
 * (contract §9), so there is nowhere on the client to compute them from.
 * An earlier pass computed them from fields that looked present on the
 * schema but are never sent; typecheck caught it once the schema was
 * corrected against the contract.
 */
function derive(walkIns: DoorSale[], dineIns: DoorSale[]): Derived {
  const all = [...walkIns, ...dineIns];
  return {
    doorHeads: all.reduce((sum, sale) => sum + sale.totalGuests, 0),
    tables: dineIns.length,
    takenPaise: all.reduce((sum, sale) => sum + sale.amountPaise, 0),
  };
}

export default function StatsScreen(): React.JSX.Element {
  const [stats, setStats] = useState<DoorStats | null>(null);
  const [derived, setDerived] = useState<Derived | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [live, setLive] = useState(false);

  // Door-sale records (walk-ins/dine-ins) have no stream — `GET /door/stats/
  // stream` only carries occupancy — so they're still polled. Occupancy
  // itself comes off the stream below, replacing what used to be the same
  // 15s poll for both.
  useEffect(() => {
    let cancelled = false;
    const load = (): void => {
      void getSessionMeta()
        .then(async (meta) => {
          if (meta === null) {
            throw new Error('No active scanner session.');
          }
          const [walkIns, dineIns] = await Promise.all([
            fetchDoorSales(meta.event.id, 'walkin'),
            fetchDoorSales(meta.event.id, 'dinein'),
          ]);
          if (!cancelled) {
            setDerived(derive(walkIns, dineIns));
            setError(null);
          }
        })
        .catch((cause: unknown) => {
          if (!cancelled) {
            setError(cause instanceof Error ? cause.message : 'Could not load stats.');
          }
        });
    };
    load();
    const handle = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let stream: { close: () => void } | null = null;
    let reconnectHandle: ReturnType<typeof setTimeout> | null = null;

    const openStream = (eventId: string): void => {
      stream = openStatsStream(eventId, {
        onStats: (next) => {
          if (cancelled) return;
          setStats(next);
          setLive(true);
          setError(null);
        },
        onClosed: () => {
          if (cancelled) return;
          setLive(false);
          // 'expired' is the server's own bounded-lifetime rotation, and a
          // network drop is ordinary — both are expected to reconnect.
          // Anything else (access revoked, event gone) still retries, since
          // there's no separate poll fallback wired here to fall back to.
          reconnectHandle = setTimeout(() => {
            if (!cancelled) openStream(eventId);
          }, 2000);
        },
      });
    };

    void getSessionMeta().then((meta) => {
      if (cancelled || meta === null) return;
      // Prime the screen instantly — the stream's own first frame arrives a
      // moment later, but a live tab shouldn't render blank until it does.
      void fetchStats(meta.event.id)
        .then((initial) => {
          if (!cancelled) setStats(initial);
        })
        .catch(() => undefined);
      openStream(meta.event.id);
    });

    return () => {
      cancelled = true;
      stream?.close();
      if (reconnectHandle !== null) clearTimeout(reconnectHandle);
    };
  }, []);

  const inside = stats?.occupancy.inside ?? 0;
  const capacity = stats?.occupancy.capacity ?? null;
  const percent = capacity !== null && capacity > 0 ? Math.min(100, Math.round((inside / capacity) * 100)) : 0;
  const doorHeads = derived?.doorHeads ?? 0;
  const scannedTickets = Math.max(0, inside - doorHeads);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Stats</Text>
        <Text style={styles.subtitle}>{error ?? (live ? 'Live' : 'Connecting…')}</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>CHECKED IN</Text>
        <Text style={styles.heroValue}>{inside}</Text>
        <Text style={styles.heroMeta}>
          {capacity === null ? 'capacity not set' : `of ${String(capacity)} capacity · ${String(percent)}%`}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: percentWidth(percent) }]} />
        </View>
        <View style={styles.heroDisc}>
          <Turntable size={70} labelColor={colors.secondary} durationMs={3000} />
        </View>
      </View>

      <View style={styles.pairRow}>
        <View style={styles.ticketsCard}>
          <Text style={styles.ticketsLabel}>TICKETS</Text>
          <Text style={styles.ticketsValue}>{scannedTickets}</Text>
          <Text style={styles.ticketsMeta}>scanned at gate</Text>
        </View>
        <View style={styles.doorCard}>
          <Text style={styles.doorLabel}>DOOR</Text>
          <Text style={styles.doorValue}>{doorHeads}</Text>
          <Text style={styles.doorMeta}>walk-ins + dine-in</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>ENTRIES / HOUR</Text>
        </View>
        <Text style={styles.unavailable}>
          Not available — the stats endpoint returns occupancy only, with no per-hour breakdown.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>GENDER SPLIT</Text>
        <Text style={styles.unavailable}>
          Not available — gender is collected at the door but never returned by any read endpoint.
        </Text>
      </View>

      <View style={styles.tripleRow}>
        <View style={styles.smallCard}>
          <Text style={styles.smallLabel}>AVG AGE</Text>
          <Text style={styles.smallValue}>—</Text>
        </View>
        <View style={styles.smallCard}>
          <Text style={styles.smallLabel}>REJECTED</Text>
          <Text style={[styles.smallValue, styles.smallValueAlert]}>—</Text>
        </View>
        <View style={styles.smallCard}>
          <Text style={styles.smallLabel}>TABLES</Text>
          <Text style={styles.smallValue}>{derived?.tables ?? 0}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>TAKEN AT THE DOOR</Text>
        <Text style={styles.takenValue}>₹{((derived?.takenPaise ?? 0) / 100).toLocaleString('en-IN')}</Text>
        <Text style={styles.qualifier}>Walk-in and dine-in entries. Excludes pre-sold tickets.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, paddingBottom: 110, gap: 10 },
  titleBlock: { paddingHorizontal: 4, paddingBottom: 4 },
  title: { fontFamily: 'Anton_400Regular', fontSize: 44, lineHeight: 40, textTransform: 'uppercase', color: colors.onSurface },
  subtitle: { fontFamily: 'Archivo_400Regular', fontSize: 13, color: colors.onSurfaceMuted, marginTop: 6 },

  hero: { position: 'relative', borderRadius: 28, backgroundColor: colors.primary, padding: 20, overflow: 'hidden' },
  heroLabel: { fontFamily: 'Archivo_800ExtraBold', fontSize: 11, letterSpacing: 1.54, color: colors.background },
  // Reference: line-height:1 on a 72px face = 72, not 74.
  heroValue: { fontFamily: 'Anton_400Regular', fontSize: 72, lineHeight: 72, color: colors.background },
  heroMeta: { fontFamily: 'Archivo_600SemiBold', fontSize: 13, color: colors.background },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: 'rgba(11,10,10,0.25)', marginTop: 14, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.background },
  heroDisc: { position: 'absolute', right: 20, top: 20 },

  pairRow: { flexDirection: 'row', gap: 10 },
  ticketsCard: { flex: 1, borderRadius: 22, backgroundColor: colors.secondary, padding: 16 },
  ticketsLabel: { fontFamily: 'Archivo_800ExtraBold', fontSize: 11, letterSpacing: 1.54, color: colors.background },
  ticketsValue: { fontFamily: 'Anton_400Regular', fontSize: 36, lineHeight: 40, color: colors.background },
  ticketsMeta: { fontFamily: 'Archivo_600SemiBold', fontSize: 12, color: colors.background },
  doorCard: { flex: 1, borderRadius: 22, backgroundColor: colors.tertiary, padding: 16 },
  doorLabel: { fontFamily: 'Archivo_800ExtraBold', fontSize: 11, letterSpacing: 1.54, color: colors.onTertiary },
  doorValue: { fontFamily: 'Anton_400Regular', fontSize: 36, lineHeight: 40, color: colors.onSurface },
  doorMeta: { fontFamily: 'Archivo_600SemiBold', fontSize: 12, color: colors.onTertiary },

  card: {
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceRaised,
    padding: 16,
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardLabel: { fontFamily: 'Archivo_700Bold', fontSize: 11, letterSpacing: 1.54, color: colors.onSurfaceMuted },
  unavailable: { fontFamily: 'Archivo_400Regular', fontSize: 12, color: colors.onSurfaceFaint, lineHeight: 17 },
  qualifier: { fontFamily: 'Archivo_400Regular', fontSize: 11, color: colors.onSurfaceFaint },

  takenValue: { fontFamily: 'Anton_400Regular', fontSize: 36, lineHeight: 40, color: colors.onSurface },

  tripleRow: { flexDirection: 'row', gap: 10 },
  smallCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceRaised,
    padding: 14,
  },
  smallLabel: { fontFamily: 'Archivo_700Bold', fontSize: 10, letterSpacing: 1.2, color: colors.onSurfaceMuted },
  smallValue: { fontFamily: 'Anton_400Regular', fontSize: 26, color: colors.onSurface },
  smallValueAlert: { color: colors.primary },
});
