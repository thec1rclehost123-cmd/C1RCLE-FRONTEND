import Link from 'next/link';

import { PageContainer, PageHeader, PageSection } from '@/components/partner-v3/PagePrimitives';

export function VenueEventReadOnlySection({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}) {
  return (
    <PageContainer>
      <main aria-label={`${title} view-only state`}>
        <PageHeader
          eyebrow="Venue event workspace · View only"
          title={title}
          description={description}
        />
        <PageSection>
          <Link href="/partner/venue/analytics">Open Venue operational analytics</Link>
        </PageSection>
      </main>
    </PageContainer>
  );
}
