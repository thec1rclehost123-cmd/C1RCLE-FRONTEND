import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { checkIn, fetchStats, lookupTicket, overrideCheckIn, staffDeny } from '@/api/scannerApiClient';
import { getSessionMeta } from '@/auth/scannerSession';
import { canOverride, getStaffUser } from '@/auth/staffAuth';
import { ScatterAccents } from '@/components/decor/ScatterAccents';
import { Turntable } from '@/components/decor/Turntable';
import { GalaButton } from '@/components/GalaButton';
import { GalaTextInput } from '@/components/GalaTextInput';
import { useCoupleConfirm } from '@/features/scan/coupleConfirm';
import { ResultSheet } from '@/features/scan/ResultSheet';
import { getScannerPreferences } from '@/features/settings/scannerPreferences';
import { showToast } from '@/features/toast/toastStore';
import { colors, radii, spacing, typography } from '@/theme/tokens';

import type { CheckInResult, DoorEvent } from '@/api/schemas';

interface PendingLookup {
  readonly qrPayload: string;
  readonly eventId: string;
  readonly gate: string | null;
  readonly holderName: string;
  readonly tierName: string;
  readonly scansAllowed: number;
}

type ScanUiState = { kind: 'idle' } | { kind: 'checking' } | { kind: 'offline' };

interface RecentEntry {
  readonly name: string;
  readonly tier: string;
  readonly time: string;
  readonly admitted: boolean;
  /** Only present for a denied entry — the ledger id `POST /door/override`
   * needs. Nothing to override for an admitted scan. */
  readonly checkInId: string | null;
  readonly overridden: boolean;
}

