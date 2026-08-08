'use client';

import { STATUS_DOT, calCells, css } from '../charts';
import { CAL_LEGEND, JULY_EVENTS, JULY_STATUS, WEEKDAYS } from '../data';
import { Icon } from '../Icon';
import { useVenueStudio } from '../store';

const SEL_WEEKDAYS = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'] as const;

const STATUS_TINT: Record<string, readonly [string, string]> = {
  confirmed: ['rgba(110,231,155,0.14)', '#6ee79b'],
  pending: ['rgba(255,176,32,0.14)', '#ffb020'],
  blocked: ['rgba(240,133,122,0.14)', '#f0857a'],
};

export function CalendarModal() {
  const s = useVenueStudio();
  if (!s.calendarOpen) return null;

  const cells = calCells({
    days: 31,
    offset: 3,
    statusMap: JULY_STATUS,
    selected: s.calSel,
    cellH: 58,
  });

  const selEvents = JULY_EVENTS[s.calSel] ?? [];

  return (
    <div
      role="presentation"
      onClick={() => {
        s.setCalendarOpen(false);
      }}
      style={css(
        'position:fixed;inset:0;z-index:60;background:rgba(0,0,0,0.74);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:28px;',
      )}
    >
      <div
        role="presentation"
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={css(
          'position:relative;width:100%;max-width:1120px;max-height:90vh;overflow:hidden;display:flex;border-radius:28px;background:rgba(16,16,16,0.92);border:1px solid rgba(255,255,255,0.09);box-shadow:0 40px 100px rgba(0,0,0,0.65);',
        )}
      >
        {/* grid */}
        <div
          style={css(
            'position:relative;flex:1;padding:30px 32px;display:flex;flex-direction:column;min-width:0;',
          )}
        >
          <div
            style={css(
              'display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;',
            )}
          >
            <div>
              <div
                style={css(
                  'font-size:12px;font-weight:700;color:#8a8a86;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;',
                )}
              >
                Booking calendar
              </div>
              <h2 style={css('margin:0;font-size:26px;font-weight:800;letter-spacing:-0.02em;')}>
                All events this month
              </h2>
            </div>
            <div style={css('display:flex;align-items:center;gap:8px;')}>
              <button
                type="button"
                aria-label="Previous month"
                className="vh-w10"
                style={css(
                  'width:38px;height:38px;border-radius:999px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#c9c9c6;cursor:pointer;display:flex;align-items:center;justify-content:center;',
                )}
              >
                <Icon name="chevron-left" size={17} />
              </button>
              <span
                style={css(
                  'font-size:15px;font-weight:800;letter-spacing:0.02em;min-width:128px;text-align:center;',
                )}
              >
                JULY 2026
              </span>
              <button
                type="button"
                aria-label="Next month"
                className="vh-w10"
                style={css(
                  'width:38px;height:38px;border-radius:999px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#c9c9c6;cursor:pointer;display:flex;align-items:center;justify-content:center;',
                )}
              >
                <Icon name="chevron-right" size={17} />
              </button>
            </div>
          </div>

          <div
            style={css(
              'display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-bottom:10px;',
            )}
          >
            {WEEKDAYS.map((w, i) => (
              <div
                key={`${w}-${String(i)}`}
                style={css(
                  'text-align:center;font-size:11px;color:#6a6a66;font-weight:800;letter-spacing:0.06em;',
                )}
              >
                {w}
              </div>
            ))}
          </div>
          <div style={css('display:grid;grid-template-columns:repeat(7,1fr);gap:8px;')}>
            {cells.map((c, i) =>
              c.empty ? (
                <div key={`e-${String(i)}`} style={css(c.style)} />
              ) : (
                <button
                  key={c.day}
                  type="button"
                  onClick={() => {
                    s.setCalSel(c.day);
                  }}
                  style={css(c.style)}
                >
                  {c.label}
                  <span style={css(c.dotStyle)} />
                </button>
              ),
            )}
          </div>

          <div
            style={css(
              'margin-top:auto;padding-top:22px;display:flex;align-items:center;gap:22px;',
            )}
          >
            {CAL_LEGEND.map((l) => (
              <div key={l.label} style={css('display:flex;align-items:center;gap:8px;')}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: l.color }} />
                <span style={css('font-size:13px;font-weight:600;color:#c9c9c6;')}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* side panel */}
        <div
          style={css(
            'position:relative;width:340px;flex:none;border-left:1px solid rgba(255,255,255,0.07);background:rgba(10,10,10,0.5);padding:30px 26px;display:flex;flex-direction:column;',
          )}
        >
          <button
            type="button"
            aria-label="Close calendar"
            onClick={() => {
              s.setCalendarOpen(false);
            }}
            style={css(
              'position:absolute;top:22px;right:22px;width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#8a8a86;cursor:pointer;display:flex;align-items:center;justify-content:center;',
            )}
          >
            <Icon name="x" size={16} />
          </button>
          <div style={css('font-size:13px;font-weight:700;color:#ff8a55;margin-bottom:4px;')}>
            {SEL_WEEKDAYS[(s.calSel - 1) % 7]}
          </div>
          <div
            style={css('font-size:22px;font-weight:800;letter-spacing:-0.01em;margin-bottom:22px;')}
          >
            July {s.calSel}, 2026
          </div>

          {selEvents.length > 0 ? (
            <div style={css('display:flex;flex-direction:column;gap:12px;')}>
              {selEvents.map((e) => {
                const tint = STATUS_TINT[e.status] ?? ['rgba(255,255,255,0.08)', '#c9c9c6'];
                return (
                  <div
                    key={e.name}
                    style={css(
                      'position:relative;border-radius:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);padding:15px 16px 15px 18px;overflow:hidden;',
                    )}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        background: STATUS_DOT[e.status],
                      }}
                    />
                    <div
                      style={css(
                        'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;',
                      )}
                    >
                      <span
                        style={css(
                          `font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;text-transform:capitalize;background:${tint[0]};color:${tint[1]};`,
                        )}
                      >
                        {e.status}
                      </span>
                    </div>
                    <div
                      style={css(
                        'font-size:14px;font-weight:700;line-height:1.3;margin-bottom:6px;',
                      )}
                    >
                      {e.name}
                    </div>
                    <div
                      style={css(
                        'display:flex;align-items:center;gap:7px;font-size:12px;color:#8a8a86;font-weight:500;margin-bottom:3px;',
                      )}
                    >
                      <Icon name="clock" size={13} />
                      {e.time}
                    </div>
                    <div
                      style={css(
                        'display:flex;align-items:center;gap:7px;font-size:12px;color:#8a8a86;font-weight:500;',
                      )}
                    >
                      <Icon name="map-pin" size={13} />
                      {e.venue}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={css(
                'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;margin-top:40px;',
              )}
            >
              <div
                style={css(
                  'width:54px;height:54px;border-radius:16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;',
                )}
              >
                <Icon name="calendar-plus" size={22} color="#6a6a66" />
              </div>
              <div style={css('font-size:14px;font-weight:700;color:#c9c9c6;')}>Nothing booked</div>
              <div style={css('font-size:12.5px;color:#8a8a86;line-height:1.5;max-width:200px;')}>
                This date is open. Create an event to fill the slot.
              </div>
              <button
                type="button"
                onClick={s.startCreate}
                style={css(
                  'margin-top:4px;background:#ff5a1f;color:#0a0a0a;border:none;padding:10px 18px;border-radius:999px;font-size:13px;font-weight:700;cursor:pointer;',
                )}
              >
                Create event
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
