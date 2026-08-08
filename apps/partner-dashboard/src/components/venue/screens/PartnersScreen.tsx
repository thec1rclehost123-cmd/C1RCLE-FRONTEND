'use client';

import { css } from '../charts';
import {
  DISCOVER_DATA,
  PARTNER_DATA,
  PERM_DEFS,
  POSTER_GRADS,
  PROMO_REQUESTS,
  STAFF_PERMS,
  STATUS_COLORS,
  glassPillBtn,
  initialsOf,
  partnerStatusGlass,
  permChip,
  pick,
  segBtn,
  subTab,
} from '../data';
import { useVenueStudio } from '../store';

import type { PartnerCard } from '../data';
import type { AudienceSeg } from '../store';

const SEGMENTS: readonly (readonly [AudienceSeg, string])[] = [
  ['venues', 'Venues'],
  ['promoters', 'Promoters'],
  ['staff', 'Staff'],
];

export function PartnersScreen() {
  const s = useVenueStudio();

  let cards: readonly PartnerCard[];
  if (s.audienceSeg === 'venues') {
    cards = s.venueTab === 'discover' ? DISCOVER_DATA.venues : PARTNER_DATA.venues;
  } else if (s.audienceSeg === 'promoters') {
    cards =
      s.promoTab === 'discover'
        ? DISCOVER_DATA.promoters
        : s.promoTab === 'requests'
          ? PROMO_REQUESTS
          : PARTNER_DATA.promoters;
  } else {
    cards = PARTNER_DATA.staff;
  }

  return (
    <div>
      <div style={css('margin-bottom:22px;')}>
        <h1 style={css('margin:0;font-size:30px;font-weight:800;letter-spacing:-0.02em;')}>
          Partners
        </h1>
        <div style={css('font-size:14px;color:#8a8a86;font-weight:500;margin-top:6px;')}>
          The venues, promoters &amp; staff you run nights with.
        </div>
      </div>

      <div style={css('display:flex;gap:8px;margin-bottom:18px;')}>
        {SEGMENTS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              s.setAudienceSeg(id);
            }}
            style={css(segBtn(s.audienceSeg === id))}
          >
            {label}
          </button>
        ))}
      </div>

      {s.audienceSeg === 'venues' ? (
        <SubTabs
          tabs={[
            ['my', 'My Venues'],
            ['discover', 'Discover'],
          ]}
          active={s.venueTab}
          onSelect={(id) => {
            s.setVenueTab(id as 'my' | 'discover');
          }}
        />
      ) : null}

      {s.audienceSeg === 'promoters' ? (
        <SubTabs
          tabs={[
            ['my', 'My Promoters'],
            ['discover', 'Discover'],
            ['requests', 'Requests'],
          ]}
          active={s.promoTab}
          onSelect={(id) => {
            s.setPromoTab(id as 'my' | 'discover' | 'requests');
          }}
        />
      ) : null}

      <div style={css('display:grid;grid-template-columns:repeat(4,1fr);gap:20px;')}>
        {cards.map((c, i) => {
          const isStaff = s.audienceSeg === 'staff' && c.name !== 'Add teammate';
          const granted = STAFF_PERMS[c.name] ?? [];
          const statusColor = STATUS_COLORS[c.status] ?? '#8a8a86';

          return (
            <div
              key={c.name}
              style={css(
                'position:relative;border-radius:28px;overflow:hidden;aspect-ratio:4/5;border:1px solid rgba(255,255,255,0.08);box-shadow:0 20px 44px rgba(0,0,0,0.4);',
              )}
            >
              <div style={css(`position:absolute;inset:0;background:${pick(POSTER_GRADS, i)};`)} />
              <div
                style={css(
                  'position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.85) 4%,rgba(0,0,0,0.35) 40%,transparent 64%);',
                )}
              />
              <div
                style={css(
                  'position:absolute;top:16px;left:16px;right:16px;display:flex;justify-content:flex-end;',
                )}
              >
                {c.status ? (
                  <span style={css(partnerStatusGlass)}>
                    <span
                      style={css(
                        `width:7px;height:7px;border-radius:50%;background:${statusColor};box-shadow:0 0 8px ${statusColor};`,
                      )}
                    />
                    {c.status}
                  </span>
                ) : null}
              </div>
              <div style={css('position:absolute;left:18px;right:18px;bottom:18px;')}>
                <div
                  style={css(
                    'font-size:20px;font-weight:800;letter-spacing:-0.01em;color:#fff;line-height:1.12;margin-bottom:4px;',
                  )}
                >
                  {c.name}
                </div>
                <div
                  style={css(
                    'font-size:12.5px;font-weight:500;color:rgba(255,255,255,0.66);margin-bottom:12px;',
                  )}
                >
                  {c.role}
                </div>

                {isStaff ? (
                  <div style={css('display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;')}>
                    {PERM_DEFS.map((p) => (
                      <span key={p} style={css(permChip(granted.includes(p)))}>
                        {p}
                      </span>
                    ))}
                  </div>
                ) : null}

                <button type="button" className="vh-w16" style={css(glassPillBtn)}>
                  {c.action}
                </button>
              </div>
              {/* initials retained for a11y-free visual parity with the mockup avatars */}
              <span style={{ display: 'none' }}>{initialsOf(c.name)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SubTabs({
  tabs,
  active,
  onSelect,
}: {
  readonly tabs: readonly (readonly [string, string])[];
  readonly active: string;
  readonly onSelect: (id: string) => void;
}) {
  return (
    <div
      style={css(
        'display:flex;gap:4px;background:#141414;border:1px solid rgba(255,255,255,0.06);padding:4px;border-radius:13px;width:fit-content;margin-bottom:20px;',
      )}
    >
      {tabs.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => {
            onSelect(id);
          }}
          style={css(subTab(active === id))}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
