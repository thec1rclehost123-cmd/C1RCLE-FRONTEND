'use client';

import { css } from '../charts';
import {
  POSTER_GRADS,
  REQ_DOT,
  SLOT_REQUESTS,
  gAvatar,
  initialsOf,
  outlinePill,
  pick,
  subTab,
} from '../data';
import { Icon } from '../Icon';
import { useVenueStudio } from '../store';

import type { ReqStatus } from '../data';

const STAT_CARD = css(
  'display:flex;align-items:center;justify-content:space-between;background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:20px 22px;',
);

const STAT_LABEL = css(
  'font-size:11px;font-weight:800;color:#6a6a66;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;',
);

export function SlotRequestsScreen() {
  const s = useVenueStudio();

  const requests = SLOT_REQUESTS.map((r) => ({
    ...r,
    status: s.requestOverrides[r.id] ?? r.status,
  }));

  const countBy = (st: ReqStatus) => requests.filter((r) => r.status === st).length;
  const shown =
    s.requestsView === 'pending' ? requests.filter((r) => r.status === 'pending') : requests;
  const noPending = s.requestsView === 'pending' && shown.length === 0;

  return (
    <div>
      <div
        style={css(
          'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;',
        )}
      >
        <button
          type="button"
          onClick={() => {
            s.go('events');
          }}
          className="vh-text"
          style={css(
            'display:flex;align-items:center;gap:7px;background:none;border:none;color:#8a8a86;font-size:14px;font-weight:600;cursor:pointer;padding:0;',
          )}
        >
          <Icon name="arrow-left" size={16} /> Back to Events
        </button>
        <button
          type="button"
          className="vh-1c"
          style={css(
            'display:flex;align-items:center;gap:8px;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f3;padding:10px 16px;border-radius:11px;font-size:13px;font-weight:600;cursor:pointer;',
          )}
        >
          <Icon name="refresh-cw" size={14} /> Refresh
        </button>
      </div>
      <h1 style={css('margin:4px 0 20px;font-size:30px;font-weight:800;letter-spacing:-0.02em;')}>
        Slot Requests
      </h1>

      <div
        style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:22px;')}
      >
        {(
          [
            ['Pending', countBy('pending'), '#ffb020', 'rgba(255,176,32,0.14)', 'clock'],
            [
              'Approved',
              countBy('approved'),
              '#6ee79b',
              'rgba(110,231,155,0.14)',
              'check-circle-2',
            ],
            ['Rejected', countBy('rejected'), '#f0857a', 'rgba(240,133,122,0.14)', 'x-circle'],
          ] as const
        ).map(([label, count, color, bg, icon]) => (
          <div key={label} style={STAT_CARD}>
            <div>
              <div style={STAT_LABEL}>{label}</div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {count}
              </div>
            </div>
            <div
              style={css(
                `width:46px;height:46px;border-radius:14px;background:${bg};color:${color};display:flex;align-items:center;justify-content:center;`,
              )}
            >
              <Icon name={icon} size={20} />
            </div>
          </div>
        ))}
      </div>

      <div
        style={css(
          'display:flex;gap:4px;background:#141414;border:1px solid rgba(255,255,255,0.06);padding:4px;border-radius:13px;width:fit-content;margin-bottom:20px;',
        )}
      >
        {(
          [
            ['pending', 'Pending'],
            ['all', 'All Requests'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              s.setRequestsView(id);
            }}
            style={css(subTab(s.requestsView === id))}
          >
            {label}
          </button>
        ))}
      </div>

      {noPending ? (
        <div
          style={css(
            'background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:22px;padding:70px 20px;display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center;',
          )}
        >
          <div
            style={css(
              'width:58px;height:58px;border-radius:50%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;color:#8a8a86;',
            )}
          >
            <Icon name="calendar" size={24} />
          </div>
          <div>
            <div style={css('font-size:17px;font-weight:700;margin-bottom:5px;')}>
              No pending requests
            </div>
            <div style={css('font-size:13px;color:#8a8a86;')}>
              All event slot requests have been reviewed.
            </div>
          </div>
          <button
            type="button"
            className="vh-1c"
            style={css(
              'background:#141414;border:1px solid rgba(255,255,255,0.12);color:#f5f5f3;padding:11px 18px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;',
            )}
          >
            Share your venue link
          </button>
        </div>
      ) : null}

      <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:20px;')}>
        {shown.map((r) => (
          <div
            key={r.id}
            className="vh-lift-sm"
            style={css(
              'position:relative;border-radius:24px;overflow:hidden;background:#0c0c0c;border:1px solid rgba(255,255,255,0.09);box-shadow:0 20px 46px rgba(0,0,0,0.4);transition:transform .32s cubic-bezier(.2,.8,.2,1);',
            )}
          >
            <div style={css('position:relative;height:96px;')}>
              <div
                style={css(`position:absolute;inset:0;background:${pick(POSTER_GRADS, r.id)};`)}
              />
              <div
                style={css(
                  'position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0) 45%,rgba(0,0,0,0.55) 100%);',
                )}
              />
              <div style={css('position:absolute;top:14px;left:14px;')}>
                <span style={css(outlinePill)}>
                  <span
                    style={css(
                      `width:6px;height:6px;border-radius:50%;background:${REQ_DOT[r.status]};box-shadow:0 0 6px ${REQ_DOT[r.status]};`,
                    )}
                  />
                  {r.status}
                </span>
              </div>
              <div
                style={css(
                  'position:absolute;top:14px;right:14px;display:flex;align-items:center;gap:8px;',
                )}
              >
                <div style={css(gAvatar(pick(POSTER_GRADS, r.id)))}>{initialsOf(r.host)}</div>
              </div>
            </div>

            <div style={css('padding:18px 18px 0;')}>
              <div
                style={css(
                  'background:linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02));border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:13px 16px;margin-bottom:16px;',
                )}
              >
                <div
                  style={css(
                    'font-size:16px;font-weight:800;letter-spacing:-0.01em;color:#fff;line-height:1.15;',
                  )}
                >
                  {r.eventName}
                </div>
                <div
                  style={css(
                    'font-size:11px;font-weight:800;color:#ff8a55;letter-spacing:0.06em;text-transform:uppercase;margin-top:4px;',
                  )}
                >
                  Requested by {r.host}
                </div>
              </div>

              <div style={css('display:flex;flex-direction:column;gap:10px;margin-bottom:16px;')}>
                <div style={css('display:flex;align-items:center;gap:10px;')}>
                  <Icon name="calendar" size={14} color="#6a6a66" />
                  <span style={css('font-size:13px;font-weight:600;')}>
                    {r.date} · {r.time}
                  </span>
                </div>
                <div style={css('display:flex;align-items:center;gap:10px;')}>
                  <Icon name="map-pin" size={14} color="#6a6a66" />
                  <span style={css('font-size:13px;font-weight:600;')}>{r.venue}</span>
                </div>
                <div style={css('display:flex;align-items:center;gap:10px;')}>
                  <Icon name="ticket" size={14} color="#6a6a66" />
                  <span style={css('font-size:13px;font-weight:600;')}>{r.tier}</span>
                </div>
              </div>
              <div
                style={css(
                  'font-size:12.5px;color:#8a8a86;line-height:1.5;margin-bottom:16px;min-height:38px;',
                )}
              >
                {r.note}
              </div>
            </div>

            <div style={css('padding:0 18px 18px;')}>
              {r.status === 'pending' ? (
                <div style={css('display:flex;gap:10px;')}>
                  <button
                    type="button"
                    onClick={() => {
                      s.setRequestStatus(r.id, 'rejected');
                    }}
                    className="vh-red-18"
                    style={css(
                      'flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:rgba(240,133,122,0.1);border:1px solid rgba(240,133,122,0.3);color:#f0857a;padding:12px;border-radius:999px;font-size:12.5px;font-weight:700;cursor:pointer;',
                    )}
                  >
                    <Icon name="x" size={14} /> Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      s.setRequestStatus(r.id, 'approved');
                    }}
                    className="vh-white"
                    style={css(
                      'flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:#f5f5f3;border:none;color:#0a0a0a;padding:12px;border-radius:999px;font-size:12.5px;font-weight:800;cursor:pointer;',
                    )}
                  >
                    <Icon name="check" size={14} /> Accept
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
