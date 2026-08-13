import Image from 'next/image';
import Link from 'next/link';

import { conversionRate, formatInr, linkForEvent } from './promoter-studio-model';

import type {
  AnonymousOrder,
  PromoterCanonicalLink,
  PromoterPartnerRecord,
  PromoterStudioEvent,
} from './promoter-studio-model';
import type { ReactNode } from 'react';

export function PromoterPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  readonly eyebrow?: string;
  readonly title: string;
  readonly description: string;
  readonly actions?: ReactNode;
}) {
  return (
    <header className="pr-page-header">
      <div>
        {eyebrow ? <span className="pr-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="pr-page-actions">{actions}</div> : null}
    </header>
  );
}

export function PromoterTabs({
  active,
  items,
}: {
  readonly active: string;
  readonly items: readonly {
    readonly label: string;
    readonly href: string;
    readonly value: string;
    readonly count?: number;
  }[];
}) {
  return (
    <nav className="pr-tabs" aria-label="Page sections">
      {items.map((item) => (
        <Link
          key={item.value}
          href={item.href}
          prefetch={item.value === active ? null : false}
          className={active === item.value ? 'is-active' : undefined}
          aria-current={active === item.value ? 'page' : undefined}
        >
          {item.label}
          {item.count === undefined ? null : <span>{item.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function PromoterButton({
  href,
  children,
  tone = 'secondary',
}: {
  readonly href: string;
  readonly children: ReactNode;
  readonly tone?: 'primary' | 'secondary' | 'quiet';
}) {
  return (
    <Link href={href} className={`pr-button pr-button--${tone}`}>
      {children}
    </Link>
  );
}

export function StatusBadge({
  state,
}: {
  readonly state:
    PromoterStudioEvent['state'] | 'active' | 'paid' | 'confirmed' | 'refunded' | 'verified';
}) {
  const labels: Record<string, string> = {
    accepted: 'Accepted',
    pending: 'Invitation pending',
    requestable: 'Open to requests',
    active: 'Active',
    paid: 'Paid',
    confirmed: 'Confirmed',
    refunded: 'Refunded',
    verified: 'Verified',
  };
  return <span className={`pr-badge pr-badge--${state}`}>{labels[state]}</span>;
}

export function EventCard({
  event,
  href,
}: {
  readonly event: PromoterStudioEvent;
  readonly href: string;
}) {
  const link = linkForEvent(event.id);
  return (
    <article className="pr-event-card">
      <Link href={href} className="pr-event-card__poster" aria-label={`Open ${event.name}`}>
        <Image src={event.poster} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" />
        <span className="pr-event-card__shade" />
        <StatusBadge state={event.state} />
        <div>
          <span>{event.category}</span>
          <h2>{event.name}</h2>
          <p>
            {event.date} · {event.time}
          </p>
        </div>
      </Link>
      <div className="pr-event-card__body">
        <p>
          {event.venue} · {event.city}
        </p>
        <div className="pr-term-row">
          <span>Commission</span>
          <strong>{event.commission}</strong>
        </div>
        {event.state === 'accepted' ? (
          link ? (
            <div className="pr-event-mini-metrics">
              <span>
                <b>{link.clicks.toLocaleString('en-IN')}</b> clicks
              </span>
              <span>
                <b>{link.tickets}</b> tickets
              </span>
              <span>
                <b>{conversionRate(link.orders, link.clicks)}%</b> conversion
              </span>
            </div>
          ) : (
            <div className="pr-no-link">
              <span>No event link yet</span>
              <PromoterButton href={`/promoter/links/create?event=${event.id}`} tone="primary">
                Create link
              </PromoterButton>
            </div>
          )
        ) : null}
        <Link className="pr-card-link" href={href}>
          View details <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

export function EventAtmosphere({ event }: { readonly event: PromoterStudioEvent }) {
  return <div className="pr-event-atmosphere" data-event-poster={event.id} aria-hidden="true" />;
}

export function EventHero({
  event,
  active,
}: {
  readonly event: PromoterStudioEvent;
  readonly active: 'overview' | 'links' | 'orders';
}) {
  return (
    <section className="pr-event-hero">
      <EventAtmosphere event={event} />
      <div className="pr-event-hero__content">
        <Image
          src={event.poster}
          alt={`${event.name} poster`}
          width={152}
          height={152}
          sizes="(max-width: 640px) 96px, 152px"
          priority
        />
        <div>
          <StatusBadge state={event.state} />
          <h1>{event.name}</h1>
          <p>
            {event.venue} · {event.city}
          </p>
          <span>
            {event.date} · {event.time}
          </span>
        </div>
      </div>
      <PromoterTabs
        active={active}
        items={[
          { label: 'Overview', value: 'overview', href: `/promoter/events/${event.id}` },
          { label: 'Link', value: 'links', href: `/promoter/events/${event.id}/links` },
          { label: 'Orders', value: 'orders', href: `/promoter/events/${event.id}/orders` },
        ]}
      />
    </section>
  );
}

export function MetricStrip({
  items,
}: {
  readonly items: readonly {
    readonly label: string;
    readonly value: string;
    readonly detail?: string;
  }[];
}) {
  return (
    <section className="pr-metric-strip">
      {items.map((item) => (
        <div key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.detail ? <small>{item.detail}</small> : null}
        </div>
      ))}
    </section>
  );
}

export function LineChart({
  title,
  value,
  values,
  labels,
}: {
  readonly title: string;
  readonly value: string;
  readonly values: readonly number[];
  readonly labels: readonly string[];
}) {
  const max = Math.max(...values, 1);
  const points = values
    .map((item, index) =>
      [index * (600 / Math.max(values.length - 1, 1)), 190 - (item / max) * 150].join(','),
    )
    .join(' ');
  return (
    <section className="pr-chart pr-glass-panel">
      <header>
        <div>
          <span>Performance</span>
          <h2>{title}</h2>
        </div>
        <strong>{value}</strong>
      </header>
      <div className="pr-chart__plot">
        <svg viewBox="0 0 600 210" role="img" aria-label={`${title} line chart`}>
          <defs>
            <linearGradient id="pr-chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ff5938" stopOpacity=".28" />
              <stop offset="1" stopColor="#ff5938" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[40, 90, 140, 190].map((y) => (
            <line key={y.toString()} x1="0" x2="600" y1={y} y2={y} className="pr-chart-grid" />
          ))}
          <polygon points={`0,190 ${points} 600,190`} fill="url(#pr-chart-fill)" />
          <polyline points={points} className="pr-chart-line" />
          {values.map((item, index) => (
            <circle
              key={`${item.toString()}-${index.toString()}`}
              cx={index * (600 / Math.max(values.length - 1, 1))}
              cy={190 - (item / max) * 150}
              r="4"
            />
          ))}
        </svg>
        <div className="pr-chart-labels">
          {labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AnonymousOrdersTable({ orders }: { readonly orders: readonly AnonymousOrder[] }) {
  return (
    <div className="pr-table-wrap">
      <table className="pr-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Placed</th>
            <th>Tickets</th>
            <th>Order total</th>
            <th>Your commission</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <strong>Order #{order.id}</strong>
                <small>Guest details private</small>
              </td>
              <td>{order.createdAt}</td>
              <td>{order.tickets}</td>
              <td>{formatInr(order.grossPaise)}</td>
              <td>{formatInr(order.commissionPaise)}</td>
              <td>
                <StatusBadge state={order.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CanonicalLinkPanel({ link }: { readonly link: PromoterCanonicalLink }) {
  return (
    <section className="pr-canonical-link pr-glass-panel">
      <div>
        <span className="pr-eyebrow">Permanent event link</span>
        <h2>{link.eventName}</h2>
        <p>This is the only promoter link for this event. Use the same URL everywhere.</p>
      </div>
      <code>https://{link.url}</code>
      <div className="pr-event-mini-metrics">
        <span>
          <b>{link.clicks.toLocaleString('en-IN')}</b> clicks
        </span>
        <span>
          <b>{link.orders}</b> orders
        </span>
        <span>
          <b>{link.tickets}</b> tickets
        </span>
        <span>
          <b>{formatInr(link.earnedPaise)}</b> earned
        </span>
      </div>
    </section>
  );
}

export function PartnerCard({ partner }: { readonly partner: PromoterPartnerRecord }) {
  const href = `/promoter/partners/${partner.kind === 'venue' ? 'venues' : 'hosts'}/${partner.id}`;
  return (
    <article className="pr-partner-card pr-glass-panel">
      <div className="pr-partner-avatar">{partner.initials}</div>
      <div className="pr-partner-card__identity">
        <span>{partner.kind}</span>
        <h2>{partner.name}</h2>
        <p>
          {partner.city} · {partner.category}
        </p>
      </div>
      {partner.verified ? <StatusBadge state="verified" /> : null}
      <div className="pr-partner-stats">
        <span>
          <b>{partner.eventsTogether}</b> events together
        </span>
        <span>
          <b>{partner.ticketsMoved.toLocaleString('en-IN')}</b> tickets moved
        </span>
      </div>
      <p className="pr-response">{partner.response}</p>
      <Link className="pr-card-link" href={href}>
        View profile <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

export function SettingsNav({ active }: { readonly active: string }) {
  const items = [
    ['Profile', '/promoter/settings/profile', 'profile'],
    ['Payout account', '/promoter/settings/payout-account', 'payout-account'],
    ['Notifications', '/promoter/settings/notifications', 'notifications'],
    ['Security', '/promoter/settings/security', 'security'],
  ] as const;
  return (
    <nav className="pr-settings-nav" aria-label="Settings sections">
      {items.map(([label, href, value]) => (
        <Link key={value} href={href} className={active === value ? 'is-active' : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
}) {
  return (
    <section className="pr-empty">
      <span aria-hidden="true">◇</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <div>{action}</div> : null}
    </section>
  );
}

export function ReadOnlyTerms({ event }: { readonly event: PromoterStudioEvent }) {
  return (
    <section className="pr-terms pr-glass-panel">
      <header>
        <div>
          <span className="pr-eyebrow">Partnership terms</span>
          <h2>Read-only agreement</h2>
        </div>
        <span className="pr-lock">Locked</span>
      </header>
      <dl>
        <div>
          <dt>Commission</dt>
          <dd>{event.commission}</dd>
        </div>
        <div>
          <dt>Attribution</dt>
          <dd>Orders completed through your permanent event link</dd>
        </div>
        <div>
          <dt>Settlement</dt>
          <dd>After the event refund window closes</dd>
        </div>
      </dl>
      <p>
        Only the venue or host can change these terms. You will be notified before changes take
        effect.
      </p>
    </section>
  );
}
