'use client';

import { useRef } from 'react';

import { calCells, css } from '../charts';
import {
  AUG_DAY_NAMES,
  AUG_STATUS,
  CAL_LEGEND,
  EVENTS,
  GENRE_CHIPS,
  GRADS,
  PARTNER_DATA,
  TABLE_DEFS,
  TIER_DEFS,
  WEEKDAYS,
  glassCard,
  inputStyle,
  labelStyle,
  pick,
} from '../data';
import { Icon } from '../Icon';
import { useVenueStudio } from '../store';

const CARD_GRADS = EVENTS.map((e) => e.card);

export function CreateEventScreen() {
  const s = useVenueStudio();

  const augLabel =
    s.dDay !== null ? `${AUG_DAY_NAMES[(5 + s.dDay) % 7] ?? ''}, Aug ${String(s.dDay)}` : null;

  const nextLabel =
    s.createStep === 3 ? (s.editMode ? 'Save changes' : 'Publish event') : 'Continue';
  const nextIcon = s.createStep === 3 ? (s.editMode ? 'check' : 'party-popper') : 'arrow-right';

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          s.go('events');
        }}
        className="vh-text"
        style={css(
          'display:flex;align-items:center;gap:7px;background:none;border:none;color:#8a8a86;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:16px;padding:0;',
        )}
      >
        <Icon name="arrow-left" size={16} /> Cancel
      </button>

      <div
        style={css(
          'display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:22px;',
        )}
      >
        <h1 style={css('margin:0;font-size:30px;font-weight:800;letter-spacing:-0.02em;')}>
          {s.editMode ? 'Edit event' : 'Create event'}
        </h1>
        <div
          style={css(
            'display:flex;gap:6px;background:rgba(20,20,20,0.6);border:1px solid rgba(255,255,255,0.07);backdrop-filter:blur(18px);padding:6px;border-radius:999px;',
          )}
        >
          {(
            [
              [1, 'Basics'],
              [2, 'Where & tickets'],
              [3, 'Review'],
            ] as const
          ).map(([n, label]) => {
            const active = s.createStep === n;
            const done = s.createStep > n;
            return (
              <div
                key={n}
                style={css(
                  `display:inline-flex;align-items:center;gap:9px;padding:9px 18px;border-radius:999px;font-size:14px;font-weight:600;` +
                    (active
                      ? 'background:#ff5a1f;color:#0a0a0a;'
                      : 'background:transparent;color:#8a8a86;'),
                )}
              >
                <span
                  style={css(
                    `width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex:none;` +
                      (active
                        ? 'background:rgba(10,10,10,0.22);color:#0a0a0a;'
                        : done
                          ? 'background:#6ee79b;color:#0a0a0a;'
                          : 'background:rgba(255,255,255,0.08);color:#8a8a86;'),
                  )}
                >
                  {done ? '✓' : n}
                </span>
                {label}
              </div>
            );
          })}
        </div>
      </div>

      <div style={css('display:grid;grid-template-columns:1fr 400px;gap:28px;align-items:start;')}>
        <div style={css('display:flex;flex-direction:column;gap:20px;')}>
          {s.createStep === 1 ? <StepBasics /> : null}
          {s.createStep === 2 ? <StepVenueTickets /> : null}
          {s.createStep === 3 ? <StepReview augLabel={augLabel} /> : null}

          <div style={css('display:flex;gap:12px;')}>
            {s.createStep > 1 ? (
              <button
                type="button"
                onClick={() => {
                  s.setCreateStep(Math.max(1, s.createStep - 1));
                }}
                className="vh-1c"
                style={css(
                  'background:rgba(20,20,20,0.7);border:1px solid rgba(255,255,255,0.1);color:#f5f5f3;padding:15px 26px;border-radius:999px;font-size:15px;font-weight:600;cursor:pointer;backdrop-filter:blur(10px);',
                )}
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (s.createStep < 3) s.setCreateStep(s.createStep + 1);
                else s.go('events');
              }}
              className="vh-accent"
              style={css(
                'display:inline-flex;align-items:center;justify-content:center;gap:9px;flex:1;background:#ff5a1f;color:#0a0a0a;border:none;padding:15px;border-radius:999px;font-size:15px;font-weight:800;cursor:pointer;',
              )}
            >
              <Icon name={nextIcon} size={17} /> {nextLabel}
            </button>
          </div>
        </div>

        <LivePreview augLabel={augLabel} />
      </div>

      <PreviewFrames />
    </div>
  );
}