export default function ScanScreen(): React.JSX.Element {
  const [permission, requestPermission] = useCameraPermissions();
  const [uiState, setUiState] = useState<ScanUiState>({ kind: 'idle' });
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [pendingLookup, setPendingLookup] = useState<PendingLookup | null>(null);
  const [admitBusy, setAdmitBusy] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [denyOpen, setDenyOpen] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [denyBusy, setDenyBusy] = useState(false);
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [event, setEvent] = useState<DoorEvent | null>(null);
  const [inside, setInside] = useState<number | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const coupleConfirm = useCoupleConfirm();
  const [scanlineY] = useState(() => new Animated.Value(0));

  useEffect(() => {
    void getSessionMeta().then((meta) => {
      if (meta === null) return;
      setEvent(meta.event);
      void fetchStats(meta.event.id)
        .then((stats) => { setInside(stats.occupancy.inside); })
        .catch(() => undefined);
    });
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanlineY, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scanlineY, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [scanlineY]);

  const pushRecent = useCallback((name: string, tier: string, admitted: boolean, checkInId: string | null = null) => {
    setRecent((current) => [
      {
        name,
        tier,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        admitted,
        checkInId,
        overridden: false,
      },
      ...current,
    ].slice(0, 5));
    // `fetchStats` is only re-polled on mount — bump the on-screen count
    // immediately on a real admit so it doesn't lag behind what staff just did.
    if (admitted) {
      setInside((current) => (current === null ? current : current + 1));
    }
  }, []);

  const [overrideTarget, setOverrideTarget] = useState<RecentEntry | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideBusy, setOverrideBusy] = useState(false);

  const submitOverride = useCallback(() => {
    if (overrideTarget?.checkInId === null || overrideTarget === null || overrideReason.trim().length === 0) {
      return;
    }
    const target = overrideTarget;
    setOverrideBusy(true);
    void overrideCheckIn({ checkInId: target.checkInId ?? '', reason: overrideReason.trim() })
      .then(() => {
        setRecent((current) => current.map((r) => (r.checkInId === target.checkInId ? { ...r, overridden: true } : r)));
        showToast(`${target.name} overridden — admitted`);
        setOverrideTarget(null);
        setOverrideReason('');
      })
      .catch((cause: unknown) => {
        showToast(cause instanceof Error ? cause.message : 'Override failed');
      })
      .finally(() => {
        setOverrideBusy(false);
      });
  }, [overrideTarget, overrideReason]);

  const staffCanOverride = canOverride(getStaffUser()?.role);

  const submitStaffDeny = useCallback(() => {
    if (denyReason.trim().length === 0) {
      return;
    }
    setDenyBusy(true);
    void getSessionMeta()
      .then((meta) => {
        if (meta === null) {
          throw new Error('No active scanner session.');
        }
        return staffDeny({
          eventId: meta.event.id,
          reason: denyReason.trim(),
          gate: meta.gate,
          ...(manualCode.trim().length > 0 ? { qrPayload: manualCode.trim() } : {}),
        });
      })
      .then((result) => {
        pushRecent('Unknown', result.denyReason, false, result.id);
        showToast('Entry denied & logged');
        setDenyOpen(false);
        setDenyReason('');
        setManualCode('');
      })
      .catch((cause: unknown) => {
        showToast(cause instanceof Error ? cause.message : 'Could not record the denial.');
      })
      .finally(() => {
        setDenyBusy(false);
      });
  }, [denyReason, manualCode, pushRecent]);

  /** Shared by the immediate (auto-admit / invalid ticket) path and the
   * explicit "ADMIT GUEST" tap below — one place decides what a real
   * `checkIn` result means, so the two paths can't drift apart. */
  const handleScanResult = useCallback(
    (scanResult: CheckInResult, eventId: string) => {
      void Haptics.notificationAsync(
        scanResult.status === 'consumed'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      );
      if (scanResult.status === 'confirmation_required') {
        coupleConfirm.start({
          eventId,
          token: scanResult.confirmation.token,
          expiresAt: scanResult.confirmation.expiresAt,
          seats: scanResult.confirmation.seats,
        });
      } else if (scanResult.status === 'consumed') {
        const holderName = scanResult.entitlement.holderName ?? 'Guest';
        pushRecent(holderName, scanResult.entitlement.tierName ?? 'General', true);
        showToast(`${holderName} admitted`);
      } else {
        pushRecent('Unknown', scanResult.denyReason, false, scanResult.checkInId);
        showToast('Entry denied & logged');
      }
      setResult(scanResult);
    },
    [coupleConfirm, pushRecent],
  );

  const runScan = useCallback(
    (qrPayload: string) => {
      if (uiState.kind === 'checking' || qrPayload === lastScannedRef.current) {
        return;
      }
      lastScannedRef.current = qrPayload;
      setUiState({ kind: 'checking' });

      void (async () => {
        const meta = await getSessionMeta();
        if (meta === null) {
          setUiState({ kind: 'idle' });
          return;
        }

        const networkState = await Network.getNetworkStateAsync();
        if (networkState.isConnected !== true) {
          setUiState({ kind: 'offline' });
          showToast('Scanner offline — entry denied until connectivity returns.');
          return;
        }

        try {
          // Non-mutating preview first — the reference's default flow (and
          // the contract's own documented reason for `/door/lookup` being a
          // separate endpoint from `/door/check-ins`: nothing is spent by a
          // lookup, so a client can safely show "tap admit to confirm"
          // before anything is actually consumed). "Auto-admit valid
          // tickets" in Settings skips straight to the real admit instead.
          const lookup = await lookupTicket({ eventId: meta.event.id, qrPayload });
          if (lookup.status === 'invalid' || getScannerPreferences().autoAdmit) {
            const scanResult = await checkIn({ eventId: meta.event.id, qrPayload, gate: meta.gate });
            handleScanResult(scanResult, meta.event.id);
          } else {
            setPendingLookup({
              qrPayload,
              eventId: meta.event.id,
              gate: meta.gate,
              holderName: lookup.entitlement?.holderName ?? 'Guest',
              tierName: lookup.entitlement?.tierName ?? 'General',
              scansAllowed: lookup.entitlement?.scansAllowed ?? 1,
            });
          }
          setUiState({ kind: 'idle' });
        } catch {
          setUiState({ kind: 'offline' });
          showToast('Scanner offline — entry denied until connectivity returns.');
        }
      })();
    },
    [uiState.kind, handleScanResult],
  );

  const confirmAdmit = useCallback(() => {
    if (pendingLookup === null) return;
    const target = pendingLookup;
    setAdmitBusy(true);
    void checkIn({ eventId: target.eventId, qrPayload: target.qrPayload, gate: target.gate })
      .then((scanResult) => {
        handleScanResult(scanResult, target.eventId);
        setPendingLookup(null);
      })
      .catch(() => {
        showToast('Could not admit — try again.');
      })
      .finally(() => {
        setAdmitBusy(false);
      });
  }, [pendingLookup, handleScanResult]);

  const resetScan = useCallback(() => {
    lastScannedRef.current = null;
    setResult(null);
    setPendingLookup(null);
    setUiState({ kind: 'idle' });
  }, []);

  const handleBarcodeScanned = useCallback((event: { data: string }) => { runScan(event.data); }, [runScan]);

  if (permission === null) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.body}>Camera access is required to scan tickets.</Text>
        <GalaButton label="GRANT ACCESS" onPress={() => void requestPermission()} />
      </View>
    );
  }

  const scanlineTop = scanlineY.interpolate({ inputRange: [0, 1], outputRange: ['8%', '88%'] });

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
        <View style={styles.headerRow}>
          <Text style={styles.headline}>
            Scan{'\n'}Ticket
          </Text>
          <View style={styles.counter}>
            <Text style={styles.counterValue}>
              {inside ?? recent.filter((r) => r.admitted).length}
              {event?.capacity !== null && event?.capacity !== undefined ? (
                <Text style={styles.counterValueCapacity}> / {event.capacity}</Text>
              ) : null}
            </Text>
            <Text style={styles.counterLabel}>CHECKED IN</Text>
          </View>
        </View>

        <View style={styles.viewfinder}>
          <CameraView
            style={styles.camera}
            enableTorch={torchOn}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={uiState.kind === 'idle' ? handleBarcodeScanned : undefined}
          />
          <View style={styles.viewfinderGlowPrimary} pointerEvents="none" />
          <View style={styles.viewfinderGlowSecondary} pointerEvents="none" />
          <View style={styles.frame} pointerEvents="none">
            <View style={styles.frameTurntable}>
              <Turntable size={104} durationMs={3000} />
            </View>
            <ScatterAccents
              accents={[
                { leftPct: 12, topPct: 14, width: 6, height: 12, color: colors.primary, rotationDeg: 30 },
                { leftPct: 62, topPct: 10, width: 5, height: 10, color: colors.secondary, rotationDeg: -30 },
                { leftPct: 68, topPct: 60, width: 7, height: 7, color: colors.onSurface, rotationDeg: 45 },
                { leftPct: 8, topPct: 62, width: 5, height: 12, color: colors.secondary, rotationDeg: 65 },
              ]}
            />
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <Animated.View style={[styles.scanline, { top: scanlineTop }]} pointerEvents="none" />
          <Text style={styles.scanHint}>
            {uiState.kind === 'checking' ? 'Reading ticket…' : 'Align the QR code inside the frame'}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <View style={styles.actionFill}>
            <GalaButton
              label={uiState.kind === 'checking' ? 'SCANNING…' : 'TAP TO SCAN'}
              onPress={() => {
                if (manualCode.trim().length > 0) runScan(manualCode.trim());
              }}
              disabled={manualCode.trim().length === 0}
              loading={uiState.kind === 'checking'}
            />
          </View>
          <Pressable
            onPress={() => { setTorchOn((on) => !on); }}
            style={[styles.actionCircle, torchOn && styles.actionCircleActive]}
          >
            <Text style={[styles.actionCircleLabel, torchOn && styles.actionCircleLabelActive]}>FLASH</Text>
          </Pressable>
          <Pressable onPress={() => { setManualOpen((open) => !open); }} style={styles.actionCircle}>
            <Text style={styles.actionCircleLabel}>CODE</Text>
          </Pressable>
        </View>

        {manualOpen ? (
          <>
            <View style={styles.manualRow}>
              <View style={styles.manualInput}>
                <GalaTextInput
                  value={manualCode}
                  onChangeText={setManualCode}
                  placeholder="Enter ticket code e.g. C1-4821"
                  // Reference's manual-code field is height:52px specifically —
                  // GalaTextInput's shared default (54) matches login.tsx's
                  // inputs instead, a different reference element.
                  style={styles.manualCodeInput}
                />
              </View>
              <Pressable
                onPress={() => {
                  if (manualCode.trim().length > 0) runScan(manualCode.trim());
                }}
                style={styles.checkButton}
              >
                <Text style={styles.checkButtonLabel}>CHECK</Text>
              </Pressable>
            </View>
            {/* Phase 3, no reference precedent: refusing someone who never
                presents a scannable ticket — a banned patron, or a ticket
                the camera can't read. Does not spend the ticket. */}
            <Pressable
              onPress={() => {
                setDenyOpen((open) => !open);
              }}
              style={styles.denyLink}
            >
              <Text style={styles.denyLinkLabel}>Deny without a ticket</Text>
            </Pressable>
          </>
        ) : null}

        {denyOpen ? (
          <View style={styles.denyCard}>
            <GalaTextInput
              value={denyReason}
              onChangeText={setDenyReason}
              placeholder="Reason (shown to the guest's manager)"
            />
            <GalaButton
              label={denyBusy ? 'DENYING…' : 'CONFIRM DENIAL'}
              disabled={denyReason.trim().length === 0 || denyBusy}
              loading={denyBusy}
              variant="outline"
              onPress={submitStaffDeny}
            />
          </View>
        ) : null}

        {uiState.kind === 'offline' ? (
          <View style={styles.offlineCard}>
            <Text style={styles.resultHeadline}>SCANNER OFFLINE</Text>
            <Text style={styles.body}>Entry denied until connectivity returns.</Text>
            <GalaButton label="TRY AGAIN" onPress={resetScan} variant="outline" />
          </View>
        ) : null}

        {coupleConfirm.pending !== null ? (
          <View style={styles.coupleCard}>
            <Text style={styles.resultHeadline}>COUPLE TICKET — {coupleConfirm.pending.seats} SEATS</Text>
            <Text style={styles.body}>
              {coupleConfirm.expired
                ? 'Confirmation window expired — re-scan.'
                : `Confirm both guests present (${String(coupleConfirm.secondsRemaining)}s)`}
            </Text>
            {!coupleConfirm.expired ? (
              <View style={styles.coupleActions}>
                <GalaButton
                  label="NO"
                  variant="outline"
                  onPress={() => {
                    void coupleConfirm.confirm(false).then((confirmResult) => { setResult(confirmResult); });
                  }}
                />
                <GalaButton
                  label="YES"
                  onPress={() => {
                    void coupleConfirm.confirm(true).then((confirmResult) => { setResult(confirmResult); });
                  }}
                />
              </View>
            ) : (
              <GalaButton label="DISMISS" onPress={() => { coupleConfirm.reset(); resetScan(); }} />
            )}
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>RECENT SCANS</Text>
        <View style={styles.recentCard}>
          {recent.length === 0 ? (
            <Text style={styles.body}>No scans yet.</Text>
          ) : (
            recent.map((entry, index) => (
              <View key={index} style={[styles.recentRow, index === recent.length - 1 && styles.recentRowLast]}>
                <View style={styles.recentAvatar}>
                  <Text style={styles.recentAvatarLabel}>{entry.name.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.recentText}>
                  <Text style={styles.recentName}>{entry.name}</Text>
                  <Text style={styles.recentMeta}>
                    {entry.tier} · {entry.time}
                  </Text>
                </View>
                {!entry.admitted && entry.overridden ? (
                  <View style={[styles.recentPill, styles.recentPillOverridden]}>
                    <Text style={[styles.recentPillLabel, styles.recentPillLabelOverridden]}>OVERRIDDEN</Text>
                  </View>
                ) : !entry.admitted && staffCanOverride && entry.checkInId !== null ? (
                  <Pressable
                    onPress={() => {
                      setOverrideTarget(entry);
                    }}
                    style={[styles.recentPill, styles.recentPillDenied]}
                  >
                    <Text style={[styles.recentPillLabel, styles.recentPillLabelDenied]}>OVERRIDE</Text>
                  </Pressable>
                ) : (
                  <View style={[styles.recentPill, entry.admitted ? styles.recentPillAdmitted : styles.recentPillDenied]}>
                    <Text style={[styles.recentPillLabel, entry.admitted ? styles.recentPillLabelAdmitted : styles.recentPillLabelDenied]}>
                      {entry.admitted ? 'ADMITTED' : 'DENIED'}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <ResultSheet
        result={result}
        {...(pendingLookup === null
          ? {}
          : {
              pending: {
                holderName: pendingLookup.holderName,
                tierName: pendingLookup.tierName,
                scansAllowed: pendingLookup.scansAllowed,
              },
            })}
        onDismiss={resetScan}
        onAdmit={confirmAdmit}
        admitBusy={admitBusy}
      />

      <Modal
        visible={overrideTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setOverrideTarget(null);
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.overrideCard}>
            <Text style={styles.resultHeadline}>OVERRIDE DENIAL</Text>
            <Text style={styles.body}>
              Admits {overrideTarget?.name ?? 'this guest'} anyway. The original deny reason stays on the record —
              this is logged as who let them in and why, not a correction.
            </Text>
            <GalaTextInput
              value={overrideReason}
              onChangeText={setOverrideReason}
              placeholder="Reason for override"
            />
            <View style={styles.coupleActions}>
              <GalaButton
                label="CANCEL"
                variant="outline"
                onPress={() => {
                  setOverrideTarget(null);
                  setOverrideReason('');
                }}
              />
              <GalaButton
                label={overrideBusy ? 'OVERRIDING…' : 'OVERRIDE'}
                disabled={overrideReason.trim().length === 0 || overrideBusy}
                loading={overrideBusy}
                onPress={submitOverride}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  containerContent: {
    padding: spacing.gutter,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headline: {
    ...typography.display,
    color: colors.onSurface,
  },
  counter: {
    alignItems: 'flex-end',
  },
  counterValue: {
    ...typography.headline,
    color: colors.onSurface,
  },
  counterValueCapacity: {
    color: colors.onSurfaceMuted,
  },
  counterLabel: {
    ...typography.label,
    color: colors.onSurfaceMuted,
    fontSize: 11,
  },
  viewfinder: {
    height: 330,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  camera: {
    flex: 1,
  },
  viewfinderGlowPrimary: {
    position: 'absolute',
    left: -40,
    top: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primary,
    opacity: 0.16,
  },
  viewfinderGlowSecondary: {
    position: 'absolute',
    right: -40,
    bottom: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.secondary,
    opacity: 0.12,
  },
  frame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 210,
    height: 210,
    marginTop: -105,
    marginLeft: -105,
  },
  frameTurntable: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -52,
    marginLeft: -52,
    opacity: 0.55,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: colors.primary,
  },
  cornerTopLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 18 },
  cornerTopRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 18 },
  cornerBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 18 },
  cornerBottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 18 },
  scanline: {
    position: 'absolute',
    left: '6%',
    right: '6%',
    height: 3,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  scanHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    textAlign: 'center',
    fontSize: 12,
    color: colors.onSurfaceMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionFill: {
    flex: 1,
  },
  actionCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCircleActive: {
    backgroundColor: colors.onSurface,
    borderColor: colors.onSurface,
  },
  actionCircleLabel: {
    ...typography.label,
    color: colors.onSurface,
    fontSize: 10,
  },
  actionCircleLabelActive: {
    color: colors.onPrimary,
  },
  manualRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  manualInput: {
    flex: 1,
  },
  manualCodeInput: {
    height: 52,
  },
  checkButton: {
    width: 80,
    height: 54,
    borderRadius: radii.sm,
    backgroundColor: colors.onSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonLabel: {
    fontWeight: '800',
    fontSize: 13,
    color: colors.onPrimary,
  },
  body: {
    ...typography.body,
    color: colors.onSurfaceMuted,
  },
  offlineCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coupleCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.secondary,
  },
  resultHeadline: {
    ...typography.headline,
    color: colors.onSurface,
    fontSize: 24,
  },
  coupleActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.onSurfaceMuted,
  },
  recentCard: {
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceRaised,
  },
  recentRowLast: {
    borderBottomWidth: 0,
  },
  recentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentAvatarLabel: {
    fontWeight: '800',
    fontSize: 13,
    color: colors.onSurface,
  },
  recentText: {
    flex: 1,
  },
  recentName: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.onSurface,
  },
  recentMeta: {
    fontSize: 12,
    color: colors.onSurfaceMuted,
  },
  recentPill: {
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  recentPillAdmitted: {
    backgroundColor: '#12202f',
  },
  recentPillDenied: {
    backgroundColor: '#2a0f0a',
  },
  recentPillLabel: {
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  recentPillLabelAdmitted: {
    color: colors.secondary,
  },
  recentPillLabelDenied: {
    color: colors.primary,
  },
  recentPillOverridden: {
    backgroundColor: colors.surfaceRaised,
  },
  recentPillLabelOverridden: {
    color: colors.onSurfaceMuted,
  },
  denyLink: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  denyLinkLabel: {
    ...typography.bodySemibold,
    fontSize: 12,
    color: colors.onSurfaceMuted,
    textDecorationLine: 'underline',
  },
  denyCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.gutter,
  },
  overrideCard: {
    width: '100%',
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
