import Image from 'next/image';
import Link from 'next/link';

import {
  acceptedEvents,
  canonicalLinks,
  formatInr,
  partners,
  promoterProfile,
} from '@/components/promoter/promoter-studio-model';
import {
  EventCard,
  LineChart,
  MetricStrip,
  PartnerCard,
  PromoterButton,
  PromoterPageHeader,
} from '@/components/promoter/PromoterStudioUi';

export default function PromoterOverviewPage() {
  const featured = acceptedEvents[0];
  const tickets = canonicalLinks.reduce((total, link) => total + link.tickets, 0);
  const earnings = canonicalLinks.reduce((total, link) => total + link.earnedPaise, 0);
  if (!featured) return null;
  return (
    <div className="pr-page">
      <PromoterPageHeader
        title={`Good evening, ${promoterProfile.name}`}
        description="Here is what is moving across your promoter network today."
        actions={
          <PromoterButton href="/promoter/links/create" tone="primary">
            Create Link
          </PromoterButton>
        }
      />
      <div className="pr-overview-lead">
        <section className="pr-featured-event pr-glass-panel">
          <Image
            src={featured.poster}
            alt={`${featured.name} poster`}
            width={188}
            height={220}
            priority
          />
          <div>
            <span className="pr-eyebrow">Top campaign</span>
            <h2>{featured.name}</h2>
            <p>
              {featured.date} · {featured.time}
            </p>
            <strong>
              {featured.tickets}
              <small> tickets moved</small>
            </strong>
            <PromoterButton href={`/promoter/events/${featured.id}`} tone="primary">
              View performance
            </PromoterButton>
          </div>
        </section>
        <section className="pr-activity pr-glass-panel">
          <header>
            <h2>Recent activity</h2>
            <Link href="/promoter/notifications">View all</Link>
          </header>
          <ul>
            <li>
              <span>12</span>
              <div>
                <strong>Tickets moved</strong>
                <small>Neon Nights · 1h ago</small>
              </div>
            </li>
            <li>
              <span>₹</span>
              <div>
                <strong>Commission updated</strong>
                <small>Warehouse Rave · Yesterday</small>
              </div>
            </li>
            <li>
              <span>✦</span>
              <div>
                <strong>New invitation</strong>
                <small>Bollywood Brunch · Yesterday</small>
              </div>
            </li>
          </ul>
        </section>
      </div>
      <MetricStrip
        items={[
          {
            label: 'Tickets moved',
            value: tickets.toLocaleString('en-IN'),
            detail: 'Across active event links',
          },
          {
            label: 'Attributed orders',
            value: canonicalLinks
              .reduce((sum, link) => sum + link.orders, 0)
              .toLocaleString('en-IN'),
            detail: 'Guest identities stay private',
          },
          {
            label: 'Available commission',
            value: formatInr(1864000),
            detail: `${formatInr(earnings)} lifetime`,
          },
        ]}
      />
      <div className="pr-overview-grid">
        <LineChart
          title="Ticket movement"
          value="+18.4%"
          values={[42, 76, 63, 112, 98, 154, 188]}
          labels={['10 Jul', '11 Jul', '12 Jul', '13 Jul', '14 Jul', '15 Jul', '16 Jul']}
        />
        <section className="pr-side-list">
          <header>
            <h2>Linked events</h2>
            <Link href="/promoter/events">View all</Link>
          </header>
          {acceptedEvents.slice(0, 2).map((event) => (
            <EventCard key={event.id} event={event} href={`/promoter/events/${event.id}`} />
          ))}
        </section>
      </div>
      <section className="pr-section">
        <header>
          <div>
            <span className="pr-eyebrow">Trusted network</span>
            <h2>My partners</h2>
          </div>
          <Link href="/promoter/partners">View all</Link>
        </header>
        <div className="pr-partner-grid">
          {partners
            .filter((partner) => partner.relationship === 'partnered')
            .slice(0, 3)
            .map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
        </div>
      </section>
    </div>
  );
}
