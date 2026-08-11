/**
 * Static dataset + style helpers for the Venue Studio dashboard.
 *
 * Every value here is ported verbatim from the C1RCLE Dashboard mockup's
 * `renderVals()` so the UI matches the design pixel-for-pixel. Swap these for
 * API-backed data once the venue endpoints land.
 */

import type { DayStatus } from './charts';

export { EVENTS, EV_STATUS_DOT, eventCardBg } from './venue-events-model';
export type { EventStatus, VenueEvent } from './venue-events-model';

export const ACCENT = '#ff5a1f';
export const GREEN = '#6ee79b';
export const RED = '#f0857a';
export const AMBER = '#ffb020';

// ── shared style helpers ────────────────────────────────────────────────────

export const subTab = (on: boolean): string =>
  `border:none;cursor:pointer;padding:9px 18px;border-radius:9px;font-size:14px;font-weight:600;` +
  (on ? `background:#262626;color:#f5f5f3;` : `background:transparent;color:#8a8a86;`);

export const pillTab = (on: boolean): string =>
  `border:none;cursor:pointer;padding:10px 20px;border-radius:999px;font-size:14px;font-weight:600;` +
  (on ? `background:#f5f5f3;color:#0a0a0a;` : `background:transparent;color:#8a8a86;`);

export const segBtn = (on: boolean): string =>
  `border:none;cursor:pointer;padding:9px 18px;border-radius:11px;font-size:14px;font-weight:600;` +
  (on
    ? `background:#ff5a1f;color:#0a0a0a;`
    : `background:#141414;border:1px solid rgba(255,255,255,0.08);color:#c9c9c6;`);

export const metricBtn = (on: boolean): string =>
  `border:none;cursor:pointer;padding:8px 15px;border-radius:8px;font-size:13px;font-weight:600;` +
  (on ? `background:#262626;color:#f5f5f3;` : `background:transparent;color:#8a8a86;`);

export const rangeBtn = (on: boolean): string =>
  `border:none;cursor:pointer;padding:7px 13px;border-radius:8px;font-size:13px;font-weight:600;` +
  (on ? `background:#262626;color:#f5f5f3;` : `background:transparent;color:#8a8a86;`);

export const bar = (pct: number, grad: string): string =>
  `width:${String(pct)}%;height:100%;background:${grad};border-radius:999px;`;

export const gAvatar = (grad: string): string =>
  `width:38px;height:38px;border-radius:11px;flex:none;display:flex;align-items:center;` +
  `justify-content:center;font-weight:700;font-size:13px;color:#fff;background:${grad};`;

export const avatar40 = (grad: string): string =>
  `width:40px;height:40px;border-radius:12px;flex:none;display:flex;align-items:center;` +
  `justify-content:center;font-weight:700;font-size:14px;color:#fff;background:${grad};`;

export const iconWrap = (bg: string, col: string): string =>
  `width:40px;height:40px;border-radius:12px;flex:none;display:flex;align-items:center;` +
  `justify-content:center;background:${bg};color:${col};`;

export const iconWrapMk = (bg: string, col: string): string =>
  `width:42px;height:42px;border-radius:12px;flex:none;display:flex;align-items:center;` +
  `justify-content:center;background:${bg};color:${col};`;

export const tagStyle = (bg: string, col: string): string =>
  `font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;background:${bg};color:${col};`;

export const outlinePill =
  'display:inline-flex;align-items:center;gap:6px;background:rgba(0,0,0,0.35);' +
  'border:1px solid rgba(255,255,255,0.28);color:#fff;padding:5px 12px 5px 9px;border-radius:999px;' +
  'font-size:10.5px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;';

export const inputStyle =
  'width:100%;background:#0d0d0d;border:1px solid rgba(255,255,255,0.1);border-radius:12px;' +
  'padding:13px 14px;color:#f5f5f3;font-size:14px;font-weight:500;';

export const labelStyle =
  'font-size:13px;font-weight:600;color:#c9c9c6;display:block;margin-bottom:8px;';

