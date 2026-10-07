import type { StudioConfig } from '@/studios/studio-config';

/**
 * ─── Studio tab access ──────────────────────────────────────────────────────
 * Applies the backend's per-role `tabVisibility` matrix
 * (`packages/core/src/domain/models/partner-access.ts`, served by
 * `GET /organizations/:id/access`) to the v3 studio shell. Segments without
 * a backend key carry no backend opinion and stay visible — their APIs still
 * enforce per request, so hiding is navigation convenience, never security.
 * Fail-open throughout: unknown access (still loading, fetch failed, or the
 * backend's null "show everything") shows everything rather than flashing
 * denials.
 */

export type TabVisibilityMap = Readonly<Record<string, boolean | undefined>> | null;

/** Backend `tabVisibility` key behind each v3 route segment. */
const SEGMENT_VISIBILITY_KEYS: Readonly<Record<string, string>> = {
  overview: 'overview',
  events: 'events',
  calendar: 'calendar',
  door: 'door',
  partners: 'partners',
  presence: 'presence',
  finance: 'finance',
  settings: 'settings',
  guests: 'guests',
  analytics: 'analytics',
};

export function visibilityKeyForSegment(segment: string): string | null {
  return SEGMENT_VISIBILITY_KEYS[segment] ?? null;
}

export function lastPathSegment(href: string): string {
  const path = href.split('?')[0] ?? '';
  const parts = path.split('/').filter((part) => part.length > 0);
  return parts[parts.length - 1] ?? '';
}

export function isTabVisibleForAccess(href: string, tabVisibility: TabVisibilityMap): boolean {
  const key = visibilityKeyForSegment(lastPathSegment(href));
  if (key === null || tabVisibility === null) return true;
  return tabVisibility[key] !== false;
}

/** The studio config with backend-withheld tabs removed from navigation. */
export function visibleStudioNavigation(
  config: StudioConfig,
  tabVisibility: TabVisibilityMap,
): StudioConfig {
  return {
    ...config,
    navigation: config.navigation.filter((item) => isTabVisibleForAccess(item.href, tabVisibility)),
  };
}
