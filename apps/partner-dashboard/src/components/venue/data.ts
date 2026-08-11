/**
 * Static dataset + style helpers for the Venue Studio dashboard.
 *
 * Every value here is ported verbatim from the C1RCLE Dashboard mockup's
 * `renderVals()` so the UI matches the design pixel-for-pixel. Swap these for
 * API-backed data once the venue endpoints land.
 */

import type { DayStatus } from './charts';

export const ACCENT = '#ff5a1f';
export const GREEN = '#6ee79b';
export const RED = '#f0857a';
export const AMBER = '#ffb020';

export const POSTER_SRC = '/venue/neon-nights-poster.webp';

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

// ── events ──────────────────────────────────────────────────────────────────

export type EventStatus = 'Live' | 'Draft' | 'Past' | 'Cancelled';

export interface VenueEvent {
  name: string;
  status: EventStatus;
  meta: string;
  metaShort: string;
  pct: string;
  pctN: number;
  revenue: string;
  price: string;
  tint: string;
  card: string;
  venue: string;
  day: string;
  month: string;
  time: string;
  host: string;
}

export const EVENTS: readonly VenueEvent[] = [
  {
    name: 'Neon Nights: Afrobeats',
    status: 'Live',
    meta: 'Skyline Rooftop · Thu, Jul 16 · 9:00 PM',
    metaShort: 'Skyline Rooftop · Jul 16',
    pct: '85%',
    pctN: 85,
    revenue: '₹6,12,000',
    price: '₹1,800',
    tint: 'linear-gradient(135deg,#ff5a1f,#7a1f00)',
    card: 'linear-gradient(158deg,#d1490c,#7a1f00 52%,#2a0f04)',
    venue: 'Skyline Rooftop',
    day: '16',
    month: 'JUL',
    time: '9:00 pm',
    host: 'Rhea Kapoor',
  },
  {
    name: 'Sunset Sessions Vol. 4',
    status: 'Live',
    meta: 'Skyline Rooftop · Sat, Aug 2 · 5:00 PM',
    metaShort: 'Skyline Rooftop · Aug 2',
    pct: '62%',
    pctN: 62,
    revenue: '₹3,88,000',
    price: '₹1,200',
    tint: 'linear-gradient(135deg,#ffb020,#7a3a00)',
    card: 'linear-gradient(158deg,#b8860b,#6b4e0a 52%,#241a04)',
    venue: 'Skyline Rooftop',
    day: '02',
    month: 'AUG',
    time: '5:00 pm',
    host: 'Rhea Kapoor',
  },
  {
    name: 'Warehouse Rave',
    status: 'Draft',
    meta: 'The Docks · Sat, Aug 9 · 11:00 PM',
    metaShort: 'The Docks · Aug 9',
    pct: '41%',
    pctN: 41,
    revenue: '₹1,64,000',
    price: '₹999',
    tint: 'linear-gradient(135deg,#3b2fff,#0a0a3a)',
    card: 'linear-gradient(158deg,#4b5563,#1f2937 52%,#0c1013)',
    venue: 'The Docks',
    day: '09',
    month: 'AUG',
    time: '11:00 pm',
    host: 'Pulse Collective',
  },
  {
    name: 'Bollywood Brunch',
    status: 'Live',
    meta: 'Garden Terrace · Sat, Aug 15 · 12:00 PM',
    metaShort: 'Garden Terrace · Aug 15',
    pct: '78%',
    pctN: 78,
    revenue: '₹2,34,000',
    price: '₹1,500',
    tint: 'linear-gradient(135deg,#ff2f8f,#3a0020)',
    card: 'linear-gradient(158deg,#be185d,#6d1a3a 52%,#240612)',
    venue: 'Garden Terrace',
    day: '15',
    month: 'AUG',
    time: '12:00 pm',
    host: 'Rhea Kapoor',
  },
  {
    name: 'Monsoon Sessions',
    status: 'Past',
    meta: 'Skyline Rooftop · Sat, Jun 28 · 8:00 PM',
    metaShort: 'Skyline Rooftop · Jun 28',
    pct: '96%',
    pctN: 96,
    revenue: '₹7,05,000',
    price: '₹2,200',
    tint: 'linear-gradient(135deg,#00c2a8,#003a33)',
    card: 'linear-gradient(158deg,#0d7a6e,#064a42 52%,#03231f)',
    venue: 'Skyline Rooftop',
    day: '28',
    month: 'JUN',
    time: '8:00 pm',
    host: 'Rhea Kapoor',
  },
];

