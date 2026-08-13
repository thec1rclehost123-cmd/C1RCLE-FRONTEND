import Link from 'next/link';

import {
  canonicalLinks,
  conversionRate,
  formatInr,
} from '@/components/promoter/promoter-studio-model';
import {
  PromoterButton,
  PromoterPageHeader,
  StatusBadge,
} from '@/components/promoter/PromoterStudioUi';

export default function LinksPage() {
  return (
    <div className="pr-page">
      <PromoterPageHeader
        eyebrow="Permanent attribution"
        title="Links"
        description="One canonical promoter link per accepted event. Use the same URL on every channel."
        actions={
          <PromoterButton href="/promoter/links/create" tone="primary">
            Create Link
          </PromoterButton>
        }
      />
      <section className="pr-link-summary">
        <div>
          <span>Active links</span>
          <strong>{canonicalLinks.length}</strong>
        </div>
        <div>
          <span>Total clicks</span>
          <strong>
            {canonicalLinks.reduce((sum, item) => sum + item.clicks, 0).toLocaleString('en-IN')}
          </strong>
        </div>
        <div>
          <span>Tickets moved</span>
          <strong>
            {canonicalLinks.reduce((sum, item) => sum + item.tickets, 0).toLocaleString('en-IN')}
          </strong>
        </div>
        <div>
          <span>Commission earned</span>
          <strong>
            {formatInr(canonicalLinks.reduce((sum, item) => sum + item.earnedPaise, 0))}
          </strong>
        </div>
      </section>
      <div className="pr-table-wrap">
        <table className="pr-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Permanent link</th>
              <th>Clicks</th>
              <th>Orders</th>
              <th>Conversion</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {canonicalLinks.map((link) => (
              <tr key={link.id}>
                <td>
                  <Link href={`/promoter/links/${link.id}`}>
                    <strong>{link.eventName}</strong>
                    <small>Created {link.createdAt}</small>
                  </Link>
                </td>
                <td>
                  <code>{link.url}</code>
                </td>
                <td>{link.clicks.toLocaleString('en-IN')}</td>
                <td>{link.orders}</td>
                <td>{conversionRate(link.orders, link.clicks)}%</td>
                <td>
                  <StatusBadge state="active" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <aside className="pr-explainer">
        <strong>One link. Every channel.</strong>
        <p>
          There are no campaign labels, custom codes or channel variants. This prevents fragmented
          attribution and keeps each event's performance trustworthy.
        </p>
      </aside>
    </div>
  );
}
