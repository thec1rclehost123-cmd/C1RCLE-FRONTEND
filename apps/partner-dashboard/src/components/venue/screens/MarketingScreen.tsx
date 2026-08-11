'use client';

import { css } from '../charts';
import {
  CAMPAIGNS,
  CH_BRAND,
  CH_NAME,
  PHONE_SCREEN,
  PHONE_SHELL,
  RECIPIENTS,
  STATUS_BG,
  TEMPLATES,
  chTag,
  iconWrapMk,
  pillTab,
} from '../data';
import { Icon } from '../Icon';
import { useVenueStudio } from '../store';

import type { Audience, Channel } from '../data';
import type { MarketingView } from '../store';

const MARKETING_TABS: readonly (readonly [MarketingView, string])[] = [
  ['compose', 'Compose'],
  ['history', 'Campaign history'],
  ['templates', 'Templates'],
];

const GLASS_PANEL =
  'position:relative;border-radius:24px;overflow:hidden;background:rgba(20,20,20,0.6);' +
  'backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,0.08);' +
  'box-shadow:inset 0 1px 0 rgba(255,255,255,0.06),0 20px 50px rgba(0,0,0,0.35);';

const SECTION_LABEL = css(
  'font-size:12px;font-weight:700;color:#6a6a66;text-transform:uppercase;letter-spacing:0.08em;',
);

export function MarketingScreen() {
  const s = useVenueStudio();

  return (
    <div>
      <div
        style={css(
          'display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px;',
        )}
      >
        <div>
          <h1 style={css('margin:0;font-size:30px;font-weight:800;letter-spacing:-0.02em;')}>
            Marketing
          </h1>
          <div style={css('font-size:14px;color:#8a8a86;font-weight:500;margin-top:6px;')}>
            Compose once. See exactly what lands on every guest&apos;s phone.
          </div>
        </div>
      </div>

      <div
        style={css(
          'display:flex;gap:4px;background:rgba(20,20,20,0.6);border:1px solid rgba(255,255,255,0.07);backdrop-filter:blur(18px);padding:4px;border-radius:999px;width:fit-content;margin-bottom:24px;',
        )}
      >
        {MARKETING_TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              s.setMarketingView(id);
            }}
            style={css(pillTab(s.marketingView === id))}
          >
            {label}
          </button>
        ))}
      </div>

      {s.marketingView === 'compose' ? <ComposeView /> : null}
      {s.marketingView === 'history' ? <HistoryView /> : null}
      {s.marketingView === 'templates' ? <TemplatesView /> : null}
    </div>
  );
}

// ── compose ─────────────────────────────────────────────────────────────────

const AUDIENCE_SEGS: readonly (readonly [Audience, string])[] = [
  ['event', 'This event'],
  ['all', 'All guests'],
  ['custom', 'Custom'],
];

const CHANNEL_TILES: readonly (readonly [Channel, string])[] = [
  ['whatsapp', 'WhatsApp'],
  ['sms', 'SMS'],
  ['email', 'Email'],
  ['push', 'Push'],
];

