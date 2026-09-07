import type { PartnerDashboardRole } from './types';

export function normalizePartnerRole(value: unknown): PartnerDashboardRole | null {
  if (typeof value !== 'string') return null;

  switch (value.trim().toLowerCase()) {
    case 'club':
    case 'venue':
      return 'venue';
    case 'host':
      return 'host';
    case 'promoter':
      return 'promoter';
    default:
      return null;
  }
}

export function resolvePartnerDashboardPath(
  value: unknown,
  suffix?: string,
): string | null {
  const role = normalizePartnerRole(value);
  if (!role) return null;

  const normalizedSuffix = suffix?.replace(/^\/+/, '').replace(/\/+$/, '');
  return normalizedSuffix ? `/${role}/${normalizedSuffix}` : `/${role}`;
}

/**
 * Partner V3 keeps the retained login experience while handing approved users
 * into the new, isolated route namespace.
 */
export function resolvePartnerV3Path(value: unknown, suffix = 'overview'): string | null {
  const role = normalizePartnerRole(value);
  if (!role) return null;

  const normalizedSuffix = suffix.replace(/^\/+/, '').replace(/\/+$/, '');
  return normalizedSuffix ? `/partner/${role}/${normalizedSuffix}` : `/partner/${role}`;
}
