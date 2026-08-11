'use client';

import { useMemo, useState } from 'react';

import { hostCampaigns } from './host-studio-model';
import {
  HostButton,
  HostHeader,
  HostPage,
  HostStatus,
  HostTable,
  HostUnavailable,
} from './HostStudioUi';

export function HostMarketingScreen({ initialTab = 'compose' }: { readonly initialTab?: string }) {
  const [tab, setTab] = useState(initialTab);
  const [channel, setChannel] = useState('SMS');
  const [message, setMessage] = useState(
    'Hey {{first_name}}! Neon Nights is tomorrow at Skyline Rooftop. See you on the dance floor.',
  );
  const [preview, setPreview] = useState<'web' | 'phone'>('phone');
  const [notice, setNotice] = useState(false);
  const audience = useMemo(() => '340 confirmed guests', []);
  return (
    <HostPage>
      <HostHeader
        title="Marketing"
        description="Send one focused message to your allocated event audience."
      />
      <div className="host-tabs" role="tablist">
        <button
          type="button"
          className={tab === 'compose' ? 'is-active' : undefined}
          onClick={() => { setTab('compose'); }}
        >
          Compose
        </button>
        <button
          type="button"
          className={tab === 'history' ? 'is-active' : undefined}
          onClick={() => { setTab('history'); }}
        >
          Campaign history
        </button>
      </div>
      {tab === 'compose' ? (
        <div className="host-marketing-layout">
          <section className="host-compose">
            <article>
              <span className="host-number">1</span>
              <div>
                <h2>Event</h2>
                <label>
                  Selected event
                  <select defaultValue="neon">
                    <option value="neon">Neon Nights: Afrobeats</option>
                  </select>
                </label>
              </div>
            </article>
            <article>
              <span className="host-number">2</span>
              <div>
                <h2>Audience</h2>
                <label>
                  Audience
                  <input value={audience} readOnly />
                </label>
              </div>
            </article>
            <article>
              <span className="host-number">3</span>
              <div>
                <h2>Channel</h2>
                <div className="host-channel-grid">
                  {['WhatsApp', 'SMS', 'Email', 'Push'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={channel === item ? 'is-active' : undefined}
                      onClick={() => { setChannel(item); }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </article>
            <article>
              <span className="host-number">4</span>
              <div>
                <h2>Message and schedule</h2>
                <label>
                  Message
                  <textarea
                    rows={6}
                    value={message}
                    maxLength={320}
                    onChange={(event) => { setMessage(event.target.value); }}
                  />
                </label>
                <small>{message.length} / 320 characters</small>
                <div className="host-form-grid">
                  <label>
                    Date
                    <input type="date" defaultValue="2026-07-15" />
                  </label>
                  <label>
                    Time
                    <input type="time" defaultValue="18:00" />
                  </label>
                </div>
              </div>
            </article>
            <footer>
              <HostButton disabled title="Marketing draft mutation is unavailable">
                Save draft
              </HostButton>
              <button
                className="host-button is-primary"
                type="button"
                onClick={() => { setNotice(true); }}
              >
                Schedule message
              </button>
            </footer>
            {notice ? <HostUnavailable label="Scheduling unavailable" /> : null}
          </section>
          <aside className="host-marketing-side">
            <section className="host-panel">
              <div className="host-preview-head">
                <h2>Preview</h2>
                <div>
                  <button
                    type="button"
                    className={preview === 'web' ? 'is-active' : undefined}
                    onClick={() => { setPreview('web'); }}
                  >
                    Web
                  </button>
                  <button
                    type="button"
                    className={preview === 'phone' ? 'is-active' : undefined}
                    onClick={() => { setPreview('phone'); }}
                  >
                    Phone
                  </button>
                </div>
              </div>
              <div className={`host-message-preview is-${preview}`}>
                <strong>Rhea Kapoor</strong>
                <small>{channel} · 6:00 PM</small>
                <p>{message.replace('{{first_name}}', 'Arjun')}</p>
              </div>
            </section>
            <details className="host-panel">
              <summary>Delivery checklist · 6 checks</summary>
              <p>
                Audience, content, provider, consent, schedule, and sender are checked by the
                provider.
              </p>
            </details>
            <section className="host-panel">
              <h2>Previous result</h2>
              <p>Tickets running low · WhatsApp</p>
              <strong>842 opened</strong>
            </section>
          </aside>
        </div>
      ) : (
        <>
          <div className="host-toolbar">
            <label>
              <span className="sr-only">Search campaigns</span>
              <input type="search" placeholder="Search campaigns" />
            </label>
            <select aria-label="Event">
              <option>All events</option>
            </select>
            <select aria-label="Channel">
              <option>All channels</option>
            </select>
            <HostButton disabled title="Campaign export is unavailable">
              Export
            </HostButton>
          </div>
          <HostTable
            columns={['Campaign', 'Channel', 'Sent', 'Result', 'Status']}
            label="Campaign history"
          >
            <>
              {hostCampaigns.map((campaign) => (
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
      )}
    </HostPage>
  );
}
