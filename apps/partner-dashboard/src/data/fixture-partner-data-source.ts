import type {
  CalendarBlock,
  CalendarDayState,
  CalendarEvent,
  CalendarMonth,
  DoorActivityRecord,
  DoorEventData,
  DoorModeData,
  EventEditorData,
  EventEditorDraft,
  EventEditorPromoterOption,
  EventEditorVenueOption,
  EventGuestsData,
  EventOperationsData,
  EventPromotersData,
  EventSalesData,
  EventSalesTone,
  HostAvailabilityData,
  HostEventsData,
  HostFinanceData,
  HostPartnersData,
  HostSlotRequestsData,
  MarketingAttendee,
  MarketingCampaign,
  MarketingData,
  MarketingEventOption,
  MarketingTemplate,
  OverviewData,
  OverviewTrendMetric,
  OverviewTrendRange,
  PartnerDataSource,
  PartnerEventDetailData,
  PartnerEventRecord,
  PartnerNotificationsData,
  PartnerRelationshipSet,
  PartnerSearchData,
  PartnerSearchResult,
  PartnerSettingsData,
  PartnerShellInteractionData,
  PromoterAnalyticsData,
  PromoterDiscoverEvent,
  PromoterEventsData,
  PromoterFinanceData,
  PromoterGuestEventOption,
  PromoterGuestsData,
  PromoterLeaderboardData,
  PromoterLinkedEvent,
  PromoterOverviewData,
  PromoterPartnerRecord,
  PromoterPartnersData,
  PromoterLinkPerformance,
  SlotRequest,
  SlotRequestEvent,
  StudioShellData,
  VenueEventsData,
  VenueFinanceData,
  VenuePartnersData,
  VenueSlotRequestsData,
  VenueCalendarData,
} from './partner-data-source';
import type { StudioRole } from '@/studios/studio-config';

const shellData: StudioShellData = {
  role: 'venue',
  displayName: 'Venue Studio',
  dataStatus: 'fixture',
};

const makeTrend = (
  metric: OverviewTrendMetric,
  range: OverviewTrendRange,
  value: string,
  delta: string,
  caption: string,
  points: readonly number[],
) => ({ metric, range, value, delta, caption, points }) as const;

const venueOverviewData: OverviewData = {
  dataStatus: 'fixture',
  todayLabel: 'Thursday, July 16 · 5:40 PM',
  greeting: 'Good evening, Rhea',
  nextEvent: {
    id: 'neon-nights-afrobeats',
    name: 'Neon Nights: Afrobeats Edition',
    venue: 'Skyline Rooftop · Bandra West',
    dateLabel: 'Tonight',
    timeLabel: '9:00 PM',
    doorsLabel: 'Doors in 3h 20m',
    href: '/partner/venue/events/neon-nights-afrobeats',
    imageSrc: '/partner-v3/venue/neon-nights-poster.jpg',
    imageAlt: 'Neon Nights event artwork',
    status: 'live',
    sold: 850,
    capacity: 1000,
  },
  trends: [
    makeTrend(
      'tickets',
      '1D',
      '112',
      '+18%',
      'Today, by the hour',
      [2, 4, 3, 6, 7, 6, 9, 11, 10, 13, 15, 18],
    ),
    makeTrend('tickets', '1W', '425', '+12%', 'This week, by day', [40, 52, 48, 61, 70, 66, 88]),
    makeTrend(
      'tickets',
      '1M',
      '822',
      '+24%',
      'This month, by day',
      [30, 38, 44, 52, 49, 60, 68, 66, 76, 84, 96, 104],
    ),
    makeTrend(
      'tickets',
      'All',
      '1,160',
      '+41%',
      'All time, by month',
      [16, 32, 48, 36, 64, 80, 72, 96, 120, 112, 144, 168],
    ),
    makeTrend(
      'revenue',
      '1D',
      '₹3,13,000',
      '+18%',
      'Today, by the hour',
      [8, 12, 10, 18, 22, 19, 28, 34, 30, 38, 44, 52],
    ),
    makeTrend(
      'revenue',
      '1W',
      '₹11,70,000',
      '+12%',
      'This week, by day',
      [120, 145, 132, 168, 190, 175, 240],
    ),
    makeTrend(
      'revenue',
      '1M',
      '₹18,45,000',
      '+24%',
      'This month, by day',
      [80, 95, 110, 130, 125, 150, 170, 165, 190, 210, 240, 260],
    ),
    makeTrend(
      'revenue',
      'All',
      '₹24,50,000',
      '+41%',
      'All time, by month',
      [40, 80, 120, 90, 160, 200, 180, 240, 300, 280, 360, 420],
    ),
  ],
  recentActivity: [
    {
      id: 'order-aisha',
      kind: 'ticket',
      name: 'Aisha Menon',
      meta: '2× VIP · Neon Nights · 4m ago',
      amount: '+ ₹5,000',
      tone: 'positive',
    },
    {
      id: 'payout-hdfc',
      kind: 'payout',
      name: 'Payout to HDFC ••4412',
      meta: 'Sunset Sessions · 1h ago',
      amount: '− ₹84,200',
      tone: 'neutral',
    },
    {
      id: 'order-karan',
      kind: 'ticket',
      name: 'Karan Shah',
      meta: '1× GA · Neon Nights · 2h ago',
      amount: '+ ₹1,800',
      tone: 'positive',
    },
    {
      id: 'refund-meera',
      kind: 'refund',
      name: 'Refund · Meera Rao',
      meta: '1× GA · Warehouse Rave · 3h ago',
      amount: '− ₹1,800',
      tone: 'negative',
    },
    {
      id: 'order-devansh',
      kind: 'ticket',
      name: 'Devansh Iyer',
      meta: '4× GA · Neon Nights · 5h ago',
      amount: '+ ₹7,200',
      tone: 'positive',
    },
    {
      id: 'table-priya',
      kind: 'table',
      name: 'Table booking · Priya K',
      meta: 'Bottle service · 6h ago',
      amount: '+ ₹24,000',
      tone: 'positive',
    },
    {
      id: 'order-nikhil',
      kind: 'ticket',
      name: 'Nikhil Verma',
      meta: '2× GA · Sunset Sessions · 8h ago',
      amount: '+ ₹3,600',
      tone: 'positive',
    },
  ],
  calendar: {
    monthLabel: 'July 2026',
    firstDayOffset: 3,
    days: Array.from({ length: 31 }, (_, index) => {
      const day = index + 1;
      const eventCounts: Readonly<Record<number, number>> = { 3: 1, 9: 1, 16: 2, 23: 1, 30: 1 };
      const eventCount = eventCounts[day];
      return { day, ...(eventCount ? { eventCount } : {}), isToday: day === 16 };
    }),
  },
  upcomingEvents: [
    {
      id: 'sunset-sessions-vol-4',
      name: 'Sunset Sessions Vol. 4',
      venue: 'Skyline Rooftop',
      dateLabel: 'Aug 2',
      timeLabel: '5:00 PM',
      href: '/partner/venue/events/sunset-sessions-vol-4',
      status: 'live',
      sold: 620,
      capacity: 1000,
    },
    {
      id: 'warehouse-rave',
      name: 'Warehouse Rave',
      venue: 'The Docks',
      dateLabel: 'Aug 9',
      timeLabel: '11:00 PM',
      href: '/partner/venue/events/warehouse-rave',
      status: 'draft',
      sold: 615,
      capacity: 1500,
    },
    {
      id: 'bollywood-brunch',
      name: 'Bollywood Brunch',
      venue: 'Garden Terrace',
      dateLabel: 'Aug 15',
      timeLabel: '12:00 PM',
      href: '/partner/venue/events/bollywood-brunch',
      status: 'live',
      sold: 780,
      capacity: 1000,
    },
    {
      id: 'monsoon-sessions',
      name: 'Monsoon Sessions',
      venue: 'Skyline Rooftop',
      dateLabel: 'Jun 28',
      timeLabel: '8:00 PM',
      href: '/partner/venue/events/monsoon-sessions',
      status: 'past',
      sold: 672,
      capacity: 700,
    },
  ],
  network: [
    {
      id: 'skyline-rooftop',
      name: 'Skyline Rooftop',
      role: 'Venue',
      initials: 'SR',
      status: 'Partnered',
      statusTone: 'success',
      accent: 'orange',
    },
    {
      id: 'arjun-pulse',
      name: 'Arjun (Pulse)',
      role: 'Promoter',
      initials: 'AP',
      status: 'Partnered',
      statusTone: 'success',
      accent: 'violet',
    },
    {
      id: 'the-docks',
      name: 'The Docks',
      role: 'Venue',
      initials: 'TD',
      status: 'Invite sent',
      statusTone: 'accent',
      accent: 'teal',
    },
    {
      id: 'maya-staff',
      name: 'Maya (Staff)',
      role: 'Door lead',
      initials: 'MS',
      status: 'Active',
      statusTone: 'neutral',
      accent: 'pink',
    },
  ],
};

const hostOverviewData: OverviewData = {
  ...venueOverviewData,
  nextEvent: {
    ...venueOverviewData.nextEvent,
    href: '/partner/host/events/neon-nights-afrobeats',
    imageSrc: '/partner-v3/host/one-direction-tribute-poster.jpg',
    imageAlt: 'Neon Nights event artwork',
  },
  upcomingEvents: venueOverviewData.upcomingEvents.map((event) => ({
    ...event,
    href: event.href.replace('/partner/venue/', '/partner/host/'),
  })),
  network: venueOverviewData.network,
};

const promoterOverviewData: PromoterOverviewData = {
  dataStatus: 'fixture',
  totalClicks: 8,
  trends: [
    makeTrend(
      'clicks',
      '1D',
      '8',
      '+14%',
      'Today, by the hour',
      [0, 0, 1, 1, 2, 2, 3, 4, 4, 5, 7, 8],
    ),
    makeTrend('clicks', '1W', '8', '+14%', 'This week, by day', [0, 0, 1, 2, 2, 5, 8]),
    makeTrend(
      'clicks',
      '1M',
      '8',
      '+14%',
      'This month, by day',
      [0, 0, 1, 1, 2, 2, 3, 4, 4, 5, 7, 8],
    ),
    makeTrend('clicks', 'All', '8', '+14%', 'All time, by month', [0, 1, 1, 2, 2, 3, 4, 5, 6, 8]),
    makeTrend(
      'revenue',
      '1D',
      '₹1,306',
      '+10%',
      'Today, by the hour',
      [0, 0, 0, 120, 120, 240, 240, 435, 435, 871, 871, 1306],
    ),
    makeTrend(
      'revenue',
      '1W',
      '₹1,306',
      '+10%',
      'This week, by day',
      [0, 0, 0, 435, 435, 871, 1306],
    ),
    makeTrend(
      'revenue',
      '1M',
      '₹1,306',
      '+10%',
      'This month, by day',
      [0, 0, 0, 435, 435, 871, 871, 871, 1306, 1306, 1306, 1306],
    ),
    makeTrend(
      'revenue',
      'All',
      '₹1,306',
      '+10%',
      'All time, by month',
      [0, 0, 435, 435, 871, 871, 1306],
    ),
  ],
  latestOrders: [
    {
      id: 'promoter-order-1',
      name: 'Guest',
      initials: 'GU',
      event: 'Event 30th July',
      when: '30 Jul, 11:11 am',
      amount: '₹870.8',
    },
    {
      id: 'promoter-order-2',
      name: 'Guest',
      initials: 'GU',
      event: 'Event 30th July',
      when: '30 Jul, 11:11 am',
      amount: '₹435.4',
    },
  ],
  upcomingEvents: [],
  activity: [
    {
      id: 'promoter-activity-1',
      title: 'Nova Nexus',
      meta: 'Nova Nexus · agarwalkespe8',
      time: '26 DAYS AGO',
    },
    {
      id: 'promoter-activity-2',
      title: 'Event - 297',
      meta: 'Event - 297 · agarwalkespe8',
      time: '27 DAYS AGO',
    },
  ],
};

