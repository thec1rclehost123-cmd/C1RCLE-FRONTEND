import styles from './marketing.module.css';

import type {
  MarketingAudience,
  MarketingCampaign,
  MarketingChannel,
  MarketingData,
  MarketingSchedule,
  MarketingCampaignStatus,
} from '@/data/partner-data-source';

const channelNames: Record<MarketingChannel, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  email: 'Email',
  push: 'Push',
};

const channelGlyphs: Record<MarketingChannel, string> = {
  whatsapp: '◉',
  sms: '▰',
  email: '✉',
  push: '●',
};

export function channelLabel(channel: MarketingChannel) {
  return channelNames[channel];
}

export function MarketingStatusBadge({ status }: { readonly status: MarketingCampaignStatus }) {
  return (
    <span className={styles['status']} data-status={status}>
      {status}
    </span>
  );
}

export function MarketingCampaignCard({
  campaign,
  selected,
  onSelect,
}: {
  readonly campaign: MarketingCampaign;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <button
      className={styles['campaignCard']}
      data-selected={selected}
      type="button"
      onClick={onSelect}
    >
      <div className={styles['campaignTop']}>
        <span className={styles['channelIcon']} aria-hidden="true">
          {channelGlyphs[campaign.channel]}
        </span>
        <span className={styles['campaignCopy']}>
          <strong>{campaign.title}</strong>
          <span>{campaign.meta}</span>
        </span>
      </div>
      <MarketingStatusBadge status={campaign.status} />
      <div className={styles['campaignMetrics']}>
        <span className={styles['campaignMetric']}>
          <span>Sent</span>
          <strong>{campaign.sent.toLocaleString('en-IN')}</strong>
        </span>
        <span className={styles['campaignMetric']}>
          <span>Read</span>
          <strong>{campaign.read.toLocaleString('en-IN')}</strong>
        </span>
        <span className={styles['campaignMetric']}>
          <span>Clicked</span>
          <strong>{campaign.clicked.toLocaleString('en-IN')}</strong>
        </span>
      </div>
      {selected ? (
        <div className={styles['campaignDetail']}>
          {campaign.audienceLabel} · {channelNames[campaign.channel]} delivery summary
        </div>
      ) : null}
    </button>
  );
}

export function MarketingPreview({
  channel,
  message,
}: {
  readonly channel: MarketingChannel;
  readonly message: string;
}) {
  const previewText = message.replace(/\{\{?\s*name\s*\}?\}/gi, 'Aisha') || 'Type your message…';
  return (
    <div className={styles['previewPanel']}>
      <div className={styles['previewTitle']}>Live preview</div>
      <div className={styles['phone']} data-channel={channel}>
        <span className={styles['phoneNotch']} aria-hidden="true" />
        <div className={styles['phoneHeader']}>
          <span className={styles['phoneHeaderIcon']} aria-hidden="true">
            C
          </span>
          <span>
            <strong>The C1RCLE</strong>
            <span>{channelNames[channel]}</span>
          </span>
        </div>
        <div className={styles['phoneBody']}>
          <span className={styles['bubble']} data-channel={channel}>
            {previewText}
          </span>
        </div>
      </div>
      <div className={styles['previewFooter']}>
        Preview frame
        <br />
        {channelNames[channel]} — live preview
      </div>
    </div>
  );
}

export function AudienceSelector({
  audiences,
  selected,
  onSelect,
}: {
  readonly audiences: readonly MarketingAudience[];
  readonly selected: string;
  readonly onSelect: (value: MarketingAudience['id']) => void;
}) {
  return (
    <div className={styles['audienceList']}>
      {audiences.map((audience) => (
        <button
          className={styles['audienceChoice']}
          data-selected={audience.id === selected}
          key={audience.id}
          type="button"
          onClick={() => {
            onSelect(audience.id);
          }}
        >
          <span className={styles['radio']} aria-hidden="true" />
          <span className={styles['audienceCopy']}>
            <strong>{audience.label}</strong>
            <span>{audience.sub}</span>
          </span>
          <span className={styles['audienceCount']}>{audience.count}</span>
        </button>
      ))}
    </div>
  );
}