export const EV_STATUS_DOT: Record<EventStatus, string> = {
  Live: '#6ee79b',
  Draft: '#ffb020',
  Past: '#8a8a86',
  Cancelled: '#f0857a',
};

export const outlinePill =
  'display:inline-flex;align-items:center;gap:6px;background:rgba(0,0,0,0.35);' +
  'border:1px solid rgba(255,255,255,0.28);color:#fff;padding:5px 12px 5px 9px;border-radius:999px;' +
  'font-size:10.5px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;';

/** Poster backdrop for an event card — index 0 uses the real photo. */
export const eventCardBg = (idx: number, card: string): string =>
  idx === 0
    ? `position:absolute;inset:0;background-image:url(${POSTER_SRC});background-size:cover;background-position:center 30%;`
    : `position:absolute;inset:0;background:${card};`;

export const EVENT_FILTERS = ['All statuses', 'All venues', 'This month'] as const;

// ── events: analytics ───────────────────────────────────────────────────────

const deltaUp = 'font-size:12px;font-weight:700;color:#6ee79b;margin-top:6px;';

export const ANALYTICS_CARDS = [
  { label: 'Tickets sold', value: '12,480', delta: '+18% vs last month', deltaStyle: deltaUp },
  { label: 'Money made', value: '₹42.6L', delta: '+24% vs last month', deltaStyle: deltaUp },
  {
    label: 'Average ticket price',
    value: '₹1,940',
    delta: '+6% vs last month',
    deltaStyle: deltaUp,
  },
  {
    label: "Who's coming back",
    value: '34%',
    delta: 'Repeat guests',
    deltaStyle: 'font-size:12px;font-weight:600;color:#8a8a86;margin-top:6px;',
  },
] as const;

export const ANALYTICS_SERIES = [40, 80, 120, 90, 160, 200, 180, 240, 300, 280, 360, 420];

export const TIER_BARS = [
  {
    name: 'VIP Table',
    count: '48',
    money: '₹2,40,000',
    bar: bar(40, 'linear-gradient(90deg,#8b5cf6,#c4a5ff)'),
  },
  {
    name: 'VIP Entry',
    count: '92',
    money: '₹1,84,000',
    bar: bar(70, 'linear-gradient(90deg,#00c2a8,#6ee7d4)'),
  },
  {
    name: 'General Admission',
    count: '200',
    money: '₹1,88,000',
    bar: bar(100, 'linear-gradient(90deg,#ff5a1f,#ffb078)'),
  },
] as const;

export const GENDER_RAW = [
  { label: 'Female', pct: 54, color: '#ff8a55' },
  { label: 'Male', pct: 42, color: '#8b5cf6' },
  { label: 'Other', pct: 4, color: '#6ee79b' },
] as const;

export const AGE_RAW: readonly (readonly [string, number])[] = [
  ['18–24', 38],
  ['25–34', 44],
  ['35–44', 14],
  ['45+', 4],
];

export const CHANNEL_RAW: readonly (readonly [string, number, boolean])[] = [
  ['Direct', 52, true],
  ['Promoters', 33, false],
  ['Social', 15, false],
];

export const PEAK_RAW: readonly (readonly [string, number])[] = [
  ['Mon', 20],
  ['Tue', 26],
  ['Wed', 34],
  ['Thu', 58],
  ['Fri', 82],
  ['Sat', 100],
  ['Sun', 46],
];

export const DETAIL_SPARK_SERIES = [120, 145, 132, 168, 190, 175, 210, 196, 238, 224, 268, 300];
export const FINANCE_SPARK_SERIES = [30, 42, 38, 55, 48, 62, 58, 72, 66, 80, 74, 92];

// ── slot requests ───────────────────────────────────────────────────────────

export type ReqStatus = 'pending' | 'approved' | 'rejected';

export interface SlotRequest {
  id: number;
  host: string;
  eventName: string;
  date: string;
  time: string;
  venue: string;
  tier: string;
  note: string;
  status: ReqStatus;
}

