import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { chargeWallet, resolveWalletQr } from '@/api/scannerApiClient';
import { getSessionMeta } from '@/auth/scannerSession';
import { showToast } from '@/features/toast/toastStore';
import { colors } from '@/theme/tokens';

import type { WalletQrResponse } from '@/api/schemas';

/**
 * Cover-tab charging — Phase 2, `05-cover-wallet-door-sales.md` D1.
 *
 * The reference design has no counterpart for this screen, so it is built in
 * the established visual language rather than transcribed.
 *
 * Rules taken straight from the contract (§8), each load-bearing:
 *   - Buttons are rendered FROM `presetItems`. There is deliberately no
 *     free-amount keypad: the API has no amount field to send one to, and
 *     the server resolves price from `presetItemId` (SOTA-10).
 *   - A null `balancePaise` means the venue hides balances — render nothing,
 *     never a `0`.
 *   - Re-scan the QR for every charge. The call takes the QR, not a saved
 *     wallet id, so a charge always follows a tab physically presented.
 *   - Max 3 charges per device per minute; a 4th is refused with a velocity
 *     error, so the UI blocks it rather than letting staff hit the wall.
 *   - Refunds, top-ups and freezes are supervisor-console actions and are
 *     deliberately absent.
 */

const VELOCITY_LIMIT = 3;
const VELOCITY_WINDOW_MS = 60_000;

