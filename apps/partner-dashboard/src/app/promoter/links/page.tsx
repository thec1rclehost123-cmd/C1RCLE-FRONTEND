import { PromoterLinkBuilder } from '@/components/promoter/PromoterLinkBuilder';
import { PromoterLinksTable } from '@/components/promoter/PromoterLinksTable';
import { partnerRepositories } from '@/lib/partner/repositories';

import type { PromoterEventLinkRow } from '@/components/promoter/PromoterLinksTable';

export default async function PromoterLinksPage() {
  const [links, events] = await Promise.all([
    partnerRepositories.promoter.getLinks(),
    partnerRepositories.promoter.getLinkedEvents(),
  ]);
  const eventLinks = Array.from(
    links.reduce((groups, link) => {
      const current = groups.get(link.eventId) ?? [];
      current.push(link);
      groups.set(link.eventId, current);
      return groups;
    }, new Map<string, typeof links[number][]>()),
  ).map(([, eventLinksForEvent]): PromoterEventLinkRow => {
    const primary = eventLinksForEvent[0];
    if (!primary) throw new Error('Promoter link group must contain a link.');
    return {
      eventId: primary.eventId,
      eventName: primary.eventName,
      shortUrl: primary.shortUrl,
      status: primary.status,
      clicks: eventLinksForEvent.reduce((total, link) => total + link.clicks, 0),
      purchases: eventLinksForEvent.reduce((total, link) => total + link.purchases, 0),
      sources: eventLinksForEvent.map((link) => ({
        channel: link.channel,
        label: link.label,
        clicks: link.clicks,
        purchases: link.purchases,
      })),
    };
  });

  return (
    <>
      <header className="promoter-links-page-header">
        <div>
          <h1>Links</h1>
          <p>Create and manage your tracked event links.</p>
        </div>
      </header>
      <PromoterLinkBuilder events={events} links={eventLinks} />
      <PromoterLinksTable rows={eventLinks} />
    </>
  );
}