export const SLOT_REQUESTS: readonly SlotRequest[] = [
  {
    id: 1,
    host: 'Arjun (Pulse Collective)',
    eventName: 'Bassline Nights',
    date: 'Sat, Aug 22',
    time: '11:00 PM – 4:00 AM',
    venue: 'Skyline Rooftop',
    tier: 'GA + VIP Table',
    note: 'Recurring monthly slot, expecting 300+ turnout.',
    status: 'pending',
  },
  {
    id: 2,
    host: 'Zoya (Nightowl)',
    eventName: 'Retro Fridays',
    date: 'Fri, Sep 5',
    time: '10:00 PM – 3:00 AM',
    venue: 'Skyline Rooftop',
    tier: 'General Admission',
    note: 'First-time booking, promo push planned across her list.',
    status: 'pending',
  },
  {
    id: 3,
    host: 'Kabir M.',
    eventName: 'Sunday Sessions',
    date: 'Sun, Aug 30',
    time: '5:00 PM – 10:00 PM',
    venue: 'Skyline Rooftop',
    tier: 'General Admission',
    note: 'Daytime chill set, smaller crowd expected.',
    status: 'approved',
  },
  {
    id: 4,
    host: 'Riya (House parties)',
    eventName: 'Basement Static',
    date: 'Sat, Aug 16',
    time: '11:00 PM – 5:00 AM',
    venue: 'Skyline Rooftop',
    tier: 'GA + VIP Table',
    note: 'Clashes with an existing booking that night.',
    status: 'rejected',
  },
];

export const REQ_DOT: Record<ReqStatus, string> = {
  pending: '#ffb020',
  approved: '#6ee79b',
  rejected: '#f0857a',
};

// ── partners ────────────────────────────────────────────────────────────────

export interface PartnerCard {
  name: string;
  role: string;
  status: string;
  action: string;
  reqType?: 'incoming' | 'outgoing';
}

export const PARTNER_DATA: Record<'venues' | 'promoters' | 'staff', readonly PartnerCard[]> = {
  venues: [
    {
      name: 'Skyline Rooftop',
      role: 'Bandra West · 400 cap',
      status: 'Partnered',
      action: 'Request a date',
    },
    {
      name: 'The Docks',
      role: 'Lower Parel · 600 cap',
      status: 'Invite sent',
      action: 'Send reminder',
    },
    {
      name: 'Garden Terrace',
      role: 'Andheri · 250 cap',
      status: 'Partnered',
      action: 'Request a date',
    },
    {
      name: 'Basement 9',
      role: 'Colaba · 300 cap',
      status: 'Waiting on them',
      action: 'Send reminder',
    },
    { name: 'The Loft', role: 'Powai · 180 cap', status: 'Partnered', action: 'Request a date' },
    {
      name: 'Neon Warehouse',
      role: 'Sewri · 800 cap',
      status: 'Invite sent',
      action: 'Send reminder',
    },
  ],
  promoters: [
    {
      name: 'Arjun (Pulse Collective)',
      role: '124 tickets driven',
      status: 'Partnered',
      action: 'Assign to event',
    },
    {
      name: 'Zoya (Nightowl)',
      role: '88 tickets driven',
      status: 'Partnered',
      action: 'Assign to event',
    },
    { name: 'Kabir M.', role: '56 tickets driven', status: 'Invite sent', action: 'Send reminder' },
    {
      name: 'Riya (House parties)',
      role: '31 tickets driven',
      status: 'Waiting on them',
      action: 'Send reminder',
    },
  ],
  staff: [
    { name: 'Maya S.', role: 'Door lead · Full access', status: 'Active', action: 'Manage access' },
    { name: 'Ravi K.', role: 'Check-in · Scan only', status: 'Active', action: 'Manage access' },
    { name: 'Tina D.', role: 'Bar · Menu & orders', status: 'Active', action: 'Manage access' },
    { name: 'Add teammate', role: 'Invite by phone or email', status: '', action: '+ Add staff' },
  ],
};

