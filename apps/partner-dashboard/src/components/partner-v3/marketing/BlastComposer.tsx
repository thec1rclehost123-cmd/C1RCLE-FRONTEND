'use client';

import { useEffect, useRef, useState } from 'react';

import styles from './audience.module.css';

import type { MarketingAudience } from '@c1rcle/contracts/partner-marketing';

const channels = ['WhatsApp', 'Email', 'SMS', 'Notification'] as const;
type Channel = (typeof channels)[number];
const limits: Record<Channel, number> = {
  WhatsApp: 1024,
  Email: 10000,
  SMS: 480,
  Notification: 178,
};
export function previewMessage(body: string, name: string) {
  const first = name.trim().split(/\s+/)[0];
  return body.replaceAll('[First name]', first?.length ? first : 'Guest');
}
export function safePreviewLink(value: string) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
export function BlastComposer({
  audience,
  audienceContext,
  onRemoveRecipient,
  onClose,
}: {
  readonly audience: MarketingAudience['rows'];
  readonly audienceContext?: string | undefined;
  readonly onRemoveRecipient: (id: string) => void;
  readonly onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [channel, setChannel] = useState<Channel>('WhatsApp');
  const [body, setBody] = useState('Hey [First name],');
  const [subject, setSubject] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [recipientsOpen, setRecipientsOpen] = useState(false);
  const [link, setLink] = useState('');
  const [action, setAction] = useState('View event');
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  useEffect(() => {
    const previousFocus = document.activeElement;
    const node = dialog.current;
    node?.showModal();
    return () => {
      node?.close();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);
  const message = previewMessage(body, audience[0]?.name ?? 'Guest');
  const previewLink = safePreviewLink(link);
  const eventNames = [...new Set(audience.map((row) => row.eventName))];
  return (
    <dialog
      ref={dialog}
      className={styles['dialog']}
      aria-labelledby="blast-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className={styles['modalHeader']}>
        <div>
          <span>MARKETING</span>
          <h2 id="blast-title">New campaign</h2>
        </div>
        <button type="button" aria-label="Close composer" onClick={onClose}>
          ✕
        </button>
      </header>
      <nav className={styles['mobileComposerNav']} aria-label="Composer view">
        <button
          type="button"
          aria-pressed={mobileView === 'edit'}
          onClick={() => {
            setMobileView('edit');
          }}
        >
          Message
        </button>
        <button
          type="button"
          aria-pressed={mobileView === 'preview'}
          onClick={() => {
            setMobileView('preview');
          }}
        >
          Preview
        </button>
      </nav>
      <div className={styles['composerGrid']}>
        <section className={styles['editor']} data-active={mobileView === 'edit'} aria-label="Message composer">
          <label>
            Campaign name
            <input
              value={campaignName}
              placeholder="e.g. Early access"
              maxLength={80}
              onChange={(event) => {
                setCampaignName(event.target.value);
              }}
            />
          </label>
          <div className={styles['channels']} aria-label="Channel">
            {channels.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={channel === value}
                onClick={() => {
                  setChannel(value);
                }}
              >
                {value}
              </button>
            ))}
          </div>
          <div className={styles['audienceSummary']}>
            <div className={styles['recipientHeading']}>
              <div>
                <strong>Recipients</strong>
                <span>{audience.length} selected{audienceContext ? ` · ${audienceContext}` : ''}</span>
              </div>
              <button
                type="button"
                aria-expanded={recipientsOpen}
                aria-controls="blast-recipients"
                onClick={() => {
                  setRecipientsOpen((open) => !open);
                }}
              >
                {recipientsOpen ? 'Hide' : 'Review'}
              </button>
            </div>
            {recipientsOpen ? (
              <ul className={styles['recipientList']} id="blast-recipients" aria-label="Selected recipients">
                {audience.slice(0, 3).map((recipient) => (
                  <li key={recipient.id}>
                    <span><strong>{recipient.name}</strong><small>{recipient.eventName}</small></span>
                    <button type="button" aria-label={`Remove ${recipient.name}`} onClick={() => {
                      onRemoveRecipient(recipient.id);
                    }}>Remove</button>
                  </li>
                ))}
                {!audience.length ? <li>No recipients selected.</li> : null}
              </ul>
            ) : eventNames.length ? (
              <span className={styles['recipientEvents']}>
                {eventNames.length <= 2 ? eventNames.join(' · ') : `${String(eventNames.length)} events`}
              </span>
            ) : null}
            {recipientsOpen && audience.length > 3 ? (
              <span className={styles['recipientEvents']}>+ {String(audience.length - 3)} more selected · manage the full selection in the attendee list</span>
            ) : null}
          </div>
          {channel === 'Email' || channel === 'Notification' ? (
            <label>
              {channel === 'Email' ? 'Subject' : 'Title'}
              <input
                value={subject}
                maxLength={channel === 'Email' ? 120 : 60}
                onChange={(e) => {
                  setSubject(e.target.value);
                }}
              />
            </label>
          ) : null}
          <label>
            Message
            <textarea
              rows={3}
              maxLength={limits[channel]}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
              }}
              aria-describedby="message-limit"
            />
          </label>
          <div className={styles['editorMeta']}>
            <button
              type="button"
              onClick={() => {
                setBody((value) => `${value} [First name]`);
              }}
            >
              + First name
            </button>
            <span id="message-limit" role={body.length > limits[channel] ? 'alert' : undefined}>
              {body.length} / {limits[channel]} characters
              {channel === 'SMS' ? ' · preview limit; segments depend on encoding' : ''}
            </span>
          </div>
          <label>
            Link (optional)
            <input
              type="url"
              placeholder="https://…"
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
              }}
              aria-invalid={Boolean(link && !previewLink)}
            />
          </label>
          {link && !previewLink ? <p role="alert">Use a complete http or https link.</p> : null}
          {channel === 'Email' || channel === 'WhatsApp' ? (
            <label>
              Action label
              <input
                value={action}
                maxLength={30}
                onChange={(e) => {
                  setAction(e.target.value);
                }}
              />
            </label>
          ) : null}
          <footer className={styles['delivery']}>
            <button type="button" disabled>
              Sending unavailable
            </button>
            <p role="note">Preview only · sending is not connected</p>
          </footer>
        </section>
        <section className={styles['previewColumn']} data-active={mobileView === 'preview'} aria-label={`${channel} preview`}>
          <div className={styles['phone']} data-channel={channel}>
            <div className={styles['phoneStatus']}>
              <span>9:41</span>
              <span>▰ ▰</span>
            </div>
            <div className={styles['island']} />
            {channel === 'Notification' ? (
              <div className={styles['lockScreen']}>
                <span>Wednesday</span>
                <strong>9:41</strong>
                <article className={styles['notification']}>
                  <small>THE C1RCLE · now</small>
                  <h3>{subject.length > 0 ? subject : (eventNames[0] ?? 'Event organizer')}</h3>
                  <p>{message || 'Your message'}</p>
                </article>
              </div>
            ) : (
              <>
                {channel === 'Email' ? null : (
                  <div className={styles['phoneHeader']}>
                    <span aria-hidden="true">‹</span>
                    <div className={styles['brandMark']}>C</div>
                    <div className={styles['chatContact']}>
                      <strong>{channel === 'WhatsApp' ? 'THE C1RCLE' : 'Messages'}</strong>
                      {channel === 'WhatsApp' ? <small>business account</small> : null}
                    </div>
                    {channel === 'WhatsApp' ? <span className={styles['chatCall']} aria-hidden="true">⋮</span> : null}
                  </div>
                )}
                {channel === 'Email' ? (
                  <article className={styles['email']}>
                    <div className={styles['emailToolbar']}><span>‹</span><span>•••</span></div>
                    <h3>{subject || 'Your event update'}</h3>
                    <div className={styles['emailSender']}><div className={styles['brandMark']}>C</div><p><strong>THE C1RCLE</strong><small>to selected attendees</small></p></div>
                    <p>{message || 'Your message'}</p>
                    {previewLink ? (
                      <>
                        <span className={styles['emailButton']}>{action || 'Open link'}</span>
                        <small className={styles['emailUrl']}>{previewLink}</small>
                      </>
                    ) : null}
                  </article>
                ) : (
                  <div className={styles['conversation']}>
                    <small className={styles['chatDate']}>Today 9:41 AM</small>
                    <article className={styles['bubble']}>
                      <p>{message || 'Your message'}</p>
                      {previewLink ? (
                        <span className={styles['previewLink']}>{previewLink}</span>
                      ) : null}
                      {channel === 'WhatsApp' && previewLink ? (
                        <span className={styles['previewAction']}>{action || 'Open link'}</span>
                      ) : null}
                      <small>9:41</small>
                    </article>
                  </div>
                )}
                {channel === 'WhatsApp' ? <div className={styles['chatComposer']}><span>＋</span><span>Message</span><span>◉</span></div> : null}
              </>
            )}
            <div className={styles['homeIndicator']} />
          </div>
          <p className={styles['previewCaption']}>{channel} preview</p>
        </section>
      </div>
    </dialog>
  );
}
