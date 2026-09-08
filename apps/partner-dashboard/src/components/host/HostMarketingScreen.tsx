'use client';

import { useMemo, useState } from 'react';

import { IPhonePreview } from '@/components/venue/screens/MarketingScreen';
import styles from '@/components/venue/screens/VenueMarketing.module.css';

import { hostCampaigns } from './host-studio-model';
import { HostPage, HostStatus, HostTable, HostUnavailable } from './HostStudioUi';

import type { MarketingChannel } from '@/components/venue/venue-marketing-model';

const CHANNELS: readonly MarketingChannel[] = ['WhatsApp', 'SMS', 'Email', 'Push'];

export function HostMarketingScreen({ initialTab = 'compose' }: { readonly initialTab?: string }) {
  const [tab, setTab] = useState(initialTab === 'history' ? 'history' : 'compose');

  return (
    <HostPage>
      <section className={styles['page']}>
        <header className={styles['pageHeader']}>
          <div>
            <h1>Marketing</h1>
            <p>Send one message to your event audience.</p>
          </div>
          <nav className={styles['tabs']} aria-label="Marketing sections">
            <button
              type="button"
              className={tab === 'compose' ? styles['active'] : undefined}
              onClick={() => setTab('compose')}
            >
              Compose
            </button>
            <button
              type="button"
              className={tab === 'history' ? styles['active'] : undefined}
              onClick={() => setTab('history')}
            >
              Campaign history
            </button>
          </nav>
        </header>
        {tab === 'compose' ? <HostCompose /> : <HostCampaignHistory />}
      </section>
    </HostPage>
  );
}

function HostCompose() {
  const [channel, setChannel] = useState<MarketingChannel>('SMS');
  const [message, setMessage] = useState(
    'Neon Nights is tomorrow at Skyline Rooftop. See you on the dance floor.',
  );
  const [notice, setNotice] = useState(false);

  const insertField = (field: string) => {
    setMessage((current) => `${current}{{${field}}}`);
  };

  return (
    <div className={styles['composeCard']}>
      <div className={styles['formSide']}>
        <div className={styles['recipientSection']}>
          <span className={styles['fieldLabel']}>Recipients</span>
          <div className={styles['recipientsRow']}>
            <label>
              <span className={styles['srOnly']}>Event</span>
              <select className={styles['selectField']} defaultValue="neon">
                <option value="neon">Neon Nights: Afrobeats</option>
              </select>
            </label>
            <label>
              <span className={styles['srOnly']}>Audience</span>
              <input className={styles['selectField']} value="340 confirmed guests" readOnly />
            </label>
          </div>
        </div>

        <div className={styles['row']}>
          <span className={styles['fieldLabel']}>Channel</span>
          <div className={styles['channelRow']}>
            {CHANNELS.map((item) => (
              <button
                key={item}
                type="button"
                className={channel === item ? styles['channelActive'] : styles['channelBtn']}
                onClick={() => setChannel(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className={styles['row']}>
          <label className={styles['fieldLabel']} htmlFor="host-marketing-message">
            Message
          </label>
          <div className={styles['messageWrap']}>
            <textarea
              id="host-marketing-message"
              className={styles['messageArea']}
              value={message}
              maxLength={320}
              onChange={(event) => setMessage(event.target.value)}
            />
            <div className={styles['messageMeta']}>
              <div className={styles['fieldBtns']}>
                <button type="button" onClick={() => insertField('first_name')}>
                  First name
                </button>
              </div>
              <span className={styles['charCount']}>{message.length} / 320</span>
            </div>
          </div>
        </div>

        <div className={styles['row']}>
          <span className={styles['fieldLabel']}>Schedule</span>
          <div className="host-marketing-schedule">
            <label>
              <span className={styles['srOnly']}>Date</span>
              <input className={styles['selectField']} type="date" defaultValue="2026-07-15" />
            </label>
            <label>
              <span className={styles['srOnly']}>Time</span>
              <input className={styles['selectField']} type="time" defaultValue="18:00" />
            </label>
          </div>
        </div>

        <div className={styles['actions']}>
          <span />
          <button type="button" className={styles['launchBtn']} onClick={() => setNotice(true)}>
            Schedule message
          </button>
        </div>
        {notice ? <HostUnavailable label="Scheduling unavailable" /> : null}
      </div>

      <aside className={styles['previewSide']}>
        <div className="host-marketing-preview-heading">
          <h2>Preview</h2>
          <small>{channel} · iPhone</small>
        </div>
        <IPhonePreview
          channel={channel}
          message={message.replace('{{first_name}}', 'Arjun')}
          eventName="Neon Nights: Afrobeats"
        />
      </aside>
    </div>
  );
}

function HostCampaignHistory() {
  const [query, setQuery] = useState('');
  const [channel, setChannel] = useState('All channels');
  const normalized = query.trim().toLocaleLowerCase('en-IN');
  const campaigns = useMemo(
    () =>
      hostCampaigns.filter((campaign) => {
        const matchesQuery =
          !normalized ||
          campaign.some((value) => value.toLocaleLowerCase('en-IN').includes(normalized));
        const matchesChannel = channel === 'All channels' || campaign[1] === channel;
        return matchesQuery && matchesChannel;
      }),
    [channel, normalized],
  );

  return (
    <>
      <div className="host-toolbar">
        <label>
          <span className="sr-only">Search campaigns</span>
          <input
            type="search"
            value={query}
            placeholder="Search campaigns"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select
          aria-label="Channel"
          value={channel}
          onChange={(event) => setChannel(event.target.value)}
        >
          <option>All channels</option>
          {CHANNELS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <HostTable
        columns={['Campaign', 'Channel', 'Sent', 'Result', 'Status']}
        label="Campaign history"
      >
        <>
          {campaigns.map((campaign) => (
            <tr key={campaign[0]}>
              <td>
                <strong>{campaign[0]}</strong>
              </td>
              <td>{campaign[1]}</td>
              <td>{campaign[2]}</td>
              <td>{campaign[4]}</td>
              <td>
                <HostStatus tone={campaign[3] === 'Delivered' ? 'success' : 'neutral'}>
                  {campaign[3]}
                </HostStatus>
              </td>
            </tr>
          ))}
        </>
      </HostTable>
    </>
  );
}
