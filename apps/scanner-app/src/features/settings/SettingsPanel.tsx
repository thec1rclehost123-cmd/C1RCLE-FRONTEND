import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { notifyAuthStateChanged } from '@/auth/authState';
import { clearSession } from '@/auth/scannerSession';
import { clearStaffSession, getStaffUser } from '@/auth/staffAuth';
import { ScatterAccents } from '@/components/decor/ScatterAccents';
import {
  setScannerPreference,
  useScannerPreferences,
} from '@/features/settings/scannerPreferences';
import { colors } from '@/theme/tokens';

/**
 * Settings/Profile — transcribed from the `isSettings` block of
 * ui_example/claude_design_ui/Circle Scanner.html (lines 510-534).
 *
 * Shared between `(tabs)/settings.tsx` (reached via the tab bar,
 * in-session) and `app/profile.tsx` (reached by tapping the brand mark in
 * the header, reachable before a shift exists) — one screen, two entry
 * points, rather than two screens that would drift apart. Every switch
 * here is a local device preference with no backend endpoint behind it,
 * which matches the reference (its toggles are local state too).
 */

const GATES = ['Gate A', 'Gate B', 'VIP'] as const;

const PROFILE_ACCENTS = [
  { leftPct: 82, topPct: 16, width: 6, height: 12, color: colors.primary, rotationDeg: 30 },
  { leftPct: 90, topPct: 68, width: 6, height: 6, color: colors.secondary, rotationDeg: 45 },
] as const;

/** The reference's 50x30 pill switch (`padding:3px`, 24px thumb) — RN's
 * `Switch` renders a platform control that looks nothing like it. */
function Toggle({
  value,
  onPress,
  disabled = false,
}: {
  readonly value: boolean;
  readonly onPress: () => void;
  readonly disabled?: boolean;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.toggle,
        value ? styles.toggleOn : styles.toggleOff,
        disabled && styles.toggleDisabled,
      ]}
    >
      <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
    </Pressable>
  );
}

function SettingRow({
  label,
  sub,
  value,
  onPress,
  disabled = false,
  last = false,
}: {
  readonly label: string;
  readonly sub: string;
  readonly value: boolean;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly last?: boolean;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.row, !last && styles.rowDivider]}
    >
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <Toggle value={value} onPress={onPress} disabled={disabled} />
    </Pressable>
  );
}

