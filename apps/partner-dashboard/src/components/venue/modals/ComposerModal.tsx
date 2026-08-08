'use client';

import { css } from '../charts';
import {
  AUDIENCE_CHOICES,
  BUBBLE_GRAD,
  CHANNEL_CHOICES,
  CH_ICON,
  CH_NAME,
  RECIPIENTS,
} from '../data';
import { Icon } from '../Icon';
import { useVenueStudio } from '../store';

/** "Compose a message" modal — the quick-send flow from the mockup. */
export function ComposerModal() {
  const s = useVenueStudio();
  if (!s.composerOpen) return null;

  const previewText = s.cText.replace(/\{\{?\s*name\s*\}?\}/gi, 'Aisha') || 'Type your message…';
  const charCount = s.cText.length;
  const segments =
    s.cChannel === 'sms'
      ? `${String(Math.max(1, Math.ceil(charCount / 160)))} SMS`
      : CH_NAME[s.cChannel];
  const recipients = RECIPIENTS[s.cAudience];

  const stepLabel = css(
    'font-size:12px;font-weight:700;color:#6a6a66;text-transform:uppercase;letter-spacing:0.05em;',
  );

  return (
    <div
      role="presentation"
      onClick={() => {
        s.setComposerOpen(false);
      }}
      style={css(
        'position:fixed;inset:0;z-index:60;background:rgba(0,0,0,0.72);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:28px;',
      )}
    >
      <div
        role="presentation"
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={css(
          'background:#131313;border:1px solid rgba(255,255,255,0.08);border-radius:24px;width:100%;max-width:940px;max-height:90vh;overflow:hidden;display:flex;box-shadow:0 30px 80px rgba(0,0,0,0.6);',
        )}
      >
        {/* form */}
        <div style={css('flex:1;padding:28px 30px;overflow-y:auto;')}>
          <div
            style={css(
              'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;',
            )}
          >
            <h3 style={css('margin:0;font-size:21px;font-weight:800;')}>Compose a message</h3>
            <button
              type="button"
              aria-label="Close composer"
              onClick={() => {
                s.setComposerOpen(false);
              }}
              style={css(
                'width:34px;height:34px;border-radius:10px;background:#1c1c1c;border:1px solid rgba(255,255,255,0.08);color:#8a8a86;cursor:pointer;display:flex;align-items:center;justify-content:center;',
              )}
            >
              <Icon name="x" size={16} />
            </button>
          </div>
          <div style={css('font-size:13px;color:#8a8a86;font-weight:500;margin-bottom:22px;')}>
            See exactly what guests get before you send.
          </div>

          <div style={{ ...stepLabel, marginBottom: 10 }}>1 · Who gets it</div>
          <div style={css('display:flex;flex-direction:column;gap:8px;margin-bottom:22px;')}>
            {AUDIENCE_CHOICES.map((a) => {
              const on = s.cAudience === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    s.setCAudience(a.id);
                  }}
                  style={css(
                    `display:flex;align-items:center;gap:13px;width:100%;cursor:pointer;padding:14px;border-radius:14px;text-align:left;color:inherit;background:${on ? 'rgba(255,90,31,0.08)' : '#0d0d0d'};border:1px solid ${on ? 'rgba(255,90,31,0.35)' : 'rgba(255,255,255,0.08)'};`,
                  )}
                >
                  <span
                    style={css(
                      `width:20px;height:20px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;border:2px solid ${on ? '#ff5a1f' : 'rgba(255,255,255,0.2)'};`,
                    )}
                  >
                    <span
                      style={css(
                        `width:10px;height:10px;border-radius:50%;background:${on ? '#ff5a1f' : 'transparent'};`,
                      )}
                    />
                  </span>
                  <span style={css('flex:1;text-align:left;')}>
                    <span style={css('font-size:14px;font-weight:600;display:block;')}>
                      {a.label}
                    </span>
                    <span style={css('font-size:12px;color:#8a8a86;')}>{a.sub}</span>
                  </span>
                  <span style={css('font-size:13px;font-weight:700;color:#ff8a55;')}>
                    {a.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ ...stepLabel, marginBottom: 10 }}>2 · How to send it</div>
          <div style={css('display:flex;gap:8px;margin-bottom:22px;')}>
            {CHANNEL_CHOICES.map(([id, label, icon]) => {
              const on = s.cChannel === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    s.setCChannel(id);
                  }}
                  style={css(
                    `flex:1;display:flex;flex-direction:column;align-items:center;gap:7px;cursor:pointer;padding:14px 8px;border-radius:13px;font-size:13px;font-weight:600;background:${on ? '#ff5a1f' : '#0d0d0d'};color:${on ? '#0a0a0a' : '#8a8a86'};border:1px solid ${on ? '#ff5a1f' : 'rgba(255,255,255,0.08)'};`,
                  )}
                >
                  <Icon name={icon} size={17} />
                  {label}
                </button>
              );
            })}
          </div>

          <div
            style={css(
              'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;',
            )}
          >
            <div style={stepLabel}>3 · Your message</div>
            <button
              type="button"
              onClick={() => {
                s.setCText(`${s.cText}{{name}}`);
              }}
              style={css(
                'display:flex;align-items:center;gap:6px;background:rgba(255,90,31,0.12);border:1px solid rgba(255,90,31,0.3);color:#ff8a55;padding:6px 11px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;',
              )}
            >
              <Icon name="user" size={13} /> Insert guest&apos;s name
            </button>
          </div>
          <textarea
            aria-label="Message"
            value={s.cText}
            onChange={(e) => {
              s.setCText(e.target.value);
            }}
            placeholder="Type your message..."
            style={css(
              'width:100%;min-height:120px;resize:vertical;background:#0d0d0d;border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:14px;color:#f5f5f3;font-size:14px;line-height:1.5;font-family:inherit;',
            )}
          />
          <div
            style={css(
              'display:flex;justify-content:flex-end;margin-top:8px;font-size:12px;color:#8a8a86;font-weight:500;',
            )}
          >
            {charCount} characters · {segments}
          </div>

          <div
            style={css(
              'margin-top:22px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.08);',
            )}
          >
            <div
              style={css(
                'display:flex;align-items:center;gap:9px;background:rgba(255,90,31,0.1);border:1px solid rgba(255,90,31,0.25);border-radius:12px;padding:12px 14px;margin-bottom:14px;',
              )}
            >
              <Icon name="info" size={16} color="#ff8a55" />
              <span style={css('font-size:13px;font-weight:600;color:#ffd9c4;')}>
                This will be sent via {CH_NAME[s.cChannel]} to {recipients} people.
              </span>
            </div>
            <div style={css('display:flex;gap:10px;')}>
              <button
                type="button"
                onClick={() => {
                  s.setComposerOpen(false);
                }}
                style={css(
                  'flex:none;background:#1c1c1c;border:1px solid rgba(255,255,255,0.1);color:#f5f5f3;padding:13px 20px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;',
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                className="vh-accent"
                style={css(
                  'flex:1;display:flex;align-items:center;justify-content:center;gap:8px;background:#ff5a1f;color:#0a0a0a;border:none;padding:13px;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;',
                )}
              >
                <Icon name="send" size={16} /> Send to {recipients} people
              </button>
            </div>
          </div>
        </div>

        {/* preview */}
        <div
          style={css(
            'width:340px;flex:none;background:#0a0a0a;border-left:1px solid rgba(255,255,255,0.06);padding:28px 24px;display:flex;flex-direction:column;align-items:center;',
          )}
        >
          <div style={{ ...stepLabel, marginBottom: 18, alignSelf: 'flex-start' }}>
            Live preview
          </div>
          <div
            style={css(
              'width:260px;height:400px;background:#050505;border:8px solid #1c1c1c;border-radius:38px;padding:14px 12px;display:flex;flex-direction:column;box-shadow:0 20px 50px rgba(0,0,0,0.5);position:relative;',
            )}
          >
            <div
              style={css(
                'position:absolute;top:12px;left:50%;transform:translateX(-50%);width:70px;height:5px;border-radius:999px;background:#2a2a2a;',
              )}
            />
            <div
              style={css(
                'display:flex;align-items:center;gap:9px;padding:14px 4px 12px;border-bottom:1px solid rgba(255,255,255,0.06);',
              )}
            >
              <div
                style={css(
                  'width:34px;height:34px;border-radius:10px;flex:none;display:flex;align-items:center;justify-content:center;background:rgba(255,90,31,0.14);color:#ff8a55;',
                )}
              >
                <Icon name={CH_ICON[s.cChannel]} size={16} />
              </div>
              <div>
                <div style={css('font-size:13px;font-weight:700;')}>The C1RCLE</div>
                <div style={css('font-size:11px;color:#8a8a86;')}>{CH_NAME[s.cChannel]}</div>
              </div>
            </div>
            <div
              style={css(
                'flex:1;padding:16px 4px;display:flex;flex-direction:column;justify-content:flex-end;',
              )}
            >
              <div
                style={css(
                  `align-self:flex-start;max-width:88%;background:${BUBBLE_GRAD[s.cChannel]};color:#fff;padding:11px 14px;border-radius:16px;border-bottom-left-radius:5px;font-size:13px;line-height:1.45;`,
                )}
              >
                {previewText}
              </div>
              <div
                style={css(
                  'font-size:10px;color:#6a6a66;margin-top:6px;align-self:flex-start;padding-left:4px;',
                )}
              >
                Delivered · now
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
