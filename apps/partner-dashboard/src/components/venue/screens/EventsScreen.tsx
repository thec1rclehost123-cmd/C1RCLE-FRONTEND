'use client';

import { buildPaths, css } from '../charts';
import {
  AGE_RAW,
  ANALYTICS_CARDS,
  ANALYTICS_SERIES,
  CHANNEL_RAW,
  EVENTS,
  EVENT_FILTERS,
  EV_STATUS_DOT,
  GENDER_RAW,
  PEAK_RAW,
  SLOT_REQUESTS,
  TIER_BARS,
  bar,
  eventCardBg,
  initialsOf,
  outlinePill,
  subTab,
} from '../data';
import { Icon } from '../Icon';
import { useVenueStudio } from '../store';

const PANEL = css(
  'background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:22px;',
);

export function EventsScreen() {
  const s = useVenueStudio();

  const pendingCount = SLOT_REQUESTS.filter(
    (r) => (s.requestOverrides[r.id] ?? r.status) === 'pending',
  ).length;

  return (
    <div>
      <div
        style={css(
          'display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:22px;',
        )}
      >
        <h1 style={css('margin:0;font-size:30px;font-weight:800;letter-spacing:-0.02em;')}>
          Events
        </h1>
        <div style={css('display:flex;align-items:center;gap:10px;')}>
          <div
            style={css(
              'display:flex;align-items:center;gap:8px;background:#141414;border:1px solid rgba(255,255,255,0.08);padding:9px 14px;border-radius:999px;',
            )}
          >
            <span
              style={css(
                'font-size:15px;font-weight:800;color:#ffb020;font-variant-numeric:tabular-nums;',
              )}
            >
              {pendingCount}
            </span>
            <span
              style={css(
                'font-size:12px;color:#8a8a86;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;',
              )}
            >
              Requests
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              s.go('slotRequests');
            }}
            className="vh-w10"
            style={css(
              'display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#f5f5f3;padding:12px 18px;border-radius:12px;font-size:13.5px;font-weight:700;cursor:pointer;',
            )}
          >
            Slot Requests <Icon name="arrow-up-right" size={15} />
          </button>
          <button
            type="button"
            onClick={s.startCreate}
            className="vh-accent"
            style={css(
              'display:flex;align-items:center;gap:8px;background:#ff5a1f;color:#0a0a0a;border:none;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;',
            )}
          >
            <Icon name="plus" size={17} /> Create event
          </button>
        </div>
      </div>

      {/* sub tabs */}
      <div
        style={css(
          'display:flex;gap:4px;background:#141414;border:1px solid rgba(255,255,255,0.06);padding:4px;border-radius:13px;width:fit-content;margin-bottom:22px;',
        )}
      >
        {(
          [
            ['list', 'All events'],
            ['analytics', 'Analytics'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              s.setEventsView(id);
            }}
            style={css(subTab(s.eventsView === id))}
          >
            {label}
          </button>
        ))}
      </div>

      {s.eventsView === 'list' ? <EventGallery /> : <EventAnalytics />}
    </div>
  );
}

