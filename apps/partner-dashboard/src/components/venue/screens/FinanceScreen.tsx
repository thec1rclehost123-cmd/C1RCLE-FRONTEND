'use client';

import { buildPaths, css } from '../charts';
import {
  FINANCE_SPARK_SERIES,
  GRADS,
  ORDERS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_FILTERS,
  PAYOUTS,
  PAY_STATUS_COLORS,
  gAvatar,
  inputStyle,
  initialsOf,
  pick,
  subTab,
  tagStyle,
} from '../data';
import { Icon } from '../Icon';
import { useVenueStudio } from '../store';

import type { FinanceView } from '../store';

const FINANCE_TABS: readonly (readonly [FinanceView, string])[] = [
  ['payouts', 'Balance & payouts'],
  ['orders', 'Orders'],
  ['bank', 'Bank & cards'],
];

export function FinanceScreen() {
  const s = useVenueStudio();

  return (
    <div>
      <h1 style={css('margin:0 0 22px;font-size:30px;font-weight:800;letter-spacing:-0.02em;')}>
        Finance
      </h1>
      <div
        style={css(
          'display:flex;gap:4px;background:#141414;border:1px solid rgba(255,255,255,0.06);padding:4px;border-radius:13px;width:fit-content;margin-bottom:22px;',
        )}
      >
        {FINANCE_TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              s.setFinanceView(id);
            }}
            style={css(subTab(s.financeView === id))}
          >
            {label}
          </button>
        ))}
      </div>

      {s.financeView === 'payouts' ? <PayoutsView /> : null}
      {s.financeView === 'orders' ? <OrdersView /> : null}
      {s.financeView === 'bank' ? <BankView /> : null}
    </div>
  );
}

