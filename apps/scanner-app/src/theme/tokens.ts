/**
 * "Circle Scanner" — ported from the design reference at
 * apps/scanner-app/ui_example/claude_design_ui/Circle Scanner.html
 * (superseding the earlier Stitch "Nocturne Gala" mockups' tokens — see
 * docs/scanner-app/implementation.md for the full diff and decision).
 * Plain object, not Tailwind — this is React Native, `StyleSheet` is
 * idiomatic (see `react-native.ts` in `@c1rcle/eslint-config`).
 */

export const colors = {
  background: '#0B0A0A',
  surface: '#151313',
  surfaceRaised: '#1E1B1B',
  border: '#2A2626',
  borderStrong: '#3a1a12',
  onSurface: '#F4F1EE',
  onSurfaceMuted: '#9A9290',
  onSurfaceFaint: '#5f5856',
  primary: '#EE4B2B',
  onPrimary: '#0B0A0A',
  secondary: '#A9C9F7',
  onSecondary: '#0B0A0A',
  tertiary: '#4A1420',
  onTertiary: '#e7c9cf',
  badgeLiveBg: '#1d0f0b',
  error: '#EE4B2B',
} as const;

export const radii = {
  sm: 14,
  md: 22,
  lg: 30,
  pill: 999,
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 44,
  gutter: 16,
} as const;

/**
 * Font families resolve via `expo-font`'s `useFonts` in the root layout —
 * see `app/_layout.tsx`. Anton is display/headline/numeric everywhere in
 * the reference (uppercase, condensed); Archivo is every other UI string.
 */
export const typography = {
  display: {
    fontFamily: 'Anton_400Regular',
    fontSize: 44,
    lineHeight: 40,
    textTransform: 'uppercase' as const,
  },
  displayLg: {
    fontFamily: 'Anton_400Regular',
    fontSize: 62,
    lineHeight: 56,
    textTransform: 'uppercase' as const,
  },
  headline: {
    fontFamily: 'Anton_400Regular',
    fontSize: 30,
    lineHeight: 28,
    textTransform: 'uppercase' as const,
  },
  statNumber: { fontFamily: 'Anton_400Regular', fontSize: 36, lineHeight: 40 },
  statNumberLg: { fontFamily: 'Anton_400Regular', fontSize: 72, lineHeight: 74 },
  body: { fontFamily: 'Archivo_400Regular', fontSize: 14, lineHeight: 20 },
  bodyMedium: { fontFamily: 'Archivo_500Medium', fontSize: 14, lineHeight: 20 },
  bodySemibold: { fontFamily: 'Archivo_600SemiBold', fontSize: 14, lineHeight: 20 },
  label: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  buttonLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 1.5,
  },
} as const;