export function MarketingChannelSelector({
  selected,
  onSelect,
}: {
  readonly selected: MarketingChannel;
  readonly onSelect: (value: MarketingChannel) => void;
}) {
  return (
    <div className={styles['channelList']}>
      {(Object.keys(channelNames) as MarketingChannel[]).map((channel) => (
        <button
          className={styles['channelChoice']}
          data-selected={channel === selected}
          key={channel}
          type="button"
          onClick={() => {
            onSelect(channel);
          }}
        >
          <span aria-hidden="true">{channelGlyphs[channel]}</span>
          {channelNames[channel]}
        </button>
      ))}
    </div>
  );
}

export function MarketingScheduleControls({
  value,
  onChange,
}: {
  readonly value: MarketingSchedule;
  readonly onChange: (value: MarketingSchedule) => void;
}) {
  return (
    <>
      <div className={styles['scheduleBox']}>
        <button
          className={styles['scheduleChoice']}
          data-selected={value.mode === 'now'}
          type="button"
          onClick={() => {
            onChange({ ...value, mode: 'now' });
          }}
        >
          Send now
        </button>
        <button
          className={styles['scheduleChoice']}
          data-selected={value.mode === 'scheduled'}
          type="button"
          onClick={() => {
            onChange({ ...value, mode: 'scheduled' });
          }}
        >
          Schedule blast
        </button>
      </div>
      {value.mode === 'scheduled' ? (
        <div className={styles['scheduleFields']}>
          <label>
            Date
            <input
              type="date"
              value={value.date}
              onChange={(event) => {
                onChange({ ...value, date: event.target.value });
              }}
            />
          </label>
          <label>
            Time
            <input
              type="time"
              value={value.time}
              onChange={(event) => {
                onChange({ ...value, time: event.target.value });
              }}
            />
          </label>
        </div>
      ) : null}
    </>
  );
}

function messageEditor(
  message: string,
  onMessage: (value: string) => void,
  onInsertName: () => void,
  linkLabel: string,
) {
  return (
    <>
      <div className={styles['messageHeader']}>
        <span className={styles['fieldLabel']}>3 · Your message</span>
        <button className={styles['insertButton']} type="button" onClick={onInsertName}>
          Insert guest&apos;s name
        </button>
      </div>
      <textarea
        className={styles['messageBox']}
        value={message}
        onChange={(event) => {
          onMessage(event.target.value);
        }}
        placeholder="Type your message..."
      />
      <div className={styles['charCount']}>{message.length} / 160 characters</div>
      {linkLabel ? (
        <button
          className={styles['insertButton']}
          type="button"
          onClick={() => {
            onMessage(`${message}\n${linkLabel}`);
          }}
        >
          Add Event Link
        </button>
      ) : null}
    </>
  );
}

