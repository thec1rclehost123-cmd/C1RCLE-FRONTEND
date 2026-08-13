'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { ExportIcon, SearchIcon } from '@c1rcle/icons';

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
      <header className={styles['pageHeader']}>
        <div>
          <h1>Marketing</h1>
          <p>Send one message to fill your next event.</p>
        </div>
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
      </header>
      {tab === 'compose' ? (
        <ComposeMarketing templateId={templateId} canSend={auth.canDo('canSendMarketing')} />
      ) : null}
      {tab === 'history' ? <CampaignHistory /> : null}
      {tab === 'templates' ? <MarketingTemplates /> : null}
    </section>
  );
}

/* ─── Compose ──────────────────────────────────────────────────────────────── */

const CHANNELS: readonly MarketingChannel[] = ['WhatsApp', 'SMS', 'Email', 'Push'];

const EVENTS = [
  {
    id: 'neon-nights',
    name: 'Neon Nights: Afrobeats Edition',
    date: 'Thu, 17 Jul · 10 PM',
    venue: 'Skyline Rooftop',
  },
  {
    id: 'sat-sessions',
    name: 'Saturday Sessions',
    date: 'Sat, 19 Jul · 9 PM',
    venue: 'Skyline Rooftop',
  },
  {
    id: 'urban-fridays',
    name: 'Urban Fridays',
    date: 'Fri, 25 Jul · 10 PM',
    venue: 'Skyline Rooftop',
  },
] as const;
type MarketingEventId = (typeof EVENTS)[number]['id'];

const RECIPIENTS = [
  { id: 'recipient-01', label: 'Eligible guest 01' },
  { id: 'recipient-02', label: 'Eligible guest 02' },
] as const;

const GENDER_FILTERS = ['All genders', 'Women', 'Men', 'Non-binary'] as const;
type GenderFilter = (typeof GENDER_FILTERS)[number];

