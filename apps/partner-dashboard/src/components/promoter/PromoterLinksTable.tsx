import { ExternalLinkIcon } from '@c1rcle/icons';

import { StatusBadge } from '@/components/partner-shell/DashboardUi';

import { CopyLinkButton } from './PromoterShareActions';

import styles from '../venue/screens/VenueOrders.module.css';

export interface PromoterEventLinkRow {
  readonly eventId: string;
  readonly eventName: string;
  readonly shortUrl: string;
  readonly status: string;
  readonly clicks: number;
  readonly purchases: number;
  readonly sources: readonly {
    readonly channel: string;
    readonly label: string;
    readonly clicks: number;
    readonly purchases: number;
  }[];
}

export function PromoterLinksTable({ rows }: { readonly rows: readonly PromoterEventLinkRow[] }) {
  return (
    <section className={styles['ordersPanel']} aria-labelledby="active-links-title">
      <header className={styles['panelHeader']}>
        <div>
          <h2 id="active-links-title">Active links</h2>
          <span>{rows.length} event links</span>
        </div>
      </header>
      {rows.length === 0 ? (
        <div className={styles['emptyState']}>
          <strong>No tracked event links</strong>
          <span>Choose a linked event above when an authoritative link is available.</span>
        </div>
      ) : (
        <div className={styles['tableWrap']}>
          <table data-order-kind="promoter-links">
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Link</th>
                <th scope="col">Tickets</th>
                <th scope="col">Clicks</th>
                <th scope="col">Conversion</th>
                <th scope="col">
                  <span className={styles['srOnly']}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.eventId}>
                  <td data-label="Event">
                    <span className={styles['orderIdentity']}>
                      <strong>{row.eventName}</strong>
                      <StatusBadge tone={row.status === 'active' ? 'positive' : 'neutral'}>
                        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                      </StatusBadge>
                    </span>
                  </td>
                  <td data-label="Link">
                    <span className="promoter-link-cell">
                      <code>{row.shortUrl}</code>
                      {row.sources.length > 1 ? (
                        <details>
                          <summary>Source breakdown</summary>
                          <span className="promoter-link-breakdown">
                            {row.sources.map((source) => (
                              <span key={`${row.eventId}-${source.channel}-${source.label}`}>
                                {source.channel} · {source.label} ·{' '}
                                {source.clicks.toLocaleString('en-IN')} clicks · {source.purchases}{' '}
                                tickets
                              </span>
                            ))}
                          </span>
                        </details>
                      ) : row.sources[0] ? (
                        <small>
                          {row.sources[0].channel} · {row.sources[0].label}
                        </small>
                      ) : null}
                    </span>
                  </td>
                  <td data-label="Tickets">{row.purchases.toLocaleString('en-IN')}</td>
                  <td data-label="Clicks">{row.clicks.toLocaleString('en-IN')}</td>
                  <td data-label="Conversion">
                    {row.clicks ? `${((row.purchases / row.clicks) * 100).toFixed(1)}%` : '0.0%'}
                  </td>
                  <td className={styles['rowActions']}>
                    <span className="promoter-link-actions">
                      <CopyLinkButton value={`https://${row.shortUrl}`} label="Copy" />
                      <a
                        href={`https://${row.shortUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${row.eventName} link`}
                        title="Open link"
                      >
                        <ExternalLinkIcon size={17} aria-hidden="true" />
                      </a>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
