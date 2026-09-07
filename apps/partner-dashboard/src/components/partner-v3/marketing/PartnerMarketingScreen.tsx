'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import styles from './marketing.module.css';
import { BroadcastDialog, MarketingCampaignCard, MarketingComposer } from './MarketingParts';

import type { MarketingAudienceType, MarketingChannel, MarketingData, MarketingDeliveryFilter, MarketingSchedule, MarketingView } from '@/data/partner-data-source';

const sourceLabels: Readonly<Record<MarketingDeliveryFilter, string>> = {
  all: 'All',
  walkin: 'Walk-ins',
  dinein: 'Dine-ins',
  online: 'Online',
};

const sourceValues: readonly MarketingDeliveryFilter[] = ['all', 'walkin', 'dinein', 'online'];
const campaignStatuses: readonly ('all' | 'sent' | 'scheduled' | 'draft')[] = ['all', 'sent', 'scheduled', 'draft'];
const channelLabels: Readonly<Record<MarketingChannel, string>> = { whatsapp: 'WhatsApp', sms: 'SMS', email: 'Email', push: 'Push' };

export function PartnerMarketingScreen({ data }: { readonly data: MarketingData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [eventMenuOpen, setEventMenuOpen] = useState(false);
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<readonly string[]>([]);
  const [message, setMessage] = useState(data.defaultMessage);
  const [schedule, setSchedule] = useState<MarketingSchedule>({ mode: 'now', date: '', time: '09:00' });

  const view = readView(searchParams.get('view'));
  const eventFilter = searchParams.get('event') ?? 'all';
  const sourceFilter = readSource(searchParams.get('source'));
  const search = searchParams.get('search') ?? '';
  const dateFilter = searchParams.get('date') ?? '';
  const audience = readAudience(searchParams.get('audience'));
  const messageChannel = readChannel(searchParams.get('messageChannel'));
  const selectedCampaignId = searchParams.get('campaign') ?? '';
  const campaignStatus = readCampaignStatus(searchParams.get('status'));
  const composerOpen = searchParams.get('composer') === '1';
  const broadcastOpen = searchParams.get('broadcast') === '1';

  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    // URL state is the source of truth when browser history changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchInput(search);
  }, [search]);

  const selectedEvent = data.events.find((event) => event.id === (eventFilter === 'all' ? data.defaultEventId : eventFilter));
  const composerData = useMemo(() => selectedEvent ? {
    ...data,
    audiences: data.audiences.map((item) => item.id === 'event' ? {
      ...item,
      sub: data.role === 'host' ? `Guests at ${selectedEvent.name} · ${selectedEvent.venue}` : `${selectedEvent.name} guests`,
    } : item),
  } : data, [data, selectedEvent]);
  const updateQuery = (values: Record<string, string | undefined>, history: 'replace' | 'push' = 'replace') => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(values).forEach(([key, value]) => { if (value) params.set(key, value); else params.delete(key); });
    const href = `${pathname}${params.size ? `?${params.toString()}` : ''}`;
    if (history === 'push') router.push(href, { scroll: false }); else router.replace(href, { scroll: false });
  };

  const filteredAttendees = useMemo(() => data.attendees.filter((attendee) => {
    const matchesEvent = eventFilter === 'all' || attendee.eventId === eventFilter;
    const matchesSource = sourceFilter === 'all' || attendee.source === sourceFilter;
    const matchesDate = !dateFilter || attendee.date === dateFilter;
    const query = searchInput.trim().toLowerCase();
    const matchesSearch = !query || [attendee.name, attendee.contact, attendee.email].some((value) => value.toLowerCase().includes(query));
    return matchesEvent && matchesSource && matchesDate && matchesSearch;
  }), [data.attendees, dateFilter, eventFilter, searchInput, sourceFilter]);

  const filteredCampaigns = useMemo(() => data.campaigns.filter((campaign) => {
    const matchesStatus = campaignStatus === 'all' || campaign.status === campaignStatus;
    const matchesEvent = eventFilter === 'all' || !campaign.eventId || campaign.eventId === eventFilter;
    const query = searchInput.trim().toLowerCase();
    const matchesSearch = !query || [campaign.title, campaign.meta, campaign.audienceLabel].some((value) => value.toLowerCase().includes(query));
    return matchesStatus && matchesEvent && matchesSearch;
  }), [campaignStatus, data.campaigns, eventFilter, searchInput]);

  const selectedVisible = filteredAttendees.filter((attendee) => selectedAttendeeIds.includes(attendee.id));
  const allVisibleSelected = filteredAttendees.length > 0 && filteredAttendees.every((attendee) => selectedAttendeeIds.includes(attendee.id));

  const selectAllVisible = () => {
    setSelectedAttendeeIds((current) => allVisibleSelected
      ? current.filter((id) => !filteredAttendees.some((attendee) => attendee.id === id))
      : [...new Set([...current, ...filteredAttendees.map((attendee) => attendee.id)])]);
  };

  const toggleAttendee = (id: string) => {
    setSelectedAttendeeIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const openComposer = () => { updateQuery({ view: 'compose', composer: '1', broadcast: undefined, audience: 'event', messageChannel: 'sms' }, 'push'); };
  const openBroadcast = () => { updateQuery({ view: 'compose', broadcast: '1', composer: undefined, messageChannel: 'whatsapp' }, 'push'); };
  const closeOverlay = () => { updateQuery({ composer: undefined, broadcast: undefined }); };

  return <PageContainer>
    <div className={styles['marketingPage']} data-accent={data.accent}>
      <header className={styles['header']}>
        <div><h1>Marketing</h1></div>
        <div className={styles['headerActions']}><button className={styles['secondaryButton']} type="button" onClick={() => { updateQuery({ view: 'history', campaign: undefined }); }}>View WhatsApp Campaigns</button><button className={styles['primaryButton']} type="button" onClick={openComposer}>Compose a message</button></div>
      </header>

      <nav className={styles['tabs']} aria-label="Marketing views">
        {([['compose', 'Audience'], ['history', 'Campaign history'], ['templates', 'Templates']] as const).map(([value, label]) => <button className={styles['tab']} data-view={value} aria-pressed={view === value} key={value} type="button" onClick={() => { updateQuery({ view: value }); }}>{label}</button>)}
      </nav>

      {view === 'history' ? <CampaignHistory data={data} campaigns={filteredCampaigns} selectedCampaignId={selectedCampaignId} campaignStatus={campaignStatus} onStatus={(value) => { updateQuery({ status: value === 'all' ? undefined : value }); }} onCampaign={(id) => { updateQuery({ campaign: id === selectedCampaignId ? undefined : id }); }} /> : view === 'templates' ? <TemplateList data={data} onUse={(templateId) => {
        const template = data.templates.find((item) => item.id === templateId);
        if (!template) return;
        setMessage(template.preview.replace('{name}', '{{name}}'));
        updateQuery({ view: 'compose', composer: '1', messageChannel: template.channel, audience: 'event' }, 'push');
      }} /> : <>
        <MarketingFilterBar data={data} eventFilter={eventFilter} search={searchInput} dateFilter={dateFilter} eventMenuOpen={eventMenuOpen} dateMenuOpen={dateMenuOpen} onSearch={(value) => { setSearchInput(value); updateQuery({ search: value || undefined }); }} onEventMenu={() => { setEventMenuOpen((open) => !open); setDateMenuOpen(false); }} onDateMenu={() => { setDateMenuOpen((open) => !open); setEventMenuOpen(false); }} onEvent={(value) => { updateQuery({ event: value === 'all' ? undefined : value }); setEventMenuOpen(false); }} onDate={(value) => { updateQuery({ date: value || undefined }); setDateMenuOpen(false); }} />
        <div className={styles['filterRow']} aria-label="Attendee source filters">
          {sourceValues.map((value) => <button className={styles['filterChip']} data-active={sourceFilter === value} key={value} type="button" onClick={() => { updateQuery({ source: value === 'all' ? undefined : value }); }}>{sourceLabels[value]} <span className={styles['filterCount']}>{data.attendees.filter((attendee) => value === 'all' || attendee.source === value).length}</span></button>)}
        </div>
        <AttendeeTable attendees={filteredAttendees} selectedIds={selectedAttendeeIds} allSelected={allVisibleSelected} onSelectAll={selectAllVisible} onToggle={toggleAttendee} />
      </>}

      {selectedVisible.length ? <div className={styles['selectionBar']}><div className={styles['selectionCopy']}><span className={styles['selectionCount']}>{selectedVisible.length}</span><div><strong>Attendees selected</strong><button className={styles['quietButton']} type="button" onClick={() => { setSelectedAttendeeIds([]); }}>Clear selection</button></div></div><button className={styles['primaryButton']} type="button" onClick={openBroadcast}>▣ Start WhatsApp Campaign</button></div> : null}
      {composerOpen ? <MarketingComposer data={composerData} audience={audience} channel={messageChannel} message={message} schedule={schedule} onAudience={(value) => { updateQuery({ audience: value }); }} onChannel={(value) => { updateQuery({ messageChannel: value }); }} onMessage={setMessage} onSchedule={setSchedule} onClose={closeOverlay} /> : null}
      {broadcastOpen ? <BroadcastDialog selectedCount={selectedVisible.length} channel={messageChannel} message={message} schedule={schedule} onChannel={(value) => { updateQuery({ messageChannel: value }); }} onMessage={setMessage} onSchedule={setSchedule} onClose={closeOverlay} /> : null}
    </div>
  </PageContainer>;
}

