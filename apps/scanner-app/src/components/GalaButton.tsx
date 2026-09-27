import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme/tokens';

import type { StyleProp, ViewStyle } from 'react-native';

interface GalaButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: 'primary' | 'secondary' | 'outline';
  readonly disabled?: boolean;
  readonly loading?: boolean;
}

const VARIANT_STYLE: Record<'primary' | 'secondary' | 'outline', StyleProp<ViewStyle>> = {
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.onSurface },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
};

const VARIANT_LABEL_COLOR: Record<'primary' | 'secondary' | 'outline', string> = {
  primary: colors.onPrimary,
  secondary: colors.onPrimary,
  outline: colors.primary,
};

export function GalaButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: GalaButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        VARIANT_STYLE[variant],
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={VARIANT_LABEL_COLOR[variant]} />
      ) : (
        <Text style={[styles.label, { color: VARIANT_LABEL_COLOR[variant] }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    ...typography.buttonLabel,
  },
});
