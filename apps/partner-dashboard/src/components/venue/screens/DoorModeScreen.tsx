'use client';

import { useState } from 'react';

import { css } from '../charts';
import {
  DOOR_GUESTS,
  DOOR_LOG,
  GRADS,
  PAY_TYPES,
  gAvatar,
  initialsOf,
  inputStyle,
  payChip,
  pick,
} from '../data';
import { Icon } from '../Icon';
import { useVenueStudio } from '../store';

const GLASS =
  'position:relative;border-radius:24px;overflow:hidden;background:rgba(20,20,20,0.55);' +
  'backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,0.08);' +
  'box-shadow:inset 0 1px 0 rgba(255,255,255,0.05),0 20px 50px rgba(0,0,0,0.35);padding:24px;';

export function DoorModeScreen() {
  const s = useVenueStudio();
  const [payType, setPayType] = useState<string>('Cash');
  const [checkedIn, setCheckedIn] = useState<Record<string, boolean>>(
    Object.fromEntries(DOOR_GUESTS.map((g) => [g.name, g.done])),
  );
  const [connection, setConnection] = useState<'online' | 'offline' | 'reconnecting'>('online');
  const [scanState, setScanState] = useState<'idle' | 'ready' | 'valid' | 'invalid' | 'duplicate'>('idle');

  return (
    <div>
      <div
        style={css(
          'display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;',
        )}
      >
        <div style={css('display:flex;align-items:center;gap:14px;')}>
          <button
            type="button"
            aria-label="Back to overview"
            onClick={() => {
              s.go('overview');
            }}
            style={css(
              'width:40px;height:40px;border-radius:12px;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#8a8a86;cursor:pointer;display:flex;align-items:center;justify-content:center;',
            )}
          >
            <Icon name="arrow-left" size={18} />
          </button>
          <div>
            <div style={css('display:flex;align-items:center;gap:9px;')}>
              <span
                style={css(
                  'width:9px;height:9px;border-radius:50%;background:#6ee79b;box-shadow:0 0 10px #6ee79b;',
                )}
              />
              <h1 style={css('margin:0;font-size:26px;font-weight:800;letter-spacing:-0.02em;')}>
                Door Mode
              </h1>
            </div>
            <div style={css('font-size:13px;color:#8a8a86;font-weight:500;margin-top:3px;')}>
              Neon Nights: Afrobeats Edition · Skyline Rooftop
            </div>
          </div>
        </div>
        <div style={css('display:flex;gap:10px;')}>
          <button
            type="button"
            onClick={() => { setScanState('ready'); }}
            className="vh-w10"
            style={css(
              'display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#c9c9c6;padding:11px 18px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;',
            )}
          >
            <Icon name="scan-line" size={15} /> Quick scan
          </button>
          <button
            type="button"
            onClick={() => { setScanState('invalid'); }}
            className="vh-w10"
            style={css(
              'display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#c9c9c6;padding:11px 18px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;',
            )}
          >
            <Icon name="triangle-alert" size={15} /> Issues{' '}
            <span
              style={css(
                'background:#ff5a1f;color:#0a0a0a;font-size:11px;font-weight:800;padding:1px 7px;border-radius:999px;',
              )}
            >
              2
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setConnection((current) => (current === 'online' ? 'offline' : 'reconnecting'));
            }}
            className="vh-red-20"
            style={css(
              'display:flex;align-items:center;gap:8px;background:rgba(240,133,122,0.12);border:1px solid rgba(240,133,122,0.3);color:#f0857a;padding:11px 18px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;',
            )}
          >
            <Icon name="power" size={15} /> {connection === 'online' ? 'Disconnect' : 'Reconnect'}
          </button>
        </div>
      </div>

      <section className={`venue-door-status venue-door-status--${connection}`} aria-live="polite"><div><span /> <strong>{connection === 'online' ? 'Door devices connected' : connection === 'offline' ? 'Offline mode' : 'Reconnecting'}</strong><small>{connection === 'online' ? 'Last sync just now' : connection === 'offline' ? 'Check-ins stay on this device until the network returns.' : 'Attempting to restore the secure scanner session.'}</small></div><button type="button" onClick={() => { setConnection('online'); }}>Retry connection</button></section>

      {scanState !== 'idle' ? <section className={`venue-scan-feedback venue-scan-feedback--${scanState}`} role="status"><div><span>{scanState === 'ready' ? 'Camera ready' : scanState === 'valid' ? 'Entry approved' : scanState === 'duplicate' ? 'Already checked in' : 'Ticket not valid'}</span><strong>{scanState === 'ready' ? 'Point the camera at a C1RCLE ticket.' : scanState === 'valid' ? 'Guest checked in successfully.' : scanState === 'duplicate' ? 'This ticket was scanned at 10:42 PM.' : 'Ask the guest to open the latest ticket in their wallet.'}</strong></div><div>{scanState === 'ready' ? <><button type="button" onClick={() => { setScanState('valid'); }}>Simulate valid scan</button><button type="button" onClick={() => { setScanState('duplicate'); }}>Simulate duplicate</button></> : <button type="button" onClick={() => { setScanState('ready'); }}>Scan another</button>}<button type="button" onClick={() => { setScanState('idle'); }}>Close</button></div></section> : null}

      <div style={css('display:grid;grid-template-columns:1.4fr 1fr;gap:20px;align-items:start;')}>
        {/* left */}
        <div style={css('display:flex;flex-direction:column;gap:20px;')}>
          <div
            style={css(
              'position:relative;border-radius:28px;overflow:hidden;background:rgba(22,17,14,0.72);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,0.09);box-shadow:inset 0 1px 0 rgba(255,255,255,0.08),0 26px 60px rgba(0,0,0,0.45);padding:28px 30px;',
            )}
          >
            <div style={css('display:flex;align-items:center;gap:10px;margin-bottom:16px;')}>
              <span style={css('font-size:13px;color:#d8c4b8;font-weight:600;')}>
                How full we are
              </span>
              <span
                style={css(
                  'display:inline-flex;align-items:center;gap:6px;background:rgba(110,231,155,0.14);color:#6ee79b;padding:4px 11px;border-radius:999px;font-size:12px;font-weight:700;',
                )}
              >
                <span
                  style={css(
                    'width:6px;height:6px;border-radius:50%;background:#6ee79b;box-shadow:0 0 8px #6ee79b;',
                  )}
                />
                Live
              </span>
            </div>
            <div style={css('display:flex;align-items:baseline;gap:14px;margin-bottom:20px;')}>
              <span
                style={css(
                  'font-size:64px;font-weight:800;letter-spacing:-0.03em;line-height:1;font-variant-numeric:tabular-nums;',
                )}
              >
                247
              </span>
              <span style={css('font-size:18px;color:#d8c4b8;font-weight:600;')}>
                of 400 inside
              </span>
            </div>
            <div
              style={css(
                'height:14px;border-radius:999px;background:rgba(255,255,255,0.12);overflow:hidden;margin-bottom:12px;',
              )}
            >
              <div
                style={css(
                  'width:62%;height:100%;background:linear-gradient(90deg,#ff5a1f,#ffb078);border-radius:999px;',
                )}
              />
            </div>
            <div style={css('font-size:13px;color:#c9b7ac;font-weight:500;')}>
              62% full · 93 guests still expected · 34 walk-ins tonight
            </div>
          </div>

          <div style={css(GLASS)}>
            <h3 style={css('margin:0 0 16px;font-size:16px;font-weight:700;')}>Check-in list</h3>
            <div
              style={css(
                'display:flex;align-items:center;gap:10px;background:#0d0d0d;border:1px solid rgba(255,255,255,0.08);padding:12px 14px;border-radius:14px;color:#8a8a86;margin-bottom:16px;',
              )}
            >
              <Icon name="search" size={16} />
              <span style={css('font-size:14px;')}>Search name or scan ticket to check in</span>
            </div>
            <div style={css('display:flex;flex-direction:column;gap:8px;')}>
              {DOOR_GUESTS.map((g, i) => {
                const done = checkedIn[g.name] ?? g.done;
                return (
                  <div
                    key={g.name}
                    className="vh-w08"
                    style={css(
                      'display:flex;align-items:center;gap:14px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);',
                    )}
                  >
                    <div style={css(gAvatar(pick(GRADS, i)))}>{initialsOf(g.name)}</div>
                    <div style={css('flex:1;')}>
                      <div style={css('font-size:14px;font-weight:600;')}>{g.name}</div>
                      <div style={css('font-size:12px;color:#8a8a86;')}>{g.tier}</div>
                    </div>
                    <button
                      type="button"
                      disabled={done}
                      onClick={() => {
                        setCheckedIn((prev) => ({ ...prev, [g.name]: true }));
                      }}
                      style={css(
                        done
                          ? 'display:inline-flex;align-items:center;gap:6px;background:rgba(110,231,155,0.12);border:1px solid rgba(110,231,155,0.3);color:#6ee79b;padding:8px 15px;border-radius:999px;font-size:13px;font-weight:700;cursor:default;'
                          : 'background:#ff5a1f;border:none;color:#0a0a0a;padding:8px 18px;border-radius:999px;font-size:13px;font-weight:700;cursor:pointer;',
                      )}
                    >
                      {done ? 'Checked in' : 'Check in'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* right */}
        <div style={css('display:flex;flex-direction:column;gap:20px;')}>
          <div style={css(GLASS)}>
            <div style={css('display:flex;align-items:center;gap:9px;margin-bottom:18px;')}>
              <div
                style={css(
                  'width:34px;height:34px;border-radius:11px;background:rgba(255,90,31,0.14);color:#ff8a55;display:flex;align-items:center;justify-content:center;',
                )}
              >
                <Icon name="user-plus" size={17} />
              </div>
              <h3 style={css('margin:0;font-size:16px;font-weight:700;')}>Add a walk-in</h3>
            </div>
            <div style={css('display:flex;flex-direction:column;gap:14px;')}>
              <input aria-label="Guest name" placeholder="Guest name" style={css(inputStyle)} />
              <input aria-label="Phone number" placeholder="Phone number" style={css(inputStyle)} />
              <div style={css('display:flex;gap:8px;')}>
                {PAY_TYPES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPayType(p);
                    }}
                    style={css(payChip(payType === p))}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <input
                aria-label="Amount collected"
                placeholder="Amount collected (₹)"
                style={css(inputStyle)}
              />
              <button
                type="button"
                className="vh-accent"
                style={css(
                  'display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#ff5a1f;color:#0a0a0a;border:none;padding:15px;border-radius:999px;font-size:15px;font-weight:800;cursor:pointer;margin-top:2px;',
                )}
              >
                <Icon name="check" size={16} /> Check in walk-in
              </button>
            </div>
          </div>

          <div style={css(GLASS)}>
            <h3 style={css('margin:0 0 16px;font-size:16px;font-weight:700;')}>
              Tonight&apos;s log
            </h3>
            <div style={css('display:flex;gap:10px;margin-bottom:16px;')}>
              <button
                type="button"
                className="vh-w08"
                style={css(
                  'flex:1;display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#f5f5f3;padding:12px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;',
                )}
              >
                <Icon name="clipboard-list" size={15} /> Incident
              </button>
              <button
                type="button"
                className="vh-w08"
                style={css(
                  'flex:1;display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#f5f5f3;padding:12px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;',
                )}
              >
                <Icon name="sticky-note" size={15} /> Note
              </button>
            </div>
            <div style={css('display:flex;flex-direction:column;gap:10px;')}>
              {DOOR_LOG.map((l) => (
                <div
                  key={l.text}
                  style={css(
                    'display:flex;gap:12px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);',
                  )}
                >
                  <div
                    style={css(
                      l.type === 'incident'
                        ? 'width:28px;height:28px;border-radius:8px;flex:none;display:flex;align-items:center;justify-content:center;background:rgba(240,133,122,0.14);color:#f0857a;'
                        : 'width:28px;height:28px;border-radius:8px;flex:none;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.07);color:#b5b5b0;',
                    )}
                  >
                    <Icon name={l.icon} size={14} />
                  </div>
                  <div style={css('flex:1;')}>
                    <div style={css('font-size:13px;font-weight:600;')}>{l.text}</div>
                    <div style={css('font-size:11px;color:#6a6a66;margin-top:2px;')}>{l.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
