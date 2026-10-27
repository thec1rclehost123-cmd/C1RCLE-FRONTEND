import { PageContainer, PageHeader, PageSection } from './PagePrimitives';
import { EmptyState } from './States';

export function StudioRoutePlaceholder({
  studioLabel,
  title,
  description,
}: {
  readonly studioLabel: string;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <PageContainer>
      <PageHeader eyebrow={studioLabel} title={title} description={description} />
      <PageSection>
        <EmptyState title={`${title} unavailable`} />
      </PageSection>
    </PageContainer>
  );
}
