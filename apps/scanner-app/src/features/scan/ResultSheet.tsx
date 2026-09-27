import { Modal, StyleSheet, Text, View } from 'react-native';

import { GalaButton } from '@/components/GalaButton';
import { colors, radii, spacing, typography } from '@/theme/tokens';

import type { CheckInResult } from '@/api/schemas';

/** A verified-but-not-yet-admitted ticket, waiting on an explicit
 * "ADMIT GUEST" tap — see `scan.tsx`'s `PendingLookup`. */
export interface PendingConfirm {
  readonly holderName: string;
  readonly tierName: string;
  readonly scansAllowed: number;
}

interface ResultSheetProps {
  readonly result: CheckInResult | null;
  readonly pending?: PendingConfirm;
  readonly onDismiss: () => void;
  readonly onAdmit?: () => void;
  readonly admitBusy?: boolean;
}

/**
 * The scan-result bottom sheet — the reference's actual core interaction
 * (ui_example/claude_design_ui/Circle Scanner.html lines ~578-596): a dark
 * overlay with a slide-up sheet, code + time row, big title, guest/tier/pax
 * grid, DISMISS + admit/deny action row. This replaces the inline result
 * cards this app used before, which were a materially different pattern.
 *
 * Two distinct states share this one sheet: `pending` (a verified ticket
 * waiting on an explicit admit — "VALID TICKET, tap admit to check in",
 * nothing spent yet) and `result` (an already-settled `checkIn` outcome —
 * admitted or denied, informational only, DISMISS is the only action).
 */
export function ResultSheet({ result, pending, onDismiss, onAdmit, admitBusy }: ResultSheetProps): React.JSX.Element {
  const visible = result !== null || pending !== undefined;

  if (pending !== undefined) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.secondary }]}>
            <View style={[styles.grip, { backgroundColor: colors.onSecondary }]} />
            <View style={styles.topRow}>
              <View style={[styles.codePill, { borderColor: colors.onSecondary }]}>
                <Text style={[styles.codeLabel, { color: colors.onSecondary }]}>VALID</Text>
              </View>
              <Text style={[styles.timeLabel, { color: colors.onSecondary }]}>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <Text style={[styles.title, { color: colors.onSecondary }]}>Valid Ticket</Text>
            <Text style={[styles.subtitle, { color: colors.onSecondary }]}>
              Ticket verified. Tap admit to check in.
            </Text>
            <View style={styles.grid}>
              <View style={styles.gridCell}>
                <Text style={[styles.gridLabel, { color: colors.onSecondary }]}>GUEST</Text>
                <Text style={[styles.gridValue, { color: colors.onSecondary }]}>{pending.holderName}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={[styles.gridLabel, { color: colors.onSecondary }]}>TIER</Text>
                <Text style={[styles.gridValue, { color: colors.onSecondary }]}>{pending.tierName}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={[styles.gridLabel, { color: colors.onSecondary }]}>PAX</Text>
                <Text style={[styles.gridValue, { color: colors.onSecondary }]}>{pending.scansAllowed}</Text>
              </View>
            </View>
            <View style={styles.twoActionRow}>
              <View style={styles.dismissWrap}>
                <GalaButton label="DISMISS" onPress={onDismiss} variant="outline" />
              </View>
              <View style={styles.admitWrap}>
                <GalaButton
                  label={admitBusy === true ? 'ADMITTING…' : 'ADMIT GUEST'}
                  onPress={onAdmit ?? (() => undefined)}
                  loading={admitBusy ?? false}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (result === null) {
    return <Modal visible={false} transparent animationType="slide" />;
  }

  const isAdmitted = result.status === 'consumed';
  const isDenied = result.status === 'denied';
  const backgroundColor = isAdmitted ? colors.secondary : isDenied ? colors.tertiary : colors.primary;
  const foregroundColor = isAdmitted || result.status === 'confirmation_required' ? colors.onSecondary : colors.onSurface;
  const title = isAdmitted ? 'Admitted' : isDenied ? 'Entry Denied' : 'Couple Ticket';
  const guestName =
    result.status === 'consumed' || result.status === 'confirmation_required'
      ? result.entitlement.holderName
      : '—';
  const tierName =
    result.status === 'consumed' || result.status === 'confirmation_required'
      ? result.entitlement.tierName ?? 'General'
      : '—';
  // Reference's grid is always 3 columns (GUEST/TIER/PAX) regardless of
  // outcome — this branch only had 2, silently dropping PAX on every
  // settled (admitted/denied/couple) result.
  const pax =
    result.status === 'consumed' || result.status === 'confirmation_required'
      ? String(result.entitlement.scansAllowed)
      : '—';
  const subtitle = isAdmitted
    ? 'Guest checked in successfully.'
    : isDenied
      ? result.denyMessage
      : 'Confirm both guests present.';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor }]}>
          <View style={[styles.grip, { backgroundColor: foregroundColor }]} />
          <View style={styles.topRow}>
            <View style={[styles.codePill, { borderColor: foregroundColor }]}>
              <Text style={[styles.codeLabel, { color: foregroundColor }]}>
                {result.status === 'denied' ? result.denyReason.toUpperCase() : result.status.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.timeLabel, { color: foregroundColor }]}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={[styles.title, { color: foregroundColor }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: foregroundColor }]}>{subtitle}</Text>
          <View style={styles.grid}>
            <View style={styles.gridCell}>
              <Text style={[styles.gridLabel, { color: foregroundColor }]}>GUEST</Text>
              <Text style={[styles.gridValue, { color: foregroundColor }]}>{guestName}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={[styles.gridLabel, { color: foregroundColor }]}>TIER</Text>
              <Text style={[styles.gridValue, { color: foregroundColor }]}>{tierName}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={[styles.gridLabel, { color: foregroundColor }]}>PAX</Text>
              <Text style={[styles.gridValue, { color: foregroundColor }]}>{pax}</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <View style={styles.dismissWrap}>
              <GalaButton label="DISMISS" onPress={onDismiss} variant="outline" />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: spacing.lg,
    paddingBottom: 34,
    gap: spacing.sm,
  },
  grip: {
    width: 40,
    height: 5,
    borderRadius: 9,
    opacity: 0.3,
    alignSelf: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codePill: {
    borderWidth: 1.5,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  codeLabel: {
    fontWeight: '700',
    fontSize: 12,
  },
  timeLabel: {
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    fontFamily: 'Anton_400Regular',
    // Reference: font-size:58px; line-height:.9 (≈52) — was 44/42.
    fontSize: 58,
    lineHeight: 52,
    textTransform: 'uppercase',
  },
  subtitle: {
    ...typography.bodySemibold,
    fontSize: 15,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.2)',
    paddingTop: spacing.sm,
  },
  gridCell: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 10,
    // Reference: letter-spacing:.12em of 10px = 1.2px — was 1.4.
    letterSpacing: 1.2,
    fontWeight: '800',
    opacity: 0.7,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionRow: {
    marginTop: spacing.xs,
  },
  twoActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dismissWrap: {
    flex: 1,
  },
  // Reference: grid-template-columns:1fr 1.6fr on the DISMISS/action pair —
  // not an even split.
  admitWrap: {
    flex: 1.6,
  },
});
