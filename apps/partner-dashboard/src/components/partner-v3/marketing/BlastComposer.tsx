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
  onClose,
}: {
  readonly audience: MarketingAudience['rows'];
  readonly audienceContext?: string | undefined;
  readonly onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [channel, setChannel] = useState<Channel>('WhatsApp');
  const [body, setBody] = useState('Hey [First name],');
  const [subject, setSubject] = useState('');
  const [link, setLink] = useState('');
  const [action, setAction] = useState('View event');
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
          <span>COMPOSE · PREVIEW ONLY</span>
          <h2 id="blast-title">Marketing blast</h2>
        </div>
        <button type="button" aria-label="Close composer" onClick={onClose}>
          ✕
        </button>
      </header>
      <div className={styles['composerGrid']}>
        <section className={styles['editor']} aria-label="Message composer">
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
          <label>
            Blast name
            <input placeholder="Early bird reminder" maxLength={100} />
          </label>
          <div className={styles['audienceSummary']}>
            <strong>{audience.length} selected event attendees</strong>
            <span>
              {eventNames.length <= 2
                ? eventNames.join(' · ')
                : `${String(eventNames.length)} events`}
              {audienceContext ? ` · ${audienceContext}` : ''}
            </span>
            <button type="button" onClick={onClose}>
              Edit audience
            </button>
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
              rows={6}
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
              Delivery not connected
            </button>
            <p>
              Local preview only. Channel consent and delivery eligibility are not connected.
              Closing discards this composition.
            </p>
          </footer>
        </section>
        <section className={styles['previewColumn']} aria-label={`${channel} preview`}>
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
                <div className={styles['phoneHeader']}>
                  <span aria-hidden="true">‹</span>
                  <div className={styles['brandMark']}>C</div>
                  <strong>{channel === 'Email' ? 'Inbox' : 'THE C1RCLE'}</strong>
                </div>
                {channel === 'Email' ? (
                  <article className={styles['email']}>
                    <small>From THE C1RCLE / Event organizer</small>
                    <h3>{subject || 'Subject'}</h3>
                    <p>{message || 'Your message'}</p>
                    {previewLink ? (
                      <span className={styles['previewAction']}>{action || 'Open link'}</span>
                    ) : null}
                  </article>
                ) : (
                  <div className={styles['conversation']}>
                    <small>Today · 9:41</small>
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
              </>
            )}
            <div className={styles['homeIndicator']} />
          </div>
          <p className={styles['previewCaption']}>Sample preview · {channel}</p>
        </section>
      </div>
    </dialog>
  );
}