function ComposeView() {
  const s = useVenueStudio();

  const charCount = s.cText.length;
  const segments =
    s.cChannel === 'sms'
      ? `${String(Math.max(1, Math.ceil(charCount / 160)))} SMS`
      : CH_NAME[s.cChannel];
  const recipients = RECIPIENTS[s.cAudience];

  return (
    <div style={css('display:grid;grid-template-columns:1fr 380px;gap:24px;align-items:start;')}>
      <div style={css('display:flex;flex-direction:column;gap:20px;')}>
        {/* audience + channel */}
        <div style={css(`${GLASS_PANEL}padding:26px;`)}>
          <div style={{ ...SECTION_LABEL, marginBottom: 16 }}>Who gets it</div>
          <div style={css('display:flex;align-items:center;gap:16px;')}>
            <div
              style={css(
                'display:inline-flex;gap:4px;background:#0d0d0d;border:1px solid rgba(255,255,255,0.07);padding:4px;border-radius:999px;',
              )}
            >
              {AUDIENCE_SEGS.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    s.setCAudience(id);
                  }}
                  style={css(
                    'border:none;cursor:pointer;padding:9px 18px;border-radius:999px;font-size:13px;font-weight:600;' +
                      (s.cAudience === id
                        ? 'background:#ff5a1f;color:#0a0a0a;'
                        : 'background:transparent;color:#8a8a86;'),
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div
              style={css(
                'margin-left:auto;display:inline-flex;align-items:center;gap:10px;background:rgba(255,90,31,0.12);border:1px solid rgba(255,90,31,0.3);padding:10px 18px;border-radius:999px;',
              )}
            >
              <Icon name="users" size={18} color="#ff8a55" />
              <span
                style={css(
                  'font-size:22px;font-weight:800;color:#ff8a55;letter-spacing:-0.01em;font-variant-numeric:tabular-nums;',
                )}
              >
                {recipients}
              </span>
              <span style={css('font-size:13px;font-weight:600;color:#d8b8a8;')}>people</span>
            </div>
          </div>

          <div style={css('height:1px;background:rgba(255,255,255,0.08);margin:24px 0;')} />

          <div style={{ ...SECTION_LABEL, marginBottom: 16 }}>Where it sends</div>
          <div style={css('display:grid;grid-template-columns:repeat(4,1fr);gap:12px;')}>
            {CHANNEL_TILES.map(([id, label]) => {
              const on = s.cChannel === id;
              const b = CH_BRAND[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    s.setCChannel(id);
                  }}
                  style={css(
                    `display:flex;flex-direction:column;align-items:center;gap:12px;cursor:pointer;padding:18px 8px;border-radius:16px;color:${on ? '#f5f5f3' : '#c9c9c6'};background:${on ? b.bg : '#0d0d0d'};border:1px solid ${on ? b.color : 'rgba(255,255,255,0.07)'};box-shadow:${on ? `0 0 26px ${b.glow}` : 'none'};transition:all .15s;`,
                  )}
                >
                  <div
                    style={css(
                      `width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:${on ? b.color : 'rgba(255,255,255,0.05)'};color:${on ? '#fff' : b.color};transition:all .15s;`,
                    )}
                  >
                    <ChannelGlyph channel={id} />
                  </div>
                  <span style={css('font-size:13px;font-weight:700;')}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* message */}
        <div style={css(`${GLASS_PANEL}padding:24px;`)}>
          <div
            style={css(
              'display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;',
            )}
          >
            <div style={SECTION_LABEL}>Message</div>
            <div style={css('display:flex;gap:8px;')}>
              <button
                type="button"
                onClick={() => {
                  s.setCText(`${s.cText}{{name}}`);
                }}
                className="vh-accent-18"
                style={css(
                  'display:inline-flex;align-items:center;gap:6px;background:rgba(255,90,31,0.1);border:1px solid rgba(255,90,31,0.28);color:#ff8a55;padding:7px 12px;border-radius:999px;font-size:12px;font-weight:700;cursor:pointer;',
                )}
              >
                <Icon name="user" size={13} /> Guest&apos;s name
              </button>
              <button
                type="button"
                onClick={() => {
                  s.setCText(`${s.cText}thec1rcle.com/e/neon`);
                }}
                className="vh-accent-18"
                style={css(
                  'display:inline-flex;align-items:center;gap:6px;background:rgba(255,90,31,0.1);border:1px solid rgba(255,90,31,0.28);color:#ff8a55;padding:7px 12px;border-radius:999px;font-size:12px;font-weight:700;cursor:pointer;',
                )}
              >
                <Icon name="link" size={13} /> Event link
              </button>
            </div>
          </div>
          <textarea
            aria-label="Message"
            value={s.cText}
            onChange={(e) => {
              s.setCText(e.target.value);
            }}
            placeholder="Write your message..."
            style={css(
              'width:100%;min-height:140px;resize:vertical;background:#0d0d0d;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:16px;color:#f5f5f3;font-size:14px;line-height:1.55;font-family:inherit;',
            )}
          />
          <div
            style={css(
              'display:flex;align-items:center;justify-content:space-between;margin-top:14px;',
            )}
          >
            <div
              style={css(
                'display:inline-flex;align-items:center;gap:9px;font-size:13px;font-weight:600;color:#d8b8a8;',
              )}
            >
              <span
                style={css(
                  'width:7px;height:7px;border-radius:50%;background:#ff5a1f;box-shadow:0 0 8px #ff5a1f;',
                )}
              />
              This will be sent via {CH_NAME[s.cChannel]} to {recipients} people.
            </div>
            <span
              style={css(
                'font-size:12px;color:#8a8a86;font-weight:600;font-variant-numeric:tabular-nums;',
              )}
            >
              {charCount} characters · {segments}
            </span>
          </div>
        </div>

        <div style={css('display:flex;gap:12px;')}>
          <button
            type="button"
            disabled
            title="Messaging delivery is enabled when the backend campaign mutation is connected."
            style={css(
              'display:inline-flex;align-items:center;justify-content:center;gap:9px;flex:1;background:#313131;color:#8a8a86;border:none;padding:16px;border-radius:999px;font-size:15px;font-weight:800;cursor:not-allowed;',
            )}
          >
            <Icon name="send" size={17} /> Connect delivery to send
          </button>
          <button
            type="button"
            className="vh-1c"
            style={css(
              'background:rgba(20,20,20,0.7);border:1px solid rgba(255,255,255,0.1);color:#f5f5f3;padding:16px 26px;border-radius:999px;font-size:15px;font-weight:600;cursor:pointer;backdrop-filter:blur(10px);',
            )}
          >
            Save draft
          </button>
        </div>
      </div>

      <PhonePreview />
    </div>
  );
}

function ChannelGlyph({ channel }: { readonly channel: Channel }) {
  if (channel === 'whatsapp') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 24, height: 24 }}>
        <path d="M17.5 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.4-1.48-.89-.8-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.29.18-1.42-.07-.13-.27-.2-.57-.35zM12.04 21.5a9.4 9.4 0 01-4.8-1.32l-.34-.2-3.57.93.96-3.48-.23-.36a9.44 9.44 0 01-1.44-5.01c0-5.2 4.24-9.44 9.46-9.44 2.52 0 4.9.99 6.68 2.77a9.38 9.38 0 012.76 6.68c0 5.2-4.24 9.44-9.44 9.44z" />
      </svg>
    );
  }
  if (channel === 'sms') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 24, height: 24 }}>
        <path d="M12 3C6.5 3 2 6.68 2 11.2c0 2.57 1.46 4.87 3.75 6.38-.18.9-.68 2.16-1.46 3.06-.22.25 0 .63.32.53 1.9-.5 3.28-1.28 4.09-1.87 1.03.24 2.13.37 3.3.37 5.5 0 10-3.68 10-8.2S17.5 3 12 3z" />
      </svg>
    );
  }
  if (channel === 'email') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: 23, height: 23 }}
      >
        <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 23, height: 23 }}>
      <path d="M12 22a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22zm7-6.2V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C8.63 5.36 7 7.92 7 11v4.8l-1.7 1.7a1 1 0 00.7 1.7h12a1 1 0 00.7-1.7L19 15.8z" />
    </svg>
  );
}