export const glassCard =
  'position:relative;border-radius:24px;background:rgba(20,20,20,0.6);backdrop-filter:blur(24px);' +
  'border:1px solid rgba(255,255,255,0.08);box-shadow:inset 0 1px 0 rgba(255,255,255,0.06),' +
  '0 16px 40px rgba(0,0,0,0.3);padding:22px 24px;';

export const GRADS = [
  'linear-gradient(135deg,#ff5a1f,#c23d10)',
  'linear-gradient(135deg,#3b2fff,#1a1a6a)',
  'linear-gradient(135deg,#00c2a8,#004a42)',
  'linear-gradient(135deg,#ff2f8f,#7a0040)',
  'linear-gradient(135deg,#ffb020,#7a3a00)',
  'linear-gradient(135deg,#8b5cf6,#3a1a6a)',
] as const;

export const POSTER_GRADS = [
  'linear-gradient(158deg,#d1490c,#7a1f00 52%,#2a0f04)',
  'linear-gradient(158deg,#0d7a6e,#064a42 52%,#03231f)',
  'linear-gradient(158deg,#4b5563,#1f2937 52%,#0c1013)',
  'linear-gradient(158deg,#be185d,#6d1a3a 52%,#240612)',
  'linear-gradient(158deg,#b8860b,#6b4e0a 52%,#241a04)',
  'linear-gradient(158deg,#4338ca,#26235e 52%,#0f0e26)',
] as const;

export const UPCOMING_GRADS = [
  'linear-gradient(158deg,#d1490c,#7a1f00 52%,#2a0f04)',
  'linear-gradient(158deg,#4338ca,#26235e 52%,#0f0e26)',
  'linear-gradient(158deg,#be185d,#6d1a3a 52%,#240612)',
  'linear-gradient(158deg,#0d7a6e,#064a42 52%,#03231f)',
] as const;

export const pick = <T>(arr: readonly T[], i: number): T => arr[i % arr.length] as T;

export const initialsOf = (name: string): string =>
  name
    .replace(/\(.*\)/, '')
    .trim()
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

// ── navigation ──────────────────────────────────────────────────────────────

export type Screen =
  | 'overview'
  | 'events'
  | 'eventDetail'
  | 'slotRequests'
  | 'audience'
  | 'create'
  | 'marketing'
  | 'finance'
  | 'door'
  | 'settings';

export const NAV_ITEMS: readonly { id: Screen; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'events', label: 'Events' },
  { id: 'audience', label: 'Partners' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'finance', label: 'Finance' },
];

export const navBtn = (active: boolean): string =>
  `border:none;cursor:pointer;padding:9px 18px;border-radius:10px;font-size:14px;font-weight:600;` +
  (active ? `background:${ACCENT};color:#0a0a0a;` : `background:transparent;color:#8a8a86;`);

// ── notifications ───────────────────────────────────────────────────────────

type NotifType = 'payout' | 'request' | 'message' | 'alert';

export const NOTIF_DEFS: readonly {
  icon: string;
  desc: string;
  time: string;
  type: NotifType;
}[] = [
  {
    icon: 'landmark',
    desc: 'Payout of ₹4,86,200 is scheduled for Fri, Jul 18.',
    time: '12m ago',
    type: 'payout',
  },
  {
    icon: 'users',
    desc: 'The Docks accepted your partner invite.',
    time: '1h ago',
    type: 'request',
  },
  {
    icon: 'message-square',
    desc: 'Neon Nights last-call campaign finished sending.',
    time: '3h ago',
    type: 'message',
  },
  {
    icon: 'triangle-alert',
    desc: '2 guests flagged at the door for Neon Nights.',
    time: '5h ago',
    type: 'alert',
  },
  {
    icon: 'user-plus',
    desc: 'Zoya (Nightowl) requested to promote your next event.',
    time: '1d ago',
    type: 'request',
  },
];

export const NOTIF_COLORS: Record<NotifType, readonly [string, string]> = {
  payout: ['rgba(110,231,155,0.14)', '#6ee79b'],
  request: ['rgba(255,90,31,0.14)', '#ff8a55'],
  message: ['rgba(139,92,246,0.14)', '#a78bfa'],
  alert: ['rgba(240,133,122,0.14)', '#f0857a'],
};

