import Link from 'next/link';

import { CalendarIcon, SearchIcon } from '@c1rcle/icons';

import { OverviewTrendCard } from './OverviewTrendCard';
import styles from './promoter-overview.module.css';

import type { PromoterOverviewData, PromoterOverviewLinks } from '@/data/partner-data-source';

const metricOptions = ['clicks', 'revenue'] as const;
const metricLabels = { tickets: 'Tickets', revenue: 'Revenue', clicks: 'Clicks' } as const;

export function PromoterOverviewScreen({ data, links }: { readonly data: PromoterOverviewData; readonly links: PromoterOverviewLinks }) {
  return (
    <div className={styles['overview']}>
      <h1>Overview</h1>

      <div className={styles['topGrid']}>
        <OverviewTrendCard
          series={data.trends}
          title="Performance"
          summaryLabel="Clicks"
          summaryValue={String(data.totalClicks)}
          metricOptions={metricOptions}
          metricLabels={metricLabels}
          initialMetric="clicks"
          initialRange="1M"
          rangePlacement="bottom"
          showMetricSummary={false}
          axisLabels={['26 Jul', '1 Aug', '7 Aug', '13 Aug', '19 Aug', '25 Aug']}
          chartClassName={styles['promoterChart']}
          className={styles['promoterTrendCard']}
        />

        <section className={styles['card']} aria-labelledby="latest-orders-title">
          <header className={styles['sectionHeader']}>
            <h2 id="latest-orders-title">Latest Orders</h2>
            <Link href={links.guests}>VIEW MORE</Link>
          </header>
          <div className={styles['searchField']} aria-label="Search orders, customers, events">
            <SearchIcon size={14} aria-hidden="true" />
            <span>Search orders, customers, events...</span>
          </div>
          <div className={styles['orderList']}>
            {data.latestOrders.map((order) => (
              <div className={styles['orderRow']} key={order.id}>
                <span className={styles['orderAvatar']}>{order.initials}</span>
                <div className={styles['orderDetails']}>
                  <div className={styles['orderName']}><strong>{order.name}</strong><span>TICKET</span></div>
                  <small>{order.event} · {order.when}</small>
                </div>
                <strong className={styles['orderAmount']}>{order.amount}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={[styles['card'], styles['upcomingCard']].join(' ')} aria-labelledby="upcoming-events-title">
        <header className={styles['sectionHeader']}>
          <h2 id="upcoming-events-title">Upcoming Events</h2>
          <Link href={links.events}>Open events →</Link>
        </header>
        {data.upcomingEvents.length > 0 ? (
          <div className={styles['linkedEventList']}>
            {data.upcomingEvents.map((event) => (
              <Link className={styles['linkedEvent']} href={event.href} key={event.id}>
                <strong>{event.name}</strong>
                <span>{event.venue}</span>
                <small>{event.clicks} clicks · {event.sales} sales</small>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles['emptyState']}>
            <CalendarIcon size={26} aria-hidden="true" />
            <span>No assigned events yet.</span>
          </div>
        )}
      </section>
    </div>
  );
}
