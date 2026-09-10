'use client';

/* eslint-disable no-restricted-syntax --
   Calendar cell styles are assembled at runtime by the shared css() string helper in
   src/components/venue/charts.ts and inline geometry (floating-calendar coordinates,
   cell heights, event breakpoints) that cannot be expressed as static Tailwind utilities
   without reworking the chart model — which is outside the 2026-09-11 partner-dashboard
   lint fix scope. The JSX `style` selector is the only no-restricted-syntax entry this
   file triggers (it contains no process.env or fetch()). */

import { useCallback } from 'react';

import { STATUS_DOT, css } from '../charts';
import { JULY_EVENTS, JULY_EVENT_DATES, JULY_OFFSET, TODAY_JULY, WEEKDAYS } from '../data';
import { Icon } from '../Icon';
import { useVenueStudio } from '../store';

/** Draggable pop-out month view, matching the mockup's floating calendar. */
export function FloatingCalendar() {
  const s = useVenueStudio();
  const { calFloatOpen, calFloatX, calFloatY, setCalFloatPos } = s;

  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const origX = calFloatX;
      const origY = calFloatY;

      const move = (ev: MouseEvent) => {
        setCalFloatPos({ x: origX + (ev.clientX - startX), y: origY + (ev.clientY - startY) });
      };
      const up = () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
      };

      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    },
    [calFloatX, calFloatY, setCalFloatPos],
  );

  if (!calFloatOpen) return null;

  return (
    <div style={{ position: 'fixed', left: calFloatX, top: calFloatY, zIndex: 70, width: 320 }}>
      <div
        style={css(
          'background:rgba(18,18,18,0.97);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.12);border-radius:20px;box-shadow:0 30px 70px rgba(0,0,0,0.6);overflow:hidden;',
        )}
      >
        <div
          role="presentation"
          onMouseDown={onDragStart}
          style={css(
            'display:flex;align-items:center;gap:8px;padding:12px 14px;cursor:grab;background:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.07);user-select:none;',
          )}
        >
          <Icon name="grip-vertical" size={14} color="#6a6a66" />
          <span style={css('font-size:13px;font-weight:700;flex:1;')}>July 2026</span>
          <button
            type="button"
            aria-label="Close pop-out calendar"
            onClick={() => {
              s.setCalFloatOpen(false);
            }}
            className="vh-w14"
            style={css(
              'width:26px;height:26px;border-radius:8px;background:rgba(255,255,255,0.06);border:none;color:#c9c9c6;cursor:pointer;display:flex;align-items:center;justify-content:center;',
            )}
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        <div style={css('padding:16px 18px 20px;')}>
          <div
            style={css(
              'display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:8px;',
            )}
          >
            {WEEKDAYS.map((w, i) => (
              <div
                key={`${w}-${String(i)}`}
                style={css(
                  'text-align:center;font-size:10.5px;font-weight:700;color:#6a6a66;text-transform:uppercase;',
                )}
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
              const evs = JULY_EVENTS[d];

              let st =
                'height:34px;width:100%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;border-radius:9px;';
              if (isToday) st += 'background:#ff5a1f;color:#0a0a0a;font-weight:800;';
              else if (hasEvent) st += 'background:rgba(255,90,31,0.14);color:#ff8a55;';
              else st += 'color:#c9c9c6;';

              return (
                <div key={d} className="calFloatDay" style={{ position: 'relative', height: 34 }}>
                  <div style={css(st)}>{d}</div>
                  {evs ? (
                    <div
                      className="calFloatTip"
                      style={css(
                        'position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%) translateY(4px);width:220px;background:rgba(22,22,22,0.98);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.14);border-radius:14px;padding:12px 14px;box-shadow:0 20px 44px rgba(0,0,0,0.5);opacity:0;pointer-events:none;transition:opacity .15s ease,transform .15s ease;z-index:30;',
                      )}
                    >
                      {evs.map((ev) => (
                        <div
                          key={ev.name}
                          style={css('display:flex;align-items:flex-start;gap:8px;padding:6px 0;')}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: STATUS_DOT[ev.status],
                              flex: 'none',
                              marginTop: 5,
                            }}
                          />
                          <div style={css('min-width:0;')}>
                            <div
                              style={css(
                                'font-size:12.5px;font-weight:700;color:#f5f5f3;line-height:1.3;',
                              )}
                            >
                              {ev.name}
                            </div>
                            <div style={css('font-size:11px;color:#8a8a86;margin-top:2px;')}>
                              {ev.time} · {ev.venue}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