export function SettingsPanel(): React.JSX.Element {
  const user = getStaffUser();
  const [gate, setGate] = useState<string>(GATES[0]);
  const { soundOn, hapticOn, autoAdmit, continuousScanning } = useScannerPreferences();

  const displayName = user?.displayName ?? user?.email ?? 'Staff';

  const handleLogout = (): void => {
    void clearSession().then(() => {
      clearStaffSession();
      // See authState.ts: without this, a direct router.replace('/login')
      // raced the root layout's still-'active_session' redirect — logout
      // would flash to /login and immediately bounce back into the app.
      notifyAuthStateChanged();
    });
  };

  return (
    <>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.profileCard}>
        <ScatterAccents accents={PROFILE_ACCENTS} />
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>{displayName.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.profileText}>
          <Text style={styles.profileName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.profileMeta} numberOfLines={1}>
            {user?.role ?? 'Door staff'}
            {user?.id !== undefined ? ` · Staff ID ${user.id}` : ''}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>ASSIGNED GATE</Text>
      <View style={styles.segmented}>
        {GATES.map((option) => (
          <Pressable
            key={option}
            onPress={() => {
              setGate(option);
            }}
            style={[styles.segment, gate === option && styles.segmentActive]}
          >
            <Text style={[styles.segmentLabel, gate === option && styles.segmentLabelActive]}>
              {option.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>SCANNER</Text>
      <View style={styles.card}>
        <SettingRow
          label="Scan sound"
          sub="Beep on every scan"
          value={soundOn}
          onPress={() => {
            setScannerPreference('soundOn', !soundOn);
          }}
        />
        <SettingRow
          label="Vibrate"
          sub="Haptic feedback on result"
          value={hapticOn}
          onPress={() => {
            setScannerPreference('hapticOn', !hapticOn);
          }}
        />
        <SettingRow
          label="Auto-admit valid tickets"
          sub="Skip the confirm step"
          value={autoAdmit}
          onPress={() => {
            setScannerPreference('autoAdmit', !autoAdmit);
          }}
        />
        <SettingRow
          label="Continuous scanning"
          sub="Keep camera open between scans"
          value={continuousScanning}
          onPress={() => {
            setScannerPreference('continuousScanning', !continuousScanning);
          }}
          last
        />
      </View>

      <Text style={styles.sectionLabel}>DEVICE</Text>
      <View style={styles.card}>
        {/* The reference offers an offline queue. This backend denies every
            offline scan by design (SOTA-2), so the switch is shown disabled
            with the real reason rather than pretending to queue. */}
        <SettingRow
          label="Offline mode"
          sub="Unavailable — offline scans are always denied"
          value={false}
          onPress={() => undefined}
          disabled
        />
        <Pressable
          onPress={() => {
            // Ends the shift so the auth state genuinely becomes
            // `needs_redeem` before navigating — see `AppScreenHeader`'s
            // back button for why a direct `router.replace('/redeem')`
            // here raced the root layout's redirect.
            void clearSession().then(() => {
              notifyAuthStateChanged();
            });
          }}
          style={styles.linkRow}
        >
          <View>
            <Text style={styles.rowLabel}>Switch event</Text>
            <Text style={styles.rowSub}>Close this shift and pick another</Text>
          </View>
          <Text style={styles.linkChevron}>→</Text>
        </Pressable>
      </View>

      <Pressable onPress={handleLogout} style={styles.logout}>
        <Text style={styles.logoutLabel}>LOG OUT</Text>
      </Pressable>
      <Text style={styles.footNote}>THE C1RCLE SCANNER · v2.4</Text>
    </>
  );
}

const styles = StyleSheet.create({
  titleBlock: { paddingHorizontal: 4 },
  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 44,
    lineHeight: 40,
    textTransform: 'uppercase',
    color: colors.onSurface,
  },

  profileCard: {
    position: 'relative',
    borderRadius: 26,
    backgroundColor: colors.tertiary,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: { fontFamily: 'Anton_400Regular', fontSize: 24, color: colors.background },
  profileText: { flex: 1 },
  profileName: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    lineHeight: 23,
    textTransform: 'uppercase',
    color: colors.onSurface,
  },
  profileMeta: { fontFamily: 'Archivo_600SemiBold', fontSize: 12, color: colors.onTertiary },

  sectionLabel: {
    fontFamily: 'Archivo_700Bold',
    fontSize: 11,
    letterSpacing: 1.54,
    color: colors.onSurfaceMuted,
    paddingTop: 6,
    paddingHorizontal: 4,
  },

  segmented: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceRaised,
  },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: { backgroundColor: colors.onSurface },
  segmentLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 12,
    letterSpacing: 0.72,
    color: colors.onSurfaceMuted,
  },
  segmentLabelActive: { color: colors.background },

  card: {
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.surfaceRaised },
  rowText: { flex: 1 },
  rowLabel: { fontFamily: 'Archivo_700Bold', fontSize: 14, color: colors.onSurface },
  rowSub: { fontFamily: 'Archivo_400Regular', fontSize: 12, color: colors.onSurfaceMuted },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  linkChevron: { fontSize: 18, color: colors.onSurfaceMuted },

  toggle: { width: 50, height: 30, borderRadius: 999, padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.primary, alignItems: 'flex-end' },
  toggleOff: { backgroundColor: colors.border, alignItems: 'flex-start' },
  toggleDisabled: { opacity: 0.4 },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.onSurface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleThumbOn: {},

  logout: {
    height: 56,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  logoutLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 14,
    letterSpacing: 1.96,
    color: colors.primary,
  },
  footNote: {
    textAlign: 'center',
    fontFamily: 'Archivo_400Regular',
    fontSize: 11,
    letterSpacing: 0.88,
    color: colors.onSurfaceFaint,
  },
});
