/**
 * The design token contract, mirrored in TypeScript.
 *
 * The *values* live in `@c1rcle/tailwind-config/theme.css` — that CSS is the
 * single source of truth. This module exposes the token *names* so TypeScript
 * can reference them where CSS classes are not available (canvas, charts,
 * inline SVG fills) without anyone hard-coding a hex value.
 */

export const semanticColors = [
  'background',
  'foreground',
  'muted',
  'muted-foreground',
  'card',
  'card-foreground',
  'border',
  'input',
  'ring',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'destructive',
  'destructive-foreground',
  'success',
  'warning',
] as const;

export type SemanticColor = (typeof semanticColors)[number];

/** Resolves a semantic token to the CSS custom property that carries it. */
export function colorVar(token: SemanticColor): string {
  return `var(--color-${token})`;
}

export const radii = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
export type Radius = (typeof radii)[number];

export const themes = ['light', 'dark', 'system'] as const;
export type Theme = (typeof themes)[number];

/** The attribute `@c1rcle/providers` writes on <html> to pin a theme. */
export const THEME_ATTRIBUTE = 'data-theme';

/** localStorage key holding the user's explicit theme choice. */
export const THEME_STORAGE_KEY = 'c1rcle-theme';
