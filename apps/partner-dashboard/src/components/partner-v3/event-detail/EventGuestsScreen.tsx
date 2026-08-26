import Link from 'next/link';

import { ExportIcon, FilterIcon, RefreshIcon, SearchIcon } from '@c1rcle/icons';

import styles from './event-guests.module.css';
import { EventDetailSection } from './EventDetailSection';
import { PartnerEventDetailFrame, type PartnerEventDetailScreenConfig } from './PartnerEventDetailScreen';

import type { EventGuestFilter, EventGuestsData, PartnerEventDetailData } from '@/data/partner-data-source';


interface EventGuestsScreenConfig extends PartnerEventDetailScreenConfig {
  readonly eventHref: string;
}

export function EventGuestsScreen({ data, config, search = '', filter = 'All', tag = '' }: { readonly data: PartnerEventDetailData; readonly config: EventGuestsScreenConfig; readonly search?: string; readonly filter?: EventGuestFilter; readonly tag?: string }) {
  const guests = filterGuests(data.guests, search, filter, tag);
  const activeTag = tag === 'VIP' ? tag : '';
  return (
    <PartnerEventDetailFrame data={data} config={config} activeDetailTab="guests">
      <EventDetailSection {...(config.accent === 'lavender' ? { className: styles['guestHost'] } : {})} title="Event Attendees" description={`${data.guests.attendeeCount} attendees`}>
        <div className={styles['guestToolbar']}>
          <form className={styles['guestSearch']} action={config.eventHref} method="get">
            <SearchIcon size={15} aria-hidden="true" />
            <input aria-label="Search by name" defaultValue={search} name="search" placeholder="Search by name..." />
            {filter !== 'All' ? <input type="hidden" name="filter" value={filterQueryValue(filter)} /> : null}
            {activeTag ? <input type="hidden" name="tag" value={activeTag} /> : null}
          </form>
          <nav className={styles['guestFilters']} aria-label="Guest filters">
            {(['All', 'Online', 'Walk-in', 'Checked In'] as const).map((option) => <Link className={filter === option ? styles['guestFilterActive'] : styles['guestFilter']} href={guestQueryHref(config.eventHref, search, option, activeTag)} key={option}>{option}</Link>)}
          </nav>
          <Link className={styles['guestAction']} href={guestQueryHref(config.eventHref, search, filter, activeTag === 'VIP' ? '' : 'VIP')}><FilterIcon size={14} aria-hidden="true" />{activeTag ? 'Tag: VIP' : 'Tag'}</Link>
          <button className={styles['guestAction']} disabled title="Export is unavailable in fixture mode" type="button"><ExportIcon size={14} aria-hidden="true" />Export list</button>
          <Link aria-label="Refresh guest list" className={styles['guestRefresh']} href={guestQueryHref(config.eventHref, search, filter, activeTag)}><RefreshIcon size={15} aria-hidden="true" /></Link>
        </div>
        {guests.length > 0 ? <GuestTable guests={guests} /> : <div className={styles['guestEmpty']}>No guests match the current filters. <Link href={config.eventHref}>Clear filters</Link></div>}
      </EventDetailSection>
    </PartnerEventDetailFrame>
  );
}

export function parseEventGuestFilter(value: string | string[] | undefined): EventGuestFilter {
  const filter = Array.isArray(value) ? value[0] : value;
  if (filter === 'online') return 'Online';
  if (filter === 'walk-in') return 'Walk-in';
  if (filter === 'checked-in') return 'Checked In';
  return 'All';
}

function GuestTable({ guests }: { readonly guests: readonly EventGuestsData['guests'][number][] }) {
  return (
    <div className={styles['guestScroller']}>
      <div className={styles['guestTable']}>
        <div className={styles['guestTableHeader']}><span>Name</span><span>Tickets</span><span>Total Spend</span><span>Gender</span><span>Contact</span><span>Tags</span></div>
        {guests.map((guest) => <div className={styles['guestTableRow']} key={guest.id}>
          <div className={styles['guestName']}><span className={styles['guestAvatar']}>{guest.initials}</span><span><strong>{guest.name}</strong><small>{guest.tier}</small></span></div>
          <span>{guest.ticketCount}</span>
          <strong>{guest.spend}</strong>
          <span className={guest.gender === 'F' ? styles['genderFemale'] : styles['genderMale']}>{guest.gender}</span>
          <span className={styles['guestContact']}>{guest.contact}</span>
          <span className={styles['guestOrigin']}><i />{guest.origin}<small>{guest.arrival}</small></span>
        </div>)}
      </div>
    </div>
  );
}

function filterGuests(data: EventGuestsData, search: string, filter: EventGuestFilter, tag: string) {
  const query = search.trim().toLocaleLowerCase();
  return data.guests.filter((guest) => {
    const matchesSearch = !query || guest.name.toLocaleLowerCase().includes(query);
    const matchesFilter = filter === 'All' || (filter === 'Online' && guest.origin === 'Online') || (filter === 'Walk-in' && guest.origin === 'Walk-in') || (filter === 'Checked In' && guest.arrival === 'Checked in');
    const matchesTag = !tag || guest.tag === tag;
    return matchesSearch && matchesFilter && matchesTag;
  });
}

function filterQueryValue(filter: EventGuestFilter) {
  return filter === 'Checked In' ? 'checked-in' : filter.toLocaleLowerCase();
}

function guestQueryHref(baseHref: string, search: string, filter: EventGuestFilter, tag: string) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (filter !== 'All') params.set('filter', filterQueryValue(filter));
  if (tag) params.set('tag', tag);
  const query = params.toString();
  return query ? `${baseHref}?${query}` : baseHref;
}