const venueEvents: readonly PartnerEventRecord[] = [
  {
    id: 'neon-nights-afrobeats',
    name: 'Neon Nights: Afrobeats',
    tag: 'Afrobeats · Club Night',
    status: 'Live',
    party: 'venue',
    venue: 'Skyline Rooftop',
    host: 'Rhea Kapoor',
    hostInitials: 'RK',
    dateLabel: 'Thu, Jul 16',
    timeLabel: '9:00 PM',
    dayLabel: '16',
    monthLabel: 'JUL',
    priceLabel: '₹1,800',
    sold: 850,
    capacity: 1000,
    revenueLabel: '₹6,12,000',
    artwork: {
      type: 'image',
      value: '/partner-v3/venue/neon-nights-poster.jpg',
      alt: 'Neon Nights event artwork',
    },
  },
  {
    id: 'sunset-sessions-vol-4',
    name: 'Sunset Sessions Vol. 4',
    tag: 'House · Sunset Party',
    status: 'Live',
    party: 'venue',
    venue: 'Skyline Rooftop',
    host: 'Rhea Kapoor',
    hostInitials: 'RK',
    dateLabel: 'Sat, Aug 2',
    timeLabel: '5:00 PM',
    dayLabel: '02',
    monthLabel: 'AUG',
    priceLabel: '₹1,200',
    sold: 620,
    capacity: 1000,
    revenueLabel: '₹3,88,000',
    artwork: { type: 'gradient', value: 'sunset' },
  },
  {
    id: 'warehouse-rave',
    name: 'Warehouse Rave',
    tag: 'Techno · Rave',
    status: 'Draft',
    party: 'hosts',
    venue: 'The Docks',
    host: 'Pulse Collective',
    hostInitials: 'PC',
    dateLabel: 'Sat, Aug 9',
    timeLabel: '11:00 PM',
    dayLabel: '09',
    monthLabel: 'AUG',
    priceLabel: '₹999',
    sold: 615,
    capacity: 1500,
    revenueLabel: '₹1,64,000',
    artwork: { type: 'gradient', value: 'warehouse' },
  },
  {
    id: 'bollywood-brunch',
    name: 'Bollywood Brunch',
    tag: 'Bollywood · Brunch',
    status: 'Live',
    party: 'venue',
    venue: 'Garden Terrace',
    host: 'Rhea Kapoor',
    hostInitials: 'RK',
    dateLabel: 'Sat, Aug 15',
    timeLabel: '12:00 PM',
    dayLabel: '15',
    monthLabel: 'AUG',
    priceLabel: '₹1,500',
    sold: 780,
    capacity: 1000,
    revenueLabel: '₹2,34,000',
    artwork: { type: 'gradient', value: 'bollywood' },
  },
  {
    id: 'monsoon-sessions',
    name: 'Monsoon Sessions',
    tag: 'Deep House · Club Night',
    status: 'Past',
    party: 'venue',
    venue: 'Skyline Rooftop',
    host: 'Rhea Kapoor',
    hostInitials: 'RK',
    dateLabel: 'Sat, Jun 28',
    timeLabel: '8:00 PM',
    dayLabel: '28',
    monthLabel: 'JUN',
    priceLabel: '₹2,200',
    sold: 672,
    capacity: 700,
    revenueLabel: '₹7,05,000',
    artwork: { type: 'gradient', value: 'monsoon' },
  },
];

const venueEventsData: VenueEventsData = {
  dataStatus: 'fixture',
  pendingRequestCount: 2,
  events: venueEvents,
};

const toAmount = (value: string) => Number.parseInt(value.replace(/[^\d]/g, ''), 10) || 0;
const formatInr = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const salesToneForFill = (fillPercent: number): EventSalesTone =>
  fillPercent >= 70 ? 'green' : fillPercent >= 40 ? 'yellow' : 'red';

const makeEventSalesData = (
  event: PartnerEventRecord,
  summary: PartnerEventDetailData['salesSummary'],
  accent: 'orange' | 'lavender' = 'orange',
): EventSalesData => {
  const donutCircumference = 2 * Math.PI * 54;
  let donutOffset = 0;
  const gender = [
    {
      label: 'Female',
      percent: 54,
      tone: accent === 'lavender' ? ('lavender' as const) : ('orange' as const),
    },
    {
      label: 'Male',
      percent: 42,
      tone: accent === 'lavender' ? ('lavender' as const) : ('violet' as const),
    },
    { label: 'Other', percent: 4, tone: 'green' as const },
  ].map((segment) => {
    const dash = (segment.percent / 100) * donutCircumference;
    const result = {
      ...segment,
      dashArray: `${String(dash)} ${String(donutCircumference - dash)}`,
      dashOffset: -donutOffset,
    };
    donutOffset += dash;
    return result;
  });
  const comparisonEvents = [
    event,
    ...venueEvents.filter(
      (candidate) => candidate.venue === event.venue && candidate.id !== event.id,
    ),
  ].slice(0, 3);
  const comparison = comparisonEvents.map((candidate, index) => {
    const fillPercent = Math.round((candidate.sold / candidate.capacity) * 100);
    return {
      name: index === 0 ? `${candidate.name} (this)` : candidate.name,
      sold: candidate.sold.toLocaleString('en-IN'),
      revenue: candidate.revenueLabel,
      fill: `${String(fillPercent)}%`,
      tone: salesToneForFill(fillPercent),
      ...(index === 0 ? { current: true } : {}),
    };
  });

  return {
    funnel: {
      stats: [
        {
          label: 'View → Purchase',
          value: '0.0%',
          tone: accent === 'lavender' ? 'lavender' : 'orange',
        },
        { label: 'Checkout Abandon', value: '0.0%', tone: 'red' },
        { label: 'Purchase → Arrival', value: '0.0%', tone: 'green' },
        { label: 'Guestlist → Arrival', value: '0.0%', tone: 'violet' },
      ],
      steps: [
        {
          label: 'Page Views',
          count: '0',
          fillPercent: 0,
          tone: accent === 'lavender' ? 'lavender' : 'orange',
        },
        { label: 'Interested', count: '0', fillPercent: 0, tone: 'violet' },
        { label: 'Ticket Bought', count: '0', fillPercent: 0, tone: 'lavender' },
        { label: 'Checked In', count: '0', fillPercent: 0, tone: 'yellow' },
      ],
      note: 'FUNNEL POPULATES AFTER DISCOVERY & BOOKING ACTIVITY BEGINS',
    },
    revenue: {
      tiers: summary.tiers,
      breakdown: [
        { label: 'Gross ticket sales', value: summary.moneyMade, tone: 'muted' },
        { label: 'Refunds', value: `−${summary.refunds}`, tone: 'red' },
        {
          label: 'Net revenue',
          value: formatInr(toAmount(summary.moneyMade) - toAmount(summary.refunds)),
          tone: 'green',
        },
      ],
    },
    crowd: {
      gender,
      age: [
        {
          label: '18–24',
          percent: '38%',
          count: '0',
          fillPercent: 86,
          tone: accent === 'lavender' ? 'lavender' : 'orange',
        },
        {
          label: '25–34',
          percent: '44%',
          count: '0',
          fillPercent: 100,
          tone: accent === 'lavender' ? 'lavender' : 'orange',
        },
        {
          label: '35–44',
          percent: '14%',
          count: '0',
          fillPercent: 32,
          tone: accent === 'lavender' ? 'lavender' : 'orange',
        },
        {
          label: '45+',
          percent: '4%',
          count: '0',
          fillPercent: 9,
          tone: accent === 'lavender' ? 'lavender' : 'orange',
        },
      ],
      segments: [
        { label: 'New Guests', value: '0', sub: 'First time at your venue', tone: 'green' },
        { label: 'Repeat Guests', value: '0', sub: 'Have attended before', tone: 'violet' },
        { label: 'VIP Guests', value: '0', sub: 'High-value regulars', tone: 'yellow' },
      ],
      loyalty: [
        { label: 'First Time', value: '0', tone: 'red' },
        { label: 'Returning', value: '0', tone: 'violet' },
        { label: 'Regular', value: '0', tone: 'green' },
        { label: 'VIP', value: '0', tone: 'yellow' },
      ],
    },
    comparison,
  };
};

const venueEventGuests: EventGuestsData = {
  attendeeCount: '6',
  guests: [
    {
      id: 'aisha-menon',
      name: 'Aisha Menon',
      initials: 'AM',
      tier: '2× VIP Entry',
      tag: 'VIP',
      arrival: 'Checked in',
      origin: 'Online',
      gender: 'F',
      ticketCount: '2',
      spend: '₹8,000',
      contact: '+91 98200 xxxxx',
      lastPurchase: 'Aug 12',
    },
    {
      id: 'karan-shah',
      name: 'Karan Shah',
      initials: 'KS',
      tier: '1× General Admission',
      tag: 'Repeat',
      arrival: 'Checked in',
      origin: 'Online',
      gender: 'M',
      ticketCount: '1',
      spend: '₹800',
      contact: '+91 99870 xxxxx',
      lastPurchase: 'Aug 14',
    },
    {
      id: 'devansh-iyer',
      name: 'Devansh Iyer',
      initials: 'DI',
      tier: '4× General Admission',
      tag: 'New',
      arrival: 'Not yet',
      origin: 'Online',
      gender: 'M',
      ticketCount: '4',
      spend: '₹3,200',
      contact: '+91 90210 xxxxx',
      lastPurchase: 'Aug 10',
    },
    {
      id: 'priya-kapoor',
      name: 'Priya Kapoor',
      initials: 'PK',
      tier: '1× VIP Table',
      tag: 'VIP',
      arrival: 'Checked in',
      origin: 'Walk-in',
      gender: 'F',
      ticketCount: '1',
      spend: '₹4,000',
      contact: '+91 98765 xxxxx',
      lastPurchase: 'Today',
    },
    {
      id: 'nikhil-verma',
      name: 'Nikhil Verma',
      initials: 'NV',
      tier: '2× General Admission',
      tag: 'Repeat',
      arrival: 'Not yet',
      origin: 'Online',
      gender: 'M',
      ticketCount: '2',
      spend: '₹1,600',
      contact: '+91 97654 xxxxx',
      lastPurchase: 'Aug 9',
    },
    {
      id: 'sara-dsouza',
      name: 'Sara D’Souza',
      initials: 'SD',
      tier: '1× VIP Entry',
      tag: 'New',
      arrival: 'Not yet',
      origin: 'Walk-in',
      gender: 'F',
      ticketCount: '1',
      spend: '₹4,000',
      contact: '+91 91234 xxxxx',
      lastPurchase: 'Today',
    },
  ],
};

const venueEventOperations: EventOperationsData = {
  insideNow: '247',
  capacity: '400',
  occupancyPercent: 62,
  expected: '93 checked-in guests still expected',
  walkIns: [
    { id: 'rohan-das', name: 'Rohan Das', meta: 'GA · Paid ₹1,200 cash', time: '9:42 PM' },
    { id: 'tanya-bhat', name: 'Tanya Bhat', meta: 'GA · Paid ₹1,200 card', time: '9:38 PM' },
    { id: 'vikram-s', name: 'Vikram S.', meta: 'VIP · Paid ₹4,000 UPI', time: '9:31 PM' },
    { id: 'neha-pillai', name: 'Neha Pillai', meta: 'GA · Paid ₹1,200 UPI', time: '9:25 PM' },
  ],
};