function PayoutsView() {
  const s = useVenueStudio();
  const spark = buildPaths(FINANCE_SPARK_SERIES);

  return (
    <div>
      <div
        style={css(
          'display:grid;grid-template-columns:1.4fr 1fr;gap:20px;margin-bottom:20px;align-items:stretch;',
        )}
      >
        {/* available balance hero */}
        <div
          style={css(
            'position:relative;border-radius:28px;overflow:hidden;background:rgba(22,17,14,0.72);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,0.09);box-shadow:inset 0 1px 0 rgba(255,255,255,0.08),0 26px 60px rgba(0,0,0,0.45);padding:28px 30px;',
          )}
        >
          <svg
            viewBox="0 0 600 190"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: 120,
              opacity: 0.5,
            }}
          >
            <defs>
              <linearGradient id="fnSpark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff5a1f" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ff5a1f" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={spark.area} fill="url(#fnSpark)" />
            <path
              d={spark.line}
              fill="none"
              stroke="#ff8a55"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </svg>
          <div style={css('position:relative;')}>
            <div style={css('display:flex;align-items:center;gap:10px;margin-bottom:14px;')}>
              <span style={css('font-size:13px;color:#d8c4b8;font-weight:600;')}>
                Available balance
              </span>
              <span
                style={css(
                  'display:inline-flex;align-items:center;gap:4px;background:rgba(110,231,155,0.14);color:#6ee79b;padding:3px 9px;border-radius:999px;font-size:12px;font-weight:700;',
                )}
              >
                <Icon name="trending-up" size={12} />
                +9.4%
              </span>
            </div>
            <div
              style={css(
                'font-size:52px;font-weight:800;letter-spacing:-0.03em;margin-bottom:8px;font-variant-numeric:tabular-nums;',
              )}
            >
              ₹4,86,200
            </div>
            <div style={css('font-size:13px;color:#c9b7ac;font-weight:500;margin-bottom:26px;')}>
              Ready to withdraw to HDFC ••4412 now.
            </div>
            <div style={css('display:flex;gap:12px;')}>
              <button
                type="button"
                disabled
                title="Withdrawals require the payout API and server confirmation."
                style={css(
                  'display:inline-flex;align-items:center;gap:8px;background:#303030;color:#858580;border:none;padding:14px 26px;border-radius:999px;font-size:14px;font-weight:800;cursor:not-allowed;',
                )}
              >
                <Icon name="arrow-down-to-line" size={16} /> Withdraw
              </button>
              <button
                type="button"
                disabled
                title="Payout scheduling requires the payout API and server confirmation."
                style={css(
                  'display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);color:#73736f;border:1px solid rgba(255,255,255,0.08);padding:14px 26px;border-radius:999px;font-size:14px;font-weight:600;cursor:not-allowed;',
                )}
              >
                <Icon name="calendar-clock" size={16} /> Request payout
              </button>
            </div>
          </div>
        </div>

        {/* bank card face */}
        <div
          style={css(
            'position:relative;border-radius:28px;overflow:hidden;padding:26px;display:flex;flex-direction:column;justify-content:space-between;min-height:220px;background:#17171b;border:1px solid rgba(255,255,255,0.09);box-shadow:0 26px 60px rgba(0,0,0,0.45);',
          )}
        >
          <div
            style={css(
              'position:relative;display:flex;align-items:flex-start;justify-content:space-between;',
            )}
          >
            <div>
              <div
                style={css('font-size:11px;letter-spacing:0.16em;font-weight:700;color:#9a9a96;')}
              >
                THE C1RCLE · PAYOUTS
              </div>
              <div style={css('font-size:15px;font-weight:700;color:#e9e9e6;margin-top:6px;')}>
                HDFC Bank
              </div>
            </div>
            <div
              style={css(
                'width:40px;height:30px;border-radius:6px;background:linear-gradient(135deg,#e9c46a,#b08922);box-shadow:inset 0 0 0 1px rgba(0,0,0,0.2);',
              )}
            />
          </div>
          <div style={css('position:relative;')}>
            <div
              style={css(
                'font-size:21px;font-weight:700;letter-spacing:0.14em;color:#e9e9e6;margin-bottom:14px;font-variant-numeric:tabular-nums;',
              )}
            >
              5010 •••• •••• 4412
            </div>
            <div style={css('display:flex;align-items:flex-end;justify-content:space-between;')}>
              <div>
                <div
                  style={css(
                    'font-size:10px;color:#7a7a76;letter-spacing:0.08em;margin-bottom:3px;',
                  )}
                >
                  ACCOUNT HOLDER
                </div>
                <div style={css('font-size:13px;font-weight:600;color:#d9d9d6;')}>
                  Rhea Kapoor Events
                </div>
              </div>
              <button
                type="button"
                onClick={s.goBank}
                style={css(
                  'background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.16);color:#f5f5f3;padding:8px 14px;border-radius:999px;font-size:12px;font-weight:700;cursor:pointer;backdrop-filter:blur(8px);',
                )}
              >
                Manage
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* pending + next */}
      <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:22px;')}>
        <div
          style={css(
            'display:flex;align-items:center;gap:16px;background:rgba(20,20,20,0.6);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:20px 22px;',
          )}
        >
          <div
            style={css(
              'width:46px;height:46px;border-radius:14px;background:rgba(255,90,31,0.14);color:#ff8a55;display:flex;align-items:center;justify-content:center;flex:none;',
            )}
          >
            <Icon name="hourglass" size={20} />
          </div>
          <div style={css('flex:1;')}>
            <div style={css('font-size:13px;color:#8a8a86;font-weight:600;')}>Pending balance</div>
            <div
              style={css(
                'font-size:26px;font-weight:800;letter-spacing:-0.02em;font-variant-numeric:tabular-nums;',
              )}
            >
              ₹1,24,000
            </div>
          </div>
          <div
            style={css(
              'font-size:12px;color:#6a6a66;text-align:right;max-width:120px;line-height:1.4;',
            )}
          >
            Clears within 2 days
          </div>
        </div>
        <div
          style={css(
            'display:flex;align-items:center;gap:16px;background:rgba(20,20,20,0.6);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:20px 22px;',
          )}
        >
          <div
            style={css(
              'width:46px;height:46px;border-radius:14px;background:rgba(110,231,155,0.12);color:#6ee79b;display:flex;align-items:center;justify-content:center;flex:none;',
            )}
          >
            <Icon name="calendar-check" size={20} />
          </div>
          <div style={css('flex:1;')}>
            <div style={css('font-size:13px;color:#8a8a86;font-weight:600;')}>Next payout</div>
            <div style={css('font-size:26px;font-weight:800;letter-spacing:-0.02em;')}>
              Fri, Jul 18
            </div>
          </div>
          <div
            style={css(
              'font-size:12px;color:#6a6a66;text-align:right;max-width:120px;line-height:1.4;',
            )}
          >
            Auto to ••4412
          </div>
        </div>
      </div>

      {/* payout history */}
      <div
        style={css(
          'position:relative;border-radius:24px;overflow:hidden;background:rgba(20,20,20,0.55);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,0.08);box-shadow:inset 0 1px 0 rgba(255,255,255,0.05),0 20px 50px rgba(0,0,0,0.35);padding:24px 26px;',
        )}
      >
        <div
          style={css(
            'position:relative;display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;',
          )}
        >
          <h3 style={css('margin:0;font-size:17px;font-weight:700;')}>Payout history</h3>
          <div style={css('display:flex;gap:10px;')}>
            <div
              style={css(
                'display:flex;align-items:center;gap:9px;background:#0d0d0d;border:1px solid rgba(255,255,255,0.08);padding:9px 13px;border-radius:999px;width:200px;color:#8a8a86;',
              )}
            >
              <Icon name="search" size={14} />
              <span style={css('font-size:13px;')}>Search by event</span>
            </div>
            <button
              type="button"
              style={css(
                'display:flex;align-items:center;gap:7px;background:#0d0d0d;border:1px solid rgba(255,255,255,0.08);color:#c9c9c6;padding:9px 15px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;',
              )}
            >
              Date range <Icon name="chevron-down" size={14} style={{ opacity: 0.6 }} />
            </button>
          </div>
        </div>
        <div style={css('position:relative;')}>
          <div
            style={css(
              'position:absolute;left:33px;top:30px;bottom:30px;width:2px;background:linear-gradient(to bottom,rgba(255,90,31,0.4),rgba(255,255,255,0.08));',
            )}
          />
          {PAYOUTS.map((p) => {
            const colors = PAY_STATUS_COLORS[p.status] ?? ['rgba(255,255,255,0.06)', '#8a8a86'];
            return (
              <div
                key={p.date}
                className="vh-w04"
                style={css(
                  'position:relative;display:flex;align-items:center;gap:16px;padding:13px 8px;border-radius:14px;',
                )}
              >
                <div
                  style={css(
                    'width:46px;height:46px;border-radius:15px;background:#17140f;border:2px solid rgba(255,90,31,0.35);display:flex;align-items:center;justify-content:center;color:#ff8a55;flex:none;position:relative;z-index:1;',
                  )}
                >
                  <Icon name="landmark" size={18} />
                </div>
                <div style={css('flex:1;')}>
                  <div style={css('font-size:14px;font-weight:700;')}>{p.date}</div>
                  <div style={css('font-size:12px;color:#8a8a86;font-weight:500;margin-top:2px;')}>
                    {p.detail}
                  </div>
                </div>
                <span style={css(tagStyle(colors[0], colors[1]))}>{p.status}</span>
                <span
                  style={css(
                    `font-size:17px;font-weight:800;min-width:120px;text-align:right;font-variant-numeric:tabular-nums;color:${p.status === 'Scheduled' ? '#ff8a55' : '#6ee79b'};`,
                  )}
                >
                  {p.amount}
                </span>
                <Icon name="chevron-right" size={18} color="#6a6a66" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const GRID_COLS = '2fr 1.3fr 0.9fr 0.9fr 0.9fr 40px';

function OrdersView() {
  const s = useVenueStudio();

  const q = s.ordersSearch.trim().toLowerCase();
  let rows = ORDERS.filter(
    (o) =>
      (s.ordersStatus === 'All' || o.status === s.ordersStatus) &&
      (!q || o.name.toLowerCase().includes(q) || o.orderNo.toLowerCase().includes(q)),
  );

  if (s.ordersSort) {
    const dir = s.ordersSortDir === 'asc' ? 1 : -1;
    const key = s.ordersSort === 'tickets' ? 'tickets' : 'amountN';
    rows = [...rows].sort((a, b) => (a[key] - b[key]) * dir);
  }

  const sortIcon = (col: 'tickets' | 'amount') =>
    s.ordersSort === col
      ? s.ordersSortDir === 'asc'
        ? 'chevron-up'
        : 'chevron-down'
      : 'chevrons-up-down';

  return (
    <div
      role="presentation"
      onClick={() => {
        s.setOrdersMenuOpen(null);
      }}
    >
      <div style={css('display:flex;gap:10px;margin-bottom:16px;')}>
        <div
          style={css(
            'display:flex;align-items:center;gap:9px;background:#141414;border:1px solid rgba(255,255,255,0.08);padding:11px 14px;border-radius:12px;flex:1;max-width:340px;color:#8a8a86;',
          )}
        >
          <Icon name="search" size={15} />
          <input
            aria-label="Search orders"
            value={s.ordersSearch}
            onChange={(e) => {
              s.setOrdersSearch(e.target.value);
            }}
            placeholder="Search by name or order #"
            style={css(
              'flex:1;background:transparent;border:none;outline:none;color:#f5f5f3;font-size:13px;',
            )}
          />
        </div>
        <div
          style={css(
            'display:flex;gap:4px;background:#141414;border:1px solid rgba(255,255,255,0.08);padding:4px;border-radius:12px;',
          )}
        >
          {ORDER_STATUS_FILTERS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                s.setOrdersStatus(st);
              }}
              style={css(
                'border:none;cursor:pointer;padding:9px 14px;border-radius:10px;font-size:13px;font-weight:600;' +
                  (s.ordersStatus === st
                    ? 'background:#262626;color:#f5f5f3;'
                    : 'background:transparent;color:#8a8a86;'),
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div
        style={css(
          'border:1px solid rgba(255,255,255,0.07);border-radius:18px;overflow:hidden;background:rgba(20,20,20,0.5);backdrop-filter:blur(14px);',
        )}
      >
        <div
          style={{
            ...css(
              'display:grid;gap:12px;padding:13px 20px;border-bottom:1px solid rgba(255,255,255,0.07);font-size:11.5px;font-weight:800;color:#6a6a66;text-transform:uppercase;letter-spacing:0.06em;',
            ),
            gridTemplateColumns: GRID_COLS,
          }}
        >
          <span>Order</span>
          <span>Event</span>
          <button
            type="button"
            onClick={() => {
              s.toggleOrdersSort('tickets');
            }}
            style={css(
              'display:flex;align-items:center;gap:4px;cursor:pointer;background:none;border:none;padding:0;color:inherit;font:inherit;text-transform:inherit;letter-spacing:inherit;',
            )}
          >
            Tickets <Icon name={sortIcon('tickets')} size={12} />
          </button>
          <button
            type="button"
            onClick={() => {
              s.toggleOrdersSort('amount');
            }}
            style={css(
              'display:flex;align-items:center;gap:4px;cursor:pointer;background:none;border:none;padding:0;color:inherit;font:inherit;text-transform:inherit;letter-spacing:inherit;',
            )}
          >
            Total <Icon name={sortIcon('amount')} size={12} />
          </button>
          <span>Status</span>
          <span />
        </div>

        {rows.map((o, i) => {
          const colors = ORDER_STATUS_COLORS[o.status];
          return (
            <div
              key={o.orderNo}
              className="vh-w03"
              style={{
                ...css(
                  'position:relative;display:grid;gap:12px;align-items:center;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05);',
                ),
                gridTemplateColumns: GRID_COLS,
              }}
            >
              <div style={css('display:flex;align-items:center;gap:12px;min-width:0;')}>
                <div style={css(gAvatar(pick(GRADS, i)))}>{initialsOf(o.name)}</div>
                <div style={css('min-width:0;')}>
                  <div
                    style={css(
                      'font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
                    )}
                  >
                    {o.name}
                  </div>
                  <div style={css('font-size:12px;color:#6a6a66;font-weight:500;')}>
                    {o.orderNo} · {o.date}
                  </div>
                </div>
              </div>
              <div
                style={css(
                  'font-size:13px;color:#c9c9c6;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
                )}
              >
                {o.event}
              </div>
              <div style={css('font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;')}>
                {o.tickets}
              </div>
              <div style={css('font-size:14px;font-weight:800;font-variant-numeric:tabular-nums;')}>
                ₹{o.amountN.toLocaleString('en-IN')}
              </div>
              <div>
                <span style={css(tagStyle(colors[0], colors[1]))}>{o.status}</span>
              </div>
              <div style={css('position:relative;')}>
                <button
                  type="button"
                  aria-label="Order actions"
                  onClick={(e) => {
                    e.stopPropagation();
                    s.setOrdersMenuOpen(s.ordersMenuOpen === i ? null : i);
                  }}
                  className="vh-w08"
                  style={css(
                    'width:30px;height:30px;border-radius:9px;background:transparent;border:none;color:#8a8a86;cursor:pointer;display:flex;align-items:center;justify-content:center;',
                  )}
                >
                  <Icon name="more-horizontal" size={17} />
                </button>
                {s.ordersMenuOpen === i ? (
                  <div
                    style={css(
                      'position:absolute;top:calc(100% + 4px);right:0;width:168px;background:rgba(24,24,24,0.98);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,0.1);border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,0.5);padding:6px;z-index:20;',
                    )}
                  >
                    {['View details', 'Refund', 'Cancel', 'Resend ticket'].map((label) => (
                      <div
                        key={label}
                        className="vh-w06"
                        style={css(
                          'padding:9px 11px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;',
                        )}
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BankView() {
  const fieldLabel = css(
    'font-size:13px;font-weight:600;color:#c9c9c6;display:block;margin-bottom:8px;',
  );

  return (
    <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:900px;')}>
      <div
        style={css(
          'background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:26px;',
        )}
      >
        <h3 style={css('margin:0 0 4px;font-size:17px;font-weight:700;')}>Bank account</h3>
        <div style={css('font-size:13px;color:#8a8a86;margin-bottom:22px;')}>
          Where your payouts land.
        </div>
        <div style={css('display:flex;flex-direction:column;gap:16px;')}>
          <div>
            <label htmlFor="fn-holder" style={fieldLabel}>
              Account holder name
            </label>
            <input id="fn-holder" defaultValue="Rhea Kapoor Events LLP" style={css(inputStyle)} />
          </div>
          <div>
            <label htmlFor="fn-acct" style={fieldLabel}>
              Account number
            </label>
            <input id="fn-acct" defaultValue="5010 0284 4412" style={css(inputStyle)} />
          </div>
          <div>
            <label htmlFor="fn-ifsc" style={fieldLabel}>
              IFSC Code
            </label>
            <input id="fn-ifsc" defaultValue="HDFC0001234" style={css(inputStyle)} />
          </div>
          <button
            type="button"
            style={css(
              'background:#ff5a1f;color:#0a0a0a;border:none;padding:13px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;margin-top:4px;',
            )}
          >
            Save bank details
          </button>
        </div>
      </div>

      <div
        style={css(
          'background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:26px;',
        )}
      >
        <h3 style={css('margin:0 0 4px;font-size:17px;font-weight:700;')}>Payment card</h3>
        <div style={css('font-size:13px;color:#8a8a86;margin-bottom:22px;')}>
          For platform fees and ads.
        </div>
        <div
          style={css(
            'position:relative;border-radius:16px;overflow:hidden;padding:22px;margin-bottom:22px;min-height:150px;background:linear-gradient(135deg,#2a1206,#1c1006 60%,#120a04);',
          )}
        >
          <div style={css('position:relative;')}>
            <div style={css('font-size:13px;color:#d8c4b8;margin-bottom:30px;')}>
              THE C1RCLE · Business
            </div>
            <div
              style={css(
                'font-size:20px;font-weight:700;letter-spacing:0.08em;margin-bottom:18px;',
              )}
            >
              4242 4242 4242 4242
            </div>
            <div
              style={css(
                'display:flex;justify-content:space-between;font-size:13px;color:#d8c4b8;',
              )}
            >
              <span>Rhea Kapoor</span>
              <span>09/28</span>
            </div>
          </div>
        </div>
        <div style={css('display:flex;flex-direction:column;gap:16px;')}>
          <div>
            <label htmlFor="fn-card" style={fieldLabel}>
              Card number
            </label>
            <input id="fn-card" defaultValue="4242 4242 4242 4242" style={css(inputStyle)} />
          </div>
          <div style={css('display:flex;gap:14px;')}>
            <div style={css('flex:1;')}>
              <label htmlFor="fn-exp" style={fieldLabel}>
                Expiry (MM/YY)
              </label>
              <input id="fn-exp" defaultValue="09/28" style={css(inputStyle)} />
            </div>
            <div style={css('flex:1;')}>
              <label htmlFor="fn-cvv" style={fieldLabel}>
                CVV
              </label>
              <input id="fn-cvv" type="password" defaultValue="123" style={css(inputStyle)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
