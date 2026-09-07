import type {
  PromoterEvent,
  PromoterFinanceSummary,
  PromoterOverview,
  PromoterNetworkProfileData,
  PromoterPartner,
  PromoterProfile,
  PromoterRepository,
  PromoterTrackingLink,
} from './contracts';

const profile: PromoterProfile = {
  id: 'promoter-nightowl',
  name: 'Zoya Mehta',
  handle: '@nightowl',
  bio: 'Building the city’s best after-dark plans. House, hip-hop and rooftop energy across Mumbai.',
  city: 'Mumbai',
  verified: true,
  completion: 84,
  categories: ['House', 'Hip-hop', 'Rooftops'],
  followers: 12400,
  eventsPromoted: 38,
};

const linkedEvents: readonly PromoterEvent[] = [
  { id: 'neon-nights', name: 'Neon Nights', date: 'Fri, 18 Jul', time: '9:00 PM', venue: 'Skyline Social', host: 'Rhea Kapoor Events', city: 'Mumbai', status: 'active', category: 'Afrobeats · House', commissionLabel: '₹180 / ticket', clicks: 1842, tickets: 56, earningsPaise: 1008000, conversion: 8.4, accent: 'linear-gradient(135deg,#ff5a1f,#6d1600)' },
  { id: 'bassline-nights', name: 'Bassline Nights', date: 'Sat, 22 Aug', time: '11:00 PM', venue: 'The Docks', host: 'Pulse Collective', city: 'Mumbai', status: 'active', category: 'Bass · Techno', commissionLabel: '12% net sales', clicks: 982, tickets: 31, earningsPaise: 744000, conversion: 6.9, accent: 'linear-gradient(135deg,#582fff,#180c63)' },
  { id: 'sunset-sessions', name: 'Sunset Sessions', date: 'Sun, 30 Aug', time: '5:30 PM', venue: 'Garden Terrace', host: 'High Spirits', city: 'Mumbai', status: 'invited', category: 'Disco · Sundowner', commissionLabel: '₹150 / ticket', clicks: 0, tickets: 0, earningsPaise: 0, conversion: 0, accent: 'linear-gradient(135deg,#ffb020,#7a3a00)' },
];

const discoverEvents: readonly PromoterEvent[] = [
  { id: 'warehouse-ritual', name: 'Warehouse Ritual', date: 'Fri, 4 Sep', time: '10:00 PM', venue: 'Neon Warehouse', host: 'Afterdark Club', city: 'Mumbai', status: 'requested', category: 'Techno', commissionLabel: '15% net sales', clicks: 0, tickets: 0, earningsPaise: 0, conversion: 0, accent: 'linear-gradient(135deg,#0d7a6e,#03231f)' },
  { id: 'terrace-theory', name: 'Terrace Theory', date: 'Sat, 12 Sep', time: '7:00 PM', venue: 'The Loft', host: 'Sonder Social', city: 'Pune', status: 'requested', category: 'Indie · House', commissionLabel: '₹220 / ticket', clicks: 0, tickets: 0, earningsPaise: 0, conversion: 0, accent: 'linear-gradient(135deg,#be185d,#3a071c)' },
  { id: 'midnight-market', name: 'Midnight Market', date: 'Sat, 19 Sep', time: '8:00 PM', venue: 'Basement 9', host: 'City Culture Co.', city: 'Mumbai', status: 'requested', category: 'Culture · Food', commissionLabel: '10% net sales', clicks: 0, tickets: 0, earningsPaise: 0, conversion: 0, accent: 'linear-gradient(135deg,#4b5563,#111827)' },
];

const partners: readonly PromoterPartner[] = [
  { id: 'skyline', kind: 'venue', name: 'Skyline Social', city: 'Mumbai', category: 'Rooftop · 400 capacity', verified: true, status: 'partnered', eventsTogether: 12, responseTime: '< 2 hours', accent: 'linear-gradient(135deg,#ff5a1f,#7a2205)' },
  { id: 'docks', kind: 'venue', name: 'The Docks', city: 'Mumbai', category: 'Warehouse · 600 capacity', verified: true, status: 'pending', eventsTogether: 3, responseTime: '< 1 day', accent: 'linear-gradient(135deg,#0d7a6e,#042b27)' },
  { id: 'rhea', kind: 'host', name: 'Rhea Kapoor Events', city: 'Mumbai', category: 'House · Afrobeats', verified: true, status: 'partnered', eventsTogether: 8, responseTime: '< 3 hours', accent: 'linear-gradient(135deg,#be185d,#4c1028)' },
  { id: 'pulse', kind: 'host', name: 'Pulse Collective', city: 'Mumbai', category: 'Bass · Techno', verified: true, status: 'partnered', eventsTogether: 5, responseTime: '< 4 hours', accent: 'linear-gradient(135deg,#582fff,#1d115a)' },
  { id: 'sonder', kind: 'host', name: 'Sonder Social', city: 'Pune', category: 'Indie · Sundowners', verified: false, status: 'discover', eventsTogether: 0, responseTime: '< 1 day', accent: 'linear-gradient(135deg,#ffb020,#734600)' },
];

