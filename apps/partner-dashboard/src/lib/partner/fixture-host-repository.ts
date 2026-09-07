import type {
  HostOverview,
  HostRepository,
  PartnerAnalyticsSummary,
  PartnerEventDetail,
  PartnerEventSummary,
  PartnerFinanceSummary,
  PartnerOrganizationSummary,
  PartnerProfile,
  PartnerRelationship,
} from './contracts';

const profile: PartnerProfile = {
  id: 'host-high-spirits',
  name: 'High Spirits Collective',
  handle: '@highspirits',
  city: 'Pune',
  verified: true,
  completion: 92,
  description: 'Independent culture collective producing intimate rooms, rooftop sessions and community-led nights.',
  categories: ['Live music', 'Indie', 'Culture'],
};

const events: readonly PartnerEventSummary[] = [
  { id: 'rooftop-jazz', name: 'Rooftop Jazz', date: 'Fri, 18 Sep', time: '7:30 PM', venue: 'Skyline Social', host: profile.name, city: 'Pune', status: 'on-sale', category: 'Live music', ticketsSold: 184, capacity: 260, grossPaise: 14720000, checkIns: 0, accent: 'linear-gradient(135deg,#c15c98,#4a173b)' },
  { id: 'after-hours', name: 'After Hours', date: 'Sat, 26 Sep', time: '10:00 PM', venue: 'The Docks', host: profile.name, city: 'Mumbai', status: 'scheduled', category: 'Electronic', ticketsSold: 92, capacity: 400, grossPaise: 9200000, checkIns: 0, accent: 'linear-gradient(135deg,#582fff,#160a54)' },
  { id: 'soul-sunday', name: 'Soul Sunday', date: 'Sun, 4 Oct', time: '5:00 PM', venue: 'Garden Terrace', host: profile.name, city: 'Pune', status: 'draft', category: 'Sundowner', ticketsSold: 0, capacity: 220, grossPaise: 0, checkIns: 0, accent: 'linear-gradient(135deg,#ffb020,#783c00)' },
  { id: 'mono-room', name: 'Mono Room', date: 'Fri, 10 Jul', time: '9:00 PM', venue: 'Basement 9', host: profile.name, city: 'Pune', status: 'completed', category: 'Alternative', ticketsSold: 208, capacity: 240, grossPaise: 16640000, checkIns: 196, accent: 'linear-gradient(135deg,#56616f,#15191f)' },
];

const detailFor = (event: PartnerEventSummary): PartnerEventDetail => ({
  ...event,
  description: 'A carefully programmed room designed around sound, conversation and the people who keep the city moving.',
  ticketTiers: [
    { id: 'early', name: 'Early access', pricePaise: 60000, sold: Math.min(event.ticketsSold, 80), inventory: 80 },
    { id: 'general', name: 'General admission', pricePaise: 80000, sold: Math.max(event.ticketsSold - 80, 0), inventory: Math.max(event.capacity - 80, 0) },
  ],
  promoterCount: 6,
  salesTrend: [8, 14, 12, 21, 28, 34, 31, 46, 54, 62, 78, 91],
  audienceCities: [{ label: event.city, value: 68 }, { label: 'Mumbai', value: 19 }, { label: 'Bengaluru', value: 8 }, { label: 'Other', value: 5 }],
  attribution: [{ label: 'Host profile', clicks: 1460, tickets: 79 }, { label: 'Promoter links', clicks: 1120, tickets: 64 }, { label: 'Explore', clicks: 890, tickets: 41 }],
});

