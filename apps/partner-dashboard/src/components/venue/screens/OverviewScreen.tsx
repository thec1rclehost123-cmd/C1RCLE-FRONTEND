'use client';

import { buildPaths, css } from '../charts';
import {
  ACTIVITY,
  GREEN,
  JULY_EVENTS,
  JULY_EVENT_DATES,
  JULY_OFFSET,
  NETWORK,
  POSTER_SRC,
  RANGES,
  RED,
  TODAY_JULY,
  TREND_CAPTIONS,
  TREND_DATA,
  TREND_DELTAS,
  UPCOMING,
  UPCOMING_GRADS,
  WEEKDAYS,
  avatar40,
  iconWrap,
  metricBtn,
  pick,
  rangeBtn,
  tagStyle,
} from '../data';
import { Icon } from '../Icon';
import { useVenueStudio } from '../store';

const CARD = css(
  'background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:22px;',
);

export function OverviewScreen() {
  const s = useVenueStudio();

  const values = TREND_DATA[s.metric][s.range];
  const { line, area } = buildPaths(values);
  const total = values.reduce((a, b) => a + b, 0);
  const trendValue =
    s.metric === 'revenue'
      ? `₹${(total * 1000).toLocaleString('en-IN')}`
      : total.toLocaleString('en-IN');

  return (
    <div>
      {/* header */}
      <div
        style={css(
          'display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px;',
        )}
      >
        <div>
          <div style={css('font-size:13px;color:#8a8a86;font-weight:500;margin-bottom:6px;')}>
            Thursday, July 16 · 5:40 PM
          </div>
          <h1 style={css('margin:0;font-size:30px;font-weight:800;letter-spacing:-0.02em;')}>
            Good evening, Rhea
          </h1>
        </div>
        <div style={css('display:flex;align-items:center;gap:10px;')}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              s.setCalFloatOpen(true);
            }}
            className="vh-w10"
            style={css(
              'display:flex;align-items:center;gap:8px;white-space:nowrap;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#f5f5f3;padding:11px 18px;border-radius:12px;font-size:13.5px;font-weight:700;cursor:pointer;',
            )}
          >
            <Icon name="pin" size={15} /> Pop-out calendar
          </button>
          <button
            type="button"
            onClick={() => {
              s.go('events');
            }}
            className="vh-w10"
            style={css(
              'display:flex;align-items:center;gap:8px;white-space:nowrap;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#f5f5f3;padding:11px 18px;border-radius:999px;font-size:14px;font-weight:600;cursor:pointer;height:42px;',
            )}
          >
            <Icon name="calendar" size={16} /> View all events
          </button>
          <button
            type="button"
            onClick={s.startCreate}
            className="vh-accent"
            style={css(
              'display:flex;align-items:center;gap:8px;white-space:nowrap;background:#ff5a1f;color:#0a0a0a;border:none;padding:11px 18px;border-radius:999px;font-size:14px;font-weight:700;cursor:pointer;height:42px;',
            )}
          >
            <Icon name="plus" size={16} /> Create event
          </button>
        </div>
      </div>

      {/* row 1 */}
      <div style={css('display:grid;grid-template-columns:1.55fr 1fr;gap:20px;align-items:start;')}>
        <div style={css('display:flex;flex-direction:column;gap:20px;')}>
          {/* hero next event */}
          <div
            style={css(
              'position:relative;border-radius:20px;overflow:hidden;min-height:300px;background:#151515;border:1px solid rgba(255,255,255,0.06);',
            )}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${POSTER_SRC})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 30%',
              }}
            />
            <div
              style={css(
                'position:absolute;inset:0;background:linear-gradient(105deg,rgba(12,6,2,0.92) 34%,rgba(12,6,2,0.6) 66%,rgba(12,6,2,0.3));',
              )}
            />
            <div
              style={css(
                'position:relative;padding:26px 28px;display:flex;flex-direction:column;height:100%;min-height:300px;',
              )}
            >
              <div
                style={css('display:flex;justify-content:space-between;align-items:flex-start;')}
              >
                <span
                  style={css(
                    'display:inline-flex;align-items:center;gap:7px;background:rgba(255,90,31,0.18);border:1px solid rgba(255,90,31,0.4);color:#ff8a55;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.03em;',
                  )}
                >
                  <span
                    style={css(
                      'width:7px;height:7px;border-radius:50%;background:#ff5a1f;box-shadow:0 0 8px #ff5a1f;',
                    )}
                  />
                  TONIGHT · 9:00 PM
                </span>
                <span style={css('font-size:13px;color:#c9b7ac;font-weight:500;')}>
                  Doors in 3h 20m
                </span>
              </div>
              <div style={css('margin-top:auto;')}>
                <div style={css('font-size:13px;color:#d8c4b8;font-weight:500;margin-bottom:6px;')}>
                  Skyline Rooftop · Bandra West
                </div>
                <h2
                  style={css(
                    'margin:0 0 20px;font-size:34px;font-weight:800;letter-spacing:-0.02em;line-height:1.05;',
                  )}
                >
                  Neon Nights: Afrobeats Edition
                </h2>
                <div
                  style={css(
                    'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;',
                  )}
                >
                  <span style={css('font-size:13px;color:#d8c4b8;font-weight:600;')}>
                    340 of 400 tickets sold
                  </span>
                  <span style={css('font-size:13px;color:#ff8a55;font-weight:700;')}>85% full</span>
                </div>
                <div
                  style={css(
                    'height:8px;border-radius:999px;background:rgba(255,255,255,0.12);overflow:hidden;margin-bottom:22px;',
                  )}
                >
                  <div
                    style={css(
                      'width:85%;height:100%;background:linear-gradient(90deg,#ff5a1f,#ffb078);border-radius:999px;',
                    )}
                  />
                </div>
                <div style={css('display:flex;gap:12px;')}>
                  <button
                    type="button"
                    onClick={() => {
                      s.setSelectedEventIdx(0);
                      s.go('eventDetail');
                    }}
                    className="vh-accent"
                    style={css(
                      'display:flex;align-items:center;gap:9px;background:#ff5a1f;color:#0a0a0a;border:none;padding:14px 24px;border-radius:999px;font-size:15px;font-weight:700;cursor:pointer;',
                    )}
                  >
                    <Icon name="users" size={18} /> View guest list
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* trend card */}
          <div
            style={css(
              'background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:24px;',
            )}
          >
            <div
              style={css(
                'display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;',
              )}
            >
              <div
                style={css(
                  'display:flex;gap:4px;background:#0d0d0d;border:1px solid rgba(255,255,255,0.06);padding:4px;border-radius:11px;',
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    s.setMetric('tickets');
                  }}
                  style={css(metricBtn(s.metric === 'tickets'))}
                >
                  Tickets
                </button>
                <button
                  type="button"
                  onClick={() => {
                    s.setMetric('revenue');
                  }}
                  style={css(metricBtn(s.metric === 'revenue'))}
                >
                  Revenue
                </button>
              </div>
              <div
                style={css(
                  'display:flex;gap:2px;background:#0d0d0d;border:1px solid rgba(255,255,255,0.06);padding:4px;border-radius:11px;',
                )}
              >
                {RANGES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      s.setRange(r);
                    }}
                    style={css(rangeBtn(s.range === r))}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div style={css('display:flex;align-items:baseline;gap:12px;margin-bottom:4px;')}>
              <span style={css('font-size:38px;font-weight:800;letter-spacing:-0.02em;')}>
                {trendValue}
              </span>
              <span
                style={css(
                  'display:inline-flex;align-items:center;gap:4px;background:rgba(74,222,128,0.14);color:#6ee79b;padding:5px 10px;border-radius:999px;font-size:13px;font-weight:700;',
                )}
              >
                <Icon name="trending-up" size={13} />
                {TREND_DELTAS[s.range]}
              </span>
            </div>
            <div style={css('font-size:13px;color:#8a8a86;font-weight:500;margin-bottom:14px;')}>
              {TREND_CAPTIONS[s.range]}
            </div>
            <svg
              viewBox="0 0 600 190"
              preserveAspectRatio="none"
              style={{ width: '100%', height: 180, display: 'block' }}
            >
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff5a1f" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#ff5a1f" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={area} fill="url(#areaFill)" />
              <path
                d={line}
                fill="none"
                stroke="#ff5a1f"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* recent activity */}
        <div
          style={css(
            'position:relative;border-radius:24px;overflow:hidden;background:rgba(20,20,20,0.55);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,0.08);box-shadow:inset 0 1px 0 rgba(255,255,255,0.05),0 20px 50px rgba(0,0,0,0.35);padding:22px;display:flex;flex-direction:column;height:670px;',
          )}
        >
          <div
            style={css(
              'position:relative;display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;',
            )}
          >
            <h3 style={css('margin:0;font-size:17px;font-weight:700;')}>Recent activity</h3>
            <button
              type="button"
              onClick={s.goOrders}
              style={css(
                'background:none;border:none;padding:0;cursor:pointer;color:#ff5a1f;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:3px;',
              )}
            >
              View all <Icon name="arrow-right" size={13} />
            </button>
          </div>
          <div
            style={css(
              'position:relative;font-size:13px;color:#8a8a86;font-weight:500;margin-bottom:18px;',
            )}
          >
            Orders, payouts &amp; refunds
          </div>
          <div style={css('position:relative;display:flex;flex-direction:column;gap:12px;')}>
            {ACTIVITY.map((a) => (
              <div
                key={a.name}
                className="vh-w08"
                style={css(
                  'position:relative;display:flex;align-items:center;gap:13px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.07);box-shadow:inset 0 1px 0 rgba(255,255,255,0.05);',
                )}
              >
                <div
                  style={css(
                    a.dir === 'in'
                      ? iconWrap('rgba(255,90,31,0.14)', '#ff8a55')
                      : a.dir === 'refund'
                        ? iconWrap('rgba(240,133,122,0.12)', RED)
                        : iconWrap('rgba(255,255,255,0.07)', '#b5b5b0'),
                  )}
                >
                  <Icon name={a.icon} size={17} />
                </div>
                <div style={css('flex:1;min-width:0;')}>
                  <div
                    style={css(
                      'font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
                    )}
                  >
                    {a.name}
                  </div>
                  <div style={css('font-size:12px;color:#8a8a86;font-weight:500;margin-top:2px;')}>
                    {a.meta} · {a.time} ago
                  </div>
                </div>
                <div
                  style={css(
                    `font-size:14px;font-weight:800;flex:none;font-variant-numeric:tabular-nums;color:${
                      a.dir === 'in' ? GREEN : a.dir === 'refund' ? RED : '#b5b5b0'
                    };`,
                  )}
                >
                  {a.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* row 2 */}
      <div
        style={css(
          'display:grid;grid-template-columns:1fr 1.15fr 0.85fr;gap:20px;margin-top:20px;align-items:start;',
        )}
      >
        {/* calendar */}
        <button
          type="button"
          onClick={() => {
            s.setCalendarOpen(true);
          }}
          className="vh-border-accent"
          style={{
            ...CARD,
            cursor: 'pointer',
            textAlign: 'left',
            color: 'inherit',
            font: 'inherit',
          }}
        >
          <div
            style={css(
              'display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;',
            )}
          >
            <h3 style={css('margin:0;font-size:17px;font-weight:700;')}>July 2026</h3>
            <div style={css('display:flex;align-items:center;gap:8px;')}>
              <span style={css('font-size:12px;color:#ff8a55;font-weight:700;')}>
                See all events
              </span>
              <div
                style={css(
                  'width:30px;height:30px;border-radius:9px;background:rgba(255,90,31,0.12);border:1px solid rgba(255,90,31,0.28);color:#ff8a55;display:flex;align-items:center;justify-content:center;',
                )}
              >
                <Icon name="maximize-2" size={14} />
              </div>
            </div>
          </div>
          <div
            style={css(
              'display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:8px;',
            )}
          >
            {WEEKDAYS.map((w, i) => (
              <div
                key={`${w}-${String(i)}`}
                style={css('text-align:center;font-size:11px;color:#6a6a66;font-weight:700;')}
              >
                {w}
              </div>
            ))}
          </div>
          <div style={css('display:grid;grid-template-columns:repeat(7,1fr);gap:4px;')}>
            {Array.from({ length: JULY_OFFSET }, (_, i) => (
              <div key={`pad-${String(i)}`} style={{ height: 34 }} />
            ))}
            {Array.from({ length: 31 }, (_, i) => {
              const d = i + 1;
              const isToday = d === TODAY_JULY;
              const hasEvent = Boolean(JULY_EVENT_DATES[d]);
              let st =
                'height:34px;width:100%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;border-radius:9px;';
              if (isToday) st += 'background:#ff5a1f;color:#0a0a0a;font-weight:800;';
              else if (hasEvent) st += 'background:rgba(255,90,31,0.14);color:#ff8a55;';
              else st += 'color:#c9c9c6;';
              return (
                <div key={d} style={css(st)}>
                  {d}
                </div>
              );
            })}
          </div>
        </button>

        {/* upcoming */}
        <div style={CARD}>
          <div
            style={css(
              'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;',
            )}
          >
            <h3 style={css('margin:0;font-size:17px;font-weight:700;')}>Upcoming events</h3>
            <button
              type="button"
              onClick={() => {
                s.go('events');
              }}
              style={css(
                'background:none;border:none;padding:0;cursor:pointer;color:#ff5a1f;font-size:13px;font-weight:600;',
              )}
            >
              See all →
            </button>
          </div>
          <div style={css('display:flex;flex-direction:column;gap:12px;')}>
            {UPCOMING.map((e, i) => (
              <button
                key={e.name}
                type="button"
                onClick={() => {
                  s.go('events');
                }}
                style={css(
                  'position:relative;border-radius:16px;overflow:hidden;cursor:pointer;height:72px;border:1px solid rgba(255,255,255,0.07);padding:0;width:100%;background:none;',
                )}
              >
                <div
                  style={css(`position:absolute;inset:0;background:${pick(UPCOMING_GRADS, i)};`)}
                />
                <div
                  style={css(
                    'position:absolute;inset:0;background:linear-gradient(100deg,rgba(0,0,0,0.82) 30%,rgba(0,0,0,0.35) 68%,rgba(0,0,0,0.15));',
                  )}
                />
                <div
                  style={css(
                    'position:relative;height:100%;display:flex;align-items:center;gap:14px;padding:0 16px;',
                  )}
                >
                  <div style={css('flex:1;min-width:0;text-align:left;')}>
                    <div
                      style={css(
                        'font-size:14px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
                      )}
                    >
                      {e.name}
                    </div>
                    <div
                      style={css(
                        'font-size:12px;color:rgba(255,255,255,0.66);font-weight:500;margin-top:3px;',
                      )}
                    >
                      {e.meta}
                    </div>
                  </div>
                  <div style={css('text-align:right;')}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: e.pctColor }}>{e.pct}</div>
                    <div style={css('font-size:11px;color:rgba(255,255,255,0.5);font-weight:500;')}>
                      sold
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* my network */}
        <div style={{ ...CARD, width: 320, height: 344 }}>
          <div
            style={css(
              'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;',
            )}
          >
            <h3 style={css('margin:0;font-size:17px;font-weight:700;')}>My network</h3>
            <button
              type="button"
              onClick={() => {
                s.go('audience');
              }}
              style={css(
                'background:none;border:none;padding:0;cursor:pointer;color:#ff5a1f;font-size:13px;font-weight:600;',
              )}
            >
              See all →
            </button>
          </div>
          <div style={css('font-size:13px;color:#8a8a86;font-weight:500;margin-bottom:18px;')}>
            Venues, hosts &amp; promoters
          </div>
          <div style={css('display:flex;flex-direction:column;gap:14px;')}>
            {NETWORK.map((n) => (
              <div key={n.name} style={css('display:flex;align-items:center;gap:12px;')}>
                <div style={css(avatar40(n.grad))}>{n.initials}</div>
                <div style={css('flex:1;')}>
                  <div style={css('font-size:14px;font-weight:600;')}>{n.name}</div>
                  <div style={css('font-size:12px;color:#8a8a86;font-weight:500;')}>{n.role}</div>
                </div>
                <span style={css(tagStyle(n.tagBg, n.tagCol))}>{n.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Exposed so the expanded-calendar modal can reuse the same source of truth. */
export const OVERVIEW_JULY_EVENTS = JULY_EVENTS;