function PhonePreview() {
  const s = useVenueStudio();
  const ch = s.cChannel;
  const previewText = s.cText.replace(/\{\{?\s*name\s*\}?\}/gi, 'Aisha') || 'Type your message…';
  const statusColor = ch === 'email' ? '#202124' : '#fff';

  const statusBar = css(
    `display:flex;align-items:center;justify-content:space-between;padding:16px 26px 8px;font-size:13px;font-weight:600;color:${statusColor};background:${STATUS_BG[ch]};` +
      (ch === 'push' ? 'position:absolute;top:0;left:0;right:0;z-index:3;' : ''),
  );

  return (
    <div style={css('position:sticky;top:96px;')}>
      <div
        style={css('display:flex;align-items:center;gap:9px;margin-bottom:16px;padding-left:4px;')}
      >
        <span
          style={css(
            'width:7px;height:7px;border-radius:50%;background:#6ee79b;box-shadow:0 0 8px #6ee79b;',
          )}
        />
        <span
          style={css(
            'font-size:12px;font-weight:700;color:#8a8a86;text-transform:uppercase;letter-spacing:0.08em;',
          )}
        >
          Live preview · {CH_NAME[ch]}
        </span>
      </div>
      <div style={css('position:relative;')}>
        <div
          style={{
            position: 'absolute',
            inset: -30,
            background: `radial-gradient(circle at 50% 40%, ${CH_BRAND[ch].glow}, transparent 70%)`,
            filter: 'blur(20px)',
            zIndex: 0,
          }}
        />
        <div style={css(PHONE_SHELL)}>
          <div
            style={css(
              'position:absolute;top:10px;left:50%;transform:translateX(-50%);width:96px;height:26px;background:#000;border-radius:999px;z-index:5;',
            )}
          />
          <div style={css(PHONE_SCREEN)}>
            <div style={statusBar}>
              <span style={{ fontWeight: 700 }}>9:41</span>
              <div style={css('display:flex;align-items:center;gap:6px;')}>
                <Icon name="signal" size={15} />
                <Icon name="wifi" size={15} />
                <Icon name="battery-full" size={20} />
              </div>
            </div>

            {ch === 'whatsapp' ? <WhatsAppPreview text={previewText} /> : null}
            {ch === 'sms' ? <SmsPreview text={previewText} /> : null}
            {ch === 'email' ? <EmailPreview text={previewText} /> : null}
            {ch === 'push' ? <PushPreview text={previewText} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function WhatsAppPreview({ text }: { readonly text: string }) {
  return (
    <div style={css('flex:1;display:flex;flex-direction:column;background:#0b141a;')}>
      <div
        style={css(
          'display:flex;align-items:center;gap:11px;padding:10px 14px;background:#1f2c34;',
        )}
      >
        <Icon name="chevron-left" size={22} color="#8ea0ab" />
        <div
          style={css(
            'width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#ff5a1f,#c23d10);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;',
          )}
        >
          C1
        </div>
        <div style={css('flex:1;')}>
          <div style={css('font-size:14px;font-weight:700;color:#e9edef;')}>The C1RCLE</div>
          <div style={css('font-size:11px;color:#8ea0ab;')}>business account</div>
        </div>
        <Icon name="video" size={20} color="#8ea0ab" />
        <Icon name="phone" size={18} color="#8ea0ab" />
      </div>
      <div
        style={{
          ...css(
            'flex:1;padding:16px 12px;display:flex;flex-direction:column;justify-content:flex-end;gap:8px;background-color:#0b141a;',
          ),
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      >
        <div
          style={css(
            'align-self:center;background:rgba(31,44,52,0.9);color:#8ea0ab;font-size:10.5px;font-weight:600;padding:4px 12px;border-radius:8px;margin-bottom:4px;',
          )}
        >
          TODAY
        </div>
        <div
          style={css(
            'align-self:flex-end;max-width:82%;position:relative;background:#005c4b;color:#e9edef;padding:8px 11px 6px;border-radius:10px;border-top-right-radius:2px;font-size:13px;line-height:1.45;box-shadow:0 1px 1px rgba(0,0,0,0.25);',
          )}
        >
          {text}
          <div
            style={css(
              'display:flex;align-items:center;justify-content:flex-end;gap:4px;margin-top:3px;',
            )}
          >
            <span style={css('font-size:10px;color:rgba(233,237,239,0.6);')}>9:41 AM</span>
            <svg viewBox="0 0 18 12" fill="none" style={{ width: 16, height: 11 }}>
              <path
                d="M1 6.5L4 9.5L9.5 3"
                stroke="#53bdeb"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.5 9.5L12 3"
                stroke="#53bdeb"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
      <div
        style={css('display:flex;align-items:center;gap:9px;padding:8px 12px;background:#0b141a;')}
      >
        <div
          style={css(
            'flex:1;background:#1f2c34;border-radius:999px;padding:9px 14px;color:#8ea0ab;font-size:12px;',
          )}
        >
          Message
        </div>
        <div
          style={css(
            'width:38px;height:38px;border-radius:50%;background:#00a884;display:flex;align-items:center;justify-content:center;',
          )}
        >
          <Icon name="mic" size={18} color="#fff" />
        </div>
      </div>
    </div>
  );
}

function SmsPreview({ text }: { readonly text: string }) {
  return (
    <div style={css('flex:1;display:flex;flex-direction:column;background:#000;')}>
      <div
        style={css(
          'position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;padding:8px 14px 12px;border-bottom:0.5px solid rgba(255,255,255,0.12);',
        )}
      >
        <div style={{ position: 'absolute', left: 12, top: 8 }}>
          <Icon name="chevron-left" size={22} color="#0a84ff" />
        </div>
        <div
          style={css(
            'width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#ff5a1f,#c23d10);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:#fff;',
          )}
        >
          C1
        </div>
        <div
          style={css(
            'font-size:12px;font-weight:600;color:#e9e9ea;display:flex;align-items:center;gap:3px;',
          )}
        >
          The C1RCLE <Icon name="chevron-right" size={13} color="#8a8a8e" />
        </div>
      </div>
      <div
        style={css(
          'flex:1;padding:16px 14px;display:flex;flex-direction:column;justify-content:flex-end;gap:6px;background:#000;',
        )}
      >
        <div
          style={css(
            'align-self:center;font-size:10.5px;color:#8a8a8e;font-weight:600;margin-bottom:4px;',
          )}
        >
          Text Message · Today 9:41 AM
        </div>
        <div
          style={css(
            'align-self:flex-start;max-width:82%;background:#26252a;color:#fff;padding:9px 14px;border-radius:19px;border-bottom-left-radius:5px;font-size:13px;line-height:1.4;',
          )}
        >
          {text}
        </div>
      </div>
      <div style={css('display:flex;align-items:center;gap:9px;padding:8px 12px 12px;')}>
        <div
          style={css(
            'width:32px;height:32px;border-radius:50%;border:1px solid #3a3a3c;display:flex;align-items:center;justify-content:center;',
          )}
        >
          <Icon name="plus" size={18} color="#8a8a8e" />
        </div>
        <div
          style={css(
            'flex:1;border:1px solid #3a3a3c;border-radius:999px;padding:8px 14px;color:#8a8a8e;font-size:12px;',
          )}
        >
          Text Message
        </div>
      </div>
    </div>
  );
}

function EmailPreview({ text }: { readonly text: string }) {
  return (
    <div
      style={css('flex:1;display:flex;flex-direction:column;background:#faf9fb;overflow:hidden;')}
    >
      <div
        style={css(
          'display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid #eee;',
        )}
      >
        <Icon name="arrow-left" size={20} color="#5f6368" />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <Icon name="archive" size={19} color="#5f6368" />
          <Icon name="trash-2" size={19} color="#5f6368" />
          <Icon name="mail-open" size={19} color="#5f6368" />
        </div>
      </div>
      <div style={css('padding:16px 16px 12px;')}>
        <div
          style={css(
            'font-size:17px;font-weight:700;color:#202124;line-height:1.3;margin-bottom:12px;',
          )}
        >
          Doors open tonight 🔥
        </div>
        <div style={css('display:flex;align-items:center;gap:10px;')}>
          <div
            style={css(
              'width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#ff5a1f,#c23d10);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff;',
            )}
          >
            C1
          </div>
          <div style={css('flex:1;min-width:0;')}>
            <div style={css('font-size:13px;font-weight:600;color:#202124;')}>The C1RCLE</div>
            <div style={css('font-size:11.5px;color:#5f6368;')}>to me · 9:41 AM</div>
          </div>
          <Icon name="reply" size={17} color="#5f6368" />
        </div>
      </div>
      <div
        style={css(
          'flex:1;overflow:hidden;margin:0 14px 14px;border:1px solid #eee;border-radius:12px;background:#fff;',
        )}
      >
        <div
          style={css(
            'height:52px;background:linear-gradient(120deg,#ff5a1f,#c23d10);display:flex;align-items:center;justify-content:center;letter-spacing:0.16em;font-size:13px;font-weight:800;color:#fff;',
          )}
        >
          THE C1RCLE
        </div>
        <div style={css('padding:14px;font-size:12.5px;line-height:1.55;color:#3c4043;')}>
          {text}
        </div>
        <div style={css('padding:0 14px 16px;')}>
          <div
            style={css(
              'background:#ff5a1f;color:#fff;text-align:center;padding:10px;border-radius:8px;font-size:12.5px;font-weight:700;',
            )}
          >
            Get your tickets
          </div>
        </div>
      </div>
    </div>
  );
}

function PushPreview({ text }: { readonly text: string }) {
  return (
    <div
      style={css(
        'flex:1;display:flex;flex-direction:column;align-items:center;position:relative;background:linear-gradient(160deg,#1a0f2e,#0a0a0a 60%);',
      )}
    >
      <div
        style={css(
          'position:absolute;inset:0;background:radial-gradient(circle at 30% 20%,rgba(255,90,31,0.35),transparent 55%);',
        )}
      />
      <div style={css('position:relative;text-align:center;margin-top:34px;')}>
        <div
          style={css(
            'font-size:15px;font-weight:600;color:rgba(255,255,255,0.85);letter-spacing:0.02em;',
          )}
        >
          Thursday, 16 July
        </div>
        <div
          style={css(
            'font-size:68px;font-weight:300;color:#fff;line-height:1;margin-top:2px;letter-spacing:-0.02em;',
          )}
        >
          9:41
        </div>
      </div>
      <div
        style={css(
          'position:relative;width:calc(100% - 24px);margin:auto 12px 16px;background:rgba(40,40,45,0.6);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:13px;display:flex;gap:11px;',
        )}
      >
        <div
          style={css(
            'width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#ff5a1f,#c23d10);display:flex;align-items:center;justify-content:center;flex:none;',
          )}
        >
          <div style={css('width:16px;height:16px;border:2.5px solid #fff;border-radius:50%;')} />
        </div>
        <div style={css('flex:1;min-width:0;')}>
          <div style={css('display:flex;justify-content:space-between;align-items:baseline;')}>
            <span
              style={css(
                'font-size:12px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.03em;',
              )}
            >
              THE C1RCLE
            </span>
            <span style={css('font-size:11px;color:rgba(255,255,255,0.6);')}>now</span>
          </div>
          <div style={css('font-size:13.5px;font-weight:700;color:#fff;margin-top:2px;')}>
            Tonight at Skyline Rooftop
          </div>
          <div
            style={css(
              'font-size:12.5px;color:rgba(255,255,255,0.82);line-height:1.4;margin-top:1px;',
            )}
          >
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── history ─────────────────────────────────────────────────────────────────

function HistoryView() {
  const donutC = 2 * Math.PI * 42;

  return (
    <div style={css('display:flex;flex-direction:column;gap:12px;')}>
      {CAMPAIGNS.map((c) => {
        const readPct = Math.round((c.read / c.sent) * 100);
        const tapPct = Math.round((c.clicked / c.sent) * 100);
        const readDash = (readPct / 100) * donutC;
        const tapDash = (tapPct / 100) * donutC;

        return (
          <div
            key={c.title}
            style={css(
              'display:flex;align-items:center;gap:20px;background:rgba(20,20,20,0.5);border:1px solid rgba(255,255,255,0.07);border-radius:18px;padding:16px 22px;',
            )}
          >
            <svg
              viewBox="0 0 100 100"
              style={{ width: 76, height: 76, flex: 'none', transform: 'rotate(-90deg)' }}
            >
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={9}
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#6ee79b"
                strokeWidth={9}
                strokeDasharray={`${String(readDash)} ${String(donutC - readDash)}`}
                strokeLinecap="round"
              />
              <circle
                cx="50"
                cy="50"
                r="30"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={7}
              />
              <circle
                cx="50"
                cy="50"
                r="30"
                fill="none"
                stroke="#ff8a55"
                strokeWidth={7}
                strokeDasharray={`${String(tapDash)} ${String(donutC - tapDash)}`}
                strokeLinecap="round"
              />
            </svg>
            <div style={css('flex:1;min-width:0;')}>
              <div style={css('display:flex;align-items:center;gap:10px;margin-bottom:4px;')}>
                <span style={css('font-size:15px;font-weight:700;')}>{c.title}</span>
                <span style={css(chTag)}>{c.channel}</span>
              </div>
              <div style={css('font-size:12px;color:#8a8a86;font-weight:500;')}>
                {c.meta} · {c.sent.toLocaleString('en-IN')} sent
              </div>
            </div>
            <div style={css('display:flex;gap:26px;flex:none;')}>
              <div style={css('text-align:right;')}>
                <div
                  style={css(
                    'font-size:18px;font-weight:800;color:#6ee79b;font-variant-numeric:tabular-nums;',
                  )}
                >
                  {readPct}%
                </div>
                <div style={css('font-size:11px;color:#6a6a66;font-weight:600;')}>Read</div>
              </div>
              <div style={css('text-align:right;')}>
                <div
                  style={css(
                    'font-size:18px;font-weight:800;color:#ff8a55;font-variant-numeric:tabular-nums;',
                  )}
                >
                  {tapPct}%
                </div>
                <div style={css('font-size:11px;color:#6a6a66;font-weight:600;')}>Tapped</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── templates ───────────────────────────────────────────────────────────────

function TemplatesView() {
  const s = useVenueStudio();

  return (
    <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:16px;')}>
      {TEMPLATES.map((t) => (
        <div
          key={t.name}
          style={css(
            'position:relative;border-radius:20px;overflow:hidden;background:rgba(20,20,20,0.6);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,0.08);box-shadow:inset 0 1px 0 rgba(255,255,255,0.05),0 12px 30px rgba(0,0,0,0.3);padding:20px;display:flex;flex-direction:column;gap:14px;min-height:210px;',
          )}
        >
          <div style={css('display:flex;align-items:center;justify-content:space-between;')}>
            <div style={css(iconWrapMk('rgba(255,90,31,0.14)', '#ff8a55'))}>
              <Icon name={t.icon} size={18} />
            </div>
            <span style={css(chTag)}>
              <Icon name={t.chIcon} size={12} /> {t.channel}
            </span>
          </div>
          <div style={css('font-size:15px;font-weight:700;')}>{t.name}</div>
          <div
            style={css(
              'flex:1;background:#0d0d0d;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:13px;font-size:12.5px;color:#b5b5b0;line-height:1.5;',
            )}
          >
            {t.preview}
          </div>
          <button
            type="button"
            onClick={() => {
              s.setMarketingView('compose');
            }}
            className="vh-accent-20"
            style={css(
              'background:rgba(255,90,31,0.1);border:1px solid rgba(255,90,31,0.28);color:#ff8a55;padding:11px;border-radius:999px;font-size:13px;font-weight:700;cursor:pointer;',
            )}
          >
            Use this template
          </button>
        </div>
      ))}
      <button
        type="button"
        className="vh-dashed"
        style={css(
          'border:1.5px dashed rgba(255,255,255,0.14);border-radius:20px;padding:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;cursor:pointer;min-height:210px;background:none;',
        )}
      >
        <div
          style={css(
            'width:46px;height:46px;border-radius:14px;background:rgba(255,90,31,0.12);display:flex;align-items:center;justify-content:center;',
          )}
        >
          <Icon name="plus" size={22} color="#ff8a55" />
        </div>
        <span style={css('font-size:14px;font-weight:600;color:#8a8a86;')}>New template</span>
      </button>
    </div>
  );
}
