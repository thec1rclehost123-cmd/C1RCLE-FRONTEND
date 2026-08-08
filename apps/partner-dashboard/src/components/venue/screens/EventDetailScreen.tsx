'use client';

import { buildPaths, css } from '../charts';
import {
  DETAIL_SPARK_SERIES,
  EVENTS,
  EVENT_GUESTS,
  GRADS,
  GUEST_TAG_COLORS,
  PROMOTERS,
  TIER_BARS,
  WALKINS,
  eventCardBg,
  gAvatar,
  initialsOf,
  pick,
  pillTab,
  tagStyle,
} from '../data';
import { Icon } from '../Icon';
import { useVenueStudio } from '../store';

import type { DetailTab } from '../store';

const PANEL = css(
  'background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:22px;',
);

const STAT_BOX = css(
  'background:#0c0c0c;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px 16px;',
);

const STAT_LABEL = css(
  'font-size:11px;font-weight:800;color:#6a6a66;text-transform:uppercase;letter-spacing:0.06em;',
);

const DETAIL_TABS: readonly (readonly [DetailTab, string])[] = [
  ['sales', 'Sales'],
  ['guests', "Who's coming"],
  ['tonight', 'Tonight'],
  ['promoters', 'Promoters'],
];

export function EventDetailScreen() {
  const s = useVenueStudio();
  const idx = s.selectedEventIdx;
  const ev = EVENTS[idx] ?? EVENTS[0];
  if (!ev) return null;

  const soldN = Math.round(ev.pctN * 4);
  const pageVisits = Math.round(ev.pctN * 34 + 400);
  const conversion = `${((ev.pctN / (ev.pctN + 60)) * 100).toFixed(1)}%`;
  const venueLine = `${ev.venue} · ${ev.meta.split('·').slice(1).join('·').trim()}`;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          s.go('events');
        }}
        className="vh-text"
        style={css(
          'display:flex;align-items:center;gap:7px;background:none;border:none;color:#8a8a86;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:18px;padding:0;',
        )}
      >
        <Icon name="arrow-left" size={16} /> All events
      </button>

      <div style={css('display:flex;gap:18px;margin-bottom:22px;align-items:stretch;')}>
        <div
          style={css('perspective:900px;flex:none;width:240px;display:flex;flex-direction:column;')}
        >
          <div
            className="venue-ticket-roll"
            style={css(
              'position:relative;border-radius:22px;overflow:hidden;flex:1;box-shadow:0 20px 40px rgba(0,0,0,0.4);',
            )}
          >
            <div style={css(eventCardBg(idx, ev.card))} />
          </div>
        </div>

        <div
          style={css(
            'flex:1;position:relative;border-radius:22px;background:#111;border:1px solid rgba(255,255,255,0.08);padding:24px 26px;display:flex;flex-direction:column;justify-content:space-between;',
          )}
        >
          <div
            style={css(
              'display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;',
            )}
          >
            <div>
              <div
                style={css(
                  'font-size:12px;font-weight:800;color:#ff8a55;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;',
                )}
              >
                {venueLine}
              </div>
              <h1
                style={css(
                  'margin:0;font-size:28px;font-weight:800;letter-spacing:-0.01em;color:#fff;',
                )}
              >
                {ev.name}
              </h1>
            </div>
            <div style={css('display:flex;gap:10px;flex:none;')}>
              <button
                type="button"
                onClick={s.openEdit}
                className="vh-w10"
                style={css(
                  'display:flex;align-items:center;gap:7px;background:transparent;border:1px solid rgba(255,255,255,0.22);color:#fff;padding:10px 16px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;',
                )}
              >
                <Icon name="pencil" size={13} /> Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  s.go('door');
                }}
                className="vh-accent"
                style={css(
                  'display:flex;align-items:center;gap:7px;background:#ff5a1f;color:#0a0a0a;border:none;padding:10px 16px;border-radius:999px;font-size:13px;font-weight:700;cursor:pointer;',
                )}
              >
                <Icon name="door-open" size={14} /> Door Mode
              </button>
            </div>
          </div>

          <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:12px;')}>
            <div style={STAT_BOX}>
              <div
                style={css(
                  'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;',
                )}
              >
                <span style={STAT_LABEL}>Tickets sold</span>
                <Icon name="ticket" size={13} color="#ff8a55" />
              </div>
              <div style={css('font-size:22px;font-weight:800;color:#fff;')}>
                {soldN}{' '}
                <span style={css('font-size:13px;color:#8a8a86;font-weight:600;')}>/ 400</span>
              </div>
            </div>
            <div style={STAT_BOX}>
              <div
                style={css(
                  'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;',
                )}
              >
                <span style={STAT_LABEL}>Page visits</span>
                <Icon name="eye" size={13} color="#ff8a55" />
              </div>
              <div style={css('font-size:22px;font-weight:800;color:#fff;')}>{pageVisits}</div>
            </div>
            <div style={STAT_BOX}>
              <div
                style={css(
                  'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;',
                )}
              >
                <span style={STAT_LABEL}>Conversions</span>
                <Icon name="trending-up" size={13} color="#6ee79b" />
              </div>
              <div style={css('font-size:22px;font-weight:800;color:#6ee79b;')}>{conversion}</div>
            </div>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div
        style={css(
          'display:flex;justify-content:center;margin-bottom:26px;position:relative;z-index:5;',
        )}
      >
        <div
          style={css(
            'display:flex;gap:4px;background:rgba(18,18,18,0.72);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.1);padding:6px;border-radius:999px;box-shadow:0 16px 40px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06);',
          )}
        >
          {DETAIL_TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                s.setDetailTab(id);
              }}
              style={css(pillTab(s.detailTab === id))}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {s.detailTab === 'sales' ? <SalesTab /> : null}
      {s.detailTab === 'guests' ? <GuestsTab /> : null}
      {s.detailTab === 'tonight' ? <TonightTab /> : null}
      {s.detailTab === 'promoters' ? <PromotersTab /> : null}
    </div>
  );
}

