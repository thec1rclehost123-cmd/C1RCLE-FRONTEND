import { Badge } from '@/components/partner-v3/Badge';

import styles from './partners.module.css';

import type { PartnerRelationshipStatus } from '@/data/partner-data-source';

export function PartnerStatusBadge({ status, hostAccent = false }: { readonly status: PartnerRelationshipStatus | 'Active'; readonly hostAccent?: boolean }) {
  const tone = status === 'Partnered' || status === 'Active' ? 'success' : status === 'Invite sent' ? 'accent' : 'warning';
  return <Badge tone={tone} {...(hostAccent && status === 'Invite sent' ? { className: styles['hostBadgeAccent'] } : {})}>{status}</Badge>;
}
