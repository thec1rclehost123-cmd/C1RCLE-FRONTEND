import { useEffect, useState } from 'react';

/**
 * Module-level scanner preferences (scan sound, haptic, auto-admit,
 * continuous scanning) — matches `toastStore.ts`'s pub-sub pattern.
 *
 * Previously these lived as local `useState` inside `SettingsPanel`,
 * which meant "Auto-admit valid tickets" was pure decoration: `scan.tsx`
 * had no way to read it, so the toggle changed nothing about how a scan
 * actually behaved. Promoted here so both screens share one source of
 * truth. Still in-memory only (resets on reload) — same persistence
 * behavior as before this change, just actually wired to something now.
 */

export interface ScannerPreferences {
  soundOn: boolean;
  hapticOn: boolean;
  autoAdmit: boolean;
  continuousScanning: boolean;
}

const DEFAULT_PREFERENCES: ScannerPreferences = {
  soundOn: true,
  hapticOn: true,
  autoAdmit: false,
  continuousScanning: true,
};

let current: ScannerPreferences = { ...DEFAULT_PREFERENCES };
const listeners = new Set<(prefs: ScannerPreferences) => void>();

function notify(): void {
  for (const listener of listeners) listener(current);
}

export function setScannerPreference<K extends keyof ScannerPreferences>(
  key: K,
  value: ScannerPreferences[K],
): void {
  current = { ...current, [key]: value };
  notify();
}

export function getScannerPreferences(): ScannerPreferences {
  return current;
}

export function useScannerPreferences(): ScannerPreferences {
  const [prefs, setPrefs] = useState(current);
  useEffect(() => {
    listeners.add(setPrefs);
    return () => {
      listeners.delete(setPrefs);
    };
  }, []);
  return prefs;
}