function MarketingFilterBar({ data, eventFilter, search, dateFilter, eventMenuOpen, dateMenuOpen, onSearch, onEventMenu, onDateMenu, onEvent, onDate }: { readonly data: MarketingData; readonly eventFilter: string; readonly search: string; readonly dateFilter: string; readonly eventMenuOpen: boolean; readonly dateMenuOpen: boolean; readonly onSearch: (value: string) => void; readonly onEventMenu: () => void; readonly onDateMenu: () => void; readonly onEvent: (value: string) => void; readonly onDate: (value: string) => void }) {
  const eventLabel = data.events.find((event) => event.id === eventFilter)?.name ?? 'All Events';
  return <div className={styles['toolbar']}>
    <label className={styles['search']}><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => { onSearch(event.target.value); }} placeholder="Search attendee, email or phone..." /></label>
    <div className={styles['filterWrap']}><button className={styles['filterButton']} type="button" onClick={onEventMenu}>✦ {eventLabel}⌄</button>{eventMenuOpen ? <div className={styles['dropdown']} role="menu"><button className={styles['menuItem']} data-active={eventFilter === 'all'} type="button" onClick={() => { onEvent('all'); }}><span className={styles['menuThumb']} /><span className={styles['menuText']}><strong>All Events</strong><span>Every event</span></span></button>{data.events.map((event) => <button className={styles['menuItem']} data-active={event.id === eventFilter} key={event.id} type="button" onClick={() => { onEvent(event.id); }}><span className={styles['menuThumb']} /><span className={styles['menuText']}><strong>{event.name}</strong><span>{event.date} · {event.venue}</span></span></button>)}</div> : null}</div>
    <div className={styles['filterWrap']}><button className={styles['filterButton']} type="button" onClick={onDateMenu}>▣ {dateFilter || 'All Time'}⌄</button>{dateMenuOpen ? <DateFilterMenu selected={dateFilter} onDate={onDate} /> : null}</div>
  </div>;
}