const venueEventPromoters: EventPromotersData = {
  promoters: [
    {
      id: 'arjun-pulse',
      name: 'Arjun (Pulse Collective)',
      initials: 'AP',
      tickets: '124',
      owed: '₹18,600',
      revenue: '₹1,86,000',
      rsvps: '140',
      conversion: '88.6%',
    },
    {
      id: 'zoya-nightowl',
      name: 'Zoya (Nightowl)',
      initials: 'ZN',
      tickets: '88',
      owed: '₹13,200',
      revenue: '₹1,32,000',
      rsvps: '102',
      conversion: '86.3%',
    },
    {
      id: 'kabir-m',
      name: 'Kabir M.',
      initials: 'KM',
      tickets: '56',
      owed: '₹8,400',
      revenue: '₹84,000',
      rsvps: '70',
      conversion: '80.0%',
    },
    {
      id: 'riya-house-parties',
      name: 'Riya (House parties)',
      initials: 'RH',
      tickets: '31',
      owed: '₹4,650',
      revenue: '₹46,500',
      rsvps: '44',
      conversion: '70.5%',
    },
  ],
};

const getVenueEvent = (eventId: string): PartnerEventRecord => {
  const event = venueEvents.find((candidate) => candidate.id === eventId);
  if (!event) throw new Error(`Missing Venue event fixture: ${eventId}`);
  return event;
};

const venueEventDetailBases: readonly Omit<
  PartnerEventDetailData,
  'sales' | 'guests' | 'operations' | 'promoters'
>[] = [
  {
    dataStatus: 'fixture',
    event: getVenueEvent('neon-nights-afrobeats'),
    venueLine: 'Skyline Rooftop · Thu, Jul 16 · 9:00 PM',
    metrics: [
      { label: 'Tickets sold', value: '340', suffix: '/ 400' },
      { label: 'Page visits', value: '3,290' },
      { label: 'Conversions', value: '58.6%', tone: 'success' },
    ],
    salesSummary: {
      moneyMade: '₹6,12,000',
      moneyDelta: '+22%',
      ticketsSold: '340 / 400',
      refunds: '₹3,600',
      moneyTrend: [120, 145, 132, 168, 190, 175, 210, 196, 238, 224, 268, 300],
      tiers: [
        { name: 'VIP Table', count: '48', money: '₹2,40,000', fillPercent: 40, accent: 'violet' },
        { name: 'VIP Entry', count: '92', money: '₹1,84,000', fillPercent: 70, accent: 'teal' },
        {
          name: 'General Admission',
          count: '200',
          money: '₹1,88,000',
          fillPercent: 100,
          accent: 'orange',
        },
      ],
    },
  },
  {
    dataStatus: 'fixture',
    event: getVenueEvent('sunset-sessions-vol-4'),
    venueLine: 'Skyline Rooftop · Sat, Aug 2 · 5:00 PM',
    metrics: [
      { label: 'Tickets sold', value: '248', suffix: '/ 400' },
      { label: 'Page visits', value: '2,180' },
      { label: 'Conversions', value: '41.4%', tone: 'success' },
    ],
    salesSummary: {
      moneyMade: '₹3,88,000',
      moneyDelta: '+18%',
      ticketsSold: '248 / 400',
      refunds: '₹1,200',
      moneyTrend: [80, 92, 110, 104, 128, 140, 156, 150, 174, 188, 204, 220],
      tiers: [
        { name: 'VIP Table', count: '20', money: '₹1,00,000', fillPercent: 35, accent: 'violet' },
        { name: 'VIP Entry', count: '64', money: '₹1,28,000', fillPercent: 58, accent: 'teal' },
        {
          name: 'General Admission',
          count: '164',
          money: '₹1,60,000',
          fillPercent: 82,
          accent: 'orange',
        },
      ],
    },
  },
  {
    dataStatus: 'fixture',
    event: getVenueEvent('warehouse-rave'),
    venueLine: 'The Docks · Sat, Aug 9 · 11:00 PM',
    metrics: [
      { label: 'Tickets sold', value: '164', suffix: '/ 400' },
      { label: 'Page visits', value: '1,640' },
      { label: 'Conversions', value: '32.8%', tone: 'success' },
    ],
    salesSummary: {
      moneyMade: '₹1,64,000',
      moneyDelta: '+10%',
      ticketsSold: '164 / 400',
      refunds: '₹800',
      moneyTrend: [35, 48, 44, 60, 72, 68, 84, 78, 96, 110, 124, 138],
      tiers: [
        { name: 'VIP Table', count: '12', money: '₹84,000', fillPercent: 25, accent: 'violet' },
        { name: 'VIP Entry', count: '32', money: '₹32,000', fillPercent: 42, accent: 'teal' },
        {
          name: 'General Admission',
          count: '120',
          money: '₹48,000',
          fillPercent: 60,
          accent: 'orange',
        },
      ],
    },
  },
  {
    dataStatus: 'fixture',
    event: getVenueEvent('bollywood-brunch'),
    venueLine: 'Garden Terrace · Sat, Aug 15 · 12:00 PM',
    metrics: [
      { label: 'Tickets sold', value: '312', suffix: '/ 400' },
      { label: 'Page visits', value: '2,940' },
      { label: 'Conversions', value: '52.7%', tone: 'success' },
    ],
    salesSummary: {
      moneyMade: '₹2,34,000',
      moneyDelta: '+16%',
      ticketsSold: '312 / 400',
      refunds: '₹1,800',
      moneyTrend: [54, 70, 82, 78, 96, 112, 126, 140, 152, 166, 180, 198],
      tiers: [
        { name: 'VIP Table', count: '30', money: '₹90,000', fillPercent: 38, accent: 'violet' },
        { name: 'VIP Entry', count: '70', money: '₹1,05,000', fillPercent: 70, accent: 'teal' },
        {
          name: 'General Admission',
          count: '212',
          money: '₹39,000',
          fillPercent: 94,
          accent: 'orange',
        },
      ],
    },
  },
  {
    dataStatus: 'fixture',
    event: getVenueEvent('monsoon-sessions'),
    venueLine: 'Skyline Rooftop · Sat, Jun 28 · 8:00 PM',
    metrics: [
      { label: 'Tickets sold', value: '336', suffix: '/ 400' },
      { label: 'Page visits', value: '3,540' },
      { label: 'Conversions', value: '56.9%', tone: 'success' },
    ],
    salesSummary: {
      moneyMade: '₹7,05,000',
      moneyDelta: '+28%',
      ticketsSold: '336 / 400',
      refunds: '₹2,400',
      moneyTrend: [140, 154, 166, 182, 198, 214, 228, 242, 260, 278, 294, 320],
      tiers: [
        { name: 'VIP Table', count: '52', money: '₹2,60,000', fillPercent: 52, accent: 'violet' },
        { name: 'VIP Entry', count: '96', money: '₹2,40,000', fillPercent: 76, accent: 'teal' },
        {
          name: 'General Admission',
          count: '188',
          money: '₹2,05,000',
          fillPercent: 100,
          accent: 'orange',
        },
      ],
    },
  },
];

const venueEventDetails: readonly PartnerEventDetailData[] = venueEventDetailBases.map(
  (detail) => ({
    ...detail,
    sales: makeEventSalesData(detail.event, detail.salesSummary),
    guests: venueEventGuests,
    operations: venueEventOperations,
    promoters: venueEventPromoters,
  }),
);

const hostEvents: readonly PartnerEventRecord[] = venueEvents.map((event, index) =>
  index === 0
    ? {
        ...event,
        name: 'Neon Nights: Afrobeats',
        artwork: {
          type: 'image',
          value: '/partner-v3/host/one-direction-tribute-poster.jpg',
          alt: 'Neon Nights event artwork',
        },
      }
    : event,
);

const hostEventsData: HostEventsData = {
  dataStatus: 'fixture',
  pendingRequestCount: 2,
  events: hostEvents,
};

const getHostEvent = (eventId: string): PartnerEventRecord => {
  const event = hostEvents.find((candidate) => candidate.id === eventId);
  if (!event) throw new Error(`Missing Host event fixture: ${eventId}`);
  return event;
};

const hostEventDetails: readonly PartnerEventDetailData[] = venueEventDetails.map((detail) => {
  const hostSummary = {
    ...detail.salesSummary,
    tiers: detail.salesSummary.tiers.map((tier, index) => ({
      ...tier,
      accent: index === 1 ? ('teal' as const) : ('violet' as const),
    })),
  };
  const hostEvent = getHostEvent(detail.event.id);
  return {
    ...detail,
    event: hostEvent,
    salesSummary: hostSummary,
    sales: makeEventSalesData(hostEvent, hostSummary, 'lavender'),
  };
});

const doorActivity: readonly DoorActivityRecord[] = [
  {
    id: 'invalid-ticket',
    text: 'Refused entry — invalid ticket',
    time: '9:44 PM',
    kind: 'incident',
  },
  { id: 'vip-capacity', text: 'VIP section at capacity', time: '9:30 PM', kind: 'note' },
  { id: 'ga-closed', text: 'Guest list closed for GA', time: '9:15 PM', kind: 'note' },
];

const makeDoorEvents = (details: readonly PartnerEventDetailData[]): readonly DoorEventData[] =>
  details.map((detail) => ({
    event: detail.event,
    venueLine: detail.venueLine,
    insideNow: 247,
    capacity: 400,
    expectedCount: 93,
    walkInCount: 34,
    guests: detail.guests.guests,
    activity: doorActivity,
  }));

const venueDoorModeData: DoorModeData = {
  dataStatus: 'fixture',
  role: 'venue',
  accent: 'orange',
  issueCount: 2,
  events: makeDoorEvents(venueEventDetails),
};

const hostDoorModeData: DoorModeData = {
  dataStatus: 'fixture',
  role: 'host',
  accent: 'lavender',
  issueCount: 2,
  events: makeDoorEvents(hostEventDetails),
};

const makeSettingsData = (role: 'venue' | 'host'): PartnerSettingsData => ({
  dataStatus: 'fixture',
  role,
  accent: role === 'host' ? 'lavender' : 'orange',
  initials: 'RK',
  displayName: 'Rhea Kapoor Events',
  bio: "Curating Mumbai's best rooftop & warehouse nights since 2019. Afrobeats · House · Techno.",
  highlights: ['Rooftop views', 'Afrobeats', 'Bottle service', '21+'],
  presenceStats: [
    { label: 'Followers', value: '12.4k' },
    { label: role === 'host' ? 'Events hosted' : 'Events hosted', value: '84' },
    { label: 'Avg. rating', value: '4.8' },
  ],
  menuLive: true,
  menuItems: [
    { id: 'house-pour-whisky', name: 'House Pour Whisky', category: 'Spirits', price: '₹450' },
    { id: 'craft-beer', name: 'Craft Beer (Pint)', category: 'Beer', price: '₹350' },
    { id: 'espresso-martini', name: 'Espresso Martini', category: 'Cocktails', price: '₹550' },
    { id: 'grey-goose', name: 'Bottle — Grey Goose', category: 'Bottle service', price: '₹12,000' },
    { id: 'loaded-nachos', name: 'Loaded Nachos', category: 'Food', price: '₹400' },
  ],
  accountRows: [
    {
      id: 'business-profile',
      icon: 'business',
      title: 'Business profile',
      description: 'Rhea Kapoor Events LLP · GST verified',
    },
    {
      id: 'team-staff',
      icon: 'team',
      title: 'Team & staff',
      description: 'Managed in Partners → Staff',
    },
    {
      id: 'notifications',
      icon: 'notifications',
      title: 'Notifications',
      description: 'Sales alerts, payout reminders, door pings',
    },
    {
      id: 'privacy-security',
      icon: 'security',
      title: 'Privacy & security',
      description: 'Login, guest data handling, exports',
    },
  ],
});

const venueSettingsData = makeSettingsData('venue');
const hostSettingsData = makeSettingsData('host');