export const notifIconWrap = (bg: string, col: string): string =>
  `width:36px;height:36px;border-radius:11px;flex:none;display:flex;align-items:center;` +
  `justify-content:center;background:${bg};color:${col};`;

// ── overview: trend chart ───────────────────────────────────────────────────

export type Metric = 'revenue' | 'tickets';
export type Range = '1D' | '1W' | '1M' | 'All';

export const RANGES: readonly Range[] = ['1D', '1W', '1M', 'All'];

export const TREND_DATA: Record<Metric, Record<Range, readonly number[]>> = {
  revenue: {
    '1D': [8, 12, 10, 18, 22, 19, 28, 34, 30, 38, 44, 52],
    '1W': [120, 145, 132, 168, 190, 175, 240],
    '1M': [80, 95, 110, 130, 125, 150, 170, 165, 190, 210, 240, 260],
    All: [40, 80, 120, 90, 160, 200, 180, 240, 300, 280, 360, 420],
  },
  tickets: {
    '1D': [2, 4, 3, 6, 7, 6, 9, 11, 10, 13, 15, 18],
    '1W': [40, 52, 48, 61, 70, 66, 88],
    '1M': [30, 38, 44, 52, 49, 60, 68, 66, 76, 84, 96, 104],
    All: [16, 32, 48, 36, 64, 80, 72, 96, 120, 112, 144, 168],
  },
};

export const TREND_DELTAS: Record<Range, string> = {
  '1D': '+18%',
  '1W': '+12%',
  '1M': '+24%',
  All: '+41%',
};

export const TREND_CAPTIONS: Record<Range, string> = {
  '1D': 'Today, by the hour',
  '1W': 'This week, by day',
  '1M': 'This month, by day',
  All: 'All time, by month',
};

// ── overview: activity feed ─────────────────────────────────────────────────

export const ACTIVITY: readonly {
  name: string;
  meta: string;
  time: string;
  icon: string;
  amount: string;
  dir: 'in' | 'out' | 'refund';
}[] = [
  {
    name: 'Aisha Menon',
    meta: '2× VIP · Neon Nights',
    time: '4m',
    icon: 'ticket',
    amount: '+ ₹5,000',
    dir: 'in',
  },
  {
    name: 'Payout to HDFC ••4412',
    meta: 'Sunset Sessions',
    time: '1h',
    icon: 'landmark',
    amount: '– ₹84,200',
    dir: 'out',
  },
  {
    name: 'Karan Shah',
    meta: '1× GA · Neon Nights',
    time: '2h',
    icon: 'ticket',
    amount: '+ ₹1,800',
    dir: 'in',
  },
  {
    name: 'Refund · Meera Rao',
    meta: '1× GA · Warehouse Rave',
    time: '3h',
    icon: 'rotate-ccw',
    amount: '– ₹1,800',
    dir: 'refund',
  },
  {
    name: 'Devansh Iyer',
    meta: '4× GA · Neon Nights',
    time: '5h',
    icon: 'ticket',
    amount: '+ ₹7,200',
    dir: 'in',
  },
  {
    name: 'Table booking · Priya K',
    meta: 'Bottle service',
    time: '6h',
    icon: 'wine',
    amount: '+ ₹24,000',
    dir: 'in',
  },
  {
    name: 'Nikhil Verma',
    meta: '2× GA · Sunset Sessions',
    time: '8h',
    icon: 'ticket',
    amount: '+ ₹3,600',
    dir: 'in',
  },
];

// ── calendar (July 2026) ────────────────────────────────────────────────────

export const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

export const JULY_STATUS: Partial<Record<number, DayStatus>> = {
  3: 'confirmed',
  9: 'pending',
  12: 'blocked',
  16: 'confirmed',
  23: 'confirmed',
  30: 'confirmed',
};

export interface CalEvent {
  name: string;
  time: string;
  status: DayStatus;
  venue: string;
}

