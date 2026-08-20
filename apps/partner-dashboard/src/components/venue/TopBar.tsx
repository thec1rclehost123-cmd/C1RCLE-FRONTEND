'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import { css } from './charts';
import {
  EVENTS,
  NAV_ITEMS,
  NOTIF_COLORS,
  NOTIF_DEFS,
  ORDERS,
  PARTNER_DATA,
  navBtn,
  notifIconWrap,
} from './data';
import { Icon } from './Icon';
import { useVenueStudio } from './store';

interface SearchResult {
  name: string;
  meta: string;
  icon: string;
  go: () => void;
}

export function TopBar({
  initials,
  venueName,
}: {
  readonly initials: string;
  readonly venueName: string;
}) {
  const s = useVenueStudio();
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { signOut } = useDashboardAuth();

  // ⌘K / Ctrl-K focuses global search, matching the shortcut hint in the field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const q = s.searchQuery.trim().toLowerCase();

  const allPartners = [...PARTNER_DATA.venues, ...PARTNER_DATA.promoters, ...PARTNER_DATA.staff];

  const eventResults: SearchResult[] = q
    ? EVENTS.filter((e) => e.name.toLowerCase().includes(q))
        .slice(0, 4)
        .map((e, i) => ({
          name: e.name,
          meta: e.metaShort,
          icon: 'ticket',
          go: () => {
            s.setSearchQuery('');
            s.setSearchFocus(false);
            s.setSelectedEventIdx(!EVENTS.includes(e) ? i : EVENTS.indexOf(e));
            s.go('eventDetail');
          },
        }))
    : [];

  const partnerResults: SearchResult[] = q
    ? allPartners
        .filter((p) => p.name.toLowerCase().includes(q))
        .slice(0, 4)
        .map((p) => ({
          name: p.name,
          meta: p.role,
          icon: 'users',
          go: () => {
            s.setSearchQuery('');
            s.setSearchFocus(false);
            s.go('audience');
          },
        }))
    : [];

  const orderResults: SearchResult[] = q
    ? ORDERS.filter((o) => o.name.toLowerCase().includes(q) || o.event.toLowerCase().includes(q))
        .slice(0, 4)
        .map((o) => ({
          name: o.name,
          meta: `${o.orderNo} · ${o.event}`,
          icon: 'receipt',
          go: () => {
            s.setSearchQuery('');
            s.setSearchFocus(false);
            s.goOrders();
          },
        }))
    : [];

  const groups = [
    { key: 'Events', items: eventResults },
    { key: 'Partners', items: partnerResults },
    { key: 'Orders', items: orderResults },
  ].filter((g) => g.items.length > 0);

  const totalResults = eventResults.length + partnerResults.length + orderResults.length;
  const showResults = s.searchFocus && q.length > 0;

  const notifications = NOTIF_DEFS.map((n, i) => {
    const [bg, col] = NOTIF_COLORS[n.type];
    return { ...n, iconWrap: notifIconWrap(bg, col), unread: i < 3 };
  });
  const unread = s.notifRead ? 0 : notifications.filter((n) => n.unread).length;

  return (
    <div
      style={css(
        'position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:20px;padding:14px 28px;background:rgba(0,0,0,0.72);backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,0.06);',
      )}
    >
      {/* brand */}
      <div style={css('display:flex;align-items:center;gap:12px;flex:none;')}>
        <div
          style={css(
            'width:34px;height:34px;border-radius:10px;background:#ff5a1f;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 18px rgba(255,90,31,0.4);',
          )}
        >
          <div
            style={css('width:15px;height:15px;border:2.5px solid #0a0a0a;border-radius:50%;')}
          />
        </div>
        <div style={css('display:flex;flex-direction:column;line-height:1;')}>
          <span style={css('font-weight:800;font-size:15px;letter-spacing:0.14em;')}>
            THE C1RCLE
          </span>
          <span
            style={css(
              'font-size:10.5px;color:#8a8a86;font-weight:500;letter-spacing:0.05em;margin-top:3px;',
            )}
          >
            Venue Studio
          </span>
        </div>
      </div>

      {/* nav */}
      <div style={css('flex:1;display:flex;justify-content:center;')}>
        <div
          style={css(
            'display:flex;gap:2px;background:#141414;border:1px solid rgba(255,255,255,0.06);padding:4px;border-radius:14px;',
          )}
        >
          {NAV_ITEMS.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                s.go(n.id);
              }}
              style={css(navBtn(s.screen === n.id))}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {/* right cluster */}
      <div style={css('display:flex;align-items:center;gap:12px;flex:none;')}>
        <div style={css('position:relative;width:260px;')}>
          <div
            style={css(
              'display:flex;align-items:center;gap:8px;background:#141414;border:1px solid rgba(255,255,255,0.06);padding:8px 12px;border-radius:11px;',
            )}
          >
            <Icon name="search" size={15} color="#8a8a86" />
            <input
              ref={searchRef}
              aria-label="Search events, partners, orders"
              value={s.searchQuery}
              onChange={(e) => {
                s.setSearchQuery(e.target.value);
              }}
              onFocus={() => {
                s.setSearchFocus(true);
              }}
              onBlur={() =>
                setTimeout(() => {
                  s.setSearchFocus(false);
                }, 180)
              }
              placeholder="Search events, partners, orders"
              style={css(
                'flex:1;min-width:0;background:transparent;border:none;outline:none;color:#f5f5f3;font-size:13px;',
              )}
            />
            <span
              style={css(
                'font-size:11px;color:#8a8a86;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);padding:2px 6px;border-radius:6px;flex:none;',
              )}
            >
              ⌘K
            </span>
          </div>

          {showResults && totalResults > 0 ? (
            <div
              style={css(
                'position:absolute;top:calc(100% + 8px);right:0;width:360px;background:rgba(18,18,18,0.96);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,0.1);border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,0.6);padding:8px;z-index:80;max-height:440px;overflow-y:auto;',
              )}
            >
              {groups.map((g) => (
                <div key={g.key}>
                  <div
                    style={css(
                      'padding:8px 12px 6px;font-size:11px;font-weight:800;color:#6a6a66;text-transform:uppercase;letter-spacing:0.06em;',
                    )}
                  >
                    {g.key}
                  </div>
                  {g.items.map((r) => (
                    <button
                      key={`${g.key}-${r.name}`}
                      type="button"
                      onMouseDown={r.go}
                      className="vh-w06"
                      style={css(
                        'display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;cursor:pointer;width:100%;background:none;border:none;color:inherit;text-align:left;',
                      )}
                    >
                      <div
                        style={css(
                          'width:34px;height:34px;border-radius:10px;flex:none;display:flex;align-items:center;justify-content:center;background:rgba(255,90,31,0.12);color:#ff8a55;',
                        )}
                      >
                        <Icon name={r.icon} size={16} />
                      </div>
                      <div style={css('flex:1;min-width:0;')}>
                        <div
                          style={css(
                            'font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
                          )}
                        >
                          {r.name}
                        </div>
                        <div
                          style={css(
                            'font-size:12px;color:#8a8a86;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
                          )}
                        >
                          {r.meta}
                        </div>
                      </div>
                      <Icon name="arrow-up-right" size={15} color="#6a6a66" />
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ) : null}

          {showResults && totalResults === 0 ? (
            <div
              style={css(
                'position:absolute;top:calc(100% + 8px);right:0;width:360px;background:rgba(18,18,18,0.96);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,0.1);border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,0.6);padding:26px 20px;z-index:80;text-align:center;',
              )}
            >
              <div style={css('font-size:13px;color:#8a8a86;')}>
                No matches. Try an event, partner or guest name.
              </div>
            </div>
          ) : null}
        </div>

        {/* notifications */}
        <div style={css('position:relative;')}>
          <button
            type="button"
            aria-label="Notifications"
            onClick={(e) => {
              e.stopPropagation();
              s.setNotifOpen(!s.notifOpen);
              s.setNotifRead(true);
            }}
            className="vh-1c"
            style={css(
              'width:40px;height:40px;border-radius:11px;background:#141414;border:1px solid rgba(255,255,255,0.06);color:#f5f5f3;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;',
            )}
          >
            <Icon name="bell" size={17} />
            {unread > 0 ? (
              <span
                style={css(
                  'position:absolute;top:9px;right:10px;width:7px;height:7px;border-radius:50%;background:#ff5a1f;border:2px solid #141414;',
                )}
              />
            ) : null}
          </button>

          {s.notifOpen ? (
            <div
              role="presentation"
              onClick={(e) => {
                e.stopPropagation();
              }}
              style={css(
                'position:absolute;top:calc(100% + 8px);right:0;width:360px;background:rgba(18,18,18,0.96);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,0.1);border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,0.6);padding:8px;z-index:90;max-height:460px;overflow-y:auto;',
              )}
            >
              <div
                style={css(
                  'display:flex;align-items:center;justify-content:space-between;padding:10px 12px 8px;',
                )}
              >
                <span style={css('font-size:13px;font-weight:800;')}>Notifications</span>
                <button
                  type="button"
                  onClick={() => {
                    s.setNotifOpen(false);
                  }}
                  style={css(
                    'font-size:12px;font-weight:600;color:#8a8a86;cursor:pointer;background:none;border:none;padding:0;',
                  )}
                >
                  Close
                </button>
              </div>
              {notifications.map((n, i) => (
                <div
                  key={n.desc}
                  style={css(
                    'display:flex;gap:12px;padding:12px;border-radius:14px;cursor:pointer;' +
                      (i < 3 && !s.notifRead ? 'background:rgba(255,90,31,0.06);' : ''),
                  )}
                >
                  <div style={css(n.iconWrap)}>
                    <Icon name={n.icon} size={16} />
                  </div>
                  <div style={css('flex:1;min-width:0;')}>
                    <div style={css('font-size:13px;color:#e9e9e6;line-height:1.4;')}>{n.desc}</div>
                    <div
                      style={css('font-size:11.5px;color:#6a6a66;font-weight:600;margin-top:4px;')}
                    >
                      {n.time}
                    </div>
                  </div>
                  {n.unread ? (
                    <span
                      style={css(
                        'width:7px;height:7px;border-radius:50%;background:#ff5a1f;flex:none;',
                      )}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          title={venueName}
          aria-label="Settings"
          onClick={() => {
            s.go('settings');
          }}
          style={css(
            'width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#ff5a1f,#c23d10);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;',
          )}
        >
          {initials}
        </button>

        <button
          type="button"
          aria-label="Sign out"
          onClick={async () => {
            await signOut();
            router.push('/login');
          }}
          style={css(
            'height:40px;padding:0 14px;border-radius:11px;background:transparent;border:1px solid rgba(255,255,255,0.1);color:#8a8a86;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.15s;',
          )}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,90,31,0.4)';
            e.currentTarget.style.color = '#ff5a1f';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = '#8a8a86';
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
