import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { registerDevice } from '@/api/scannerApiClient';
import { notifyAuthStateChanged } from '@/auth/authState';
import { getOrCreateDeviceId, setStoredDeviceName } from '@/auth/deviceIdentity';
import { GalaButton } from '@/components/GalaButton';
import { GalaTextInput } from '@/components/GalaTextInput';
import { colors, spacing, typography } from '@/theme/tokens';

export default function PairingScreen(): React.JSX.Element {
  const [deviceName, setDeviceName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePair = (): void => {
    setError(null);
    setLoading(true);
    void getOrCreateDeviceId()
      .then((deviceId) => registerDevice(deviceId, deviceName.trim()))
      .then(() => setStoredDeviceName(deviceName.trim()))
      // See login.tsx: the root layout re-checks and navigates itself —
      // a direct replace() here raced its stale-state redirect the same way.
      .then(() => {
        notifyAuthStateChanged();
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Device registration failed.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>DEVICE PAIRING</Text>
      <Text style={styles.headline}>Name this{'\n'}handset</Text>
      <Text style={styles.body}>
        A permanent identity for this device, registered once. If it&apos;s ever unbound by a
        manager, only a manager can restore it — never re-register on your own.
      </Text>

      <View style={styles.form}>
        <GalaTextInput
          label="DEVICE NAME"
          value={deviceName}
          onChangeText={setDeviceName}
          placeholder="Gate iPad 1"
        />
        {error !== null ? <Text style={styles.error}>{error}</Text> : null}
        <GalaButton
          label="PAIR THIS DEVICE"
          onPress={handlePair}
          disabled={deviceName.trim().length === 0}
          loading={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.onSurfaceMuted,
    textAlign: 'center',
  },
  headline: {
    ...typography.displayLg,
    color: colors.onSurface,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.onSurfaceMuted,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  error: {
    ...typography.bodySemibold,
    color: colors.error,
  },
});