export const JULY_EVENTS: Partial<Record<number, readonly CalEvent[]>> = {
  3: [
    {
      name: 'Private booking · Corporate',
      time: '7:00 PM – 11:00 PM',
      status: 'confirmed',
      venue: 'Skyline Rooftop',
    },
  ],
  9: [
    {
      name: 'Warehouse Rave (on hold)',
      time: '11:00 PM – 4:00 AM',
      status: 'pending',
      venue: 'The Docks',
    },
  ],
  12: [{ name: 'Venue maintenance', time: 'All day', status: 'blocked', venue: 'Skyline Rooftop' }],
  16: [
    {
      name: 'Neon Nights: Afrobeats Edition',
      time: '9:00 PM – 3:00 AM',
      status: 'confirmed',
      venue: 'Skyline Rooftop',
    },
    {
      name: 'Soundcheck & setup',
      time: '5:00 PM – 8:00 PM',
      status: 'confirmed',
      venue: 'Skyline Rooftop',
    },
  ],
  23: [
    {
      name: 'Bollywood Brunch (matinee)',
      time: '12:00 PM – 4:00 PM',
      status: 'confirmed',
      venue: 'Garden Terrace',
    },
  ],
  30: [
    {
      name: 'Sunset Sessions Vol. 4',
      time: '5:00 PM – 11:00 PM',
      status: 'confirmed',
      venue: 'Skyline Rooftop',
    },
  ],
};

/** August 2026 venue availability used by the Create Event date step. */
export const AUG_STATUS: Partial<Record<number, DayStatus>> = {
  1: 'confirmed',
  7: 'blocked',
  8: 'confirmed',
  14: 'pending',
  15: 'confirmed',
  21: 'pending',
  22: 'confirmed',
  28: 'confirmed',
};

export const CAL_LEGEND = [
  { label: 'Confirmed', color: '#6ee79b' },
  { label: 'Pending', color: '#ffb020' },
  { label: 'Blocked', color: '#f0857a' },
] as const;

export const JULY_EVENT_DATES: Partial<Record<number, number>> = {
  3: 1,
  9: 1,
  16: 2,
  23: 1,
  30: 1,
};

export const TODAY_JULY = 16;
export const JULY_OFFSET = 3;

// ── overview: upcoming + network ────────────────────────────────────────────

export const UPCOMING = [
  {
    name: 'Sunset Sessions Vol. 4',
    meta: 'Skyline Rooftop · Aug 2',
    pct: '62%',
    pctColor: '#ff8a55',
  },
  { name: 'Warehouse Rave', meta: 'The Docks · Aug 9', pct: '41%', pctColor: '#c9c9c6' },
  { name: 'Bollywood Brunch', meta: 'Garden Terrace · Aug 15', pct: '78%', pctColor: '#6ee79b' },
  { name: 'Techno Underground', meta: 'Basement 9 · Aug 22', pct: '23%', pctColor: '#c9c9c6' },
] as const;

export const NETWORK = [
  {
    name: 'Skyline Rooftop',
    role: 'Venue',
    initials: 'SR',
    grad: GRADS[0],
    tag: 'Partnered',
    tagBg: 'rgba(110,231,155,0.14)',
    tagCol: '#6ee79b',
  },
  {
    name: 'Arjun (Pulse)',
    role: 'Promoter',
    initials: 'AP',
    grad: GRADS[1],
    tag: 'Partnered',
    tagBg: 'rgba(110,231,155,0.14)',
    tagCol: '#6ee79b',
  },
  {
    name: 'The Docks',
    role: 'Venue',
    initials: 'TD',
    grad: GRADS[2],
    tag: 'Invite sent',
    tagBg: 'rgba(255,90,31,0.14)',
    tagCol: '#ff8a55',
  },
  {
    name: 'Maya (Staff)',
    role: 'Door lead',
    initials: 'MS',
    grad: GRADS[3],
    tag: 'Active',
    tagBg: 'rgba(255,255,255,0.08)',
    tagCol: '#c9c9c6',
  },
] as const;

export const FINANCE_SPARK_SERIES = [30, 42, 38, 55, 48, 62, 58, 72, 66, 80, 74, 92];