const promoterDiscoverEvents: readonly PromoterDiscoverEvent[] = [
  {
    id: 'eclipse-royale',
    name: 'Eclipse Royale',
    venue: 'Your Venue, Pune, IN',
    city: 'Pune',
    dateLabel: 'Wed, 05 Aug',
    timeLabel: '8:00 PM',
    accessState: 'pending',
    artwork: { type: 'gradient', value: 'eclipse' },
  },
  {
    id: 'testing-event',
    name: 'testing event',
    venue: "Gaikwad's Club, Pune",
    city: 'Pune',
    dateLabel: 'Mon, 30 Mar',
    timeLabel: '11:00 PM',
    accessState: 'required',
    artwork: { type: 'gradient', value: 'placeholder' },
  },
  {
    id: 'check-event-2',
    name: 'check event 2',
    venue: 'EPITOME, Pune',
    city: 'Pune',
    dateLabel: 'Fri, 27 Mar',
    timeLabel: '9:00 PM',
    accessState: 'required',
    artwork: { type: 'gradient', value: 'placeholder' },
  },
  {
    id: 'night-of-mystery',
    name: 'Night of Mystery',
    venue: 'Aria Lounge, Pune',
    city: 'Pune',
    dateLabel: 'Sat, 12 Sep',
    timeLabel: '10:00 PM',
    accessState: 'required',
    artwork: { type: 'gradient', value: 'mystery' },
  },
  {
    id: 'retro-fridays',
    name: 'Retro Fridays',
    venue: 'The Docks, Mumbai',
    city: 'Mumbai',
    dateLabel: 'Fri, 18 Sep',
    timeLabel: '10:00 PM',
    accessState: 'required',
    artwork: { type: 'gradient', value: 'placeholder' },
  },
  {
    id: 'sunday-sessions',
    name: 'Sunday Sessions',
    venue: 'Skyline Rooftop, Pune',
    city: 'Pune',
    dateLabel: 'Sun, 20 Sep',
    timeLabel: '5:00 PM',
    accessState: 'required',
    artwork: { type: 'gradient', value: 'placeholder' },
  },
];

const promoterLinkedEvents: readonly PromoterLinkedEvent[] = [
  {
    id: 'nova-nexus',
    name: 'Nova Nexus',
    venue: 'Skyline Rooftop, Pune',
    city: 'Pune',
    clicks: 3,
    sales: 0,
    artwork: { type: 'gradient', value: 'eclipse' },
  },
  {
    id: 'event-297',
    name: 'Event - 297',
    venue: 'The Docks, Pune',
    city: 'Pune',
    clicks: 2,
    sales: 0,
    artwork: { type: 'gradient', value: 'placeholder' },
  },
  {
    id: 'event-by-new-host',
    name: 'Event by new host',
    venue: 'Warehouse District, Pune',
    city: 'Pune',
    clicks: 1,
    sales: 0,
    artwork: { type: 'gradient', value: 'mystery' },
  },
  {
    id: 'event-30th-july',
    name: 'Event 30th July',
    venue: 'Skyline Rooftop, Pune',
    city: 'Pune',
    clicks: 2,
    sales: 2,
    artwork: { type: 'gradient', value: 'nova' },
  },
];

const promoterEventsData: PromoterEventsData = {
  dataStatus: 'fixture',
  discoverCount: 16,
  linkedCount: 4,
  discoverEvents: promoterDiscoverEvents,
  linkedEvents: promoterLinkedEvents,
};

const partnerProfileDefaults = {
  location: 'Mumbai, India',
  verified: true,
  upcomingEvents: [
    { id: 'retro-fridays', name: 'Retro Fridays', dateLabel: 'Sep 5' },
    { id: 'sunday-sessions', name: 'Sunday Sessions', dateLabel: 'Sep 20' },
  ],
} as const;

const venuePartners: PartnerRelationshipSet = {
  connected: [
    {
      ...partnerProfileDefaults,
      id: 'kabir-sunday-sessions',
      name: 'Kabir M. (Sunday Sessions)',
      initials: 'KS',
      kind: 'host',
      role: '6 events hosted',
      genres: ['House', 'Deep House'],
      stats: [
        { label: 'Events hosted', value: '6' },
        { label: 'Venues worked with', value: '4' },
        { label: 'Tickets sold', value: '3,860' },
        { label: 'Experience', value: '3 yrs' },
      ],
      cardTone: 'orange',
      status: 'Partnered',
    },
    {
      ...partnerProfileDefaults,
      id: 'nightscape-collective',
      name: 'Nightscape Collective',
      initials: 'NC',
      kind: 'host',
      role: '9 events hosted',
      genres: ['Techno', 'Rave'],
      stats: [
        { label: 'Events hosted', value: '9' },
        { label: 'Venues worked with', value: '4' },
        { label: 'Tickets sold', value: '3,860' },
        { label: 'Experience', value: '3 yrs' },
      ],
      cardTone: 'teal',
      status: 'Partnered',
    },
    {
      ...partnerProfileDefaults,
      id: 'pulse-collective',
      name: 'Pulse Collective',
      initials: 'PC',
      kind: 'host',
      role: '14 events hosted',
      genres: ['Afrobeats', 'Club Night'],
      stats: [
        { label: 'Events hosted', value: '14' },
        { label: 'Venues worked with', value: '4' },
        { label: 'Tickets sold', value: '3,860' },
        { label: 'Experience', value: '3 yrs' },
      ],
      cardTone: 'gold',
      status: 'Partnered',
    },
  ],
  discover: [
    {
      ...partnerProfileDefaults,
      id: 'zoya-nightowl-discover',
      name: 'Zoya (Nightowl)',
      initials: 'ZN',
      kind: 'host',
      role: '5 events hosted',
      genres: ['Retro', 'Club Night'],
      stats: [
        { label: 'Events hosted', value: '5' },
        { label: 'Venues worked with', value: '3' },
        { label: 'Tickets sold', value: '2,100' },
        { label: 'Experience', value: '2 yrs' },
      ],
      cardTone: 'violet',
    },
    {
      ...partnerProfileDefaults,
      id: 'arjun-bassline',
      name: 'Arjun (Bassline Collective)',
      initials: 'AB',
      kind: 'host',
      role: '8 events hosted',
      genres: ['Bass', 'Techno'],
      stats: [
        { label: 'Events hosted', value: '8' },
        { label: 'Venues worked with', value: '5' },
        { label: 'Tickets sold', value: '4,200' },
        { label: 'Experience', value: '4 yrs' },
      ],
      cardTone: 'indigo',
    },
    {
      ...partnerProfileDefaults,
      id: 'sunday-sessions-host',
      name: 'The Sunday Sessions',
      initials: 'SS',
      kind: 'host',
      role: '3 events hosted',
      genres: ['Deep House'],
      stats: [
        { label: 'Events hosted', value: '3' },
        { label: 'Venues worked with', value: '2' },
        { label: 'Tickets sold', value: '1,400' },
        { label: 'Experience', value: '2 yrs' },
      ],
      cardTone: 'pink',
    },
  ],
  requests: {
    incoming: [
      {
        id: 'sana-echo-crew',
        name: 'Sana (Echo Crew)',
        initials: 'SE',
        kind: 'host',
        direction: 'incoming',
        note: 'Wants to host a recurring slot',
      },
    ],
    outgoing: [
      {
        id: 'vikram-loud-nights',
        name: 'Vikram (Loud Nights)',
        initials: 'VL',
        kind: 'host',
        direction: 'outgoing',
        note: 'Invite sent 3 days ago',
      },
    ],
  },
};

const promoterPartners: PartnerRelationshipSet = {
  connected: [
    {
      ...partnerProfileDefaults,
      id: 'arjun-pulse-promoter',
      name: 'Arjun (Pulse Collective)',
      initials: 'AP',
      kind: 'promoter',
      role: '124 tickets driven',
      genres: ['House', 'Club Night'],
      stats: [
        { label: 'Events promoted', value: '12' },
        { label: 'Tickets sold', value: '1,240' },
        { label: 'Avg. conversion', value: '82%' },
        { label: 'Experience', value: '2 yrs' },
      ],
      cardTone: 'orange',
      status: 'Partnered',
    },
    {
      ...partnerProfileDefaults,
      id: 'zoya-nightowl-promoter',
      name: 'Zoya (Nightowl)',
      initials: 'ZN',
      kind: 'promoter',
      role: '88 tickets driven',
      genres: ['Techno', 'Rave'],
      stats: [
        { label: 'Events promoted', value: '9' },
        { label: 'Tickets sold', value: '1,240' },
        { label: 'Avg. conversion', value: '82%' },
        { label: 'Experience', value: '2 yrs' },
      ],
      cardTone: 'violet',
      status: 'Partnered',
    },
    {
      ...partnerProfileDefaults,
      id: 'kabir-m-promoter',
      name: 'Kabir M.',
      initials: 'KM',
      kind: 'promoter',
      role: '56 tickets driven',
      genres: ['House', 'Deep House'],
      stats: [
        { label: 'Events promoted', value: '6' },
        { label: 'Tickets sold', value: '1,240' },
        { label: 'Avg. conversion', value: '82%' },
        { label: 'Experience', value: '2 yrs' },
      ],
      cardTone: 'teal',
      status: 'Invite sent',
    },
    {
      ...partnerProfileDefaults,
      id: 'riya-house-parties-promoter',
      name: 'Riya (House parties)',
      initials: 'RH',
      kind: 'promoter',
      role: '31 tickets driven',
      genres: ['Deep House'],
      stats: [
        { label: 'Events promoted', value: '4' },
        { label: 'Tickets sold', value: '1,240' },
        { label: 'Avg. conversion', value: '82%' },
        { label: 'Experience', value: '2 yrs' },
      ],
      cardTone: 'pink',
      status: 'Waiting on them',
    },
  ],
  discover: [
    {
      ...partnerProfileDefaults,
      id: 'vikram-loud-nights-promoter',
      name: 'Vikram (Loud Nights)',
      initials: 'VL',
      kind: 'promoter',
      role: '62 tickets driven',
      genres: ['Club Night'],
      stats: [
        { label: 'Events promoted', value: '6' },
        { label: 'Tickets sold', value: '620' },
        { label: 'Avg. conversion', value: '76%' },
        { label: 'Experience', value: '1 yr' },
      ],
      cardTone: 'gold',
    },
    {
      ...partnerProfileDefaults,
      id: 'sana-echo-crew-promoter',
      name: 'Sana (Echo Crew)',
      initials: 'SE',
      kind: 'promoter',
      role: '40 tickets driven',
      genres: ['House'],
      stats: [
        { label: 'Events promoted', value: '4' },
        { label: 'Tickets sold', value: '400' },
        { label: 'Avg. conversion', value: '71%' },
        { label: 'Experience', value: '1 yr' },
      ],
      cardTone: 'indigo',
    },
  ],
  requests: {
    incoming: [
      {
        id: 'rhea-afterglow',
        name: 'Rhea (Afterglow)',
        initials: 'RA',
        kind: 'promoter',
        direction: 'incoming',
        note: 'Wants to promote your events',
      },
    ],
    outgoing: [
      {
        id: 'kabir-m-promoter-request',
        name: 'Kabir M.',
        initials: 'KM',
        kind: 'promoter',
        direction: 'outgoing',
        note: 'Invite sent 4 days ago',
      },
      {
        id: 'riya-house-parties-promoter-request',
        name: 'Riya (House parties)',
        initials: 'RH',
        kind: 'promoter',
        direction: 'outgoing',
        note: 'Invite sent 9 days ago',
      },
    ],
  },
};

const venueStaff = [
  {
    id: 'maya-s',
    name: 'Maya S.',
    initials: 'MS',
    role: 'Door lead · Full access',
    status: 'Active',
    permissions: ['Door check-in', 'Event editing'],
  },
  {
    id: 'ravi-k',
    name: 'Ravi K.',
    initials: 'RK',
    role: 'Check-in · Scan only',
    status: 'Active',
    permissions: ['Door check-in'],
  },
  {
    id: 'tina-d',
    name: 'Tina D.',
    initials: 'TD',
    role: 'Bar · Menu & orders',
    status: 'Active',
    permissions: ['Finance view', 'Guest messaging'],
  },
] as const;