const finance: PromoterFinanceSummary = {
  availablePaise: 4862000,
  pendingPaise: 1240000,
  lifetimePaise: 18642000,
  nextPayout: 'Fri, 25 Jul',
  payoutAccount: 'HDFC ••4412',
  kycStatus: 'verified',
  payouts: [
    { id: 'pay-jul-11', date: '11 Jul 2026', amountPaise: 3280000, status: 'paid' },
    { id: 'pay-jun-27', date: '27 Jun 2026', amountPaise: 2140000, status: 'paid' },
    { id: 'pay-jun-13', date: '13 Jun 2026', amountPaise: 1760000, status: 'paid' },
  ],
  adjustments: [
    { id: 'adj-neon-refund', eventName: 'Neon Nights', label: '2 refunded tickets', amountPaise: -36000, date: '16 Jul 2026' },
    { id: 'adj-bassline-bonus', eventName: 'Bassline Nights', label: '30-ticket campaign bonus', amountPaise: 120000, date: '12 Jul 2026' },
  ],
};

const links: readonly PromoterTrackingLink[] = [
  { id: 'lnk-instagram-neon', eventId: 'neon-nights', eventName: 'Neon Nights', channel: 'Instagram', label: 'Main story', shortUrl: 'c1rcle.in/zoya/neon', status: 'active', clicks: 1184, purchases: 42, earningsPaise: 756000 },
  { id: 'lnk-whatsapp-neon', eventId: 'neon-nights', eventName: 'Neon Nights', channel: 'WhatsApp', label: 'Close friends', shortUrl: 'c1rcle.in/zoya/neon-wa', status: 'active', clicks: 658, purchases: 14, earningsPaise: 252000 },
  { id: 'lnk-bassline-bio', eventId: 'bassline-nights', eventName: 'Bassline Nights', channel: 'Bio link', label: 'August bio', shortUrl: 'c1rcle.in/zoya/bassline', status: 'active', clicks: 982, purchases: 31, earningsPaise: 744000 },
];

const overview: PromoterOverview = {
  profile,
  nextEvent: linkedEvents[0] ?? null,
  recentOrders: [
    { id: 'order-4812', eventName: 'Neon Nights', createdAt: '4 minutes ago', ticketCount: 2, channel: 'Instagram · Main story', commissionPaise: 36000, status: 'confirmed' },
    { id: 'order-4807', eventName: 'Bassline Nights', createdAt: '18 minutes ago', ticketCount: 3, channel: 'Bio link', commissionPaise: 72000, status: 'confirmed' },
    { id: 'order-4799', eventName: 'Neon Nights', createdAt: '42 minutes ago', ticketCount: 1, channel: 'WhatsApp', commissionPaise: 18000, status: 'confirmed' },
    { id: 'order-4760', eventName: 'Neon Nights', createdAt: 'Yesterday', ticketCount: 2, channel: 'Instagram · Main story', commissionPaise: -36000, status: 'refunded' },
  ],
  performance: [18, 27, 22, 38, 41, 56, 63, 58, 74, 81, 96, 112, 108, 126],
  calendar: [
    { date: '18 Jul', label: 'Neon Nights', type: 'event' },
    { date: '22 Jul', label: 'Sunset Sessions response due', type: 'deadline' },
    { date: '25 Jul', label: 'Commission payout', type: 'payout' },
    { date: '22 Aug', label: 'Bassline Nights', type: 'event' },
  ],
};

const ticketTotal = linkedEvents.reduce((total, event) => total + event.tickets, 0);
const clickTotal = linkedEvents.reduce((total, event) => total + event.clicks, 0);
const networkProfile: PromoterNetworkProfileData = {
  profile,
  stats: {
    ticketsMoved: ticketTotal,
    trackedConversion: clickTotal ? (ticketTotal / clickTotal) * 100 : 0,
    eventsPromoted: profile.eventsPromoted,
    audienceReach: profile.followers,
    repeatPartners: partners.filter((partner) => partner.eventsTogether > 1).length,
    typicalResponse: '< 4h',
  },
  recentCollaborators: partners
    .filter((partner) => partner.status === 'partnered')
    .slice(0, 4)
    .map(({ id, kind, name, eventsTogether }) => ({ id, kind, name, eventsTogether })),
};

export const fixturePromoterRepository: PromoterRepository = {
  getOverview() { return Promise.resolve(overview); },
  getLinkedEvents() { return Promise.resolve(linkedEvents); },
  discoverEvents() { return Promise.resolve(discoverEvents); },
  getPartners() { return Promise.resolve(partners); },
  getFinance() { return Promise.resolve(finance); },
  getLinks() { return Promise.resolve(links); },
  getProfile() { return Promise.resolve(profile); },
  getNetworkProfile() { return Promise.resolve(networkProfile); },
  createTrackingLink(input) {
    const event = linkedEvents.find((candidate) => candidate.id === input.eventId);
    const normalizedChannel = input.channel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const link: PromoterTrackingLink = {
      id: `preview-${input.eventId}-${normalizedChannel}`,
      eventId: input.eventId,
      eventName: event?.name ?? 'Linked event',
      channel: input.channel,
      label: input.label?.trim() ? input.label.trim() : 'Campaign',
      shortUrl: `c1rcle.in/zoya/${input.eventId}-${normalizedChannel}`,
      status: 'active',
      clicks: 0,
      purchases: 0,
      earningsPaise: 0,
    };
    return Promise.resolve(link);
  },
};
