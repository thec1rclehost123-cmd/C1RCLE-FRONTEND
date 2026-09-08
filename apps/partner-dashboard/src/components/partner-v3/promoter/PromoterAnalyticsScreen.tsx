'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { LinkIcon, TrendUpIcon } from '@c1rcle/icons';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import styles from './promoter-analytics.module.css';

import type {
  PromoterAnalyticsData,
  PromoterAnalyticsMetric,
  PromoterAnalyticsRange,
} from '@/data/partner-data-source';

const ranges: readonly PromoterAnalyticsRange[] = ['7D', '30D', 'YTD', 'ALL'];
const chartMetrics: readonly { readonly value: PromoterAnalyticsMetric; readonly label: string }[] =
  [
    { value: 'revenue', label: 'Revenue' },
    { value: 'clicks', label: 'Clicks' },
    { value: 'sales', label: 'Sales' },
  ];

export function PromoterAnalyticsScreen({
  data,
  initialRange = '30D',
  initialMetric = 'revenue',
}: {
  readonly data: PromoterAnalyticsData;
  readonly initialRange?: PromoterAnalyticsRange;
  readonly initialMetric?: PromoterAnalyticsMetric;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [range, setRange] = useState(initialRange);
  const [metric, setMetric] = useState(initialMetric);

  const updateUrl = (next: {
    range?: PromoterAnalyticsRange;
    metric?: PromoterAnalyticsMetric;
  }) => {
    const params = new URLSearchParams();
    const nextRange = next.range ?? range;
    const nextMetric = next.metric ?? metric;
    if (nextRange !== '30D') params.set('range', nextRange);
    if (nextMetric !== 'revenue') params.set('metric', nextMetric);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <PageContainer>
      <div className={styles['page']}>
        <header className={styles['header']}>
          <h1>Analytics</h1>
          <div className={styles['rangeTabs']} role="tablist" aria-label="Analytics range">
            {ranges.map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={range === value}
                onClick={() => {
                  setRange(value);
                  updateUrl({ range: value });
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </header>

        <section className={styles['metrics']} aria-label="Promoter analytics summary">
          <Metric label="Total Clicks" value={data.totalClicks} />
          <Metric label="Tickets Sold" value={data.ticketsSold} />
          <Metric label="Conversion Rate" value={data.conversionRate} />
          <Metric label="Total Earnings" value={data.totalEarnings} accent />
        </section>

        <section className={styles['chartCard']} aria-labelledby="performance-title">
          <div className={styles['sectionHeader']}>
            <div>
              <h2 id="performance-title">Performance</h2>
              <p>Daily performance for the selected range</p>
            </div>
            <div className={styles['chartTabs']} role="tablist" aria-label="Analytics chart metric">
              {chartMetrics.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={metric === item.value}
                  onClick={() => {
                    setMetric(item.value);
                    updateUrl({ metric: item.value });
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles['chartEmpty']} role="status">
            <TrendUpIcon size={24} aria-hidden="true" />
            <strong>No timeline data yet</strong>
            <span>
              Daily performance will appear here once your links start generating clicks or ticket
              sales.
            </span>
          </div>
        </section>

        <div className={styles['twoColumn']}>
          <section className={styles['panel']} aria-labelledby="links-title">
            <div className={styles['sectionHeader']}>
              <div>
                <h2 id="links-title">Top Performing Links</h2>
                <p>
                  {data.activeLinks} active of {data.totalLinks} total links
                </p>
              </div>
            </div>
            <div className={styles['linkList']}>
              {data.topLinks.map((link, index) => (
                <div
                  className={[styles['linkRow'], index === 0 ? styles['featured'] : ''].join(' ')}
                  key={link.id}
                >
                  <span className={styles['rank']}>{index + 1}</span>
                  <span className={styles['linkIdentity']}>
                    <strong>{link.name}</strong>
                    <small>{link.path}</small>
                  </span>
                  <span>
                    <b>{link.clicks}</b>
                    <small>clicks</small>
                  </span>
                  <span>
                    <b>{link.sales}</b>
                    <small>sales</small>
                  </span>
                  <span className={styles['conversion']}>{link.conversion}</span>
                </div>
              ))}
            </div>
          </section>
          <section className={styles['panel']} aria-labelledby="activity-title">
            <div className={styles['sectionHeader']}>
              <div>
                <h2 id="activity-title">Recent Activity</h2>
                <p>Latest promoter link activity from the backend</p>
              </div>
            </div>
            <div className={styles['activityList']}>
              {data.recentActivity.map((item) => (
                <div className={styles['activityRow']} key={item.id}>
                  <span className={styles['activityIcon']}>
                    <LinkIcon size={14} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.meta}</small>
                  </span>
                  <time>{item.time}</time>
                  <LinkIcon size={14} aria-hidden="true" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}

function Metric({
  label,
  value,
  accent = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly accent?: boolean;
}) {
  return (
    <article className={styles['metric']}>
      <span>{label}</span>
      <strong className={accent ? styles['metricAccent'] : undefined}>{value}</strong>
    </article>
  );
}