export function MarketingComposer({
  data,
  audience,
  channel,
  message,
  schedule,
  onAudience,
  onChannel,
  onMessage,
  onSchedule,
  onClose,
}: {
  readonly data: MarketingData;
  readonly audience: MarketingAudience['id'];
  readonly channel: MarketingChannel;
  readonly message: string;
  readonly schedule: MarketingSchedule;
  readonly onAudience: (value: MarketingAudience['id']) => void;
  readonly onChannel: (value: MarketingChannel) => void;
  readonly onMessage: (value: string) => void;
  readonly onSchedule: (value: MarketingSchedule) => void;
  readonly onClose: () => void;
}) {
  const audienceCount = data.audiences.find((item) => item.id === audience)?.count ?? '0';
  const delivery =
    schedule.mode === 'scheduled'
      ? `This campaign is ready to be scheduled for ${schedule.date || 'a selected date'}.`
      : `This will be sent via ${channelNames[channel]} to ${audienceCount} people.`;
  return (
    <div className={styles['overlay']} role="presentation">
      <div
        className={styles['modal']}
        role="dialog"
        aria-modal="true"
        aria-labelledby="composer-title"
      >
        <div className={styles['modalForm']}>
          <div className={styles['modalHeader']}>
            <h2 id="composer-title">Compose a message</h2>
            <button
              className={styles['iconButton']}
              type="button"
              aria-label="Close composer"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <p className={styles['modalIntro']}>See exactly what guests get before you send.</p>
          <span className={styles['fieldLabel']}>1 · Who gets it</span>
          <AudienceSelector audiences={data.audiences} selected={audience} onSelect={onAudience} />
          <span className={styles['fieldLabel']}>2 · How to send it</span>
          <MarketingChannelSelector selected={channel} onSelect={onChannel} />
          {messageEditor(
            message,
            onMessage,
            () => {
              onMessage(`${message} {{name}}`);
            },
            'Add Event Link',
          )}
          <MarketingScheduleControls value={schedule} onChange={onSchedule} />
          <div className={styles['modalNotice']}>
            ⓘ{' '}
            <span>
              {delivery} Final delivery remains unavailable until the marketing mutation contract is
              connected.
            </span>
          </div>
          <div className={styles['modalActions']}>
            <button className={styles['secondaryButton']} type="button" onClick={onClose}>
              Cancel
            </button>
            <button className={styles['primaryButton']} type="button" disabled>
              Send to {audienceCount} people
            </button>
          </div>
        </div>
        <MarketingPreview channel={channel} message={message} />
      </div>
    </div>
  );
}

export function BroadcastDialog({
  selectedCount,
  channel,
  message,
  schedule,
  onChannel,
  onMessage,
  onSchedule,
  onClose,
}: {
  readonly selectedCount: number;
  readonly channel: MarketingChannel;
  readonly message: string;
  readonly schedule: MarketingSchedule;
  readonly onChannel: (value: MarketingChannel) => void;
  readonly onMessage: (value: string) => void;
  readonly onSchedule: (value: MarketingSchedule) => void;
  readonly onClose: () => void;
}) {
  return (
    <div className={styles['overlay']} role="presentation">
      <div
        className={[styles['modal'], styles['broadcastModal']].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="broadcast-title"
      >
        <div className={styles['modalHeader']}>
          <div>
            <h2 id="broadcast-title">Broadcast Campaign</h2>
            <p className={styles['modalIntro']}>{selectedCount} attendees selected</p>
          </div>
          <button
            className={styles['iconButton']}
            type="button"
            aria-label="Close broadcast dialog"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className={styles['broadcastBody']}>
          <div>
            <span className={styles['fieldLabel']}>Send via</span>
            <MarketingChannelSelector selected={channel} onSelect={onChannel} />
            {messageEditor(
              message,
              onMessage,
              () => {
                onMessage(`${message} {{name}}`);
              },
              'Add Event Link',
            )}
            <span className={styles['fieldLabel']}>Power-ups</span>
            <div className={styles['powerUps']}>
              <button className={styles['powerUp']} type="button" disabled>
                <strong>Custom sender</strong>
                <span>Verify your own number</span>
              </button>
              <button className={styles['powerUp']} type="button" disabled>
                <strong>Schedule blast</strong>
                <span>Send at a specific time</span>
              </button>
            </div>
            <MarketingScheduleControls value={schedule} onChange={onSchedule} />
          </div>
          <div className={styles['broadcastPreview']}>
            <MarketingPreview channel={channel} message={message} />
          </div>
        </div>
        <div className={styles['broadcastFooter']}>
          <button className={styles['quietButton']} type="button" onClick={onClose}>
            Send Test Blast
          </button>
          <div className={styles['broadcastFooterActions']}>
            <button className={styles['quietButton']} type="button" onClick={onClose}>
              Exit Without Saving
            </button>
            <button className={styles['primaryButton']} type="button" disabled>
              Launch Campaign →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
