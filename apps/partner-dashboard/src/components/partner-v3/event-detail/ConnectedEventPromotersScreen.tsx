import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import { ConnectedEventPromoterManagement } from './ConnectedEventPromoterManagement';

import type {
  ReferralLinkDto,
  PromoterAssignmentDto,
  PromoterAssignmentCandidateDto,
  TicketTierDto,
  EventPromoterAnalyticsDto,
} from '@c1rcle/contracts';

export function ConnectedEventPromotersScreen({
  eventId,
  links,
  assignments,
  connections,
  tiers,
  performance,
}: {
  readonly studio: 'host' | 'venue';
  readonly eventId: string;
  readonly eventTitle: string;
  readonly links: readonly ReferralLinkDto[];
  readonly assignments: readonly PromoterAssignmentDto[];
  readonly connections: readonly PromoterAssignmentCandidateDto[];
  readonly tiers: readonly TicketTierDto[];
  readonly performance: EventPromoterAnalyticsDto;
}) {
  return (
    <PageContainer>
      <main className="mx-auto max-w-5xl py-7 text-stone-100">
        <ConnectedEventPromoterManagement
          eventId={eventId}
          links={links}
          assignments={assignments}
          connections={connections}
          tiers={tiers}
          performance={performance}
        />
      </main>
    </PageContainer>
  );
}