export const DISCOVER_DATA: Record<'venues' | 'promoters', readonly PartnerCard[]> = {
  venues: [
    { name: 'Aria Sky Lounge', role: 'Worli · 350 cap', status: '', action: 'Invite to partner' },
    { name: 'The Vault', role: 'Fort · 220 cap', status: '', action: 'Invite to partner' },
    { name: 'Hillside Terrace', role: 'Juhu · 280 cap', status: '', action: 'Invite to partner' },
  ],
  promoters: [
    {
      name: 'Vikram (Loud Nights)',
      role: '62 tickets driven',
      status: '',
      action: 'Invite to partner',
    },
    {
      name: 'Sana (Echo Crew)',
      role: '40 tickets driven',
      status: '',
      action: 'Invite to partner',
    },
  ],
};

export const PROMO_REQUESTS: readonly PartnerCard[] = [
  {
    name: 'Rhea (Afterglow)',
    role: 'Wants to promote your events',
    status: '',
    action: 'Accept',
    reqType: 'incoming',
  },
  {
    name: 'Kabir M.',
    role: 'Invite sent 4 days ago',
    status: '',
    action: 'Send reminder',
    reqType: 'outgoing',
  },
  {
    name: 'Riya (House parties)',
    role: 'Invite sent 9 days ago',
    status: '',
    action: 'Send reminder',
    reqType: 'outgoing',
  },
];

export const STATUS_COLORS: Record<string, string> = {
  Partnered: '#6ee79b',
  'Invite sent': '#ff8a55',
  'Waiting on them': '#ffb020',
  Active: '#6ee79b',
};

export const PERM_DEFS = [
  'Door check-in',
  'Finance view',
  'Event editing',
  'Guest messaging',
] as const;

export const STAFF_PERMS: Record<string, readonly string[]> = {
  'Maya S.': ['Door check-in', 'Event editing'],
  'Ravi K.': ['Door check-in'],
  'Tina D.': ['Finance view', 'Guest messaging'],
};

export const permChip = (on: boolean): string =>
  `border:none;cursor:pointer;padding:5px 12px;border-radius:999px;font-size:11.5px;font-weight:700;` +
  (on
    ? `background:#ff5a1f;color:#0a0a0a;`
    : `background:transparent;color:#8a8a86;border:1px solid rgba(255,255,255,0.14);`);

export const partnerStatusGlass =
  'display:inline-flex;align-items:center;gap:6px;background:rgba(0,0,0,0.42);backdrop-filter:blur(10px);' +
  'border:1px solid rgba(255,255,255,0.16);color:#fff;padding:5px 11px;border-radius:999px;' +
  'font-size:11px;font-weight:700;';

export const glassPillBtn =
  'width:100%;text-align:center;background:rgba(255,255,255,0.14);backdrop-filter:blur(12px);' +
  'border:1px solid rgba(255,255,255,0.22);color:#fff;padding:12px;border-radius:999px;' +
  'font-size:13px;font-weight:700;cursor:pointer;';

// ── event detail ────────────────────────────────────────────────────────────

export const EVENT_GUESTS = [
  { name: 'Aisha Menon', tier: '2× VIP Entry', tag: 'VIP', check: 'Checked in' },
  { name: 'Karan Shah', tier: '1× General Admission', tag: 'Repeat', check: 'Checked in' },
  { name: 'Devansh Iyer', tier: '4× General Admission', tag: 'New', check: 'Not yet' },
  { name: 'Priya Kapoor', tier: '1× VIP Table', tag: 'VIP', check: 'Checked in' },
  { name: 'Nikhil Verma', tier: '2× General Admission', tag: 'Repeat', check: 'Not yet' },
  { name: 'Sara D’Souza', tier: '1× VIP Entry', tag: 'New', check: 'Not yet' },
] as const;

export const GUEST_TAG_COLORS: Record<string, readonly [string, string]> = {
  VIP: ['rgba(255,90,31,0.14)', '#ff8a55'],
  Repeat: ['rgba(110,231,155,0.14)', '#6ee79b'],
  New: ['rgba(255,255,255,0.08)', '#c9c9c6'],
};

export const WALKINS = [
  { name: 'Rohan Das', meta: 'GA · Paid ₹1,200 cash', time: '9:42 PM' },
  { name: 'Tanya Bhat', meta: 'GA · Paid ₹1,200 card', time: '9:38 PM' },
  { name: 'Vikram S.', meta: 'VIP · Paid ₹4,000 UPI', time: '9:31 PM' },
  { name: 'Neha Pillai', meta: 'GA · Paid ₹1,200 UPI', time: '9:25 PM' },
] as const;

