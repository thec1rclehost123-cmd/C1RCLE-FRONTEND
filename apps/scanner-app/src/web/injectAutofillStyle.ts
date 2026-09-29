import { Platform } from 'react-native';

import { colors } from '@/theme/tokens';

/**
 * This app's tsconfig has no `dom` lib (a React Native project normally
 * has no DOM to type against), so `document` isn't a known global here —
 * unlike in a real browser at runtime on the web target, where it exists.
 * A minimal local shape for exactly what's used below, rather than adding
 * `dom` to the whole app's lib config for one file.
 */
interface MinimalDocument {
  getElementById: (id: string) => unknown;
  createElement: (tag: string) => { id: string; textContent: string };
  head: { appendChild: (node: unknown) => void };
}

/**
 * On web, `TextInput` renders as a real `<input>` DOM node — and Chrome
 * (and most Chromium browsers) force a white/yellow background on an
 * autofilled input via the `:-webkit-autofill` pseudo-class, which nothing
 * in React Native's `style` prop can reach (it only ever produces inline
 * styles or an ordinary stylesheet rule, neither of which can target a
 * browser-internal pseudo-class). This is why staff email/password
 * fields on `login.tsx` turned white the moment the browser filled them
 * in, even though `GalaTextInput`'s own style is correctly dark.
 *
 * The fix is the standard workaround for this exact browser behavior: an
 * absurdly large inset `box-shadow` in the real background color, which
 * visually paints over the browser's forced background, plus
 * `-webkit-text-fill-color` since autofill also overrides text color
 * directly (`color` alone does not win against it). A near-instant
 * `transition` on `background-color` prevents the one-frame flash of the
 * browser's own autofill color before this rule takes effect.
 *
 * A real, if minor, gap this closes rather than papers over: without it,
 * every text input in this app (not just login) would show the same
 * white flash the instant a browser offers to autofill it.
 */
export function injectAutofillStyle(): void {
  if (Platform.OS !== 'web') return;
  const document = (globalThis as { document?: MinimalDocument }).document;
  if (document === undefined) return;

  const id = 'c1rcle-scanner-autofill-fix';
  if (document.getElementById(id) !== null) return;

  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
      -webkit-text-fill-color: ${colors.onSurface} !important;
      -webkit-box-shadow: 0 0 0px 1000px ${colors.surface} inset !important;
      box-shadow: 0 0 0px 1000px ${colors.surface} inset !important;
      transition: background-color 9999s ease-in-out 0s;
    }
  `;
  document.head.appendChild(style);
}
