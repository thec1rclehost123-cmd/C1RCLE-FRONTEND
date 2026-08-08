'use client';

import { css } from '../charts';
import { ACCOUNT_ROWS, HIGHLIGHTS, MENU_ITEMS, PRESENCE_STATS, inputStyle, subTab } from '../data';
import { Icon } from '../Icon';
import { useVenueStudio } from '../store';

import type { SettingsView } from '../store';

const SETTINGS_TABS: readonly (readonly [SettingsView, string])[] = [
  ['public', 'Presence'],
  ['menu', 'Menu'],
  ['account', 'Account'],
];

export function SettingsScreen() {
  const s = useVenueStudio();

  return (
    <div>
      <h1 style={css('margin:0 0 22px;font-size:30px;font-weight:800;letter-spacing:-0.02em;')}>
        Settings
      </h1>
      <div
        style={css(
          'display:flex;gap:4px;background:#141414;border:1px solid rgba(255,255,255,0.06);padding:4px;border-radius:13px;width:fit-content;margin-bottom:22px;',
        )}
      >
        {SETTINGS_TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              s.setSettingsView(id);
            }}
            style={css(subTab(s.settingsView === id))}
          >
            {label}
          </button>
        ))}
      </div>

      {s.settingsView === 'public' ? <PresenceView /> : null}
      {s.settingsView === 'menu' ? <MenuView /> : null}
      {s.settingsView === 'account' ? <AccountView /> : null}
    </div>
  );
}

