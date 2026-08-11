import Link from 'next/link';

import { CalendarIcon, SmsIcon, UsersIcon } from '@c1rcle/icons';

import {
  CopyEventLinkAction,
  CreateEventMessageAction,
} from '../event-detail/EventMarketingActions';
import styles from '../event-detail/VenueEventOperations.module.css';

import type { VenueEventMarketingModel } from '../event-detail-model';

export function VenueEventMarketingScreen({
  model,
}: {
  readonly model: VenueEventMarketingModel | null;
}) {
  return (
    <div className={styles['operationsPage']}>
      <header className={styles['pageHeader']}>
        <div>
          <h2>Marketing</h2>
          <p>Messages sent for this event.</p>
        </div>
        <CreateEventMessageAction label="Create message" />
      </header>

      {!model ? (
        <section className={styles['emptyState']}>
          <h3>No messages have been sent.</h3>
          <p>Create a message when Marketing access is available.</p>
          <Link href="/venue/events">Return to events</Link>
        </section>
      ) : (
        <>
          {model.activeCampaign ? (
            <section className={styles['activeCampaign']} aria-labelledby="active-campaign-title">
              <span>Active campaign</span>
              <div className={styles['campaignBody']}>
                <span className={styles['campaignIcon']} aria-hidden="true">
                  <SmsIcon size={28} />
                </span>
                <div className={styles['campaignDetails']}>
                  <h3 id="active-campaign-title">{model.activeCampaign.name}</h3>
                  <div>
                    <span>
                      <SmsIcon size={17} aria-hidden="true" /> {model.activeCampaign.channel}
                    </span>
                    <span>
                      <CalendarIcon size={17} aria-hidden="true" />
                      {model.activeCampaign.scheduledFor}
                    </span>
                    <span>
                      <UsersIcon size={18} aria-hidden="true" />
                      {model.activeCampaign.audienceSize}
                    </span>
                  </div>
                </div>
                <span className={styles['status']} data-status="active">
                  {model.activeCampaign.status}
                </span>
                <CreateEventMessageAction label="Edit" />
              </div>
            </section>
          ) : null}

          <div className={styles['marketingGrid']}>
            <section className={styles['panel']} aria-labelledby="recent-messages-title">
              <h3 id="recent-messages-title">Recent messages</h3>
              <div className={styles['tableWrap']}>
                <table className={styles['messageTable']}>
                  <thead>
                    <tr>
                      <th scope="col">Message</th>
                      <th scope="col">Channel</th>
                      <th scope="col">Sent</th>
                      <th scope="col">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.recentMessages.map((message) => (
                      <tr key={message.id}>
                        <td data-label="Message">{message.message}</td>
                        <td data-label="Channel">{message.channel}</td>
                        <td data-label="Sent">{message.sentAt}</td>
                        <td data-label="Result">{message.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside
              className={[styles['panel'], styles['eventLinkPanel']].filter(Boolean).join(' ')}
            >
              <h3>Event link</h3>
              <a href={model.eventUrl}>{model.eventUrl.replace('https://', '')}</a>
              <CopyEventLinkAction eventUrl={model.eventUrl} />
              <div className={styles['qrUnavailable']} role="status">
                QR code unavailable.
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