const venuePartnersData: VenuePartnersData = {
  dataStatus: 'fixture',
  hosts: venuePartners,
  promoters: promoterPartners,
  staff: venueStaff,
};

const hostVenues: PartnerRelationshipSet = {
  connected: [
    {
      ...partnerProfileDefaults,
      id: 'skyline-rooftop-host',
      name: 'Skyline Rooftop',
      initials: 'SR',
      kind: 'venue',
      role: 'Capacity 400 · 6 events booked',
      genres: [],
      stats: [
        { label: 'Events hosted', value: '400' },
        { label: 'Venues worked with', value: '4' },
        { label: 'Tickets sold', value: '3,860' },
        { label: 'Experience', value: '3 yrs' },
      ],
      cardTone: 'orange',
      status: 'Partnered',
    },
    {
      ...partnerProfileDefaults,
      id: 'the-docks-host',
      name: 'The Docks',
      initials: 'TD',
      kind: 'venue',
      role: 'Capacity 900 · 11 events booked',
      genres: [],
      stats: [
        { label: 'Events hosted', value: '900' },
        { label: 'Venues worked with', value: '4' },
        { label: 'Tickets sold', value: '3,860' },
        { label: 'Experience', value: '3 yrs' },
      ],
      cardTone: 'teal',
      status: 'Invite sent',
    },
    {
      ...partnerProfileDefaults,
      id: 'warehouse-district-host',
      name: 'Warehouse District',
      initials: 'WD',
      kind: 'venue',
      role: 'Capacity 1200 · 9 events booked',
      genres: [],
      stats: [
        { label: 'Events hosted', value: '1200' },
        { label: 'Venues worked with', value: '4' },
        { label: 'Tickets sold', value: '3,860' },
        { label: 'Experience', value: '3 yrs' },
      ],
      cardTone: 'slate',
      status: 'Partnered',
    },
    {
      ...partnerProfileDefaults,
      id: 'aria-lounge-host',
      name: 'Aria Lounge',
      initials: 'AL',
      kind: 'venue',
      role: 'Capacity 220 · 4 events booked',
      genres: [],
      stats: [
        { label: 'Events hosted', value: '220' },
        { label: 'Venues worked with', value: '4' },
        { label: 'Tickets sold', value: '3,860' },
        { label: 'Experience', value: '3 yrs' },
      ],
      cardTone: 'pink',
      status: 'Waiting on them',
    },
    {
      ...partnerProfileDefaults,
      id: 'the-yard-host',
      name: 'The Yard',
      initials: 'TY',
      kind: 'venue',
      role: 'Capacity 650 · 14 events booked',
      genres: [],
      stats: [
        { label: 'Events hosted', value: '650' },
        { label: 'Venues worked with', value: '4' },
        { label: 'Tickets sold', value: '3,860' },
        { label: 'Experience', value: '3 yrs' },
      ],
      cardTone: 'gold',
      status: 'Partnered',
    },
    {
      ...partnerProfileDefaults,
      id: 'circuit-hall-host',
      name: 'Circuit Hall',
      initials: 'CH',
      kind: 'venue',
      role: 'Capacity 500 · 7 events booked',
      genres: [],
      stats: [
        { label: 'Events hosted', value: '500' },
        { label: 'Venues worked with', value: '4' },
        { label: 'Tickets sold', value: '3,860' },
        { label: 'Experience', value: '3 yrs' },
      ],
      cardTone: 'indigo',
      status: 'Invite sent',
    },
  ],
  discover: [
    {
      ...partnerProfileDefaults,
      id: 'neon-basement-host',
      name: 'Neon Basement',
      initials: 'NB',
      kind: 'venue',
      role: 'Capacity 300 · 5 events hosted here',
      genres: [],
      stats: [
        { label: 'Events hosted', value: '300' },
        { label: 'Venues worked with', value: '3' },
        { label: 'Tickets sold', value: '2,100' },
        { label: 'Experience', value: '2 yrs' },
      ],
      cardTone: 'violet',
    },
    {
      ...partnerProfileDefaults,
      id: 'riverside-hall-host',
      name: 'Riverside Hall',
      initials: 'RH',
      kind: 'venue',
      role: 'Capacity 800 · 8 events hosted here',
      genres: [],
      stats: [
        { label: 'Events hosted', value: '800' },
        { label: 'Venues worked with', value: '3' },
        { label: 'Tickets sold', value: '2,100' },
        { label: 'Experience', value: '2 yrs' },
      ],
      cardTone: 'teal',
    },
    {
      ...partnerProfileDefaults,
      id: 'attic-club-host',
      name: 'The Attic Club',
      initials: 'AC',
      kind: 'venue',
      role: 'Capacity 180 · 3 events hosted here',
      genres: [],
      stats: [
        { label: 'Events hosted', value: '180' },
        { label: 'Venues worked with', value: '3' },
        { label: 'Tickets sold', value: '2,100' },
        { label: 'Experience', value: '2 yrs' },
      ],
      cardTone: 'pink',
    },
  ],
  requests: {
    incoming: [
      {
        id: 'sana-echo-crew-host',
        name: 'Sana (Echo Crew)',
        initials: 'SE',
        kind: 'host',
        direction: 'incoming',
        note: 'Wants to host a recurring slot',
      },
    ],
    outgoing: [
      {
        id: 'vikram-loud-nights-host',
        name: 'Vikram (Loud Nights)',
        initials: 'VL',
        kind: 'host',
        direction: 'outgoing',
        note: 'Invite sent 3 days ago',
      },
    ],
  },
};

const hostPartnersData: HostPartnersData = {
  dataStatus: 'fixture',
  venues: hostVenues,
  promoters: promoterPartners,
  staff: venueStaff,
};

const promoterPartnerProfile = (
  record: Omit<PromoterPartnerRecord, 'location' | 'verified' | 'upcomingEvents'>,
): PromoterPartnerRecord => ({
  ...record,
  location: 'Mumbai, India',
  verified: false,
  upcomingEvents: [],
});

const promoterPartnersData: PromoterPartnersData = {
  dataStatus: 'fixture',
  activePartnersCount: 3,
  pendingPartnersCount: 0,
  venuesCount: 2,
  hostsCount: 1,
  active: [
    promoterPartnerProfile({
      id: 'majids-club-promoter',
      name: "Majid's Club",
      initials: 'MC',
      kind: 'venue',
      role: '0 events | 0 followers',
      genres: [],
      stats: [],
      cardTone: 'gold',
      state: 'active',
      actionLabel: 'Connected',
    }),
    promoterPartnerProfile({
      id: 'bloom-circle-promoter',
      name: 'Bloom Circle',
      initials: 'BC',
      kind: 'venue',
      role: '0 events | 0 followers',
      genres: [],
      stats: [],
      cardTone: 'violet',
      state: 'active',
      actionLabel: 'Connected',
    }),
    promoterPartnerProfile({
      id: 'new-host-promoter',
      name: 'New Host',
      initials: 'NH',
      kind: 'host',
      role: '0 events | 0 followers',
      genres: [],
      stats: [],
      cardTone: 'teal',
      state: 'active',
      actionLabel: 'Connected',
    }),
  ],
  discover: [
    promoterPartnerProfile({
      id: 'anonymous-promoter',
      name: 'Anonymous',
      initials: 'A',
      kind: 'host',
      role: '0 events | 0 followers',
      genres: [],
      stats: [],
      cardTone: 'orange',
      state: 'discover',
      actionLabel: 'Send Request',
    }),
    promoterPartnerProfile({
      id: 'playboy-club-delhi-promoter',
      name: 'Playboy Club Delhi',
      initials: 'PC',
      kind: 'host',
      role: '0 events | 410 followers',
      genres: [],
      stats: [],
      cardTone: 'indigo',
      state: 'discover',
      actionLabel: 'Send Request',
    }),
    promoterPartnerProfile({
      id: 'dot-pune-promoter',
      name: 'D.O.T Pune',
      initials: 'DP',
      kind: 'host',
      role: '0 events | 220 followers',
      genres: [],
      stats: [],
      cardTone: 'pink',
      state: 'discover',
      actionLabel: 'Send Request',
    }),
    promoterPartnerProfile({
      id: 'quantika-promoter',
      name: 'Quantika',
      initials: 'Q',
      kind: 'host',
      role: '0 events | 880 followers',
      genres: [],
      stats: [],
      cardTone: 'slate',
      state: 'discover',
      actionLabel: 'Send Request',
    }),
  ],
  incoming: [],
  pending: [],
  declined: [],
};

const venueFinanceData: VenueFinanceData = {
  dataStatus: 'fixture',
  accent: 'orange',
  availableBalance: '₹4,86,200',
  balanceDelta: '+9.4%',
  balanceDetail: 'Ready to withdraw to HDFC ••4412 now.',
  balanceTrend: [30, 42, 38, 55, 48, 62, 58, 72, 66, 80, 74, 92],
  pendingBalance: {
    label: 'Pending balance',
    value: '₹1,24,000',
    detail: 'Clears within 2 days',
    tone: 'warning',
  },
  nextPayout: {
    label: 'Next payout',
    value: 'Fri, Jul 18',
    detail: 'Auto to ••4412',
    tone: 'positive',
  },
  bankAccount: {
    bankName: 'HDFC Bank',
    displayNumber: '5010 •••• •••• 4412',
    accountNumber: '5010 0284 4412',
    ifscCode: 'HDFC0001234',
    accountHolder: 'Rhea Kapoor Events LLP',
  },
  paymentCard: {
    label: 'THE C1RCLE · Business',
    displayNumber: '4242 4242 4242 4242',
    cardNumber: '4242 4242 4242 4242',
    holder: 'Rhea Kapoor',
    expiry: '09/28',
    cvv: '•••',
  },
  payouts: [
    {
      id: 'payout-jul-18',
      date: 'Fri, Jul 18',
      detail: 'Scheduled · Neon Nights + 2 events',
      status: 'Scheduled',
      amount: '₹4,86,200',
    },
    {
      id: 'payout-jul-11',
      date: 'Fri, Jul 11',
      detail: 'HDFC ••4412 · Sunset Sessions',
      status: 'Paid',
      amount: '₹3,88,000',
    },
    {
      id: 'payout-jul-04',
      date: 'Fri, Jul 4',
      detail: 'HDFC ••4412 · Monsoon Sessions',
      status: 'Paid',
      amount: '₹7,05,000',
    },
    {
      id: 'payout-jun-27',
      date: 'Fri, Jun 27',
      detail: 'HDFC ••4412 · Bollywood Brunch',
      status: 'Paid',
      amount: '₹2,34,000',
    },
    {
      id: 'payout-jun-20',
      date: 'Fri, Jun 20',
      detail: 'HDFC ••4412 · Warehouse Rave',
      status: 'Paid',
      amount: '₹1,64,000',
    },
  ],
  orders: [
    {
      id: 'order-8823',
      name: 'Priya Kapoor',
      initials: 'PK',
      orderNumber: '#8823',
      date: '4m ago',
      event: 'Neon Nights',
      tickets: 5,
      amount: '₹28,000',
      status: 'Confirmed',
      avatarTone: 'orange',
    },
    {
      id: 'order-8822',
      name: 'Aisha Menon',
      initials: 'AM',
      orderNumber: '#8822',
      date: '22m ago',
      event: 'Neon Nights',
      tickets: 2,
      amount: '₹5,000',
      status: 'Confirmed',
      avatarTone: 'violet',
    },
    {
      id: 'order-8821',
      name: 'Karan Shah',
      initials: 'KS',
      orderNumber: '#8821',
      date: '1h ago',
      event: 'Neon Nights',
      tickets: 1,
      amount: '₹1,800',
      status: 'Pending',
      avatarTone: 'teal',
    },
    {
      id: 'order-8815',
      name: 'Meera Rao',
      initials: 'MR',
      orderNumber: '#8815',
      date: '3h ago',
      event: 'Warehouse Rave',
      tickets: 1,
      amount: '₹1,800',
      status: 'Refunded',
      avatarTone: 'pink',
    },
    {
      id: 'order-8810',
      name: 'Devansh Iyer',
      initials: 'DI',
      orderNumber: '#8810',
      date: '5h ago',
      event: 'Neon Nights',
      tickets: 4,
      amount: '₹7,200',
      status: 'Confirmed',
      avatarTone: 'gold',
    },
    {
      id: 'order-8804',
      name: 'Sara D’Souza',
      initials: 'SD',
      orderNumber: '#8804',
      date: '8h ago',
      event: 'Sunset Sessions',
      tickets: 1,
      amount: '₹2,500',
      status: 'Cancelled',
      avatarTone: 'indigo',
    },
  ],
};

