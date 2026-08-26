import {
  GalleryViewIcon,
  ListViewIcon,
  SearchIcon,
} from '@c1rcle/icons';

import styles from './events.module.css';

import type { PartnerEventParty } from '@/data/partner-data-source';

export function EventFilterBar({
  query,
  status,
  party,
  partyLabel = 'Event ownership',
  showViewToggle = true,
  view,
  counts,
  onQueryChange,
  onStatusChange,
  onPartyChange,
  onViewChange,
}: {
  readonly query: string;
  readonly status: 'all' | 'Live' | 'Draft';
  readonly party: PartnerEventParty;
  readonly partyLabel?: string;
  readonly showViewToggle?: boolean;
  readonly view: 'list' | 'grid';
  readonly counts: Readonly<{ all: number; live: number; drafts: number }>;
  readonly onQueryChange: (value: string) => void;
  readonly onStatusChange: (value: 'all' | 'Live' | 'Draft') => void;
  readonly onPartyChange: (value: PartnerEventParty) => void;
  readonly onViewChange: (value: 'list' | 'grid') => void;
}) {
  return (
    <div className={styles['toolbar']} aria-label="Find and display events">
      <label className={styles['searchControl']}>
        <span className={styles['srOnly']}>Search events</span>
        <SearchIcon size={16} aria-hidden="true" />
        <input type="search" value={query} onChange={(event) => { onQueryChange(event.target.value); }} placeholder="Search events" />
      </label>

      <div className={styles['toolbarControls']}>
        <div className={styles['controlGroup']} aria-label="Event status">
          {([
            ['all', 'All', counts.all],
            ['Live', 'Live', counts.live],
            ['Draft', 'Drafts', counts.drafts],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={status === value} onClick={() => { onStatusChange(value); }}>
              {label}<span className={styles['filterCount']}>{value === 'all' ? counts.all : value === 'Live' ? counts.live : counts.drafts}</span>
            </button>
          ))}
        </div>
        <div className={styles['controlGroup']} aria-label={partyLabel}>
          {([['hosts', 'Hosts'], ['venue', 'Venue']] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={party === value} onClick={() => { onPartyChange(value); }}>{label}</button>
          ))}
        </div>
        {showViewToggle ? <div className={styles['controlGroup']} aria-label="Event view">
          <button type="button" aria-label="List view" aria-pressed={view === 'list'} onClick={() => { onViewChange('list'); }}><ListViewIcon size={16} aria-hidden="true" /></button>
          <button type="button" aria-label="Gallery view" aria-pressed={view === 'grid'} onClick={() => { onViewChange('grid'); }}><GalleryViewIcon size={16} aria-hidden="true" /></button>
        </div> : null}
      </div>
    </div>
  );
}