// ── step 1 ──────────────────────────────────────────────────────────────────

function StepBasics() {
  const s = useVenueStudio();
  const fileRef = useRef<HTMLInputElement>(null);

  const sectionLabel = css(
    'font-size:12px;font-weight:700;color:#6a6a66;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:14px;',
  );

  return (
    <div style={css('display:flex;flex-direction:column;gap:20px;')}>
      <div style={css(glassCard)}>
        <div style={sectionLabel}>Poster</div>
        <div style={css('display:flex;gap:18px;align-items:flex-start;')}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              ...css(
                'width:160px;height:200px;border-radius:16px;flex:none;border:1.5px dashed rgba(255,255,255,0.28);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;font-size:12px;font-weight:600;text-align:center;padding:16px;',
              ),
              background: pick(CARD_GRADS, s.dGrad),
            }}
          >
            <Icon name="image" size={22} color="#fff" />
            <span style={{ color: '#fff' }}>Drop event poster (4:5)</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} />
          <div style={css('flex:1;padding-top:4px;')}>
            <div style={css('font-size:13px;color:#c9c9c6;font-weight:600;margin-bottom:6px;')}>
              Drag &amp; drop or click to upload
            </div>
            <div style={css('font-size:12.5px;color:#8a8a86;line-height:1.5;margin-bottom:14px;')}>
              Used as the blurred background wherever this event appears — gallery, event page, and
              Overview.
            </div>
            <div style={css('display:flex;gap:8px;flex-wrap:wrap;')}>
              {CARD_GRADS.map((g, i) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    s.setDGrad(i);
                  }}
                  aria-label={`Poster style ${String(i + 1)}`}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: g,
                    border: `2px solid ${s.dGrad === i ? '#fff' : 'transparent'}`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={css(glassCard)}>
        <div style={sectionLabel}>The basics</div>
        <div style={css('display:flex;flex-direction:column;gap:16px;')}>
          <div>
            <label htmlFor="ev-name" style={css(labelStyle)}>
              Event name
            </label>
            <input
              id="ev-name"
              value={s.dName}
              onChange={(e) => {
                s.setDName(e.target.value);
              }}
              placeholder="e.g. Neon Nights: Afrobeats Edition"
              style={css(inputStyle)}
            />
          </div>

          <div style={css('display:flex;gap:14px;')}>
            <div style={css('flex:1;')}>
              <label htmlFor="ev-date" style={css(labelStyle)}>
                Date {s.editMode ? <Icon name="lock" size={11} /> : null}
              </label>
              <input
                id="ev-date"
                defaultValue="Sat, Aug 30 2026"
                disabled={s.editMode}
                title={s.editMode ? "Date and time can't be changed after publishing." : undefined}
                style={css(
                  s.editMode
                    ? 'width:100%;background:#0a0a0a;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:13px 14px;color:#6a6a66;font-size:14px;font-weight:500;cursor:not-allowed;'
                    : inputStyle,
                )}
              />
            </div>
            <div style={css('flex:1;')}>
              <label htmlFor="ev-time" style={css(labelStyle)}>
                Start time {s.editMode ? <Icon name="lock" size={11} /> : null}
              </label>
              <input
                id="ev-time"
                defaultValue="9:00 PM"
                disabled={s.editMode}
                style={css(
                  s.editMode
                    ? 'width:100%;background:#0a0a0a;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:13px 14px;color:#6a6a66;font-size:14px;font-weight:500;cursor:not-allowed;'
                    : inputStyle,
                )}
              />
            </div>
          </div>

          {s.editMode ? (
            <div style={css('font-size:12px;color:#8a8a86;font-style:italic;')}>
              Date and time can&apos;t be changed after publishing.
            </div>
          ) : null}

          <div>
            <span style={css(labelStyle)}>Genre / vibe</span>
            <div style={css('display:flex;gap:8px;flex-wrap:wrap;')}>
              {GENRE_CHIPS.map(([label, on]) => (
                <span
                  key={label}
                  style={css(
                    'padding:8px 14px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;' +
                      (on
                        ? 'background:rgba(255,90,31,0.14);border:1px solid rgba(255,90,31,0.35);color:#ff8a55;'
                        : 'background:#0d0d0d;border:1px solid rgba(255,255,255,0.08);color:#8a8a86;'),
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="ev-artist" style={css(labelStyle)}>
              Mentioned artists
            </label>
            <div style={css('display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;')}>
              {s.dArtists.map((name, i) => (
                <span
                  key={`${name}-${String(i)}`}
                  style={css(
                    'display:inline-flex;align-items:center;gap:7px;background:#0d0d0d;border:1px solid rgba(255,255,255,0.1);padding:5px 6px;border-radius:999px;font-size:13px;font-weight:600;',
                  )}
                >
                  <span
                    style={css(
                      'width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#ff5a1f,#c23d10);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;',
                    )}
                  >
                    {name.slice(0, 2).toUpperCase()}
                  </span>
                  {name}
                  <button
                    type="button"
                    aria-label={`Remove ${name}`}
                    onClick={() => {
                      s.setDArtists(s.dArtists.filter((_, j) => j !== i));
                    }}
                    style={css(
                      'background:none;border:none;padding:0;cursor:pointer;color:#8a8a86;margin-right:2px;display:flex;',
                    )}
                  >
                    <Icon name="x" size={13} />
                  </button>
                </span>
              ))}
            </div>
            <input
              id="ev-artist"
              value={s.dArtistInput}
              onChange={(e) => {
                s.setDArtistInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && s.dArtistInput.trim()) {
                  e.preventDefault();
                  s.setDArtists([...s.dArtists, s.dArtistInput.trim()]);
                  s.setDArtistInput('');
                }
              }}
              placeholder="Search or type an artist name, press Enter"
              style={css(inputStyle)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── step 2 ──────────────────────────────────────────────────────────────────

function StepVenueTickets() {
  const s = useVenueStudio();

  const sectionLabel = css(
    'font-size:12px;font-weight:700;color:#6a6a66;text-transform:uppercase;letter-spacing:0.08em;',
  );

  const cells = calCells({
    days: 31,
    offset: 6,
    statusMap: AUG_STATUS,
    selected: s.dDay,
    cellH: 48,
  });

  const venueName = PARTNER_DATA.venues[s.dVenue]?.name ?? 'Skyline Rooftop';
  const augLabel =
    s.dDay !== null ? `${AUG_DAY_NAMES[(5 + s.dDay) % 7] ?? ''}, Aug ${String(s.dDay)}` : null;

  const tiers = TIER_DEFS.map(([name, price, qty]) => ({
    name,
    price: price.toLocaleString('en-IN'),
    qty: String(qty),
    total: `₹${(price * qty).toLocaleString('en-IN')}`,
  }));
  const soldOut = TIER_DEFS.reduce((acc, [, price, qty]) => acc + price * qty, 0);

  const selectedPromoters = PARTNER_DATA.promoters.filter((p) => s.caPromoters[p.name]).length;
  const allPromotersOn = selectedPromoters === PARTNER_DATA.promoters.length;
  const selectedTables = TABLE_DEFS.filter(([n]) => s.caTables[n]).length;

  return (
    <div style={css('display:flex;flex-direction:column;gap:20px;')}>
      {/* venue picker */}
      <div style={css(glassCard)}>
        <div style={{ ...sectionLabel, marginBottom: 14 }}>Pick a venue</div>
        <div style={css('display:flex;gap:14px;overflow-x:auto;padding-bottom:6px;')}>
          {PARTNER_DATA.venues.slice(0, 4).map((v, i) => (
            <button
              key={v.name}
              type="button"
              onClick={() => {
                s.setDVenue(i);
              }}
              style={css(
                `flex:none;width:180px;border-radius:16px;overflow:hidden;cursor:pointer;background:#0d0d0d;padding:0;text-align:left;color:inherit;border:1px solid ${s.dVenue === i ? '#ff5a1f' : 'rgba(255,255,255,0.08)'};`,
              )}
            >
              <div
                style={css(`height:88px;background:${pick(GRADS, i).replace('135deg', '120deg')};`)}
              />
              <div style={css('padding:12px 14px;')}>
                <div style={css('font-size:14px;font-weight:700;')}>{v.name}</div>
                <div style={css('font-size:12px;color:#8a8a86;font-weight:500;margin-top:2px;')}>
                  {v.role}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* availability calendar */}
      <div style={css(glassCard)}>
        <div
          style={css(
            'display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;',
          )}
        >
          <div>
            <div style={{ ...sectionLabel, marginBottom: 6 }}>Pick a date</div>
            <div style={css('font-size:13px;color:#8a8a86;font-weight:500;')}>
              {venueName}’s open nights — grey dates are already taken.
            </div>
          </div>
          <div style={css('display:flex;align-items:center;gap:8px;')}>
            <button
              type="button"
              aria-label="Previous month"
              style={css(
                'width:32px;height:32px;border-radius:999px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#c9c9c6;cursor:pointer;display:flex;align-items:center;justify-content:center;',
              )}
            >
              <Icon name="chevron-left" size={15} />
            </button>
            <span
              style={css(
                'font-size:14px;font-weight:800;letter-spacing:0.02em;min-width:112px;text-align:center;',
              )}
            >
              AUGUST 2026
            </span>
            <button
              type="button"
              aria-label="Next month"
              style={css(
                'width:32px;height:32px;border-radius:999px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#c9c9c6;cursor:pointer;display:flex;align-items:center;justify-content:center;',
              )}
            >
              <Icon name="chevron-right" size={15} />
            </button>
          </div>
        </div>

        <div
          style={css('display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:8px;')}
        >
          {WEEKDAYS.map((w, i) => (
            <div
              key={`${w}-${String(i)}`}
              style={css('text-align:center;font-size:11px;color:#6a6a66;font-weight:800;')}
            >
              {w}
            </div>
          ))}
        </div>
        <div style={css('display:grid;grid-template-columns:repeat(7,1fr);gap:6px;')}>
          {cells.map((c, i) =>
            c.empty ? (
              <div key={`e-${String(i)}`} style={css(c.style)} />
            ) : (
              <button
                key={c.day}
                type="button"
                onClick={() => {
                  if (!AUG_STATUS[c.day]) s.setDDay(c.day);
                }}
                style={{ ...css(c.style), border: css(c.style).border ?? 'none' }}
              >
                {c.label}
                <span style={css(c.dotStyle)} />
              </button>
            ),
          )}
        </div>

        <div
          style={css(
            'margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;',
          )}
        >
          <div style={css('display:flex;align-items:center;gap:18px;')}>
            {CAL_LEGEND.map((l) => (
              <div key={l.label} style={css('display:flex;align-items:center;gap:7px;')}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                <span style={css('font-size:12px;font-weight:600;color:#8a8a86;')}>{l.label}</span>
              </div>
            ))}
          </div>
          <span
            style={css(
              s.dDay !== null
                ? 'display:inline-flex;align-items:center;gap:6px;background:rgba(110,231,155,0.14);border:1px solid rgba(110,231,155,0.3);color:#6ee79b;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:700;'
                : 'display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#8a8a86;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:600;',
            )}
          >
            {augLabel ? `${augLabel} selected` : 'No date picked yet'}
          </span>
        </div>
      </div>

      {/* ticket tiers */}
      <div style={css(glassCard)}>
        <div
          style={css(
            'display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;',
          )}
        >
          <div style={sectionLabel}>Ticket tiers</div>
          <span style={css('font-size:13px;font-weight:700;color:#6ee79b;')}>
            ₹{soldOut.toLocaleString('en-IN')} if sold out
          </span>
        </div>
        <div style={css('display:flex;flex-direction:column;gap:12px;')}>
          {tiers.map((t) => (
            <div
              key={t.name}
              style={css(
                'display:flex;align-items:center;gap:12px;background:#0d0d0d;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 14px;',
              )}
            >
              <input
                defaultValue={t.name}
                aria-label="Tier name"
                style={css(
                  'flex:1;background:transparent;border:none;color:#f5f5f3;font-size:14px;font-weight:600;',
                )}
              />
              <div style={css('display:flex;align-items:center;gap:6px;width:120px;')}>
                <span style={css('color:#8a8a86;font-size:13px;')}>₹</span>
                <input
                  defaultValue={t.price}
                  aria-label="Tier price"
                  style={css(
                    'width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:9px;padding:8px 10px;color:#f5f5f3;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;',
                  )}
                />
              </div>
              <div style={css('display:flex;align-items:center;gap:6px;width:100px;')}>
                <span style={css('color:#8a8a86;font-size:13px;')}>×</span>
                <input
                  defaultValue={t.qty}
                  aria-label="Tier quantity"
                  style={css(
                    'width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:9px;padding:8px 10px;color:#f5f5f3;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;',
                  )}
                />
              </div>
              <div
                style={css(
                  'width:110px;text-align:right;font-size:13px;font-weight:700;color:#6ee79b;font-variant-numeric:tabular-nums;',
                )}
              >
                {t.total}
              </div>
            </div>
          ))}
          <button
            type="button"
            style={css(
              'align-self:flex-start;display:inline-flex;align-items:center;gap:6px;background:rgba(255,90,31,0.1);border:1px solid rgba(255,90,31,0.28);color:#ff8a55;padding:9px 14px;border-radius:999px;font-size:13px;font-weight:700;cursor:pointer;',
            )}
          >
            <Icon name="plus" size={14} /> Add tier
          </button>
        </div>
      </div>

      {/* advanced setup */}
      <details style={css(glassCard)}>
        <summary
          style={css(
            'display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;font-weight:700;list-style:none;',
          )}
        >
          <Icon name="sliders-horizontal" size={16} color="#ff8a55" /> Advanced setup
          {selectedPromoters > 0 ? (
            <span
              style={css(
                'font-size:11px;font-weight:700;background:rgba(255,90,31,0.14);color:#ff8a55;padding:3px 9px;border-radius:999px;',
              )}
            >
              {selectedPromoters} selected
            </span>
          ) : null}
          <span style={css('font-size:12px;color:#8a8a86;font-weight:500;margin-left:auto;')}>
            Promoters, tables &amp; promo codes
          </span>
        </summary>

        <div
          style={css(
            'margin-top:18px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;gap:22px;',
          )}
        >
          {/* promoters */}
          <div>
            <div
              style={css(
                'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;',
              )}
            >
              <div style={sectionLabel}>Promoters</div>
              <button
                type="button"
                onClick={() => {
                  const next: Record<string, boolean> = {};
                  PARTNER_DATA.promoters.forEach((p) => {
                    next[p.name] = !allPromotersOn;
                  });
                  s.setCaPromoters(next);
                }}
                style={css(
                  'display:flex;align-items:center;gap:7px;font-size:12.5px;color:#8a8a86;font-weight:600;cursor:pointer;background:none;border:none;padding:0;',
                )}
              >
                <Icon name={allPromotersOn ? 'square-check' : 'square'} size={15} color="#ff8a55" />
                Select all
              </button>
            </div>
            <div style={css('display:flex;flex-direction:column;gap:8px;')}>
              {PARTNER_DATA.promoters.map((p) => {
                const on = Boolean(s.caPromoters[p.name]);
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      s.setCaPromoters({ ...s.caPromoters, [p.name]: !on });
                    }}
                    style={css(
                      'display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;cursor:pointer;background:#0d0d0d;border:1px solid rgba(255,255,255,0.06);color:inherit;width:100%;text-align:left;',
                    )}
                  >
                    <Icon name={on ? 'square-check' : 'square'} size={17} color="#ff8a55" />
                    <span style={css('flex:1;font-size:13.5px;font-weight:600;')}>{p.name}</span>
                    <span style={css('font-size:12px;color:#6a6a66;')}>{p.role}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* tables */}
          <div>
            <div
              style={css(
                'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;',
              )}
            >
              <div style={sectionLabel}>Tables</div>
              {selectedTables > 0 ? (
                <span
                  style={css(
                    'font-size:11px;font-weight:700;background:rgba(255,90,31,0.14);color:#ff8a55;padding:3px 9px;border-radius:999px;',
                  )}
                >
                  {selectedTables} selected
                </span>
              ) : null}
            </div>
            <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:10px;')}>
              {TABLE_DEFS.map(([name, cap]) => {
                const on = Boolean(s.caTables[name]);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      s.setCaTables({ ...s.caTables, [name]: !on });
                    }}
                    style={css(
                      `border-radius:14px;padding:12px 14px;cursor:pointer;text-align:left;color:inherit;background:${on ? 'rgba(255,90,31,0.12)' : '#0d0d0d'};border:1px solid ${on ? 'rgba(255,90,31,0.35)' : 'rgba(255,255,255,0.08)'};`,
                    )}
                  >
                    <div style={css('font-size:13.5px;font-weight:700;')}>{name}</div>
                    <div style={css('font-size:12px;color:#8a8a86;margin-top:2px;')}>
                      {cap} seats
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* promo codes */}
          <div>
            <div
              style={css(
                'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;',
              )}
            >
              <div style={sectionLabel}>Promo codes</div>
              {s.caPromoCodes.length > 0 ? (
                <span
                  style={css(
                    'font-size:11px;font-weight:700;background:rgba(255,90,31,0.14);color:#ff8a55;padding:3px 9px;border-radius:999px;',
                  )}
                >
                  {s.caPromoCodes.length} active
                </span>
              ) : null}
            </div>
            <div style={css('display:flex;flex-direction:column;gap:10px;')}>
              {s.caPromoCodes.map((pc, i) => (
                <div
                  key={`${pc.code}-${String(i)}`}
                  style={css(
                    'display:flex;align-items:center;gap:10px;background:#0d0d0d;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px 12px;',
                  )}
                >
                  <input
                    value={pc.code}
                    aria-label="Promo code"
                    onChange={(e) => {
                      s.setCaPromoCodes(
                        s.caPromoCodes.map((p, j) =>
                          j === i ? { ...p, code: e.target.value } : p,
                        ),
                      );
                    }}
                    placeholder="CODE"
                    style={css(
                      'flex:1;background:transparent;border:none;color:#f5f5f3;font-size:13.5px;font-weight:700;text-transform:uppercase;',
                    )}
                  />
                  <span style={css('font-size:12px;color:#8a8a86;')}>{pc.type}</span>
                  <input
                    value={pc.limit}
                    aria-label="Usage limit"
                    onChange={(e) => {
                      s.setCaPromoCodes(
                        s.caPromoCodes.map((p, j) =>
                          j === i ? { ...p, limit: e.target.value } : p,
                        ),
                      );
                    }}
                    placeholder="Uses"
                    style={css(
                      'width:70px;background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:6px 9px;color:#f5f5f3;font-size:12.5px;',
                    )}
                  />
                  <button
                    type="button"
                    aria-label="Remove code"
                    onClick={() => {
                      s.setCaPromoCodes(s.caPromoCodes.filter((_, j) => j !== i));
                    }}
                    style={css(
                      'background:none;border:none;padding:0;cursor:pointer;color:#8a8a86;display:flex;',
                    )}
                  >
                    <Icon name="x" size={15} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  s.setCaPromoCodes([...s.caPromoCodes, { code: '', type: '%', limit: '' }]);
                }}
                style={css(
                  'align-self:flex-start;display:inline-flex;align-items:center;gap:6px;background:rgba(255,90,31,0.1);border:1px solid rgba(255,90,31,0.28);color:#ff8a55;padding:8px 13px;border-radius:999px;font-size:12.5px;font-weight:700;cursor:pointer;',
                )}
              >
                <Icon name="plus" size={13} /> Add code
              </button>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}

// ── step 3 ──────────────────────────────────────────────────────────────────

function StepReview({ augLabel }: { readonly augLabel: string | null }) {
  const s = useVenueStudio();

  const soldOut = TIER_DEFS.reduce((acc, [, price, qty]) => acc + price * qty, 0);
  const rows = [
    { label: 'Event name', value: s.dName || 'Untitled event' },
    { label: 'Date & time', value: `${augLabel ?? 'Sat, Aug 30'} · 9:00 PM` },
    { label: 'Venue', value: PARTNER_DATA.venues[s.dVenue]?.name ?? 'Skyline Rooftop' },
    { label: 'Ticket tiers', value: '3 tiers · 400 total' },
    { label: 'Revenue if sold out', value: `₹${soldOut.toLocaleString('en-IN')}` },
  ];

  return (
    <div style={css(glassCard)}>
      <div
        style={css(
          'font-size:12px;font-weight:700;color:#6a6a66;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:18px;',
        )}
      >
        Review &amp; publish
      </div>
      <div style={css('display:flex;flex-direction:column;gap:2px;')}>
        {rows.map((r) => (
          <div
            key={r.label}
            style={css(
              'display:flex;align-items:center;justify-content:space-between;padding:14px 4px;border-bottom:1px solid rgba(255,255,255,0.05);',
            )}
          >
            <span style={css('font-size:13px;color:#8a8a86;font-weight:600;')}>{r.label}</span>
            <span style={css('font-size:14px;font-weight:700;')}>{r.value}</span>
          </div>
        ))}
      </div>
      <div
        style={css(
          'display:flex;align-items:center;gap:12px;background:rgba(110,231,155,0.08);border:1px solid rgba(110,231,155,0.22);border-radius:14px;padding:14px 16px;margin-top:18px;',
        )}
      >
        <Icon name="party-popper" size={18} color="#6ee79b" />
        <span style={css('font-size:13px;font-weight:600;color:#a9e9c2;')}>
          Everything looks good. Guests will see the poster preview exactly as shown.
        </span>
      </div>
    </div>
  );
}

// ── live preview ────────────────────────────────────────────────────────────

function LivePreview({ augLabel }: { readonly augLabel: string | null }) {
  const s = useVenueStudio();

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
          Live preview · what guests see
        </span>
      </div>
      <button
        type="button"
        onClick={() => {
          s.setPreviewFrame('pick');
        }}
        style={css(
          'position:relative;border-radius:32px;overflow:hidden;aspect-ratio:4/5;width:100%;padding:0;border:1px solid rgba(255,255,255,0.1);box-shadow:0 30px 70px rgba(0,0,0,0.5);cursor:pointer;background:none;',
        )}
      >
        <div style={css(`position:absolute;inset:0;background:${pick(CARD_GRADS, s.dGrad)};`)} />
        <div
          style={css(
            'position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.85) 5%,rgba(0,0,0,0.3) 42%,transparent 66%);',
          )}
        />
        <div style={css('position:absolute;top:18px;left:18px;')}>
          <span
            style={css(
              'display:inline-flex;align-items:center;gap:6px;background:rgba(0,0,0,0.42);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.16);color:#fff;padding:6px 12px;border-radius:999px;font-size:11px;font-weight:700;',
            )}
          >
            <span style={css('width:6px;height:6px;border-radius:50%;background:#ffb020;')} />
            Draft
          </span>
        </div>
        <div style={css('position:absolute;left:22px;right:22px;bottom:22px;text-align:left;')}>
          <div
            style={css(
              'font-size:30px;font-weight:800;color:#fff;letter-spacing:-0.01em;margin-bottom:4px;font-variant-numeric:tabular-nums;',
            )}
          >
            ₹1,500
          </div>
          <div
            style={css(
              'font-size:20px;font-weight:800;color:#fff;line-height:1.15;margin-bottom:5px;',
            )}
          >
            {s.dName || 'Your event name'}
          </div>
          <div
            style={css(
              'font-size:13px;font-weight:500;color:rgba(255,255,255,0.66);margin-bottom:18px;',
            )}
          >
            {PARTNER_DATA.venues[s.dVenue]?.name ?? 'Skyline Rooftop'} · {augLabel ?? 'Aug 30'}
          </div>
          <div
            style={css(
              'width:100%;text-align:center;background:rgba(255,255,255,0.14);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.22);color:#fff;padding:14px;border-radius:999px;font-size:14px;font-weight:700;',
            )}
          >
            Buy tickets
          </div>
        </div>
      </button>
    </div>
  );
}

// ── preview frames ──────────────────────────────────────────────────────────

function PreviewFrames() {
  const s = useVenueStudio();
  if (!s.previewFrame) return null;

  const backBtn = (
    <button
      type="button"
      onClick={() => {
        s.setPreviewFrame(null);
      }}
      style={css(
        'display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);color:#f5f5f3;padding:11px 20px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;',
      )}
    >
      <Icon name="arrow-left" size={14} /> Back to editing
    </button>
  );

  if (s.previewFrame === 'pick') {
    return (
      <div
        role="presentation"
        onClick={() => {
          s.setPreviewFrame(null);
        }}
        style={css(
          'position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:100;display:flex;align-items:center;justify-content:center;',
        )}
      >
        <div
          role="presentation"
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={css(
            'display:flex;gap:8px;background:rgba(30,30,30,0.85);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.16);padding:8px;border-radius:999px;box-shadow:0 30px 70px rgba(0,0,0,0.5);',
          )}
        >
          <button
            type="button"
            onClick={() => {
              s.setPreviewFrame('guest');
            }}
            className="vh-w10"
            style={css(
              'display:flex;align-items:center;gap:9px;background:transparent;border:none;color:#f5f5f3;padding:13px 22px;border-radius:999px;font-size:14px;font-weight:700;cursor:pointer;',
            )}
          >
            <Icon name="globe" size={16} /> Guest portal
          </button>
          <button
            type="button"
            onClick={() => {
              s.setPreviewFrame('mobile');
            }}
            className="vh-w10"
            style={css(
              'display:flex;align-items:center;gap:9px;background:transparent;border:none;color:#f5f5f3;padding:13px 22px;border-radius:999px;font-size:14px;font-weight:700;cursor:pointer;',
            )}
          >
            <Icon name="smartphone" size={16} /> Mobile app
          </button>
        </div>
      </div>
    );
  }

  if (s.previewFrame === 'guest') {
    return (
      <div
        style={css(
          'position:fixed;inset:0;background:rgba(0,0,0,0.86);z-index:100;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;',
        )}
      >
        <div
          style={css(
            'width:900px;height:600px;background:#141414;border:1px solid rgba(255,255,255,0.1);border-radius:16px;overflow:hidden;box-shadow:0 40px 90px rgba(0,0,0,0.6);display:flex;flex-direction:column;',
          )}
        >
          <div
            style={css(
              'height:40px;background:#1c1c1c;display:flex;align-items:center;gap:8px;padding:0 14px;border-bottom:1px solid rgba(255,255,255,0.06);',
            )}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={css('width:11px;height:11px;border-radius:50%;background:#3a3a3a;')}
              />
            ))}
          </div>
          <div
            style={css(
              'flex:1;display:flex;align-items:center;justify-content:center;color:#6a6a66;font-size:16px;font-weight:600;',
            )}
          >
            This is how it will look in the guest portal
          </div>
        </div>
        {backBtn}
      </div>
    );
  }

  return (
    <div
      style={css(
        'position:fixed;inset:0;background:rgba(0,0,0,0.86);z-index:100;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;',
      )}
    >
      <div
        style={css(
          'position:relative;width:330px;height:640px;background:#000;border-radius:48px;padding:10px;box-shadow:0 40px 90px rgba(0,0,0,0.6);border:2px solid #26262a;',
        )}
      >
        <div
          style={css(
            'position:absolute;top:10px;left:50%;transform:translateX(-50%);width:96px;height:26px;background:#000;border-radius:999px;z-index:5;',
          )}
        />
        <div
          style={css(
            'width:100%;height:100%;border-radius:40px;background:#141414;display:flex;align-items:center;justify-content:center;text-align:center;padding:30px;color:#6a6a66;font-size:15px;font-weight:600;',
          )}
        >
          This is how it will look in the mobile app
        </div>
      </div>
      {backBtn}
    </div>
  );
}