const hostFinanceData: HostFinanceData = {
  ...venueFinanceData,
  accent: 'lavender',
};

const promoterFinanceData: PromoterFinanceData = {
  dataStatus: 'fixture',
  walletBalance: '₹0',
  walletStatus: 'AVAILABLE',
  pendingBalance: '₹0',
  instantAvailable: '₹0',
  withdrawalsMessage: 'Withdrawals unavailable during launch verification',
  country: 'India',
  currency: 'INR',
  statementDescriptor: 'C1RCLE',
  payoutSchedule: 'Weekly',
  bankSectionTitle: 'Banks & Debit Cards',
  bankSetupLabel: '+ Add Bank Account',
  bankSetupNote: 'Link a payout destination from the payouts page when you are ready to withdraw.',
  payoutsTitle: 'Payouts',
  lastUpdated: '02:55 pm',
  emptyPayoutTitle: 'No earnings yet.',
  emptyPayoutDescription:
    'Commission rows will appear here once tickets are sold through your promoter links.',
};

const promoterGuestEvents: readonly PromoterGuestEventOption[] = [
  { id: 'event-30th-july', name: 'Event 30th July' },
];

const promoterGuestsData: PromoterGuestsData = {
  dataStatus: 'fixture',
  totalGuests: 2,
  checkedIn: '0/2',
  revenue: '₹1,306',
  commission: '₹131',
  events: promoterGuestEvents,
  guests: [
    {
      id: 'promoter-guest-1',
      name: 'Guest',
      initials: 'GU',
      tickets: '2 tickets',
      event: 'Event 30th July',
      amount: '₹871',
      commission: '+₹87',
      status: 'Ticket',
      when: '26d ago',
    },
    {
      id: 'promoter-guest-2',
      name: 'Guest',
      initials: 'GU',
      tickets: '1 ticket',
      event: 'Event 30th July',
      amount: '₹435',
      commission: '+₹44',
      status: 'Ticket',
      when: '26d ago',
    },
  ],
};

const promoterTopLinks: readonly PromoterLinkPerformance[] = [1, 2, 3, 4].map((rank) => ({
  id: `promoter-link-${String(rank)}`,
  name: 'Event',
  path: '/e/agarwalkespe8',
  clicks: 0,
  sales: 0,
  conversion: '0.0%',
}));

const promoterAnalyticsData: PromoterAnalyticsData = {
  dataStatus: 'fixture',
  totalClicks: '8',
  ticketsSold: '0',
  conversionRate: '0.0%',
  totalEarnings: '₹0',
  activeLinks: 4,
  totalLinks: 4,
  topLinks: promoterTopLinks,
  recentActivity: [
    {
      id: 'analytics-activity-1',
      title: 'Nova Nexus',
      meta: 'Nova Nexus · agarwalkespe8',
      time: '26 DAYS AGO',
    },
    {
      id: 'analytics-activity-2',
      title: 'Event - 297',
      meta: 'Event - 297 · agarwalkespe8',
      time: '27 DAYS AGO',
    },
    {
      id: 'analytics-activity-3',
      title: 'Event by new host',
      meta: 'Event by new host · agarwalkespe8',
      time: '27 DAYS AGO',
    },
    {
      id: 'analytics-activity-4',
      title: 'Event 30th July',
      meta: 'Event 30th July · agarwalkespe8',
      time: '26 DAYS AGO',
    },
  ],
};

const promoterLeaderboardData: PromoterLeaderboardData = {
  dataStatus: 'fixture',
  periods: [
    { value: 'all', label: 'All Time' },
    { value: '30d', label: '30 Days' },
    { value: '7d', label: '7 Days' },
  ],
  cities: [
    { value: 'global', label: 'Global (All Cities)' },
    { value: 'mumbai', label: 'Mumbai' },
    { value: 'pune', label: 'Pune' },
  ],
  podium: [
    {
      id: 'sarah-v',
      name: 'Sarah V.',
      initials: 'SV',
      tickets: 201,
      xp: 426,
      rank: 2,
      avatarTone: 'silver',
    },
    {
      id: 'nadia-p',
      name: 'Nadia P.',
      initials: 'NP',
      tickets: 225,
      xp: 480,
      rank: 1,
      avatarTone: 'gold',
    },
    {
      id: 'marcus-s',
      name: 'Marcus S.',
      initials: 'MS',
      tickets: 189,
      xp: 403,
      rank: 3,
      avatarTone: 'bronze',
    },
  ],
  ranked: [
    {
      id: 'chloe-matrix',
      name: 'Chloe Matrix',
      initials: 'CM',
      rank: 4,
      xp: 304,
      avatarTone: 'red',
    },
    {
      id: 'alex-thunder',
      name: 'Alex Thunder',
      initials: 'AT',
      rank: 5,
      xp: 286,
      avatarTone: 'purple',
    },
    {
      id: 'tariq-storm',
      name: 'Tariq Storm',
      initials: 'TS',
      rank: 6,
      xp: 214,
      avatarTone: 'blue',
    },
  ],
};

const basslineSlotEvent: SlotRequestEvent = {
  name: 'Bassline Nights',
  description:
    'Bass-heavy night with a rotating cast of underground selectors. Doors at 11, headline set at 1 AM.',
  date: 'Sat, Aug 22',
  time: '11:00 PM – 4:00 AM',
  venue: 'Skyline Rooftop',
  ticketTier: 'GA + VIP Table',
  note: 'Recurring monthly slot, expecting 300+ turnout.',
  artists: ['DJ Sartek', 'Nucleya'],
  promoters: ['Pulse Collective', 'Nightowl'],
  tiers: [
    { name: 'General Admission', price: '₹800', quantity: '250' },
    { name: 'VIP Table', price: '₹8,000', quantity: '20' },
  ],
  pricing: ['First 50 tickets: 15% off', 'Last 25 tickets: +20%'],
  tables: '6 tables reserved',
  codes: 'BASS15',
};

const retroSlotEvent: SlotRequestEvent = {
  name: 'Retro Fridays',
  description: '80s and 90s throwback party with live visuals and a costume corner.',
  date: 'Fri, Sep 5',
  time: '10:00 PM – 3:00 AM',
  venue: 'Skyline Rooftop',
  ticketTier: 'General Admission',
  note: 'First-time booking, promo push planned across her list.',
  artists: ['Retrograde'],
  promoters: ['Nightowl'],
  tiers: [{ name: 'General Admission', price: '₹600', quantity: '300' }],
  pricing: ['First 40 tickets: 10% off'],
  tables: 'None',
  codes: '—',
};

const sundaySlotEvent: SlotRequestEvent = {
  name: 'Sunday Sessions',
  description: 'Sunset house session, family-friendly early hours.',
  date: 'Sun, Aug 30',
  time: '5:00 PM – 10:00 PM',
  venue: 'Skyline Rooftop',
  ticketTier: 'General Admission',
  note: 'Daytime chill set, smaller crowd expected.',
  artists: ['TBA'],
  promoters: ['Kabir M.'],
  tiers: [{ name: 'General Admission', price: '₹500', quantity: '180' }],
  pricing: ['First 30 tickets: 10% off'],
  tables: 'None',
  codes: '—',
};

const venueSlotRequests: readonly SlotRequest[] = [
  {
    id: 'venue-slot-bassline',
    status: 'pending',
    direction: 'incoming',
    partnerName: 'Arjun (Pulse Collective)',
    partnerRoleLabel: 'Host',
    partnerInitials: 'AP',
    event: basslineSlotEvent,
  },
  {
    id: 'venue-slot-retro',
    status: 'pending',
    direction: 'incoming',
    partnerName: 'Zoya (Nightowl)',
    partnerRoleLabel: 'Host',
    partnerInitials: 'ZN',
    event: retroSlotEvent,
  },
  {
    id: 'venue-slot-sunday',
    status: 'approved',
    direction: 'incoming',
    partnerName: 'Kabir M.',
    partnerRoleLabel: 'Host',
    partnerInitials: 'KM',
    event: sundaySlotEvent,
  },
];

const hostSlotRequests: readonly SlotRequest[] = [
  {
    id: 'host-slot-bassline',
    status: 'pending',
    direction: 'outgoing',
    partnerName: 'Skyline Rooftop',
    partnerRoleLabel: 'Venue',
    partnerInitials: 'SR',
    event: basslineSlotEvent,
  },
  {
    id: 'host-slot-retro',
    status: 'pending',
    direction: 'outgoing',
    partnerName: 'Skyline Rooftop',
    partnerRoleLabel: 'Venue',
    partnerInitials: 'SR',
    event: retroSlotEvent,
  },
  {
    id: 'host-slot-sunday',
    status: 'approved',
    direction: 'outgoing',
    partnerName: 'Skyline Rooftop',
    partnerRoleLabel: 'Venue',
    partnerInitials: 'SR',
    event: sundaySlotEvent,
  },
];

const venueSlotRequestsData: VenueSlotRequestsData = {
  dataStatus: 'fixture',
  accent: 'orange',
  direction: 'incoming',
  requests: venueSlotRequests,
};

const hostSlotRequestsData: HostSlotRequestsData = {
  dataStatus: 'fixture',
  accent: 'lavender',
  direction: 'outgoing',
  requests: hostSlotRequests,
};

const makeCalendarMonth = (
  key: string,
  label: string,
  daysInMonth: number,
  events: readonly CalendarEvent[],
  blocks: readonly CalendarBlock[] = [],
  dayStates: Readonly<Record<number, CalendarDayState>> = {},
): CalendarMonth => {
  const [yearValue, monthValue] = key.split('-').map(Number);
  const year = yearValue ?? 2026;
  const month = monthValue ?? 7;
  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((grouped, event) => {
    (grouped[event.date] ??= []).push(event);
    return grouped;
  }, {});
  const blocksByDate = new Map(blocks.map((block) => [block.date, block]));
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = `${key}-${String(day).padStart(2, '0')}`;
    const dayEvents = eventsByDate[date] ?? [];
    const block = blocksByDate.get(date);
    const state = block
      ? 'blocked'
      : (dayStates[day] ??
        (dayEvents.some((event) => event.status === 'pending')
          ? 'pending'
          : dayEvents.length
            ? 'confirmed'
            : 'available'));
    return { date, day, state, events: dayEvents, slots: [] };
  });
  return {
    key,
    label,
    firstDayOffset: new Date(Date.UTC(year, month - 1, 1)).getUTCDay(),
    daysInMonth,
    days,
  };
};