export const PROMOTERS = [
  { rank: '1', name: 'Arjun (Pulse Collective)', tickets: '124', owed: '₹18,600' },
  { rank: '2', name: 'Zoya (Nightowl)', tickets: '88', owed: '₹13,200' },
  { rank: '3', name: 'Kabir M.', tickets: '56', owed: '₹8,400' },
  { rank: '4', name: 'Riya (House parties)', tickets: '31', owed: '₹4,650' },
] as const;

// ── create event ────────────────────────────────────────────────────────────

export const GENRE_CHIPS: readonly (readonly [string, boolean])[] = [
  ['Afrobeats', true],
  ['House', false],
  ['Techno', false],
  ['Bollywood', false],
  ['Hip-hop', false],
];

export const TIER_DEFS: readonly (readonly [string, number, number])[] = [
  ['General Admission', 1500, 300],
  ['VIP Entry', 3000, 80],
  ['VIP Table', 25000, 20],
];

export const TABLE_DEFS: readonly (readonly [string, number])[] = [
  ['Table A1', 6],
  ['Table A2', 6],
  ['Table B1', 10],
  ['Table B2', 10],
  ['VIP Booth', 14],
  ['Rooftop Cabana', 8],
];

export const AUG_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

// ── marketing ───────────────────────────────────────────────────────────────

export type Channel = 'whatsapp' | 'sms' | 'email' | 'push';
export type Audience = 'event' | 'all' | 'custom';

export const CH_NAME: Record<Channel, string> = {
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  email: 'Email',
  push: 'Push',
};

export const CH_ICON: Record<Channel, string> = {
  sms: 'message-square',
  whatsapp: 'message-circle',
  email: 'mail',
  push: 'bell',
};

export const CH_BRAND: Record<Channel, { glow: string; color: string; bg: string }> = {
  whatsapp: { glow: 'rgba(37,211,102,0.45)', color: '#25d366', bg: 'rgba(37,211,102,0.16)' },
  sms: { glow: 'rgba(10,132,255,0.45)', color: '#0a84ff', bg: 'rgba(10,132,255,0.16)' },
  email: { glow: 'rgba(139,92,246,0.45)', color: '#a78bfa', bg: 'rgba(139,92,246,0.16)' },
  push: { glow: 'rgba(255,90,31,0.5)', color: '#ff8a55', bg: 'rgba(255,90,31,0.16)' },
};

export const STATUS_BG: Record<Channel, string> = {
  whatsapp: '#1f2c34',
  sms: '#000',
  email: '#faf9fb',
  push: 'transparent',
};

export const BUBBLE_GRAD: Record<Channel, string> = {
  sms: '#2c6bed',
  whatsapp: '#1f9d55',
  email: '#262626',
  push: '#262626',
};

export const RECIPIENTS: Record<Audience, string> = {
  event: '2,140',
  all: '8,420',
  custom: '640',
};

export const DEFAULT_COMPOSER_TEXT =
  'Hi {{name}}, doors open at 9PM tonight for Neon Nights 🔥 Show this message at the door to skip the line. See you on the rooftop!';

export const PHONE_SHELL =
  'position:relative;z-index:1;width:330px;margin:0 auto;height:640px;background:#000;' +
  'border-radius:48px;padding:10px;box-shadow:0 34px 80px rgba(0,0,0,0.6);border:2px solid #26262a;';

export const PHONE_SCREEN =
  'width:100%;height:100%;border-radius:40px;overflow:hidden;display:flex;flex-direction:column;' +
  'position:relative;background:#000;';

export const CAMPAIGNS = [
  {
    title: 'Neon Nights — last call for tickets',
    meta: 'Sent Jul 14 · Neon Nights guests',
    channel: 'SMS',
    icon: 'message-square',
    sent: 2140,
    read: 1880,
    clicked: 642,
  },
  {
    title: 'Sunset Sessions announcement',
    meta: 'Sent Jul 8 · All guests',
    channel: 'WhatsApp',
    icon: 'message-circle',
    sent: 8420,
    read: 7190,
    clicked: 2310,
  },
  {
    title: 'Thank you for coming!',
    meta: 'Sent Jun 30 · Monsoon Sessions guests',
    channel: 'Email',
    icon: 'mail',
    sent: 1960,
    read: 1120,
    clicked: 488,
  },
  {
    title: 'Early-bird VIP tables open',
    meta: 'Sent Jun 22 · VIP guests',
    channel: 'Push',
    icon: 'bell',
    sent: 640,
    read: 590,
    clicked: 214,
  },
] as const;

