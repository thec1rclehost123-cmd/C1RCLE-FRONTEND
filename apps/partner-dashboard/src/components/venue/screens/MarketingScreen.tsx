'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  CheckIcon,
  ChevronDownIcon,
  EmailIcon,
  ExportIcon,
  NotificationIcon,
  SearchIcon,
  SendIcon,
  SmsIcon,
  WhatsAppIcon,
} from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import {
  campaignResultLabel,
  getMarketingTemplate,
  venueCampaigns,
  venueMarketingSource,
  venueMarketingTemplates,
} from '../venue-marketing-model';

import styles from './VenueMarketing.module.css';

import type { MarketingChannel } from '../venue-marketing-model';

export type MarketingTab = 'compose' | 'history' | 'templates';

const TABS: readonly { readonly id: MarketingTab; readonly label: string }[] = [
  { id: 'compose', label: 'Compose' },
  { id: 'history', label: 'Campaign history' },
  { id: 'templates', label: 'Templates' },
];

export function MarketingScreen({
  tab = 'compose',
  templateId = null,
}: {
  readonly tab?: MarketingTab;
  readonly templateId?: string | null;
}) {
  const auth = useDashboardAuth();
  const canView =
    auth.grantedPermissions.length === 0 ||
    auth.grantedPermissions.includes('*') ||
    auth.hasPermission('VIEW_MARKETING');

  if (!canView) {
    return (
      <section className={styles['unavailable']} role="alert">
        <h1>Marketing unavailable</h1>
        <p>Your current venue access does not include marketing.</p>
      </section>
    );
  }

  return (
    <section className={styles['page']}>
      <header>
        <h1>Marketing</h1>
        <p>Send one message to fill your next event.</p>
      </header>
      <nav className={styles['tabs']} aria-label="Marketing sections">
        {TABS.map((item) => (
          <Link
            key={item.id}
            href={`/venue/marketing?tab=${item.id}`}
            className={tab === item.id ? styles['active'] : undefined}
            aria-current={tab === item.id ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {tab === 'compose' ? (
        <ComposeMarketing templateId={templateId} canSend={auth.canDo('canSendMarketing')} />
      ) : null}
      {tab === 'history' ? <CampaignHistory /> : null}
      {tab === 'templates' ? <MarketingTemplates /> : null}
    </section>
  );
}

const CHANNELS: readonly MarketingChannel[] = ['WhatsApp', 'SMS', 'Email', 'Push'];

function ComposeMarketing({
  templateId,
  canSend,
}: {
  readonly templateId: string | null;
  readonly canSend: boolean;
}) {
  const selectedTemplate = getMarketingTemplate(templateId);
  const [channel, setChannel] = useState<MarketingChannel>(
    selectedTemplate?.channel ?? venueMarketingSource.defaultChannel,
  );
  const [message, setMessage] = useState(
    selectedTemplate?.preview ?? venueMarketingSource.defaultMessage,
  );
  const [preview, setPreview] = useState<'web' | 'phone'>('phone');

  return (
    <div className={styles['composeGrid']}>
      <form
        className={styles['composer']}
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <ComposerSection number="1" title="Event">
          <div className={styles['selectedEvent']}>
            {/* eslint-disable-next-line @next/next/no-img-element -- trusted local optimized fixture asset */}
            <img src={venueMarketingSource.event.artworkSrc} alt="" />
            <span>
              <strong>{venueMarketingSource.event.name}</strong>
              <small>{venueMarketingSource.event.meta}</small>
            </span>
            <em>{venueMarketingSource.event.ticketsLeft.toLocaleString('en-IN')} tickets left</em>
          </div>
        </ComposerSection>
        <ComposerSection number="2" title="Audience">
          <div className={styles['audience']}>
            <span>{venueMarketingSource.audience.label}</span>
            <strong>{venueMarketingSource.audience.size.toLocaleString('en-IN')} people</strong>
          </div>
        </ComposerSection>
        <ComposerSection number="3" title="Channel">
          <fieldset className={styles['channels']}>
            <legend className={styles['srOnly']}>Channel</legend>
            {CHANNELS.map((item) => (
              <label key={item} className={channel === item ? styles['selected'] : undefined}>
                <input
                  type="radio"
                  name="channel"
                  value={item}
                  checked={channel === item}
                  onChange={() => {
                    setChannel(item);
                  }}
                />
                <ChannelIcon channel={item} />
                {item}
                {channel === item ? <CheckIcon size={16} aria-hidden="true" /> : null}
              </label>
            ))}
          </fieldset>
        </ComposerSection>
        <ComposerSection number="4" title="Message and schedule">
          <label className={styles['messageField']}>
            <span>Message</span>
            <textarea
              value={message}
              maxLength={320}
              onChange={(event) => {
                setMessage(event.target.value);
              }}
              aria-describedby="message-count"
            />
            <small id="message-count">{message.length} / 320 characters</small>
          </label>
          <div className={styles['schedule']}>
            <label>
              <span>Date</span>
              <input type="date" defaultValue="2025-07-15" />
            </label>
            <label>
              <span>Time</span>
              <input type="time" defaultValue="18:00" />
            </label>
          </div>
          <footer>
            <button
              type="button"
              disabled
              title="Marketing drafts require the campaign mutation API."
            >
              Save draft unavailable
            </button>
            <button
              type="submit"
              className={styles['primary']}
              disabled={!canSend || true}
              title={
                canSend
                  ? 'Scheduling requires the campaign mutation API.'
                  : 'You do not have permission to send marketing.'
              }
            >
              <SendIcon size={18} aria-hidden="true" /> Schedule message unavailable
            </button>
          </footer>
        </ComposerSection>
      </form>
      <aside className={styles['previewColumn']}>
        <section className={styles['preview']} aria-label="Message preview">
          <header>
            <h2>Preview</h2>
            <div>
              <button
                type="button"
                className={preview === 'web' ? styles['active'] : undefined}
                onClick={() => {
                  setPreview('web');
                }}
              >
                Web
              </button>
              <button
                type="button"
                className={preview === 'phone' ? styles['active'] : undefined}
                onClick={() => {
                  setPreview('phone');
                }}
              >
                Phone
              </button>
            </div>
          </header>
          <div className={preview === 'phone' ? styles['phone'] : styles['web']}>
            <span className={styles['previewSender']}>VP · {channel}</span>
            <p>{message || 'Your message preview appears here.'}</p>
          </div>
        </section>
        <details className={styles['checklist']}>
          <summary>
            <span>
              <CheckIcon size={18} aria-hidden="true" /> Delivery checklist
            </span>
            <ChevronDownIcon size={18} aria-hidden="true" />
          </summary>
          <ul>
            <li>Audience selected</li>
            <li>Channel selected</li>
            <li>Message entered</li>
            <li>Schedule selected</li>
          </ul>
        </details>
        <section className={styles['previous']}>
          <span>Previous campaign result</span>
          <strong>{venueMarketingSource.previousResult.eventName}</strong>
          <small>
            {venueMarketingSource.previousResult.sentAt} ·{' '}
            {venueMarketingSource.previousResult.channel}
          </small>
          <p>{venueMarketingSource.previousResult.providerResult}</p>
        </section>
      </aside>
    </div>
  );
}

function ComposerSection({
  number,
  title,
  children,
}: {
  readonly number: string;
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section className={styles['composerSection']}>
      <h2>
        <span>{number}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function CampaignHistory() {
  const [query, setQuery] = useState('');
  const [channel, setChannel] = useState('All channels');
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('en-IN');
    return venueCampaigns.filter(
      (campaign) =>
        (!normalized ||
          `${campaign.name} ${campaign.eventName}`
            .toLocaleLowerCase('en-IN')
            .includes(normalized)) &&
        (channel === 'All channels' || campaign.channel === channel),
    );
  }, [channel, query]);
  return (
    <section className={styles['history']}>
      <div className={styles['historyActions']}>
        <label className={styles['search']}>
          <span className={styles['srOnly']}>Search campaigns</span>
          <SearchIcon size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder="Search campaigns"
          />
        </label>
        <label>
          <span className={styles['srOnly']}>Event</span>
          <select defaultValue="All events">
            <option>All events</option>
            <option>{venueMarketingSource.event.name}</option>
          </select>
        </label>
        <label>
          <span className={styles['srOnly']}>Channel</span>
          <select
            value={channel}
            onChange={(event) => {
              setChannel(event.target.value);
            }}
          >
            <option>All channels</option>
            {CHANNELS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled
          title="Campaign export is unavailable until the provider export endpoint is connected."
        >
          <ExportIcon size={18} aria-hidden="true" /> Export unavailable
        </button>
      </div>
      <div className={styles['campaignTable']} role="table" aria-label="Campaign history">
        <div className={styles['campaignHead']} role="row">
          <span>Campaign</span>
          <span>Event</span>
          <span>Channel</span>
          <span>Sent</span>
          <span>Result</span>
          <span>Status</span>
        </div>
        {filtered.map((campaign) => (
          <div className={styles['campaignRow']} role="row" key={campaign.id}>
            <span role="cell">
              <strong>{campaign.name}</strong>
              <small>{campaign.preview}</small>
            </span>
            <span role="cell">{campaign.eventName}</span>
            <span role="cell" className={styles['channel']}>
              <ChannelIcon channel={campaign.channel} />
              {campaign.channel}
            </span>
            <span role="cell">{campaign.sentAt ?? '—'}</span>
            <span role="cell">{campaignResultLabel(campaign.providerResult)}</span>
            <span role="cell" data-status={campaign.status}>
              {campaign.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function MarketingTemplates() {
  return (
    <section className={styles['templates']}>
      <header>
        <h2>Templates</h2>
        <p>Start with a message that works.</p>
      </header>
      <div className={styles['templateGrid']}>
        {venueMarketingTemplates.map((template) => (
          <article key={template.id}>
            <span className={styles['templateIcon']}>
              <ChannelIcon channel={template.channel} />
            </span>
            <div>
              <small>{template.channel}</small>
              <h3>{template.title}</h3>
              <p>{template.preview}</p>
            </div>
            <Link href={`/venue/marketing?tab=compose&template=${template.id}`}>Use template</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function ChannelIcon({ channel }: { readonly channel: MarketingChannel }) {
  if (channel === 'WhatsApp') return <WhatsAppIcon size={20} aria-hidden="true" />;
  if (channel === 'SMS') return <SmsIcon size={20} aria-hidden="true" />;
  if (channel === 'Email') return <EmailIcon size={20} aria-hidden="true" />;
  return <NotificationIcon size={20} aria-hidden="true" />;
}