const calendarEvents: readonly CalendarEvent[] = [
  {
    id: 'private-booking-corporate',
    date: '2026-07-03',
    name: 'Private booking · Corporate',
    time: '7:00 PM – 11:00 PM',
    status: 'confirmed',
    venue: 'Skyline Rooftop',
  },
  {
    id: 'warehouse-rave-on-hold',
    date: '2026-07-09',
    name: 'Warehouse Rave (on hold)',
    time: '11:00 PM – 4:00 AM',
    status: 'pending',
    venue: 'The Docks',
  },
  {
    id: 'venue-maintenance',
    date: '2026-07-12',
    name: 'Venue maintenance',
    time: 'All day',
    status: 'blocked',
    venue: 'Skyline Rooftop',
  },
  {
    id: 'neon-nights-setup',
    date: '2026-07-16',
    name: 'Soundcheck & setup',
    time: '5:00 PM – 8:00 PM',
    status: 'confirmed',
    venue: 'Skyline Rooftop',
    href: '/partner/venue/events/neon-nights-afrobeats',
  },
  {
    id: 'neon-nights-calendar',
    date: '2026-07-16',
    name: 'Neon Nights: Afrobeats Edition',
    time: '9:00 PM – 3:00 AM',
    status: 'confirmed',
    venue: 'Skyline Rooftop',
    href: '/partner/venue/events/neon-nights-afrobeats',
  },
  {
    id: 'bollywood-brunch-matinee',
    date: '2026-07-23',
    name: 'Bollywood Brunch (matinee)',
    time: '12:00 PM – 4:00 PM',
    status: 'confirmed',
    venue: 'Garden Terrace',
    href: '/partner/venue/events/bollywood-brunch',
  },
  {
    id: 'sunset-sessions-calendar',
    date: '2026-07-30',
    name: 'Sunset Sessions Vol. 4',
    time: '5:00 PM – 11:00 PM',
    status: 'confirmed',
    venue: 'Skyline Rooftop',
    href: '/partner/venue/events/sunset-sessions-vol-4',
  },
  {
    id: 'sunset-sessions-august',
    date: '2026-08-02',
    name: 'Sunset Sessions Vol. 4',
    time: '5:00 PM – 11:00 PM',
    status: 'confirmed',
    venue: 'Skyline Rooftop',
    href: '/partner/venue/events/sunset-sessions-vol-4',
  },
  {
    id: 'warehouse-rave-august',
    date: '2026-08-09',
    name: 'Warehouse Rave',
    time: '11:00 PM – 4:00 AM',
    status: 'pending',
    venue: 'The Docks',
    href: '/partner/venue/events/warehouse-rave',
  },
  {
    id: 'bollywood-brunch-august',
    date: '2026-08-15',
    name: 'Bollywood Brunch',
    time: '12:00 PM – 4:00 PM',
    status: 'confirmed',
    venue: 'Garden Terrace',
    href: '/partner/venue/events/bollywood-brunch',
  },
];

const venueCalendarBlocks: readonly CalendarBlock[] = [
  {
    id: 'maintenance-july-12',
    date: '2026-07-12',
    reason: 'Maintenance',
    from: '00:00',
    to: '23:59',
  },
];

const venueCalendarMonths: readonly CalendarMonth[] = [
  makeCalendarMonth(
    '2026-07',
    'July 2026',
    31,
    calendarEvents.filter((event) => event.date.startsWith('2026-07')),
    venueCalendarBlocks,
  ),
  makeCalendarMonth(
    '2026-08',
    'August 2026',
    31,
    calendarEvents.filter((event) => event.date.startsWith('2026-08')),
  ),
];

const venueCalendarData: VenueCalendarData = {
  dataStatus: 'fixture',
  accent: 'orange',
  months: venueCalendarMonths,
  blocks: venueCalendarBlocks,
};

const hostVenueOptions = [
  {
    id: 'skyline-rooftop',
    name: 'Skyline Rooftop',
    meta: 'Capacity 400 · 6 events booked',
    status: 'Partnered' as const,
  },
  {
    id: 'warehouse-district',
    name: 'Warehouse District',
    meta: 'Capacity 1200 · 9 events booked',
    status: 'Partnered' as const,
  },
  {
    id: 'the-yard',
    name: 'The Yard',
    meta: 'Capacity 650 · 14 events booked',
    status: 'Partnered' as const,
  },
];

const addAvailabilitySlots = (months: readonly CalendarMonth[]): readonly CalendarMonth[] =>
  months.map((month) => ({
    ...month,
    days: month.days.map((day) => ({
      ...day,
      slots:
        day.state === 'available'
          ? [
              { id: `${day.date}-late`, label: '8:00 PM – 11:00 PM', status: 'available' as const },
              {
                id: `${day.date}-night`,
                label: '11:00 PM – 3:00 AM',
                status: 'available' as const,
              },
            ]
          : [],
    })),
  }));

const calendarForVenue = (
  venueName: string,
  months: readonly CalendarMonth[],
): readonly CalendarMonth[] =>
  months.map((month) => ({
    ...month,
    days: month.days.map((day) => {
      const events = day.events.filter((event) => event.venue === venueName);
      const state: CalendarDayState = events.some((event) => event.status === 'pending')
        ? 'pending'
        : events.length
          ? 'confirmed'
          : venueName === 'Skyline Rooftop' && day.state === 'blocked'
            ? 'blocked'
            : 'available';
      return { ...day, state, events };
    }),
  }));

const hostAvailabilityData: HostAvailabilityData = {
  dataStatus: 'fixture',
  accent: 'lavender',
  venues: hostVenueOptions.map((venue, index) => ({
    venue,
    months:
      index === 0
        ? addAvailabilitySlots(calendarForVenue(venue.name, venueCalendarMonths))
        : addAvailabilitySlots([makeCalendarMonth('2026-07', 'July 2026', 31, [])]),
  })),
};

const editorVenues: readonly EventEditorVenueOption[] = hostVenueOptions.map((venue, index) => ({
  ...venue,
  artwork: { type: 'gradient', value: ['sunset', 'warehouse', 'bollywood'][index] ?? 'default' },
}));

const editorPromoters: readonly EventEditorPromoterOption[] = promoterPartners.connected
  .filter((partner) => partner.kind === 'promoter')
  .map((partner) => ({
    id: partner.id,
    name: partner.name,
    initials: partner.initials,
    role: partner.role,
  }));

const defaultEditorDraft = (role: 'venue' | 'host'): EventEditorDraft => ({
  name: '',
  venueId: role === 'host' ? (editorVenues[0]?.id ?? '') : 'skyline-rooftop',
  date: '',
  dateLabel: 'No date picked yet',
  time: '9:00 PM',
  genres: ['House', 'Club Night'],
  artists: [],
  artwork: { type: 'gradient', value: 'sunset' },
  ticketTiers: [
    { id: 'ga', name: 'General Admission', price: 1200, quantity: 250 },
    { id: 'vip-entry', name: 'VIP Entry', price: 2000, quantity: 100 },
    { id: 'vip-table', name: 'VIP Table', price: 8000, quantity: 20 },
  ],
  selectedPromoterIds: [],
  tableType: 'high',
  promoCodes: ['EARLYBIRD'],
  pricingRule: 'First 50 tickets · 15% off',
  compensation: 'standard',
  commissionRate: 15,
  salaryNotes: '',
});

const venueEventEditorData: EventEditorData = {
  dataStatus: 'fixture',
  role: 'venue',
  venues: editorVenues,
  promoters: editorPromoters,
  genres: ['House', 'Techno', 'Afrobeats', 'Bollywood', 'Deep House'],
  extraGenres: ['R&B', 'Hip-hop', 'Disco', 'Live music', 'Brunch'],
  artworkOptions: [
    {
      type: 'image',
      value: '/partner-v3/venue/neon-nights-poster.jpg',
      alt: 'Neon Nights event artwork',
    },
    { type: 'gradient', value: 'sunset' },
    { type: 'gradient', value: 'warehouse' },
    { type: 'gradient', value: 'bollywood' },
  ],
  defaultDraft: defaultEditorDraft('venue'),
};

const hostEventEditorData: EventEditorData = {
  ...venueEventEditorData,
  role: 'host',
  defaultDraft: defaultEditorDraft('host'),
};

const marketingEventOptions = (
  events: readonly PartnerEventRecord[],
): readonly MarketingEventOption[] =>
  events.map((event) => ({
    id: event.id,
    name: event.name,
    date: `${event.monthLabel} ${event.dayLabel}`,
    venue: event.venue,
    artwork: event.artwork,
  }));

const marketingAttendees: readonly MarketingAttendee[] = [
  {
    id: 'marketing-aisha',
    name: 'Aisha Menon',
    initials: 'AM',
    contact: '+91 98200 xxxxx',
    email: 'aisha.m@email.com',
    gender: 'F',
    source: 'online',
    eventId: 'neon-nights-afrobeats',
    date: '2026-07-16',
  },
  {
    id: 'marketing-karan',
    name: 'Karan Shah',
    initials: 'KS',
    contact: '+91 99870 xxxxx',
    email: 'karan.s@email.com',
    gender: 'M',
    source: 'online',
    eventId: 'bollywood-brunch',
    date: '2026-08-15',
  },
  {
    id: 'marketing-devansh',
    name: 'Devansh Iyer',
    initials: 'DI',
    contact: '+91 90210 xxxxx',
    email: 'devansh.i@email.com',
    gender: 'M',
    source: 'online',
    eventId: 'warehouse-rave',
    date: '2026-08-09',
  },
  {
    id: 'marketing-priya',
    name: 'Priya Kapoor',
    initials: 'PK',
    contact: '+91 98765 xxxxx',
    email: 'priya.s@email.com',
    gender: 'F',
    source: 'walkin',
    eventId: 'neon-nights-afrobeats',
    date: '2026-07-16',
  },
  {
    id: 'marketing-nikhil',
    name: 'Nikhil Verma',
    initials: 'NV',
    contact: '+91 97654 xxxxx',
    email: 'nikhil.v@email.com',
    gender: 'M',
    source: 'online',
    eventId: 'sunset-sessions-vol-4',
    date: '2026-08-02',
  },
  {
    id: 'marketing-sara',
    name: 'Sara D’Souza',
    initials: 'SD',
    contact: '+91 91234 xxxxx',
    email: 'sara.d@email.com',
    gender: 'F',
    source: 'walkin',
    eventId: 'sunset-sessions-vol-4',
    date: '2026-08-02',
  },
];

const marketingCampaigns: readonly MarketingCampaign[] = [
  {
    id: 'campaign-neon-last-call',
    title: 'Neon Nights — last call for tickets',
    meta: 'Sent Jul 14 · Neon Nights guests',
    channel: 'sms',
    status: 'sent',
    eventId: 'neon-nights-afrobeats',
    audienceLabel: 'Neon Nights guests',
    sent: 2140,
    read: 1880,
    clicked: 642,
  },
  {
    id: 'campaign-sunset-announcement',
    title: 'Sunset Sessions announcement',
    meta: 'Sent Jul 8 · All guests',
    channel: 'whatsapp',
    status: 'sent',
    audienceLabel: 'All guests',
    sent: 8420,
    read: 7190,
    clicked: 2310,
  },
  {
    id: 'campaign-monsoon-thanks',
    title: 'Thank you for coming!',
    meta: 'Sent Jun 30 · Monsoon Sessions guests',
    channel: 'email',
    status: 'sent',
    eventId: 'monsoon-sessions',
    audienceLabel: 'Monsoon Sessions guests',
    sent: 1960,
    read: 1120,
    clicked: 488,
  },
  {
    id: 'campaign-vip-tables',
    title: 'Early-bird VIP tables open',
    meta: 'Scheduled Jul 22 · VIP guests',
    channel: 'push',
    status: 'scheduled',
    audienceLabel: 'VIP guests',
    sent: 640,
    read: 590,
    clicked: 214,
  },
];

const marketingTemplates: readonly MarketingTemplate[] = [
  {
    id: 'template-announcement',
    name: 'Event announcement',
    channel: 'whatsapp',
    preview:
      'Hey {name}! We just dropped a new night you won’t want to miss. Grab early-bird tickets before they’re gone 🔥',
  },
  {
    id: 'template-last-call',
    name: 'Last-call reminder',
    channel: 'sms',
    preview:
      'Only a few tickets left for tonight, {name}. Doors at 9PM — tap the link to lock yours in.',
  },
  {
    id: 'template-thank-you',
    name: 'Thank-you note',
    channel: 'email',
    preview:
      'Thanks for coming out, {name}! Here’s 15% off your next night with us. See you on the dancefloor soon.',
  },
];

