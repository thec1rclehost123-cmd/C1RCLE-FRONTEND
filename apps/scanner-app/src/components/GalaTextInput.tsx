import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radii, typography } from '@/theme/tokens';

interface GalaTextInputProps extends TextInputProps {
  readonly label?: string;
  /** Fully rounded pill shape, `#151313` fill — the Guests search bar. */
  readonly pill?: boolean;
  /**
   * The reference uses two different input fills depending on screen:
   * login inputs are `#151313` (lighter than the screen background);
   * door-entry form inputs are `#0B0A0A` (same as the screen background).
   * Defaults to the door-entry shape since that's the more common caller;
   * login.tsx passes `surface` explicitly.
   */
  readonly surface?: boolean;
  /**
   * Rendered inside a wrapper around the input ALONE, so an absolutely
   * positioned child (the password field's SHOW button, `right:8 top:8` in
   * the reference) measures from the input's own box. Positioning it
   * against the whole field — label included — floated it above the input.
   */
  readonly accessory?: React.ReactNode;
}

export function GalaTextInput({
  label,
  pill = false,
  surface = false,
  accessory,
  style,
  ...inputProps
}: GalaTextInputProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {label !== undefined ? <Text style={styles.label}>{label}</Text> : null}
      <View>
        <TextInput
          placeholderTextColor={colors.onSurfaceFaint}
          style={[styles.input, surface && styles.surfaceFill, pill && styles.pill, style]}
          {...inputProps}
        />
        {accessory}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 7,
  },
  label: {
    ...typography.label,
    color: colors.onSurfaceMuted,
  },
  input: {
    ...typography.bodySemibold,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 54,
    backgroundColor: colors.background,
    fontSize: 16,
  },
  surfaceFill: {
    backgroundColor: colors.surface,
  },
  pill: {
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    height: 50,
  },
});