export const TEMPLATES = [
  {
    name: 'Event announcement',
    icon: 'megaphone',
    channel: 'WhatsApp',
    chIcon: 'message-circle',
    preview:
      'Hey {name}! We just dropped a new night you won’t want to miss. Grab early-bird tickets before they’re gone 🔥',
  },
  {
    name: 'Last-call reminder',
    icon: 'clock',
    channel: 'SMS',
    chIcon: 'message-square',
    preview:
      'Only a few tickets left for tonight, {name}. Doors at 9PM — tap the link to lock yours in.',
  },
  {
    name: 'Thank-you note',
    icon: 'heart',
    channel: 'Email',
    chIcon: 'mail',
    preview:
      'Thanks for coming out, {name}! Here’s 15% off your next night with us. See you on the dancefloor soon.',
  },
] as const;

export const AUDIENCE_CHOICES = [
  {
    id: 'event' as Audience,
    label: "This event's guests",
    sub: 'Neon Nights: Afrobeats Edition',
    count: '2,140',
  },
  {
    id: 'all' as Audience,
    label: 'All guests',
    sub: 'Everyone who has ever attended',
    count: '8,420',
  },
  {
    id: 'custom' as Audience,
    label: 'Custom filter',
    sub: 'VIP · Repeat · New — pick your own',
    count: 'Select…',
  },
] as const;

export const CHANNEL_CHOICES: readonly (readonly [Channel, string, string])[] = [
  ['sms', 'SMS', 'message-square'],
  ['whatsapp', 'WhatsApp', 'message-circle'],
  ['email', 'Email', 'mail'],
  ['push', 'Push', 'bell'],
];

export const chTag =
  'display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;padding:4px 11px;' +
  'border-radius:999px;background:rgba(255,90,31,0.14);color:#ff8a55;';

// ── finance ─────────────────────────────────────────────────────────────────

export const PAYOUTS = [
  {
    date: 'Fri, Jul 18',
    detail: 'Scheduled · Neon Nights + 2 events',
    status: 'Scheduled',
    amount: '₹4,86,200',
  },
  {
    date: 'Fri, Jul 11',
    detail: 'HDFC ••4412 · Sunset Sessions',
    status: 'Paid',
    amount: '₹3,88,000',
  },
  {
    date: 'Fri, Jul 4',
    detail: 'HDFC ••4412 · Monsoon Sessions',
    status: 'Paid',
    amount: '₹7,05,000',
  },
  {
    date: 'Fri, Jun 27',
    detail: 'HDFC ••4412 · Bollywood Brunch',
    status: 'Paid',
    amount: '₹2,34,000',
  },
  {
    date: 'Fri, Jun 20',
    detail: 'HDFC ••4412 · Warehouse Rave',
    status: 'Paid',
    amount: '₹1,64,000',
  },
] as const;

export const PAY_STATUS_COLORS: Record<string, readonly [string, string]> = {
  Paid: ['rgba(110,231,155,0.14)', '#6ee79b'],
  Scheduled: ['rgba(255,90,31,0.14)', '#ff8a55'],
};

export type OrderStatus = 'Confirmed' | 'Refunded' | 'Cancelled' | 'Pending';

export interface Order {
  name: string;
  orderNo: string;
  tickets: number;
  event: string;
  status: OrderStatus;
  amountN: number;
  date: string;
}