const classNames = (...values: readonly (string | undefined)[]): string =>
  values.filter((value): value is string => Boolean(value)).join(' ');

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
  const [eventOpen, setEventOpen] = useState(false);
  const [recipientsOpen, setRecipientsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<MarketingEventId>(EVENTS[0].id);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<readonly string[]>(
    RECIPIENTS.map((recipient) => recipient.id),
  );
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('All genders');
  const [recipientEventFilter, setRecipientEventFilter] = useState<'All events' | MarketingEventId>(
    'All events',
  );

  // Mock data for the static UI
  const currentEvent = EVENTS.find((event) => event.id === selectedEventId) ?? EVENTS[0];
  const audienceCount = selectedRecipientIds.length;
  const activeFilterCount =
    Number(genderFilter !== 'All genders') + Number(recipientEventFilter !== 'All events');
  const cost =
    channel === 'Push'
      ? 'Free'
      : `≈ ₹${(audienceCount * (channel === 'WhatsApp' ? 0.85 : channel === 'SMS' ? 0.25 : 0.12)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const insertField = (field: string) => {
    setMessage((prev) => prev + `{{${field}}}`);
  };

  const toggleRecipient = (recipientId: string) => {
    setSelectedRecipientIds((current) =>
      current.includes(recipientId)
        ? current.filter((id) => id !== recipientId)
        : [...current, recipientId],
    );
  };

  return (
    <div className={styles['composeCard']}>
      {/* ── Left: Form ── */}
      <div className={styles['formSide']}>
        {/* Event, recipients, and audience filters */}
        <div className={styles['recipientSection']}>
          <span className={styles['fieldLabel']}>Recipients</span>
          <div className={styles['recipientsRow']}>
            <div className={styles['dropdownControl']}>
              <button
                type="button"
                className={classNames(styles['dropdownBtn'], styles['eventBtn'])}
                aria-label={`Select event. Current event: ${currentEvent.name}`}
                aria-expanded={eventOpen}
                onClick={() => {
                  setEventOpen(!eventOpen);
                  setRecipientsOpen(false);
                  setFiltersOpen(false);
                }}
              >
                <span>
                  <small>Event</small>
                  <strong>{currentEvent.name}</strong>
                </span>
                <Chevron expanded={eventOpen} />
              </button>
              {eventOpen ? (
                <div className={classNames(styles['popover'], styles['eventPopover'])}>
                  <div className={styles['popoverHeading']}>
                    <strong>Select event</strong>
                    <span>Choose the campaign event.</span>
                  </div>
                  <div className={styles['eventOptions']}>
                    {EVENTS.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        className={styles['eventOption']}
                        data-selected={event.id === selectedEventId}
                        aria-pressed={event.id === selectedEventId}
                        onClick={() => {
                          setSelectedEventId(event.id);
                          setEventOpen(false);
                        }}
                      >
                        <span className={styles['radioMark']} aria-hidden="true" />
                        <span>
                          <strong>{event.name}</strong>
                          <small>
                            {event.date} · {event.venue}
                          </small>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className={styles['dropdownControl']}>
              <button
                type="button"
                className={styles['dropdownBtn']}
                aria-expanded={recipientsOpen}
                onClick={() => {
                  setRecipientsOpen(!recipientsOpen);
                  setEventOpen(false);
                  setFiltersOpen(false);
                }}
              >
                <span>{selectedRecipientIds.length} selected</span>
                <Chevron expanded={recipientsOpen} />
              </button>
              {recipientsOpen ? (
                <div className={classNames(styles['popover'], styles['recipientsPopover'])}>
                  <div className={styles['popoverSearch']}>
                    <SearchIcon size={16} aria-hidden="true" />
                    <input aria-label="Search recipients" placeholder="Search eligible guests" />
                  </div>
                  <div className={styles['popoverSection']}>
                    <small>Select all</small>
                    <label className={classNames(styles['popoverItem'], styles['selectAllItem'])}>
                      <input
                        className={styles['srOnly']}
                        type="checkbox"
                        checked={selectedRecipientIds.length === RECIPIENTS.length}
                        onChange={(event) => {
                          setSelectedRecipientIds(
                            event.target.checked ? RECIPIENTS.map((recipient) => recipient.id) : [],
                          );
                        }}
                      />
                      <CheckBox checked={selectedRecipientIds.length === RECIPIENTS.length} />
                      <strong>Select all ({RECIPIENTS.length})</strong>
                    </label>
                  </div>
                  <div className={styles['popoverSection']}>
                    <small>Recipients</small>
                    {RECIPIENTS.map((recipient) => {
                      const checked = selectedRecipientIds.includes(recipient.id);
                      return (
                        <label className={styles['popoverItem']} key={recipient.id}>
                          <input
                            className={styles['srOnly']}
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              toggleRecipient(recipient.id);
                            }}
                          />
                          <CheckBox checked={checked} />
                          <div className={styles['recipientInfo']}>
                            <strong>{recipient.label}</strong>
                            <span>Contact details hidden</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className={classNames(styles['dropdownControl'], styles['filterControl'])}>
              <button
                type="button"
                className={styles['dropdownBtn']}
                aria-expanded={filtersOpen}
                onClick={() => {
                  setFiltersOpen(!filtersOpen);
                  setEventOpen(false);
                  setRecipientsOpen(false);
                }}
              >
                <span>Filters</span>
                {activeFilterCount > 0 ? (
                  <span className={styles['filterCount']}>{activeFilterCount}</span>
                ) : null}
                <Chevron expanded={filtersOpen} />
              </button>
              {filtersOpen ? (
                <div className={classNames(styles['popover'], styles['filtersPopover'])}>
                  <div className={styles['filterHeader']}>
                    <span>
                      <strong>Filter recipients</strong>
                      <small>Refine who receives this campaign.</small>
                    </span>
                    <button
                      type="button"
                      disabled={activeFilterCount === 0}
                      onClick={() => {
                        setGenderFilter('All genders');
                        setRecipientEventFilter('All events');
                      }}
                    >
                      Clear
                    </button>
                  </div>

                  <fieldset className={styles['filterSection']}>
                    <legend>Gender</legend>
                    <div className={styles['filterChips']}>
                      {GENDER_FILTERS.map((gender) => (
                        <button
                          key={gender}
                          type="button"
                          aria-pressed={genderFilter === gender}
                          onClick={() => {
                            setGenderFilter(gender);
                          }}
                        >
                          {gender}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className={styles['filterSection']}>
                    <legend>Event</legend>
                    <div className={styles['filterEventList']}>
                      <button
                        type="button"
                        aria-pressed={recipientEventFilter === 'All events'}
                        onClick={() => {
                          setRecipientEventFilter('All events');
                        }}
                      >
                        <span className={styles['radioMark']} aria-hidden="true" />
                        <span>
                          <strong>All events</strong>
                          <small>Every eligible guest</small>
                        </span>
                      </button>
                      {EVENTS.map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          aria-pressed={recipientEventFilter === event.id}
                          onClick={() => {
                            setRecipientEventFilter(event.id);
                          }}
                        >
                          <span className={styles['radioMark']} aria-hidden="true" />
                          <span>
                            <strong>{event.name}</strong>
                            <small>{event.date}</small>
                          </span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Channel */}
        <div className={styles['row']}>
          <span className={styles['fieldLabel']}>Channel</span>
          <div className={styles['channelRow']}>
            {CHANNELS.map((ch) => (
              <button
                key={ch}
                type="button"
                className={classNames(
                  styles['channelBtn'],
                  channel === ch ? styles['channelActive'] : undefined,
                )}
                onClick={() => {
                  setChannel(ch);
                }}
              >
                <ChannelSvg channel={ch} size={16} />
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div className={styles['row']}>
          <label className={styles['fieldLabel']} htmlFor="marketing-message">
            Message
          </label>
          <div className={styles['messageWrap']}>
            <textarea
              id="marketing-message"
              className={styles['messageArea']}
              value={message}
              maxLength={320}
              onChange={(e) => {
                setMessage(e.target.value);
              }}
            />
            <div className={styles['messageMeta']}>
              <div className={styles['fieldBtns']}>
                <button
                  type="button"
                  onClick={() => {
                    insertField('first_name');
                  }}
                >
                  First name
                </button>
                <button
                  type="button"
                  onClick={() => {
                    insertField('last_name');
                  }}
                >
                  Last name
                </button>
                <button
                  type="button"
                  onClick={() => {
                    insertField('event_link');
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                  </svg>
                  Link
                </button>
              </div>
              <span className={styles['charCount']}>{message.length} / 320</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles['actions']}>
          <button type="button" className={styles['testBtn']}>
            Send Test Blast
          </button>
          <span className={styles['actionSpacer']} />
          <button type="button" className={styles['exitBtn']}>
            Exit Without Saving
          </button>
          <button
            type="button"
            className={styles['launchBtn']}
            disabled={!canSend || true}
            title={canSend ? 'Scheduling requires the campaign mutation API.' : 'No permission.'}
          >
            Launch Campaign
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Right: Preview + cost ── */}
      <div className={styles['previewSide']}>
        <IPhonePreview channel={channel} message={message} eventName={currentEvent.name} />
        {/* Cost strip */}
        <div className={styles['costStrip']}>
          <div className={classNames(styles['costTotal'], styles['costTotalCompact'])}>
            <span className={styles['costTotalLabel']}>
              <strong>Estimated spend</strong>
              <small>{audienceCount} recipients · {channel}</small>
            </span>
            <b>{cost}</b>
          </div>
        </div>
        <div className={styles['previewMeta']}>
          <span>PREVIEW</span>
          <small>Simulated {channel} · iPhone</small>
        </div>
      </div>
    </div>
  );
}

function Chevron({ expanded }: { readonly expanded: boolean }) {
  return (
    <svg
      className={styles['chevron']}
      data-expanded={expanded}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckBox({ checked }: { readonly checked: boolean }) {
  return (
    <span className={styles['checkbox']} data-checked={checked} aria-hidden="true">
      {checked ? (
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  );
}

/* ─── iPhone Preview ───────────────────────────────────────────────────────── */

function IPhonePreview({
  channel,
  message,
  eventName,
}: {
  readonly channel: MarketingChannel;
  readonly message: string;
  readonly eventName: string;
}) {
  return (
    <div className={styles['iphone']}>
      {/* Dynamic Island */}
      <div className={styles['iphoneIsland']} />
      {/* Status bar */}
      <div className={styles['iphoneStatus']}>
        <span className={styles['iphoneTime']}>9:41</span>
        <span className={styles['iphoneSignals']}>
          <svg width="16" height="11" viewBox="0 0 17 12" fill="#fff" aria-hidden="true">
            <rect y="8" width="3" height="4" rx=".8" />
            <rect x="4.5" y="5" width="3" height="7" rx=".8" />
            <rect x="9" y="2" width="3" height="10" rx=".8" />
            <rect x="13.5" width="3" height="12" rx=".8" />
          </svg>
          <svg width="14" height="11" viewBox="0 0 16 12" fill="#fff" aria-hidden="true">
            <circle cx="8" cy="10" r="1.3" />
            <path
              d="M5.2 7.8a4 4 0 015.6 0"
              stroke="#fff"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M2.5 5.2a8 8 0 0111 0"
              stroke="#fff"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <svg width="22" height="11" viewBox="0 0 25 12" aria-hidden="true">
            <rect
              x=".5"
              y=".5"
              width="21"
              height="11"
              rx="3.5"
              fill="none"
              stroke="#fff"
              strokeOpacity=".35"
            />
            <rect x="2" y="2" width="16" height="8" rx="2" fill="#fff" />
            <path d="M23 4v4a2 2 0 000-4z" fill="#fff" fillOpacity=".4" />
          </svg>
        </span>
      </div>
      {/* Screen */}
      <div className={styles['iphoneScreen']}>
        {channel === 'WhatsApp' && <WAScreen msg={message} />}
        {channel === 'SMS' && <SMSScreen msg={message} />}
        {channel === 'Email' && <EmailScreen msg={message} name={eventName} />}
        {channel === 'Push' && <PushScreen msg={message} name={eventName} />}
      </div>
      {/* Home bar */}
      <div className={styles['iphoneHome']} />
    </div>
  );
}

/* ── WhatsApp ── */
function WAScreen({ msg }: { readonly msg: string }) {
  return (
    <>
      <div className={styles['scrHead']} data-ch="wa">
        <svg width="8" height="13" viewBox="0 0 8 14" fill="none" aria-hidden="true">
          <path
            d="M7 1L1.5 7 7 13"
            stroke="#25D366"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className={classNames(styles['scrAvatar'], styles['whatsAppAvatar'])} />
        <div className={styles['scrTitle']}>
          <strong>Broadcast List</strong>
          <small>Online</small>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#8696a0" aria-hidden="true">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </div>
      <div className={styles['scrBody']} data-ch="wa">
        <span className={styles['scrDate']} data-ch="wa">
          TODAY
        </span>
        <div className={styles['scrBubble']} data-ch="wa">
          <p>{msg || 'Message preview'}</p>
          <span>
            9:41 AM <CheckChecks />
          </span>
        </div>
      </div>
      <div className={styles['scrInput']} data-ch="wa">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" stroke="#8696a0" strokeWidth="1.3" />
          <path
            d="M8 14.5s1.5 2 4 2 4-2 4-2"
            stroke="#8696a0"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <circle cx="9" cy="10" r="1" fill="#8696a0" />
          <circle cx="15" cy="10" r="1" fill="#8696a0" />
        </svg>
        <span className={styles['scrInputBox']} data-ch="wa">
          Message
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="9" y="3" width="6" height="10" rx="3" stroke="#8696a0" strokeWidth="1.3" />
          <path d="M5 11a7 7 0 0014 0" stroke="#8696a0" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="12" y1="18" x2="12" y2="21" stroke="#8696a0" strokeWidth="1.3" />
        </svg>
      </div>
    </>
  );
}

/* ── SMS / iMessage ── */
function SMSScreen({ msg }: { readonly msg: string }) {
  return (
    <>
      <div className={styles['scrHead']} data-ch="sms">
        <svg width="8" height="13" viewBox="0 0 8 14" fill="none" aria-hidden="true">
          <path
            d="M7 1L1.5 7 7 13"
            stroke="#007AFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className={styles['smsCenter']}>
          <div className={classNames(styles['scrAvatar'], styles['smsAvatar'])}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#999" aria-hidden="true">
              <circle cx="12" cy="9" r="4" />
              <ellipse cx="12" cy="20" rx="7" ry="4" />
            </svg>
          </div>
          <span className={styles['smsNumber']}>42302 ›</span>
        </div>
        <svg width="18" height="14" viewBox="0 0 22 16" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="13" height="14" rx="2.5" stroke="#007AFF" strokeWidth="1.5" />
          <path
            d="M14 5l5.5-3v12L14 11V5Z"
            stroke="#007AFF"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className={styles['scrBody']} data-ch="sms">
        <span className={styles['scrDate']} data-ch="sms">
          Today at 9:41 AM
        </span>
        <div className={styles['scrBubble']} data-ch="sms">
          <p>{msg || 'Message preview'}</p>
        </div>
      </div>
      <div className={styles['scrInput']} data-ch="sms">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#636366"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8M8 12h8" />
        </svg>
        <span className={styles['scrInputBox']} data-ch="sms">
          iMessage
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="#636366" strokeWidth="1.5" />
          <path d="M12 8v4l2.5 1.5" stroke="#636366" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </>
  );
}

/* ── Email ── */
function EmailScreen({ msg, name }: { readonly msg: string; readonly name: string }) {
  return (
    <>
      <div className={styles['scrHead']} data-ch="email">
        <svg width="8" height="13" viewBox="0 0 8 14" fill="none" aria-hidden="true">
          <path
            d="M7 1L1.5 7 7 13"
            stroke="#007AFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className={styles['mailToolbarTitle']}><strong>Inbox</strong></div>
        <div className={styles['mailToolbarActions']} aria-hidden="true">
          <span aria-label="Archive">▱</span>
          <span aria-label="Delete">▢</span>
          <span aria-label="More">⋮</span>
        </div>
      </div>
      <div className={styles['scrBody']} data-ch="email">
        <div className={styles['emailSubject']}>{name}</div>
        <div className={styles['emailFrom']}>
          <span className={styles['emailDot']}>C</span>
          <div>
            <strong>The C1RCLE</strong>
            <small>to eligible guests</small>
          </div>
          <time>Today, 9:41 AM</time>
        </div>
        <div className={styles['emailDivider']} />
        <p className={styles['emailPara']}>{msg || 'Email preview'}</p>
        <div className={styles['emailEventCard']}>
          <span>THE C1RCLE · EVENT UPDATE</span>
          <strong>{name}</strong>
          <small>Tickets are waiting for you.</small>
          <button type="button">View event</button>
        </div>
      </div>
    </>
  );
}

/* ── Push ── */
function PushScreen({ msg, name }: { readonly msg: string; readonly name: string }) {
  return (
    <div className={styles['pushBody']}>
      <span className={styles['pushTime']}>9:41</span>
      <span className={styles['pushDate']}>Wednesday, August 12</span>
      <div className={styles['pushCard']}>
        <span className={styles['pushAppIcon']}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f44a22"
            strokeWidth="2.2"
            aria-hidden="true"
          >
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" />
          </svg>
        </span>
        <div className={styles['pushContent']}>
          <div className={styles['pushHeading']}>
            <strong>The C1rcle</strong>
            <small>now</small>
          </div>
          <b>{name}</b>
          <p>{msg ? msg.slice(0, 85) + (msg.length > 85 ? '…' : '') : 'Push preview'}</p>
        </div>
      </div>
    </div>
  );
}

function CheckChecks() {
  return (
    <svg
      className={styles['checkChecks']}
      width="14"
      height="8"
      viewBox="0 0 18 10"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 5l3.5 3.5L12 1"
        stroke="#53bdeb"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 5l3.5 3.5L16 1"
        stroke="#53bdeb"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Campaign History ─────────────────────────────────────────────────────── */

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
            onChange={(e) => {
              setQuery(e.target.value);
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
            onChange={(e) => {
              setChannel(e.target.value);
            }}
          >
            <option>All channels</option>
            {CHANNELS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <button type="button" disabled title="Export unavailable.">
          <ExportIcon size={18} aria-hidden="true" /> Export
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
        {filtered.map((c) => (
          <div className={styles['campaignRow']} role="row" key={c.id}>
            <span role="cell">
              <strong>{c.name}</strong>
              <small>{c.preview}</small>
            </span>
            <span role="cell">{c.eventName}</span>
            <span role="cell" className={styles['channelCell']}>
              <ChannelSvg channel={c.channel} size={15} />
              {c.channel}
            </span>
            <span role="cell">{c.sentAt ?? '—'}</span>
            <span role="cell">{campaignResultLabel(c.providerResult)}</span>
            <span role="cell" data-status={c.status}>
              {c.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Templates ────────────────────────────────────────────────────────────── */

function MarketingTemplates() {
  return (
    <section className={styles['templates']}>
      <header>
        <h2>Templates</h2>
        <p>Start with a message that works.</p>
      </header>
      <div className={styles['templateGrid']}>
        {venueMarketingTemplates.map((t) => (
          <article key={t.id}>
            <span className={styles['templateIcon']}>
              <ChannelSvg channel={t.channel} size={22} />
            </span>
            <div>
              <small>{t.channel}</small>
              <h3>{t.title}</h3>
              <p>{t.preview}</p>
            </div>
            <Link href={`/venue/marketing?tab=compose&template=${t.id}`}>Use template</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ─── Channel SVGs ─────────────────────────────────────────────────────────── */

function ChannelSvg({
  channel,
  size = 20,
}: {
  readonly channel: MarketingChannel;
  readonly size?: number;
}) {
  if (channel === 'WhatsApp')
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2C6.477 2 2 6.477 2 12c0 1.89.523 3.657 1.432 5.168L2 22l4.979-1.409A10 10 0 1012 2z"
          fill="#25D366"
        />
        <path
          d="M17 14.93c-.275-.137-1.628-.803-1.88-.895-.25-.09-.433-.136-.615.137-.182.272-.706.894-.866 1.08-.16.183-.32.206-.594.069-.274-.137-1.157-.426-2.203-1.359-.814-.726-1.363-1.62-1.524-1.894-.16-.274-.017-.422.12-.558.123-.123.274-.32.41-.48.138-.16.183-.274.275-.456.09-.183.045-.343-.023-.48-.069-.137-.614-1.487-.843-2.037-.22-.533-.447-.46-.614-.469L8.8 8.6c-.183 0-.48.069-.731.343-.252.274-.96.937-.96 2.285 0 1.348.984 2.651 1.12 2.834.138.183 1.935 2.95 4.685 4.137.655.283 1.166.452 1.564.578.657.21 1.255.18 1.727.11.527-.078 1.628-.666 1.857-1.31.228-.641.228-1.19.16-1.31-.068-.114-.25-.182-.526-.318z"
          fill="#fff"
        />
      </svg>
    );
  if (channel === 'SMS')
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" fill="#34C759" />
        <path d="M7 9h10M7 13h6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  if (channel === 'Email')
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" fill="#007AFF" />
        <path
          d="M2 7l10 7 10-7"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#f44a22" />
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#fff" strokeWidth="1.5" />
      <path d="M13.73 21a2 2 0 01-3.46 0" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