function EventGallery() {
  const s = useVenueStudio();

  return (
    <div>
      <div
        style={css(
          'display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;gap:12px;flex-wrap:wrap;',
        )}
      >
        <div style={css('display:flex;gap:10px;')}>
          {EVENT_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className="vh-1c"
              style={css(
                'display:flex;align-items:center;gap:7px;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#c9c9c6;padding:9px 14px;border-radius:11px;font-size:13px;font-weight:600;cursor:pointer;',
              )}
            >
              {f} <Icon name="chevron-down" size={14} style={{ opacity: 0.6 }} />
            </button>
          ))}
        </div>
      </div>

      <div className="venue-event-gallery-grid" style={css('display:grid;grid-template-columns:repeat(4,1fr);gap:20px;')}>
        {EVENTS.map((e, i) => (
          <div
            key={e.name}
            className="vh-lift"
            style={css(
              'position:relative;border-radius:24px;overflow:hidden;background:#0c0c0c;border:1px solid rgba(255,255,255,0.09);box-shadow:0 20px 46px rgba(0,0,0,0.45);transition:transform .32s cubic-bezier(.2,.8,.2,1),box-shadow .32s ease;',
            )}
          >
            {/* poster */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                s.openEvent(i);
              }}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter') {
                  s.openEvent(i);
                }
              }}
              style={css('position:relative;height:148px;cursor:pointer;overflow:hidden;')}
            >
              <div style={css(eventCardBg(i, e.card))} />
              <div
                style={css(
                  'position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0) 55%,rgba(0,0,0,0.55) 100%);',
                )}
              />
              <div style={css('position:absolute;top:14px;left:14px;')}>
                <span style={css(outlinePill)}>
                  <span
                    style={css(
                      `width:6px;height:6px;border-radius:50%;background:${EV_STATUS_DOT[e.status]};box-shadow:0 0 6px ${EV_STATUS_DOT[e.status]};`,
                    )}
                  />
                  {e.status}
                </span>
              </div>
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  s.setSelectedEventIdx(i);
                  s.openEdit();
                }}
                className="vh-w14"
                style={css(
                  'position:absolute;top:14px;right:14px;display:inline-flex;align-items:center;gap:6px;background:rgba(0,0,0,0.4);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.28);color:#fff;padding:6px 12px;border-radius:999px;font-size:10.5px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;',
                )}
              >
                <Icon name="pencil" size={11} />
                Edit event
              </button>
            </div>

            {/* ticket-stub perforation */}
            <div style={css('position:relative;height:0;')}>
              <div
                style={css(
                  'position:absolute;top:-9px;left:-9px;width:18px;height:18px;border-radius:50%;background:#060606;border:1px solid rgba(255,255,255,0.09);',
                )}
              />
              <div
                style={css(
                  'position:absolute;top:-9px;right:-9px;width:18px;height:18px;border-radius:50%;background:#060606;border:1px solid rgba(255,255,255,0.09);',
                )}
              />
              <div style={css('border-top:1.5px dashed rgba(255,255,255,0.16);margin:0 16px;')} />
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                s.openEvent(i);
              }}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter') {
                  s.openEvent(i);
                }
              }}
              style={css('cursor:pointer;padding:18px 16px 0;')}
            >
              <div
                style={css(
                  'background:linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02));border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:13px 16px;margin-bottom:16px;',
                )}
              >
                <div
                  style={css(
                    'font-size:17px;font-weight:800;letter-spacing:-0.01em;color:#fff;line-height:1.15;',
                  )}
                >
                  {e.name}
                </div>
                <div
                  style={css(
                    'font-size:11px;font-weight:800;color:#ff8a55;letter-spacing:0.07em;text-transform:uppercase;margin-top:4px;',
                  )}
                >
                  {e.venue}
                </div>
              </div>

              <div style={css('display:flex;align-items:center;gap:14px;margin-bottom:18px;')}>
                <div
                  style={css(
                    'flex:none;text-align:center;background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:7px 12px;min-width:48px;',
                  )}
                >
                  <div
                    style={css(
                      'font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.01em;font-variant-numeric:tabular-nums;line-height:1;',
                    )}
                  >
                    {e.day}
                  </div>
                  <div
                    style={css(
                      'font-size:10px;font-weight:800;color:#ff8a55;letter-spacing:0.08em;margin-top:2px;',
                    )}
                  >
                    {e.month}
                  </div>
                </div>
                <div>
                  <div style={css('font-size:14px;font-weight:700;color:#f5f5f3;')}>{e.time}</div>
                  <div style={css('display:flex;align-items:center;gap:6px;margin-top:5px;')}>
                    <span
                      style={css(
                        'width:18px;height:18px;border-radius:50%;background:rgba(255,90,31,0.18);color:#ff8a55;font-size:8px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;',
                      )}
                    >
                      {initialsOf(e.host)}
                    </span>
                    <span style={css('font-size:12.5px;font-weight:600;color:#8a8a86;')}>
                      {e.host}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={css('padding:0 16px 16px;')}>
              <button
                type="button"
                onClick={() => {
                  s.openEvent(i);
                }}
                className="vh-white"
                style={css(
                  'width:100%;display:flex;align-items:center;justify-content:center;gap:8px;background:#f5f5f3;color:#0a0a0a;border:none;padding:13px;border-radius:12px;font-size:12.5px;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;cursor:pointer;',
                )}
              >
                Explore event <Icon name="arrow-right" size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventAnalytics() {
  const ap = buildPaths(ANALYTICS_SERIES);

  const donutC = 2 * Math.PI * 54;
  // Each arc starts where the previous one ended, so offset is the running
  // total of all preceding segment lengths.
  const genderSplit = GENDER_RAW.map((g, i) => {
    const dash = (g.pct / 100) * donutC;
    const offset = GENDER_RAW.slice(0, i).reduce((acc, p) => acc + (p.pct / 100) * donutC, 0);
    return {
      ...g,
      dashArray: `${String(dash)} ${String(donutC - dash)}`,
      dashOffset: -offset,
    };
  });

  const ageMax = Math.max(...AGE_RAW.map((a) => a[1]));

  return (
    <div>
      <div
        style={css('display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;')}
      >
        {ANALYTICS_CARDS.map((c) => (
          <div
            key={c.label}
            style={css(
              'background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:20px;',
            )}
          >
            <div style={css('font-size:13px;color:#8a8a86;font-weight:600;margin-bottom:10px;')}>
              {c.label}
            </div>
            <div style={css('font-size:28px;font-weight:800;letter-spacing:-0.02em;')}>
              {c.value}
            </div>
            <div style={css(c.deltaStyle)}>{c.delta}</div>
          </div>
        ))}
      </div>

      <div style={css('display:grid;grid-template-columns:1.5fr 1fr;gap:16px;')}>
        <div style={PANEL}>
          <h3 style={css('margin:0 0 4px;font-size:16px;font-weight:700;')}>Sales over time</h3>
          <div style={css('font-size:13px;color:#8a8a86;margin-bottom:16px;')}>Last 12 weeks</div>
          <svg
            viewBox="0 0 600 200"
            preserveAspectRatio="none"
            style={{ width: '100%', height: 200, display: 'block' }}
          >
            <defs>
              <linearGradient id="af2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff5a1f" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#ff5a1f" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={ap.area} fill="url(#af2)" />
            <path
              d={ap.line}
              fill="none"
              stroke="#ff5a1f"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div style={PANEL}>
          <h3 style={css('margin:0 0 4px;font-size:16px;font-weight:700;')}>Tickets by tier</h3>
          <div style={css('font-size:13px;color:#8a8a86;margin-bottom:20px;')}>This month</div>
          <div style={css('display:flex;flex-direction:column;gap:16px;')}>
            {TIER_BARS.map((t) => (
              <div key={t.name}>
                <div style={css('display:flex;justify-content:space-between;margin-bottom:7px;')}>
                  <span style={css('font-size:13px;font-weight:600;')}>{t.name}</span>
                  <span style={css('font-size:13px;font-weight:700;color:#c9c9c6;')}>
                    {t.count}
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
      </div>

      {/* gender / age / channel */}
      <div style={css('display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:16px;')}>
        <div style={PANEL}>
          <h3 style={css('margin:0 0 4px;font-size:16px;font-weight:700;')}>Gender split</h3>
          <div style={css('font-size:13px;color:#8a8a86;margin-bottom:16px;')}>
            Ticket buyers this month
          </div>
          <div style={css('display:flex;align-items:center;gap:20px;')}>
            <div style={css('position:relative;width:128px;height:128px;flex:none;')}>
              <svg
                viewBox="0 0 128 128"
                style={{ width: 128, height: 128, transform: 'rotate(-90deg)' }}
              >
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={16}
                />
                {genderSplit.map((g) => (
                  <circle
                    key={g.label}
                    cx="64"
                    cy="64"
                    r="54"
                    fill="none"
                    stroke={g.color}
                    strokeWidth={16}
                    strokeDasharray={g.dashArray}
                    strokeDashoffset={g.dashOffset}
                    strokeLinecap="butt"
                  />
                ))}
              </svg>
              <div
                style={css(
                  'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;',
                )}
              >
                <span style={css('font-size:24px;font-weight:800;letter-spacing:-0.02em;')}>
                  12.4k
                </span>
                <span style={css('font-size:11px;color:#8a8a86;font-weight:600;')}>buyers</span>
              </div>
            </div>
            <div style={css('display:flex;flex-direction:column;gap:12px;flex:1;')}>
              {genderSplit.map((g) => (
                <div key={g.label} style={css('display:flex;align-items:center;gap:9px;')}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: g.color }} />
                  <span style={css('flex:1;font-size:13px;font-weight:600;color:#c9c9c6;')}>
                    {g.label}
                  </span>
                  <span
                    style={css('font-size:14px;font-weight:800;font-variant-numeric:tabular-nums;')}
                  >
                    {g.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={PANEL}>
          <h3 style={css('margin:0 0 4px;font-size:16px;font-weight:700;')}>Age demographics</h3>
          <div style={css('font-size:13px;color:#8a8a86;margin-bottom:20px;')}>
            Share of buyers by age
          </div>
          <div style={css('display:flex;flex-direction:column;gap:16px;')}>
            {AGE_RAW.map(([label, pct]) => (
              <div key={label} style={css('display:flex;align-items:center;gap:12px;')}>
                <span
                  style={css(
                    'width:52px;font-size:13px;font-weight:600;color:#c9c9c6;font-variant-numeric:tabular-nums;',
                  )}
                >
                  {label}
                </span>
                <div
                  style={css(
                    'flex:1;height:10px;border-radius:999px;background:rgba(255,255,255,0.06);overflow:hidden;',
                  )}
                >
                  <div
                    style={css(
                      bar(
                        Math.round((pct / ageMax) * 100),
                        'linear-gradient(90deg,#ff5a1f,#ffb078)',
                      ),
                    )}
                  />
                </div>
                <span
                  style={css(
                    'width:38px;text-align:right;font-size:13px;font-weight:800;font-variant-numeric:tabular-nums;',
                  )}
                >
                  {pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={PANEL}>
          <h3 style={css('margin:0 0 4px;font-size:16px;font-weight:700;')}>Sales by channel</h3>
          <div style={css('font-size:13px;color:#8a8a86;margin-bottom:20px;')}>
            Where tickets came from
          </div>
          <div style={css('display:flex;flex-direction:column;gap:16px;')}>
            {CHANNEL_RAW.map(([label, pct, hi]) => (
              <div key={label} style={css('display:flex;align-items:center;gap:12px;')}>
                <span style={css('width:76px;font-size:13px;font-weight:600;color:#c9c9c6;')}>
                  {label}
                </span>
                <div
                  style={css(
                    'flex:1;height:10px;border-radius:999px;background:rgba(255,255,255,0.06);overflow:hidden;',
                  )}
                >
                  <div
                    style={css(
                      `width:${String(pct)}%;height:100%;border-radius:999px;background:${
                        hi ? 'linear-gradient(90deg,#ff5a1f,#ffb078)' : 'rgba(255,255,255,0.16)'
                      };`,
                    )}
                  />
                </div>
                <span
                  style={css(
                    `width:38px;text-align:right;font-size:14px;font-weight:800;font-variant-numeric:tabular-nums;color:${hi ? '#ff8a55' : '#c9c9c6'};`,
                  )}
                >
                  {pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* peak days */}
      <div style={{ ...PANEL, marginTop: 16 }}>
        <div
          style={css(
            'display:flex;align-items:baseline;justify-content:space-between;margin-bottom:20px;',
          )}
        >
          <div>
            <h3 style={css('margin:0 0 4px;font-size:16px;font-weight:700;')}>When people buy</h3>
            <div style={css('font-size:13px;color:#8a8a86;')}>Ticket sales by day of week</div>
          </div>
          <span
            style={css(
              'display:inline-flex;align-items:center;gap:6px;background:rgba(255,90,31,0.12);border:1px solid rgba(255,90,31,0.28);color:#ff8a55;padding:5px 12px;border-radius:999px;font-size:12px;font-weight:700;',
            )}
          >
            Saturday is your best night
          </span>
        </div>
        <div style={css('display:flex;align-items:flex-end;gap:14px;height:150px;')}>
          {PEAK_RAW.map(([label, h]) => (
            <div
              key={label}
              style={css(
                'flex:1;display:flex;flex-direction:column;align-items:center;gap:10px;height:100%;justify-content:flex-end;',
              )}
            >
              <div style={css('width:100%;flex:1;display:flex;align-items:flex-end;')}>
                <div
                  style={css(
                    `width:100%;height:${String(h)}%;border-radius:7px 7px 0 0;background:${
                      h === 100 ? 'linear-gradient(180deg,#ffb078,#ff5a1f)' : 'rgba(255,90,31,0.28)'
                    };`,
                  )}
                />
              </div>
              <span style={css('font-size:12px;font-weight:700;color:#8a8a86;')}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