const makeMarketingData = (
  role: 'venue' | 'host',
  events: readonly PartnerEventRecord[],
): MarketingData => ({
  dataStatus: 'fixture',
  role,
  accent: role === 'host' ? 'lavender' : 'orange',
  events: marketingEventOptions(events),
  attendees: marketingAttendees,
  campaigns: marketingCampaigns,
  templates: marketingTemplates,
  audiences:
    role === 'host'
      ? [
          {
            id: 'event',
            label: "This event's guests",
            sub: 'Guests from the partnered venue event',
            count: '2,140',
          },
          {
            id: 'all',
            label: 'All guests',
            sub: 'Guests from your partnered events',
            count: '8,420',
          },
          {
            id: 'custom',
            label: 'Custom filter',
            sub: 'VIP · Repeat · New — pick your own',
            count: 'Select…',
          },
        ]
      : [
          {
            id: 'event',
            label: "This event's guests",
            sub: 'Neon Nights: Afrobeats Edition',
            count: '2,140',
          },
          { id: 'all', label: 'All guests', sub: 'Everyone who has ever attended', count: '8,420' },
          {
            id: 'custom',
            label: 'Custom filter',
            sub: 'VIP · Repeat · New — pick your own',
            count: 'Select…',
          },
        ],
  defaultMessage:
    'Hi {{name}}, doors open at 9PM tonight for Neon Nights 🔥 Show this message at the door to skip the line. See you on the rooftop!',
  defaultEventId: events[0]?.id ?? '',
});

const venueMarketingData = makeMarketingData('venue', venueEvents);
const hostMarketingData = makeMarketingData('host', hostEvents);

const makeEventSearchResults = (
  role: 'venue' | 'host',
  events: readonly PartnerEventRecord[],
): readonly PartnerSearchResult[] =>
  events.map((event) => ({
    id: `${role}-search-event-${event.id}`,
    type: 'event',
    group: 'Events',
    title: event.name,
    subtitle: `${event.dateLabel} · ${event.venue}`,
    href: `/partner/${role}/events/${event.id}`,
    icon: 'event',
    keywords: [event.name, event.tag, event.venue, event.host],
  }));

const makePartnerSearchResults = (
  role: StudioRole,
  partners: readonly { readonly id: string; readonly name: string; readonly role: string }[],
): readonly PartnerSearchResult[] =>
  partners.map((partner) => ({
    id: `${role}-search-partner-${partner.id}`,
    type: 'partner',
    group: 'Partners',
    title: partner.name,
    subtitle: partner.role,
    href: `/partner/${role}/partners?profile=${partner.id}`,
    icon: 'partner',
    keywords: [partner.name, partner.role],
  }));

const venueSearchData: PartnerSearchData = {
  dataStatus: 'fixture',
  results: [
    ...makeEventSearchResults('venue', venueEvents),
    ...makePartnerSearchResults('venue', [
      ...venuePartnersData.hosts.connected,
      ...venuePartnersData.promoters.connected,
      ...venuePartnersData.staff,
    ]),
    {
      id: 'venue-search-requests',
      type: 'request',
      group: 'Requests',
      title: 'Slot requests',
      subtitle: 'Review incoming event requests',
      href: '/partner/venue/slot-requests',
      icon: 'request',
      keywords: ['slot', 'request', 'requests'],
    },
    {
      id: 'venue-search-finance',
      type: 'finance',
      group: 'Finance',
      title: 'Finance',
      subtitle: 'Payouts, orders and bank details',
      href: '/partner/venue/finance',
      icon: 'finance',
      keywords: ['finance', 'payout', 'orders', 'bank'],
    },
    {
      id: 'venue-search-settings',
      type: 'settings',
      group: 'Settings',
      title: 'Settings',
      subtitle: 'Presence, menu and account',
      href: '/partner/venue/settings',
      icon: 'settings',
      keywords: ['settings', 'account', 'menu'],
    },
  ],
};

const hostSearchData: PartnerSearchData = {
  dataStatus: 'fixture',
  results: [
    ...makeEventSearchResults('host', hostEvents),
    ...makePartnerSearchResults('host', [
      ...hostPartnersData.venues.connected,
      ...hostPartnersData.promoters.connected,
    ]),
    {
      id: 'host-search-requests',
      type: 'request',
      group: 'Requests',
      title: 'Slot requests',
      subtitle: 'Review venue requests and approvals',
      href: '/partner/host/slot-requests',
      icon: 'request',
      keywords: ['slot', 'request', 'approval'],
    },
    {
      id: 'host-search-finance',
      type: 'finance',
      group: 'Finance',
      title: 'Finance',
      subtitle: 'Payouts, orders and account details',
      href: '/partner/host/finance',
      icon: 'finance',
      keywords: ['finance', 'payout', 'orders', 'bank'],
    },
    {
      id: 'host-search-settings',
      type: 'settings',
      group: 'Settings',
      title: 'Settings',
      subtitle: 'Presence and account',
      href: '/partner/host/settings',
      icon: 'settings',
      keywords: ['settings', 'account', 'presence'],
    },
  ],
};

const promoterSearchData: PartnerSearchData = {
  dataStatus: 'fixture',
  results: [
    ...promoterDiscoverEvents.map((event) => ({
      id: `promoter-search-event-${event.id}`,
      type: 'event' as const,
      group: 'Events',
      title: event.name,
      subtitle: `${event.dateLabel} · ${event.venue}`,
      href: `/partner/promoter/events/${event.id}`,
      icon: 'event' as const,
      keywords: [event.name, event.venue, event.city],
    })),
    ...promoterLinkedEvents.map((event) => ({
      id: `promoter-search-linked-${event.id}`,
      type: 'event' as const,
      group: 'Linked Events',
      title: event.name,
      subtitle: `${String(event.clicks)} clicks · ${String(event.sales)} sales`,
      href: `/partner/promoter/events/${event.id}`,
      icon: 'event' as const,
      keywords: [event.name, event.venue, event.city, 'linked'],
    })),
    ...makePartnerSearchResults('promoter', promoterPartnersData.active),
    {
      id: 'promoter-search-guests',
      type: 'guest',
      group: 'Guests',
      title: 'Guest Stream',
      subtitle: 'Attributed guests and commissions',
      href: '/partner/promoter/guests',
      icon: 'guest',
      keywords: ['guest', 'guests', 'ticket', 'commission'],
    },
    {
      id: 'promoter-search-analytics',
      type: 'finance',
      group: 'Analytics',
      title: 'Analytics',
      subtitle: 'Clicks, sales and link performance',
      href: '/partner/promoter/analytics',
      icon: 'finance',
      keywords: ['analytics', 'clicks', 'sales', 'links'],
    },
    {
      id: 'promoter-search-finance',
      type: 'finance',
      group: 'Finance',
      title: 'Finance',
      subtitle: 'Wallet and commission payouts',
      href: '/partner/promoter/finance',
      icon: 'finance',
      keywords: ['finance', 'wallet', 'earnings', 'payout'],
    },
  ],
};

const makeNotifications = (role: 'venue' | 'host'): PartnerNotificationsData => ({
  dataStatus: 'fixture',
  notifications: [
    {
      id: `${role}-notification-payout`,
      description: 'Payout of ₹4,86,200 is scheduled for Fri, Jul 18.',
      time: '12m ago',
      type: 'payout',
      icon: 'finance',
      href: `/partner/${role}/finance`,
      unread: true,
    },
    {
      id: `${role}-notification-partner`,
      description: 'The Docks accepted your partner invite.',
      time: '1h ago',
      type: 'request',
      icon: 'partner',
      href: `/partner/${role}/partners`,
      unread: true,
    },
    {
      id: `${role}-notification-marketing`,
      description: 'Neon Nights last-call campaign finished sending.',
      time: '3h ago',
      type: 'marketing',
      icon: 'marketing',
      href: `/partner/${role}/marketing`,
      unread: true,
    },
    {
      id: `${role}-notification-door`,
      description: '2 guests flagged at the door for Neon Nights.',
      time: '5h ago',
      type: 'operations',
      icon: 'operations',
      href: `/partner/${role}/door`,
      unread: false,
    },
    {
      id: `${role}-notification-request`,
      description: 'Zoya (Nightowl) requested to promote your next event.',
      time: '1d ago',
      type: 'request',
      icon: 'request',
      href: `/partner/${role}/slot-requests`,
      unread: false,
    },
  ],
});

const promoterNotificationsData: PartnerNotificationsData = {
  dataStatus: 'fixture',
  notifications: [],
};

const makeShellInteractionData = (
  role: 'venue' | 'host' | 'promoter',
): PartnerShellInteractionData => ({
  dataStatus: 'fixture',
  search:
    role === 'venue' ? venueSearchData : role === 'host' ? hostSearchData : promoterSearchData,
  notifications: role === 'promoter' ? promoterNotificationsData : makeNotifications(role),
});

export const fixturePartnerDataSource: PartnerDataSource = {
  getStudioShell(role) {
    return Promise.resolve({
      ...shellData,
      role,
      displayName: `${role.charAt(0).toUpperCase()}${role.slice(1)} Studio`,
    });
  },
  getVenueOverview() {
    return Promise.resolve(venueOverviewData);
  },
  getHostOverview() {
    return Promise.resolve(hostOverviewData);
  },
  getPromoterOverview() {
    return Promise.resolve(promoterOverviewData);
  },
  getVenueEvents() {
    return Promise.resolve(venueEventsData);
  },
  getVenueEventDetail(eventId) {
    return Promise.resolve(venueEventDetails.find((detail) => detail.event.id === eventId) ?? null);
  },
  getHostEvents() {
    return Promise.resolve(hostEventsData);
  },
  getHostEventDetail(eventId) {
    return Promise.resolve(hostEventDetails.find((detail) => detail.event.id === eventId) ?? null);
  },
  getPromoterEvents() {
    return Promise.resolve(promoterEventsData);
  },
  getVenuePartners() {
    return Promise.resolve(venuePartnersData);
  },
  getHostPartners() {
    return Promise.resolve(hostPartnersData);
  },
  getPromoterPartners() {
    return Promise.resolve(promoterPartnersData);
  },
  getVenueFinance() {
    return Promise.resolve(venueFinanceData);
  },
  getHostFinance() {
    return Promise.resolve(hostFinanceData);
  },
  getPromoterFinance() {
    return Promise.resolve(promoterFinanceData);
  },
  getPromoterGuests() {
    return Promise.resolve(promoterGuestsData);
  },
  getPromoterAnalytics() {
    return Promise.resolve(promoterAnalyticsData);
  },
  getPromoterLeaderboard() {
    return Promise.resolve(promoterLeaderboardData);
  },
  getVenueSlotRequests() {
    return Promise.resolve(venueSlotRequestsData);
  },
  getHostSlotRequests() {
    return Promise.resolve(hostSlotRequestsData);
  },
  getVenueCalendar() {
    return Promise.resolve(venueCalendarData);
  },
  getHostAvailability() {
    return Promise.resolve(hostAvailabilityData);
  },
  getVenueEventEditor() {
    return Promise.resolve(venueEventEditorData);
  },
  getHostEventEditor() {
    return Promise.resolve(hostEventEditorData);
  },
  getVenueMarketing() {
    return Promise.resolve(venueMarketingData);
  },
  getHostMarketing() {
    return Promise.resolve(hostMarketingData);
  },
  getVenueDoorMode() {
    return Promise.resolve(venueDoorModeData);
  },
  getHostDoorMode() {
    return Promise.resolve(hostDoorModeData);
  },
  getVenueSettings() {
    return Promise.resolve(venueSettingsData);
  },
  getHostSettings() {
    return Promise.resolve(hostSettingsData);
  },
  getPartnerShellInteractions(role) {
    return Promise.resolve(makeShellInteractionData(role));
  },
};