export const ORDERS: readonly Order[] = [
  {
    name: 'Priya Kapoor',
    orderNo: '#8823',
    tickets: 5,
    event: 'Neon Nights',
    status: 'Confirmed',
    amountN: 28000,
    date: '4m ago',
  },
  {
    name: 'Aisha Menon',
    orderNo: '#8822',
    tickets: 2,
    event: 'Neon Nights',
    status: 'Confirmed',
    amountN: 5000,
    date: '22m ago',
  },
  {
    name: 'Karan Shah',
    orderNo: '#8821',
    tickets: 1,
    event: 'Neon Nights',
    status: 'Pending',
    amountN: 1800,
    date: '1h ago',
  },
  {
    name: 'Meera Rao',
    orderNo: '#8815',
    tickets: 1,
    event: 'Warehouse Rave',
    status: 'Refunded',
    amountN: 1800,
    date: '3h ago',
  },
  {
    name: 'Devansh Iyer',
    orderNo: '#8810',
    tickets: 4,
    event: 'Neon Nights',
    status: 'Confirmed',
    amountN: 7200,
    date: '5h ago',
  },
  {
    name: 'Sara D’Souza',
    orderNo: '#8804',
    tickets: 1,
    event: 'Sunset Sessions',
    status: 'Cancelled',
    amountN: 2500,
    date: '8h ago',
  },
];

export const ORDER_STATUS_COLORS: Record<OrderStatus, readonly [string, string]> = {
  Confirmed: ['rgba(110,231,155,0.14)', '#6ee79b'],
  Refunded: ['rgba(240,133,122,0.12)', '#f0857a'],
  Cancelled: ['rgba(255,255,255,0.06)', '#8a8a86'],
  Pending: ['rgba(255,176,32,0.14)', '#ffb020'],
};

export const ORDER_STATUS_FILTERS = [
  'All',
  'Confirmed',
  'Pending',
  'Refunded',
  'Cancelled',
] as const;

// ── door mode ───────────────────────────────────────────────────────────────

export const DOOR_GUESTS = [
  { name: 'Aisha Menon', tier: '2× VIP Entry', done: true },
  { name: 'Karan Shah', tier: '1× General Admission', done: true },
  { name: 'Devansh Iyer', tier: '4× General Admission', done: false },
  { name: 'Priya Kapoor', tier: '1× VIP Table', done: true },
  { name: 'Nikhil Verma', tier: '2× General Admission', done: false },
] as const;

export const DOOR_LOG = [
  {
    text: 'Refused entry — invalid ticket',
    time: '9:44 PM',
    type: 'incident',
    icon: 'triangle-alert',
  },
  { text: 'VIP section at capacity', time: '9:30 PM', type: 'note', icon: 'sticky-note' },
  { text: 'Guest list closed for GA', time: '9:15 PM', type: 'note', icon: 'sticky-note' },
] as const;

export const PAY_TYPES = ['Cash', 'Card', 'UPI'] as const;

export const payChip = (on: boolean): string =>
  `flex:1;border:1px solid ${on ? '#ff5a1f' : 'rgba(255,255,255,0.1)'};` +
  `background:${on ? 'rgba(255,90,31,0.12)' : '#0d0d0d'};color:${on ? '#ff8a55' : '#8a8a86'};` +
  `padding:11px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;`;

// ── settings ────────────────────────────────────────────────────────────────

export const PRESENCE_STATS = [
  { label: 'Followers', value: '12.4k' },
  { label: 'Events hosted', value: '84' },
  { label: 'Avg. rating', value: '4.8' },
] as const;

export const HIGHLIGHTS = ['Rooftop views', 'Afrobeats', 'Bottle service', '21+'] as const;

export const MENU_ITEMS = [
  { name: 'House Pour Whisky', cat: 'Spirits', price: '₹450' },
  { name: 'Craft Beer (Pint)', cat: 'Beer', price: '₹350' },
  { name: 'Espresso Martini', cat: 'Cocktails', price: '₹550' },
  { name: 'Bottle — Grey Goose', cat: 'Bottle service', price: '₹12,000' },
  { name: 'Loaded Nachos', cat: 'Food', price: '₹400' },
] as const;

export const ACCOUNT_ROWS = [
  { icon: 'building-2', title: 'Business profile', sub: 'Rhea Kapoor Events LLP · GST verified' },
  { icon: 'users', title: 'Team & staff', sub: 'Managed in Partners → Staff' },
  { icon: 'bell', title: 'Notifications', sub: 'Sales alerts, payout reminders, door pings' },
  { icon: 'shield', title: 'Privacy & security', sub: 'Login, guest data handling, exports' },
] as const;