const relationships: readonly PartnerRelationship[] = [
  { id: 'skyline', kind: 'venue', name: 'Skyline Social', city: 'Pune', verified: true, status: 'partnered', eventsTogether: 9, responseTime: '< 2 hours', categories: ['Rooftop', 'Live music'] },
  { id: 'docks', kind: 'venue', name: 'The Docks', city: 'Mumbai', verified: true, status: 'partnered', eventsTogether: 4, responseTime: '< 1 day', categories: ['Warehouse', 'Electronic'] },
  { id: 'nightowl', kind: 'promoter', name: 'Night Owl', city: 'Mumbai', verified: true, status: 'partnered', eventsTogether: 7, responseTime: '< 4 hours', categories: ['House', 'Rooftops'] },
  { id: 'sonder', kind: 'promoter', name: 'Sonder Social', city: 'Pune', verified: false, status: 'pending', eventsTogether: 1, responseTime: '< 1 day', categories: ['Indie', 'Culture'] },
];

const finance: PartnerFinanceSummary = {
  availablePaise: 8320000,
  pendingPaise: 5140000,
  lifetimePaise: 48620000,
  nextPayout: 'Fri, 25 Sep',
  payoutAccount: 'HDFC ••4412',
  payouts: [
    { id: 'pay-901', createdAt: '25 Aug', amountPaise: 6240000, status: 'paid', accountLabel: 'HDFC ••4412' },
    { id: 'pay-902', createdAt: '25 Jul', amountPaise: 7180000, status: 'paid', accountLabel: 'HDFC ••4412' },
    { id: 'pay-903', createdAt: '25 Sep', amountPaise: 8320000, status: 'scheduled', accountLabel: 'HDFC ••4412' },
  ],
};

const overview: HostOverview = {
  profile,
  nextEvent: events[0] ?? null,
  recentOrders: [
    { id: 'host-order-1', eventId: 'rooftop-jazz', eventName: 'Rooftop Jazz', createdAt: '8 minutes ago', ticketCount: 2, channel: 'Explore', amountPaise: 160000, status: 'confirmed' },
    { id: 'host-order-2', eventId: 'after-hours', eventName: 'After Hours', createdAt: '24 minutes ago', ticketCount: 3, channel: 'Partner link', amountPaise: 300000, status: 'confirmed' },
    { id: 'host-order-3', eventId: 'rooftop-jazz', eventName: 'Rooftop Jazz', createdAt: 'Yesterday', ticketCount: 1, channel: 'Host profile', amountPaise: 80000, status: 'refunded' },
  ],
  performance: [12, 18, 16, 27, 33, 42, 38, 51, 64, 72, 81, 96, 108, 124],
  calendar: [
    { date: '18 Sep', label: 'Rooftop Jazz', type: 'event' },
    { date: '21 Sep', label: 'After Hours artwork due', type: 'deadline' },
    { date: '25 Sep', label: 'Payout scheduled', type: 'payout' },
    { date: '26 Sep', label: 'After Hours', type: 'event' },
  ],
};

const organizations: readonly PartnerOrganizationSummary[] = [
  { id: 'host-high-spirits', role: 'host', name: 'High Spirits Collective', verified: true },
];

export const fixtureHostRepository: HostRepository = {
  getOrganizations() { return Promise.resolve(organizations); },
  getOverview() { return Promise.resolve(overview); },
  getEvents() { return Promise.resolve(events); },
  getEvent(eventId) { return Promise.resolve(events.find((event) => event.id === eventId)).then((event) => event ? detailFor(event) : null); },
  getEventAnalytics(eventId) {
    const event = events.find((candidate) => candidate.id === eventId);
    if (!event) return Promise.resolve(null);
    const analytics: PartnerAnalyticsSummary = {
      ticketsSold: event.ticketsSold,
      grossPaise: event.grossPaise,
      conversion: 7.8,
      checkInRate: event.ticketsSold ? (event.checkIns / event.ticketsSold) * 100 : 0,
      salesTrend: [8, 14, 12, 21, 28, 34, 31, 46, 54, 62, 78, 91],
    };
    return Promise.resolve(analytics);
  },
  getPartners() { return Promise.resolve(relationships); },
  getFinance() { return Promise.resolve(finance); },
  getProfile() { return Promise.resolve(profile); },
};
