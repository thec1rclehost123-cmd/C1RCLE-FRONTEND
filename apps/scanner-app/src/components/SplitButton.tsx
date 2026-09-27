import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, typography } from '@/theme/tokens';

interface SplitButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
}

/**
 * The reference's LOG IN button shape — a solid pill with the label
 * left-aligned and a separate circular arrow button inset on the right,
 * not a centered label. Distinct enough from `GalaButton`'s plain pill to
 * warrant its own component rather than another `GalaButton` variant.
 */
export function SplitButton({ label, onPress, disabled = false, loading = false }: SplitButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.base, (disabled || loading) && styles.disabled, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.arrowCircle}>
        {loading ? <ActivityIndicator color={colors.primary} size="small" /> : <Text style={styles.arrow}>→</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 62,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 26,
    paddingRight: 8,
    marginTop: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    ...typography.buttonLabel,
    fontSize: 15,
    letterSpacing: 2.1,
    color: colors.onPrimary,
  },
  arrowCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    color: colors.primary,
    fontSize: 20,
  },
});
