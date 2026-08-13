import { notFound } from 'next/navigation';

import { linkById } from '@/components/promoter/promoter-studio-model';
import { CopyLinkButton } from '@/components/promoter/PromoterStudioActions';
import { PromoterButton } from '@/components/promoter/PromoterStudioUi';

export default async function LinkReadyPage({
  params,
}: {
  readonly params: Promise<{ linkId: string }>;
}) {
  const link = linkById((await params).linkId);
  if (!link) notFound();
  return (
    <div className="pr-page pr-narrow-page">
      <section className="pr-ready pr-glass-panel">
        <span className="pr-ready__check">✓</span>
        <span className="pr-eyebrow">Permanent link ready</span>
        <h1>{link.eventName}</h1>
        <p>Use this same link everywhere. Attribution stays consolidated under one event.</p>
        <code>https://{link.url}</code>
        <div className="pr-inline-actions">
          <CopyLinkButton value={`https://${link.url}`} />
          <PromoterButton href={`/promoter/links/${link.id}`}>View performance</PromoterButton>
        </div>
      </section>
    </div>
  );
}
