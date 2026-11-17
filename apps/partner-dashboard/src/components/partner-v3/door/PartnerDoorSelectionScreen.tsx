import Link from 'next/link';

import { PageContainer, PageHeader, PageSection } from '@/components/partner-v3/PagePrimitives';

export function PartnerDoorSelectionScreen() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Venue Studio"
        title="Door Mode unavailable"
        description="Venue Studio has operational event visibility, but no scanner authorization for Host events."
      />
      <PageSection>
        <p>Host organizations manage ticket scanning for their events.</p>
        <Link href="/partner/venue/events">Return to Venue events</Link>
      </PageSection>
    </PageContainer>
  );
}