function DateFilterMenu({ selected, onDate }: { readonly selected: string; readonly onDate: (value: string) => void }) {
  return <div className={[styles['dropdown'], styles['dateMenu']].join(' ')} role="menu"><div className={styles['dateHeader']}><button type="button" aria-label="Previous month" disabled>‹</button><strong>August 2026</strong><button type="button" aria-label="Next month" disabled>›</button></div><div className={styles['weekdays']}>{['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => <span key={day}>{day}</span>)}</div><div className={styles['dateGrid']}>{Array.from({ length: 6 }, (_, index) => <span key={`empty-${String(index)}`} aria-hidden="true" />)}{Array.from({ length: 31 }, (_, index) => { const day = String(index + 1).padStart(2, '0'); const date = `2026-08-${day}`; return <button data-selected={date === selected} key={date} type="button" onClick={() => { onDate(date); }}>{index + 1}</button>; })}</div><button className={styles['clearButton']} type="button" onClick={() => { onDate(''); }}>Clear filter</button></div>;
}

function AttendeeTable({ attendees, selectedIds, allSelected, onSelectAll, onToggle }: { readonly attendees: readonly MarketingData['attendees'][number][]; readonly selectedIds: readonly string[]; readonly allSelected: boolean; readonly onSelectAll: () => void; readonly onToggle: (id: string) => void }) {
  return <div className={styles['tableWrap']}><table className={styles['attendeeTable']}><thead><tr><th><button className={styles['attendeeSelect']} data-selected={allSelected} type="button" aria-label="Select all attendees" onClick={onSelectAll}>{allSelected ? '✓' : ''}</button></th><th>Attendee</th><th>Phone</th><th>Email</th><th>Gender</th><th>Status</th></tr></thead><tbody>{attendees.map((attendee, index) => { const selected = selectedIds.includes(attendee.id); return <tr key={attendee.id}><td><button className={styles['attendeeSelect']} data-selected={selected} type="button" aria-label={`Select ${attendee.name}`} onClick={() => { onToggle(attendee.id); }}>{selected ? '✓' : ''}</button></td><td><div className={styles['attendeeIdentity']}><span className={styles['avatar']} data-index={index % 6}>{attendee.initials}</span><strong>{attendee.name}</strong></div></td><td>{attendee.contact}</td><td>{attendee.email}</td><td><span className={styles['gender']} data-gender={attendee.gender}>{attendee.gender}</span></td><td><span className={styles['source']} data-source={attendee.source}><i className={styles['sourceDot']} />{sourceLabels[attendee.source]}</span></td></tr>; })}</tbody></table>{attendees.length ? null : <div className={styles['empty']}><strong>No attendees match these filters</strong><p>Try a different event, date, source, or search term.</p></div>}</div>;
}

function CampaignHistory({ data, campaigns, selectedCampaignId, campaignStatus, onStatus, onCampaign }: { readonly data: MarketingData; readonly campaigns: readonly MarketingData['campaigns'][number][]; readonly selectedCampaignId: string; readonly campaignStatus: 'all' | 'sent' | 'scheduled' | 'draft'; readonly onStatus: (value: 'all' | 'sent' | 'scheduled' | 'draft') => void; readonly onCampaign: (id: string) => void }) {
  return <section><div className={styles['filterRow']} aria-label="Campaign status filters">{campaignStatuses.map((status) => <button className={styles['filterChip']} data-active={campaignStatus === status} key={status} type="button" onClick={() => { onStatus(status); }}>{status === 'all' ? 'All campaigns' : status}</button>)}</div>{campaigns.length ? <div className={styles['historyGrid']}>{campaigns.map((campaign) => <MarketingCampaignCard campaign={campaign} selected={campaign.id === selectedCampaignId} key={campaign.id} onSelect={() => { onCampaign(campaign.id); }} />)}</div> : <div className={styles['empty']}><strong>No campaigns in this view</strong><p>Compose a message to start reaching {data.role === 'host' ? 'guests from a partnered event' : 'your guests'}.</p></div>}</section>;
}

function TemplateList({ data, onUse }: { readonly data: MarketingData; readonly onUse: (id: string) => void }) {
  return <section><div className={styles['templateGrid']}>{data.templates.map((template) => <article className={styles['templateCard']} key={template.id}><div className={styles['templateHeader']}><strong>{template.name}</strong><span className={styles['channelLabel']}>{channelLabels[template.channel]}</span></div><p>{template.preview}</p><button className={styles['secondaryButton']} type="button" onClick={() => { onUse(template.id); }}>Use template</button></article>)}</div></section>;
}

function readView(value: string | null): MarketingView { return value === 'history' || value === 'templates' ? value : 'compose'; }
function readAudience(value: string | null): MarketingAudienceType { return value === 'all' || value === 'custom' ? value : 'event'; }
function readChannel(value: string | null): MarketingChannel { return value === 'whatsapp' || value === 'email' || value === 'push' ? value : 'sms'; }
function readSource(value: string | null): MarketingDeliveryFilter { return value === 'walkin' || value === 'dinein' || value === 'online' ? value : 'all'; }
function readCampaignStatus(value: string | null): 'all' | 'sent' | 'scheduled' | 'draft' { return value === 'sent' || value === 'scheduled' || value === 'draft' ? value : 'all'; }