function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export default function WalletScreen(): React.JSX.Element {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [eventId, setEventId] = useState<string | null>(null);
  const [canCharge, setCanCharge] = useState<boolean | null>(null);

  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletQrResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chargeTimes, setChargeTimes] = useState<number[]>([]);
  // One key per tap, replayed on retry of that same tap — never per attempt.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    void getSessionMeta().then((meta) => {
      setEventId(meta?.event.id ?? null);
      setCanCharge(meta?.permissions.canCharge ?? false);
    });
  }, []);

  // Expired timestamps are pruned on a timer rather than filtered during
  // render: reading the clock while rendering is impure, and the gate would
  // only ever clear when some unrelated state change forced a re-render.
  useEffect(() => {
    if (chargeTimes.length === 0) {
      return;
    }
    const handle = setInterval(() => {
      setChargeTimes((times) => {
        const fresh = times.filter((at) => Date.now() - at < VELOCITY_WINDOW_MS);
        return fresh.length === times.length ? times : fresh;
      });
    }, 1000);
    return () => {
      clearInterval(handle);
    };
  }, [chargeTimes.length]);

  const rateLimited = chargeTimes.length >= VELOCITY_LIMIT;

  const handleScan = (payload: string): void => {
    if (busy || wallet !== null || eventId === null) {
      return;
    }
    setBusy(true);
    setError(null);
    void resolveWalletQr(eventId, payload)
      .then((resolved) => {
        setQrPayload(payload);
        setWallet(resolved);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Could not read this tab.');
      })
      .finally(() => {
        setBusy(false);
      });
  };

  const handleCharge = (presetItemId: string, label: string): void => {
    if (eventId === null || qrPayload === null || busy || rateLimited) {
      return;
    }
    setBusy(true);
    setError(null);
    void chargeWallet({ eventId, qrPayload, presetItemId, quantity: 1, idempotencyKey })
      .then((result) => {
        showToast(`${label} · ${rupees(result.charged.amountPaise)} charged`);
        setChargeTimes((times) => [...times, Date.now()]);
        setIdempotencyKey(crypto.randomUUID());
        // The contract requires a fresh presentation of the tab for each
        // charge, so the resolved wallet is dropped rather than reused.
        setWallet(null);
        setQrPayload(null);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Charge failed.');
      })
      .finally(() => {
        setBusy(false);
      });
  };

  if (canCharge === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Cover{'\n'}Tab</Text>
        <Text style={styles.note}>This shift has no charging permission.</Text>
        <Pressable
          onPress={() => {
            router.back();
          }}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryLabel}>GO BACK</Text>
        </Pressable>
      </View>
    );
  }

  if (permission !== null && !permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Cover{'\n'}Tab</Text>
        <Text style={styles.note}>Camera access is required to read a cover tab.</Text>
        <Pressable onPress={() => void requestPermission()} style={styles.primaryButton}>
          <Text style={styles.primaryLabel}>GRANT ACCESS</Text>
        </Pressable>
      </View>
    );
  }

  const availableItems = wallet?.presetItems.filter((item) => item.isAvailable) ?? [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => {
            router.back();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backLabel}>←</Text>
        </Pressable>
        <Text style={styles.title}>Cover Tab</Text>
      </View>

      {wallet === null ? (
        <>
          <View style={styles.viewfinder}>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={
                busy
                  ? undefined
                  : ({ data }) => {
                      handleScan(data);
                    }
              }
            />
            <View style={styles.frame} pointerEvents="none">
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
          </View>
          <Text style={styles.hint}>{busy ? 'Reading tab…' : 'Scan the guest’s cover tab QR'}</Text>
        </>
      ) : (
        <>
          <View style={styles.walletCard}>
            <Text style={styles.walletName}>{wallet.guestFirstName ?? 'Guest'}</Text>
            {/* Null balance means the venue hides balances. Showing 0 here
                would be a different, wrong claim. */}
            {wallet.balancePaise === null ? (
              <Text style={styles.walletHidden}>Balance hidden by venue</Text>
            ) : (
              <Text style={styles.walletBalance}>{rupees(wallet.balancePaise)}</Text>
            )}
            <Text style={styles.walletStatus}>{wallet.status.toUpperCase()}</Text>
          </View>

          {wallet.status !== 'active' ? (
            <Text style={styles.note}>This tab is {wallet.status} and cannot be charged.</Text>
          ) : null}

          {rateLimited ? (
            <Text style={styles.note}>
              Charge limit reached ({VELOCITY_LIMIT} per minute). Wait a moment before the next one.
            </Text>
          ) : null}

          <Text style={styles.sectionLabel}>CHARGE AN ITEM</Text>
          {availableItems.length === 0 ? (
            <Text style={styles.note}>No items are available on this tab.</Text>
          ) : (
            <View style={styles.itemGrid}>
              {availableItems.map((item) => {
                const tooExpensive = wallet.balancePaise !== null && item.amountPaise > wallet.balancePaise;
                const disabled = busy || rateLimited || wallet.status !== 'active' || tooExpensive;
                return (
                  <Pressable
                    key={item.id}
                    disabled={disabled}
                    onPress={() => {
                      handleCharge(item.id, item.label);
                    }}
                    style={[styles.itemCard, disabled && styles.itemCardDisabled]}
                  >
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Text style={styles.itemAmount}>{rupees(item.amountPaise)}</Text>
                    {tooExpensive ? <Text style={styles.itemNote}>Not enough left</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          )}

          <Pressable
            onPress={() => {
              setWallet(null);
              setQrPayload(null);
              setError(null);
            }}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryLabel}>SCAN ANOTHER TAB</Text>
          </Pressable>
        </>
      )}

      {error !== null ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, gap: 14 },
  centered: { flex: 1, backgroundColor: colors.background, padding: 16, gap: 14, justifyContent: 'center' },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  title: { fontFamily: 'Anton_400Regular', fontSize: 34, lineHeight: 32, textTransform: 'uppercase', color: colors.onSurface },

  viewfinder: {
    height: 300,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  camera: { flex: 1 },
  frame: { position: 'absolute', left: '50%', top: '50%', width: 200, height: 200, marginLeft: -100, marginTop: -100 },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: colors.primary },
  cornerTopLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 18 },
  cornerTopRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 18 },
  cornerBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 18 },
  cornerBottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 18 },
  hint: { textAlign: 'center', fontFamily: 'Archivo_400Regular', fontSize: 12, color: colors.onSurfaceMuted },

  walletCard: { borderRadius: 26, backgroundColor: colors.secondary, padding: 20 },
  walletName: { fontFamily: 'Anton_400Regular', fontSize: 30, lineHeight: 30, textTransform: 'uppercase', color: colors.background },
  walletBalance: { fontFamily: 'Anton_400Regular', fontSize: 52, lineHeight: 54, color: colors.background },
  walletHidden: { fontFamily: 'Archivo_600SemiBold', fontSize: 14, color: colors.background, paddingVertical: 12 },
  walletStatus: { fontFamily: 'Archivo_800ExtraBold', fontSize: 11, letterSpacing: 1.54, color: colors.background },

  sectionLabel: { fontFamily: 'Archivo_700Bold', fontSize: 11, letterSpacing: 1.54, color: colors.onSurfaceMuted },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  itemCard: {
    minWidth: '47%',
    flexGrow: 1,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 4,
  },
  itemCardDisabled: { opacity: 0.4 },
  itemLabel: { fontFamily: 'Archivo_700Bold', fontSize: 14, color: colors.onSurface },
  itemAmount: { fontFamily: 'Anton_400Regular', fontSize: 26, color: colors.onSurface },
  itemNote: { fontFamily: 'Archivo_400Regular', fontSize: 11, color: colors.primary },

  primaryButton: { height: 56, borderRadius: 999, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryLabel: { fontFamily: 'Archivo_800ExtraBold', fontSize: 14, letterSpacing: 1.96, color: colors.background },
  secondaryButton: {
    height: 54,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: { fontFamily: 'Archivo_700Bold', fontSize: 14, color: colors.onSurface },

  note: { fontFamily: 'Archivo_400Regular', fontSize: 13, color: colors.onSurfaceMuted, lineHeight: 18 },
  error: { fontFamily: 'Archivo_600SemiBold', fontSize: 12, color: colors.primary },
});