function PresenceView() {
  const fieldLabel = css(
    'font-size:13px;font-weight:600;color:#c9c9c6;display:block;margin-bottom:8px;',
  );

  return (
    <div
      style={css(
        'display:grid;grid-template-columns:1.5fr 1fr;gap:20px;align-items:start;max-width:1040px;',
      )}
    >
      <div style={css('display:flex;flex-direction:column;gap:20px;')}>
        <div
          style={css(
            'position:relative;border-radius:24px;overflow:hidden;background:rgba(20,20,20,0.6);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,0.08);box-shadow:inset 0 1px 0 rgba(255,255,255,0.06),0 20px 50px rgba(0,0,0,0.35);',
          )}
        >
          <div
            style={css(
              'height:150px;position:relative;background:linear-gradient(120deg,#2a1206,#3a1a08 40%,#160b04);display:flex;align-items:flex-end;justify-content:flex-end;padding:14px;',
            )}
          >
            <div
              style={css(
                'position:absolute;top:-40px;left:30%;width:240px;height:240px;background:radial-gradient(circle,rgba(255,90,31,0.45),transparent 68%);',
              )}
            />
            <button
              type="button"
              className="vh-black-60"
              style={css(
                'position:relative;display:inline-flex;align-items:center;gap:7px;background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.22);color:#fff;padding:8px 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;backdrop-filter:blur(6px);',
              )}
            >
              <Icon name="image" size={13} /> Change cover
            </button>
          </div>
          <div style={css('padding:24px;position:relative;')}>
            <div
              style={css(
                'width:68px;height:68px;border-radius:18px;background:linear-gradient(135deg,#ff5a1f,#c23d10);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:24px;color:#fff;position:absolute;top:-34px;left:24px;border:4px solid #141414;box-shadow:0 8px 24px rgba(255,90,31,0.35);',
              )}
            >
              RK
            </div>
            <div style={css('margin-top:26px;display:flex;flex-direction:column;gap:18px;')}>
              <div>
                <label htmlFor="st-name" style={fieldLabel}>
                  Display name
                </label>
                <input id="st-name" defaultValue="Rhea Kapoor Events" style={css(inputStyle)} />
              </div>
              <div>
                <label htmlFor="st-bio" style={fieldLabel}>
                  Bio
                </label>
                <textarea
                  id="st-bio"
                  defaultValue="Curating Mumbai's best rooftop & warehouse nights since 2019. Afrobeats · House · Techno."
                  style={{
                    ...css(inputStyle),
                    minHeight: 84,
                    resize: 'vertical',
                    lineHeight: 1.5,
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <div>
                <span style={fieldLabel}>Highlights</span>
                <div style={css('display:flex;gap:8px;flex-wrap:wrap;')}>
                  {HIGHLIGHTS.map((h) => (
                    <span
                      key={h}
                      style={css(
                        'display:inline-flex;align-items:center;gap:7px;background:#0d0d0d;border:1px solid rgba(255,255,255,0.1);padding:8px 13px;border-radius:999px;font-size:13px;font-weight:600;',
                      )}
                    >
                      {h}
                      <Icon name="x" size={12} color="#8a8a86" style={{ cursor: 'pointer' }} />
                    </span>
                  ))}
                  <button
                    type="button"
                    style={css(
                      'background:rgba(255,90,31,0.12);border:1px solid rgba(255,90,31,0.3);color:#ff8a55;padding:8px 13px;border-radius:999px;font-size:13px;font-weight:700;cursor:pointer;',
                    )}
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="vh-accent"
          style={css(
            'display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#ff5a1f;color:#0a0a0a;border:none;padding:15px 28px;border-radius:999px;font-size:15px;font-weight:800;cursor:pointer;align-self:flex-start;',
          )}
        >
          <Icon name="check" size={16} /> Save presence
        </button>
      </div>

      {/* live public preview */}
      <div style={css('position:sticky;top:96px;')}>
        <div
          style={css(
            'display:flex;align-items:center;gap:9px;margin-bottom:16px;padding-left:4px;',
          )}
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
            How guests see you
          </span>
        </div>
        <div
          style={css(
            'position:relative;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.09);box-shadow:0 24px 56px rgba(0,0,0,0.45);',
          )}
        >
          <div
            style={css(
              'height:120px;position:relative;background:linear-gradient(120deg,#2a1206,#3a1a08 40%,#160b04);',
            )}
          />
          <div
            style={css(
              'background:rgba(20,20,20,0.85);backdrop-filter:blur(18px);padding:0 22px 22px;position:relative;',
            )}
          >
            <div
              style={css(
                'width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,#ff5a1f,#c23d10);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:22px;color:#fff;margin-top:-32px;border:4px solid #141414;',
              )}
            >
              RK
            </div>
            <div
              style={css('font-size:19px;font-weight:800;letter-spacing:-0.01em;margin-top:12px;')}
            >
              Rhea Kapoor Events
            </div>
            <div
              style={css(
                'font-size:13px;color:#b5b5b0;font-weight:500;line-height:1.5;margin-top:6px;',
              )}
            >
              Curating Mumbai&apos;s best rooftop &amp; warehouse nights since 2019.
            </div>
            <div style={css('display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;')}>
              {HIGHLIGHTS.map((h) => (
                <span
                  key={h}
                  style={css(
                    'background:rgba(255,90,31,0.12);border:1px solid rgba(255,90,31,0.28);color:#ff8a55;padding:5px 11px;border-radius:999px;font-size:11.5px;font-weight:700;',
                  )}
                >
                  {h}
                </span>
              ))}
            </div>
            <div
              style={css(
                'display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:20px;',
              )}
            >
              {PRESENCE_STATS.map((st) => (
                <div
                  key={st.label}
                  style={css(
                    'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:13px 10px;text-align:center;',
                  )}
                >
                  <div style={css('font-size:19px;font-weight:800;letter-spacing:-0.02em;')}>
                    {st.value}
                  </div>
                  <div style={css('font-size:11px;color:#8a8a86;font-weight:600;margin-top:2px;')}>
                    {st.label}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              style={css(
                'width:100%;margin-top:18px;background:#ff5a1f;color:#0a0a0a;border:none;padding:12px;border-radius:999px;font-size:13px;font-weight:700;cursor:pointer;',
              )}
            >
              Follow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuView() {
  return (
    <div style={css('max-width:620px;')}>
      <div
        style={css(
          'display:flex;align-items:center;justify-content:space-between;background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:16px 20px;margin-bottom:16px;',
        )}
      >
        <div>
          <div style={css('font-size:15px;font-weight:700;')}>Menu is live</div>
          <div style={css('font-size:13px;color:#8a8a86;')}>
            Guests can see and order these items right now.
          </div>
        </div>
        <button
          type="button"
          aria-label="Toggle menu visibility"
          style={css(
            'width:52px;height:30px;border-radius:999px;background:#ff5a1f;position:relative;cursor:pointer;border:none;',
          )}
        >
          <span
            style={css(
              'position:absolute;top:3px;right:3px;width:24px;height:24px;border-radius:50%;background:#0a0a0a;',
            )}
          />
        </button>
      </div>
      <div
        style={css(
          'background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:12px;',
        )}
      >
        {MENU_ITEMS.map((m) => (
          <div
            key={m.name}
            className="vh-1a"
            style={css(
              'display:flex;align-items:center;gap:14px;padding:13px 12px;border-radius:12px;',
            )}
          >
            <Icon name="grip-vertical" size={16} color="#6a6a66" style={{ cursor: 'grab' }} />
            <div
              style={css(
                'width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.06);flex:none;',
              )}
            />
            <div style={css('flex:1;')}>
              <div style={css('font-size:14px;font-weight:600;')}>{m.name}</div>
              <div style={css('font-size:12px;color:#8a8a86;')}>{m.cat}</div>
            </div>
            <span style={css('font-size:15px;font-weight:700;')}>{m.price}</span>
            <button
              type="button"
              aria-label={`Edit ${m.name}`}
              style={css(
                'width:32px;height:32px;border-radius:9px;background:#0d0d0d;border:1px solid rgba(255,255,255,0.08);color:#8a8a86;cursor:pointer;display:flex;align-items:center;justify-content:center;',
              )}
            >
              <Icon name="pencil" size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountView() {
  return (
    <div style={css('max-width:620px;display:flex;flex-direction:column;gap:14px;')}>
      {ACCOUNT_ROWS.map((a) => (
        <button
          key={a.title}
          type="button"
          className="vh-19"
          style={css(
            'display:flex;align-items:center;gap:14px;background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:18px 20px;cursor:pointer;text-align:left;color:inherit;width:100%;',
          )}
        >
          <div
            style={css(
              'width:42px;height:42px;border-radius:12px;background:rgba(255,90,31,0.12);color:#ff8a55;display:flex;align-items:center;justify-content:center;flex:none;',
            )}
          >
            <Icon name={a.icon} size={18} />
          </div>
          <div style={css('flex:1;')}>
            <div style={css('font-size:15px;font-weight:700;')}>{a.title}</div>
            <div style={css('font-size:13px;color:#8a8a86;')}>{a.sub}</div>
          </div>
          <Icon name="chevron-right" size={18} color="#6a6a66" />
        </button>
      ))}
    </div>
  );
}
