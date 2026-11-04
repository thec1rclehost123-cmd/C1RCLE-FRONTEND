import type { PartnerShellInteractionData } from '@/data/partner-data-source';

/**
 * The authenticated shell must never surface demo records. Search and
 * notification feeds need dedicated, tenant-scoped read models before they can
 * be enabled for partners.
 */
export function unavailablePartnerShellInteractions(): PartnerShellInteractionData {
  return {
    dataStatus: 'unavailable',
    search: {
      dataStatus: 'unavailable',
      results: [],
      unavailableReason: 'Global search is not connected to an authorized partner index yet.',
    },
    notifications: {
      dataStatus: 'unavailable',
      notifications: [],
      unavailableReason: 'Partner notifications are not connected yet.',
    },
  };
}