function SalesTab() {
  const spark = buildPaths(DETAIL_SPARK_SERIES);

  return (
    <>
      <div
        style={css('display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px;')}
      >
        <div
          style={css(
            'position:relative;overflow:hidden;background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:20px;',
          )}
        >
          <div style={css('font-size:13px;color:#8a8a86;font-weight:600;margin-bottom:10px;')}>
            Money made
          </div>
          <div style={css('display:flex;align-items:baseline;gap:10px;')}>
            <div style={css('font-size:28px;font-weight:800;')}>₹6,12,000</div>
            <span
              style={css(
                'display:inline-flex;align-items:center;gap:3px;background:rgba(110,231,155,0.14);color:#6ee79b;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;',
              )}
            >
              <Icon name="trending-up" size={11} />
              +22%
            </span>
          </div>
          <svg
            viewBox="0 0 600 190"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: 52,
              opacity: 0.5,
            }}
          >
            <defs>
              <linearGradient id="dtSpark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff5a1f" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ff5a1f" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={spark.area} fill="url(#dtSpark)" />
            <path
              d={spark.line}
              fill="none"
              stroke="#ff8a55"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div
          style={css(
            'background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:20px;',
          )}
        >
          <div style={css('font-size:13px;color:#8a8a86;font-weight:600;margin-bottom:10px;')}>
            Tickets sold
          </div>
          <div style={css('font-size:28px;font-weight:800;')}>
            340 <span style={css('font-size:15px;color:#8a8a86;font-weight:600;')}>/ 400</span>
          </div>
        </div>
        <div
          style={css(
            'background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:20px;',
          )}
        >
          <div style={css('font-size:13px;color:#8a8a86;font-weight:600;margin-bottom:10px;')}>
            Refunds
          </div>
          <div style={css('font-size:28px;font-weight:800;color:#f0857a;')}>₹3,600</div>
        </div>
      </div>

      <div style={{ ...PANEL, borderRadius: 18 }}>
        <h3 style={css('margin:0 0 18px;font-size:16px;font-weight:700;')}>Tickets by tier</h3>
        <div style={css('display:flex;flex-direction:column;gap:16px;')}>
          {TIER_BARS.map((t) => (
            <div key={t.name}>
              <div style={css('display:flex;justify-content:space-between;margin-bottom:7px;')}>
                <span style={css('font-size:14px;font-weight:600;')}>{t.name}</span>
                <span style={css('font-size:14px;font-weight:700;color:#c9c9c6;')}>
                  {t.count} · {t.money}
                </span>
              </div>
              <div
                style={css(
                  'height:9px;border-radius:999px;background:rgba(255,255,255,0.08);overflow:hidden;',
                )}
              >
                <div style={css(t.bar)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function GuestsTab() {
  return (
    <div style={PANEL}>
      <div
        style={css(
          'display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;',
        )}
      >
        <div
          style={css(
            'display:flex;align-items:center;gap:10px;background:#0d0d0d;border:1px solid rgba(255,255,255,0.06);padding:10px 14px;border-radius:11px;width:280px;color:#8a8a86;',
          )}
        >
          <Icon name="search" size={15} />
          <span style={css('font-size:13px;')}>Search guests</span>
        </div>
        <button
          type="button"
          className="vh-1c"
          style={css(
            'display:flex;align-items:center;gap:7px;background:#141414;border:1px solid rgba(255,255,255,0.1);color:#f5f5f3;padding:10px 15px;border-radius:11px;font-size:13px;font-weight:600;cursor:pointer;',
          )}
        >
          <Icon name="download" size={14} /> Export list
        </button>
      </div>
      <div style={css('display:flex;flex-direction:column;gap:2px;')}>
        {EVENT_GUESTS.map((g, i) => {
          const tagCol = GUEST_TAG_COLORS[g.tag] ?? ['rgba(255,255,255,0.08)', '#c9c9c6'];
          return (
            <div
              key={g.name}
              className="vh-1a"
              style={css(
                'display:flex;align-items:center;gap:14px;padding:12px 10px;border-radius:12px;',
              )}
            >
              <div style={css(gAvatar(pick(GRADS, i)))}>{initialsOf(g.name)}</div>
              <div style={css('flex:1;')}>
                <div style={css('font-size:14px;font-weight:600;')}>{g.name}</div>
                <div style={css('font-size:12px;color:#8a8a86;font-weight:500;')}>{g.tier}</div>
              </div>
              <span style={css(tagStyle(tagCol[0], tagCol[1]))}>{g.tag}</span>
              <span
                style={css(
                  g.check === 'Checked in'
                    ? 'font-size:12px;font-weight:700;color:#6ee79b;min-width:90px;text-align:right;'
                    : 'font-size:12px;font-weight:600;color:#8a8a86;min-width:90px;text-align:right;',
                )}
              >
                {g.check}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TonightTab() {
  const s = useVenueStudio();

  return (
    <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:16px;')}>
      <div
        style={css(
          'background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:24px;',
        )}
      >
        <div style={css('font-size:14px;color:#8a8a86;font-weight:600;margin-bottom:14px;')}>
          How full we are
        </div>
        <div style={css('display:flex;align-items:baseline;gap:10px;margin-bottom:16px;')}>
          <span style={css('font-size:48px;font-weight:800;letter-spacing:-0.03em;')}>247</span>
          <span style={css('font-size:16px;color:#8a8a86;font-weight:600;')}>inside now</span>
        </div>
        <div
          style={css(
            'height:12px;border-radius:999px;background:rgba(255,255,255,0.1);overflow:hidden;margin-bottom:10px;',
          )}
        >
          <div
            style={css(
              'width:62%;height:100%;background:linear-gradient(90deg,#ff5a1f,#ffb078);border-radius:999px;',
            )}
          />
        </div>
        <div style={css('font-size:13px;color:#8a8a86;font-weight:500;')}>
          62% of 400 capacity · 93 checked-in guests still expected
        </div>
      </div>

      <div
        style={css(
          'background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:24px;',
        )}
      >
        <div
          style={css(
            'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;',
          )}
        >
          <span style={css('font-size:14px;color:#8a8a86;font-weight:600;')}>Walk-ins log</span>
          <button
            type="button"
            onClick={() => {
              s.go('door');
            }}
            style={css(
              'background:#ff5a1f;color:#0a0a0a;border:none;padding:8px 14px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;',
            )}
          >
            + Walk-in
          </button>
        </div>
        <div style={css('display:flex;flex-direction:column;gap:12px;')}>
          {WALKINS.map((w) => (
            <div
              key={w.name}
              style={css('display:flex;align-items:center;justify-content:space-between;')}
            >
              <div>
                <div style={css('font-size:14px;font-weight:600;')}>{w.name}</div>
                <div style={css('font-size:12px;color:#8a8a86;')}>{w.meta}</div>
              </div>
              <span style={css('font-size:12px;color:#6ee79b;font-weight:700;')}>{w.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PromotersTab() {
  return (
    <div style={PANEL}>
      <h3 style={css('margin:0 0 4px;font-size:16px;font-weight:700;')}>
        Who&apos;s driving sales
      </h3>
      <div style={css('font-size:13px;color:#8a8a86;margin-bottom:18px;')}>
        Ranked by tickets sold · commission owed shown
      </div>
      <div style={css('display:flex;flex-direction:column;gap:2px;')}>
        {PROMOTERS.map((p, i) => (
          <div
            key={p.name}
            className="vh-1a"
            style={css(
              'display:flex;align-items:center;gap:14px;padding:13px 10px;border-radius:12px;',
            )}
          >
            <span style={css('font-size:16px;font-weight:800;color:#ff8a55;width:24px;')}>
              {p.rank}
            </span>
            <div style={css(gAvatar(pick(GRADS, i)))}>{initialsOf(p.name)}</div>
            <div style={css('flex:1;')}>
              <div style={css('font-size:14px;font-weight:600;')}>{p.name}</div>
              <div style={css('font-size:12px;color:#8a8a86;')}>{p.tickets} tickets</div>
            </div>
            <div style={css('text-align:right;')}>
              <div style={css('font-size:12px;color:#8a8a86;')}>Commission owed</div>
              <div style={css('font-size:15px;font-weight:800;color:#6ee79b;')}>{p.owed}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
