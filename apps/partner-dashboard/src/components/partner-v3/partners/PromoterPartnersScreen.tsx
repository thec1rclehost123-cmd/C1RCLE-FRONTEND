import Link from 'next/link';

import { Button } from '@/components/partner-v3/Button';
import { PageContainer } from '@/components/partner-v3/PagePrimitives';
import { SearchInput } from '@/components/partner-v3/SearchInput';
import { EmptyState } from '@/components/partner-v3/States';

import { PartnerRequestCard } from './PartnerRequestCard';
import styles from './partners.module.css';
import { PromoterPartnerCard } from './PromoterPartnerCard';

import type {
  PartnerRequest,
  PromoterPartnerFilter,
  PromoterPartnerRecord,
  PromoterPartnersData,
  PromoterPartnerTab,
} from '@/data/partner-data-source';

interface PromoterPartnersQuery {
  readonly tab: PromoterPartnerTab;
  readonly filter: PromoterPartnerFilter;
  readonly search: string;
}

const tabs: readonly { readonly value: PromoterPartnerTab; readonly label: string }[] = [
  { value: 'discover', label: 'Discover' },
  { value: 'active', label: 'Active 3' },
  { value: 'incoming', label: 'Incoming' },
  { value: 'pending', label: 'Pending' },
  { value: 'declined', label: 'Declined' },
];

const filters: readonly { readonly value: PromoterPartnerFilter; readonly label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'venues', label: 'Venues' },
  { value: 'hosts', label: 'Hosts' },
];

const filterRecords = <T extends { readonly name: string; readonly kind: 'venue' | 'host' }>(
  records: readonly T[],
  filter: PromoterPartnerFilter,
  search: string,
) => {
  const normalized = search.trim().toLowerCase();
  return records.filter(
    (record) =>
      (filter === 'all' || record.kind === filter.slice(0, -1)) &&
      (!normalized || record.name.toLowerCase().includes(normalized)),
  );
};

const requestFilter = (records: readonly PartnerRequest[], search: string) => {
  const normalized = search.trim().toLowerCase();
  return normalized
    ? records.filter((record) => record.name.toLowerCase().includes(normalized))
    : records;
};

const requestsForTab = (
  data: PromoterPartnersData,
  tab: PromoterPartnerTab,
): readonly PartnerRequest[] =>
  tab === 'incoming'
    ? data.incoming
    : tab === 'pending'
      ? data.pending
      : tab === 'declined'
        ? data.declined
        : [];

export function PromoterPartnersScreen({
  data,
  tab = 'discover',
  filter = 'all',
  search = '',
}: {
  readonly data: PromoterPartnersData;
  readonly tab?: PromoterPartnerTab;
  readonly filter?: PromoterPartnerFilter;
  readonly search?: string;
}) {
  const state: PromoterPartnersQuery = { tab, filter, search };
  const hrefFor = (overrides: Partial<PromoterPartnersQuery> = {}) => {
    const next = { ...state, ...overrides };
    const params = new URLSearchParams();
    if (next.tab !== 'discover') params.set('tab', next.tab);
    if (next.filter !== 'all') params.set('filter', next.filter);
    if (next.search) params.set('search', next.search);
    const query = params.toString();
    return `/partner/promoter/partners${query ? `?${query}` : ''}`;
  };
  const sourceRecords: readonly PromoterPartnerRecord[] =
    tab === 'active' ? data.active : tab === 'discover' ? data.discover : [];
  const records = filterRecords(sourceRecords, filter, search);
  const requests = requestFilter(requestsForTab(data, tab), search);
  const emptyTitle =
    tab === 'incoming'
      ? 'No incoming requests'
      : tab === 'pending'
        ? 'No pending requests'
        : 'No declined requests';
  const emptyDescription =
    tab === 'incoming'
      ? 'Requests from venues and hosts will appear here.'
      : tab === 'pending'
        ? 'Partner requests you send will appear here.'
        : 'Declined partner requests will appear here.';

  return (
    <PageContainer>
      <div className={styles['promoterPartnersScreen']}>
        <header className={styles['promoterPartnersHeader']}>
          <h1>Partners</h1>
          <div className={styles['promoterPartnerStats']}>
            <div>
              <strong className={styles['statSuccess']}>{data.activePartnersCount}</strong>
              <span>Active</span>
            </div>
            <div>
              <strong className={styles['statWarning']}>{data.pendingPartnersCount}</strong>
              <span>Pending</span>
            </div>
            <div>
              <strong>{data.venuesCount}</strong>
              <span>Venues</span>
            </div>
            <div>
              <strong>{data.hostsCount}</strong>
              <span>Hosts</span>
            </div>
          </div>
        </header>
        <div className={styles['promoterPartnerToolbar']}>
          <nav className={styles['promoterPartnerTabs']} aria-label="Partner relationship state">
            {tabs.map((item) => (
              <Link
                key={item.value}
                href={hrefFor({ tab: item.value, filter: 'all' })}
                className={tab === item.value ? styles['promoterPartnerTabActive'] : ''}
                aria-current={tab === item.value ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form
            className={styles['promoterPartnerSearch']}
            action="/partner/promoter/partners"
            method="get"
          >
            <input type="hidden" name="tab" value={tab} />
            <input type="hidden" name="filter" value={filter} />
            <SearchInput
              name="search"
              defaultValue={search}
              placeholder="Search venues & hosts..."
              aria-label="Search venues and hosts"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
            {search ? (
              <Link href={hrefFor({ search: '' })} className={styles['clearSearch']}>
                Clear
              </Link>
            ) : null}
          </form>
          <nav className={styles['promoterPartnerFilters']} aria-label="Partner type filter">
            {filters.map((item) => (
              <Link
                key={item.value}
                href={hrefFor({ filter: item.value })}
                className={filter === item.value ? styles['promoterPartnerFilterActive'] : ''}
                aria-current={filter === item.value ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        {tab === 'active' || tab === 'discover' ? (
          records.length ? (
            <div className={styles['promoterPartnerGrid']}>
              {records.map((partner) => (
                <PromoterPartnerCard key={partner.id} partner={partner} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No partners found"
              description="Try a different search or partner type."
            />
          )
        ) : requests.length ? (
          <div className={styles['requestList']}>
            {requests.map((request) => (
              <PartnerRequestCard key={`${request.direction}-${request.id}`} request={request} />
            ))}
          </div>
        ) : (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )}
      </div>
    </PageContainer>
  );
}
