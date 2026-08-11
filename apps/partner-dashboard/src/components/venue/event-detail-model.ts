import { cache } from 'react';

import { venueEventSource } from './venue-events-model';

export type EventOrderStatus = 'Paid' | 'Refunded' | 'Pending';
export type EventGuestCheckInStatus = 'Checked in' | 'Not arrived';
export type EventGuestSource = 'Ticket sale' | 'Guest list';
export type EventPromoterStatus = 'Active' | 'Invite pending';
export type EventFinanceTransactionStatus = 'Paid' | 'Refunded';

export interface VenueEventDetailHeaderModel {
  readonly id: string;
  readonly name: string;
  readonly venue: string;
  readonly dateTimeLabel: string;
  readonly posterSrc: string;
  readonly posterAlt: string;
}

export interface VenueEventTicketType {
  readonly name: 'Couple Pass' | 'Early Bird' | 'General Entry';
  readonly pricePaise: number;
  readonly price: string;
  readonly sold: number;
  readonly capacity: number;
  readonly soldPercent: number;
}

export interface VenueEventSummaryModel {
  readonly metrics: {
    readonly ticketsSold: string;
    readonly grossSales: string;
    readonly guestsCheckedIn: string;
  };
  readonly salesProgress: {
    readonly labels: readonly string[];
    readonly valuesRupees: readonly number[];
    readonly accessibleSummary: string;
  };
  readonly recentOrders: readonly {
    readonly id: string;
    readonly ticket: string;
    readonly ticketLabel: string;
    readonly amount: string;
    readonly relativeTime: string;
  }[];
  readonly ticketTypes: readonly VenueEventTicketType[];
  readonly information: {
    readonly venue: string;
    readonly address: string;
    readonly startAndEnd: string;
    readonly ageLimit: string;
    readonly dressCode: string | null;
    readonly entryMethod: string;
    readonly contact: string;
  };
}

export interface VenueEventSalesModel {
  readonly metrics: readonly {
    readonly label: 'Gross sales' | 'Tickets sold' | 'Refunds';
    readonly value: string;
    readonly definition: string;
  }[];
  readonly chart: {
    readonly labels: readonly string[];
    readonly salesRupees: readonly number[];
    readonly tickets: readonly number[];
    readonly salesSummary: string;
    readonly ticketsSummary: string;
  };
  readonly ticketTypes: readonly VenueEventTicketType[];
  readonly orders: readonly {
    readonly id: string;
    readonly guest: string;
    readonly ticket: string;
    readonly quantity: number;
    readonly amountPaise: number;
    readonly amount: string;
    readonly status: EventOrderStatus;
  }[];
}

export interface VenueEventGuestsModel {
  readonly checkedIn: number;
  readonly remaining: number;
  readonly issuedGuests: number;
  readonly checkedInPercent: number;
  readonly guests: readonly {
    readonly id: string;
    readonly name: string;
    readonly initials: string;
    readonly maskedPhone: string;
    readonly ticketType: 'VIP Table' | 'GA';
    readonly checkInStatus: EventGuestCheckInStatus;
    readonly checkInTime: string | null;
    readonly checkInDateTime: string | null;
    readonly addedBy: EventGuestSource;
  }[];
}

export interface VenueEventPromotersModel {
  readonly activePromoters: number;
  readonly ticketsSold: number;
  readonly promoters: readonly {
    readonly id: string;
    readonly name: string;
    readonly initials: string;
    readonly phone: string;
    readonly instagram: string | null;
    readonly link: string;
    readonly ticketsSold: number;
    readonly earningsPaise: number;
    readonly earnings: string;
    readonly status: EventPromoterStatus;
  }[];
}

export interface VenueEventMarketingModel {
  readonly activeCampaign: {
    readonly name: string;
    readonly channel: 'SMS' | 'Email' | 'Instagram' | 'Push';
    readonly scheduledFor: string;
    readonly audienceSize: string;
    readonly status: 'Ready' | 'Scheduled';
  } | null;
  readonly recentMessages: readonly {
    readonly id: string;
    readonly message: string;
    readonly channel: 'SMS' | 'Email' | 'Instagram' | 'Push';
    readonly sentAt: string;
    readonly result: string;
  }[];
  readonly eventUrl: string;
}

export interface VenueEventFinanceModel {
  readonly summary: {
    readonly grossSales: string;
    readonly deductions: string;
    readonly expectedPayout: string;
    readonly payoutDate: string;
  };
  readonly breakdown: readonly {
    readonly label: 'Ticket sales' | 'Refunds' | 'Platform fees' | 'Taxes' | 'Expected payout';
    readonly amount: string;
    readonly amountPaise: number;
  }[];
  readonly payoutAccount: {
    readonly bankName: string;
    readonly maskedAccount: string;
  };
  readonly transactions: readonly {
    readonly id: string;
    readonly date: string;
    readonly description: string;
    readonly status: EventFinanceTransactionStatus;
    readonly amountPaise: number;
    readonly amount: string;
  }[];
}

export interface VenueEventDetailRecord {
  readonly header: VenueEventDetailHeaderModel;
  readonly summary: VenueEventSummaryModel | null;
  readonly sales: VenueEventSalesModel | null;
  readonly guests: VenueEventGuestsModel | null;
  readonly promoters: VenueEventPromotersModel | null;
  readonly marketing: VenueEventMarketingModel | null;
  readonly finance: VenueEventFinanceModel | null;
}

export interface VenueEventDetailFixtureSource {
  readonly header: VenueEventDetailHeaderModel;
  /** Completed paid ticket-order value before fees, in paise. */
  readonly completedPaidOrderValuePaise: number;
  /** Completed paid ticket quantity before voided tickets are removed. */
  readonly completedPaidTicketQuantity: number;
  readonly voidedTicketQuantity: number;
  /** Completed refund value, in paise. */
  readonly completedRefundAmountPaise: number;
  readonly issuedGuests: number;
  readonly checkedInGuests: number;
  readonly salesLabels: readonly string[];
  readonly summarySalesRupees: readonly number[];
  readonly dailySalesRupees: readonly number[];
  readonly dailyTickets: readonly number[];
  readonly ticketTypes: readonly {
    readonly name: VenueEventTicketType['name'];
    readonly pricePaise: number;
    readonly sold: number;
    readonly capacity: number;
  }[];
  readonly summaryOrders: VenueEventSummaryModel['recentOrders'];
  readonly orders: readonly Omit<VenueEventSalesModel['orders'][number], 'amount'>[];
  readonly guests: VenueEventGuestsModel['guests'];
  readonly information: VenueEventSummaryModel['information'];
  readonly promoters: readonly {
    readonly id: string;
    readonly name: string;
    readonly initials: string;
    readonly phone: string;
    readonly instagram: string | null;
    readonly link: string;
    readonly ticketsSold: number;
    /** Contracted event commission earned per attributed ticket, in paise. */
    readonly commissionPerTicketPaise: number;
    readonly status: EventPromoterStatus;
  }[];
  readonly activeCampaign: VenueEventMarketingModel['activeCampaign'];
  readonly recentMessages: readonly (Omit<
    VenueEventMarketingModel['recentMessages'][number],
    'result'
  > & { readonly providerResult: string | null })[];
  readonly eventUrl: string;
  /** Authoritative event-level platform fee total, in paise. */
  readonly platformFeePaise: number;
  /** Authoritative event-level tax total, in paise. */
  readonly taxPaise: number;
  readonly payoutDate: string;
  readonly payoutAccount: VenueEventFinanceModel['payoutAccount'];
  readonly completedPaidTransactions: readonly {
    readonly id: string;
    readonly date: string;
    readonly amountPaise: number;
  }[];
}

const formatInr = (paise: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);

const percentage = (value: number, total: number): number =>
  total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

const ticketsSold = (completed: number, voided: number): number => Math.max(0, completed - voided);

export const venueEventDetailFixture: VenueEventDetailFixtureSource = {
  header: {
    id: 'neon-nights-afrobeats',
    name: 'Neon Nights: Afrobeats',
    venue: 'Skyline Rooftop',
    dateTimeLabel: 'Thu 16 Jul · 10:00 PM',
    posterSrc: '/venue/events/neon-nights.webp',
    posterAlt: 'Neon Nights: Afrobeats event artwork',
  },
  completedPaidOrderValuePaise: 61_200_000,
  completedPaidTicketQuantity: 343,
  voidedTicketQuantity: 3,
  completedRefundAmountPaise: 360_000,
  issuedGuests: 340,
  checkedInGuests: 248,
  salesLabels: ['Jul 10', 'Jul 11', 'Jul 12', 'Jul 13', 'Jul 14', 'Jul 15', 'Jul 16'],
  summarySalesRupees: [90_000, 210_000, 195_000, 315_000, 280_000, 425_000, 545_000],
  dailySalesRupees: [18_000, 39_000, 41_000, 65_000, 60_000, 94_000, 120_000],
  dailyTickets: [18, 39, 41, 63, 58, 91, 116],
  ticketTypes: [
    { name: 'Couple Pass', pricePaise: 399_900, sold: 120, capacity: 150 },
    { name: 'Early Bird', pricePaise: 79_900, sold: 135, capacity: 150 },
    { name: 'General Entry', pricePaise: 39_900, sold: 85, capacity: 100 },
  ],
  summaryOrders: [
    {
      id: 'summary-1',
      ticket: '2x Couple Pass',
      ticketLabel: 'Couple Pass',
      amount: '₹3,998',
      relativeTime: '1m ago',
    },
    {
      id: 'summary-2',
      ticket: '1x Early Bird',
      ticketLabel: 'Early Bird',
      amount: '₹799',
      relativeTime: '4m ago',
    },
    {
      id: 'summary-3',
      ticket: '3x General Entry',
      ticketLabel: 'General Entry',
      amount: '₹3,897',
      relativeTime: '7m ago',
    },
    {
      id: 'summary-4',
      ticket: '4x Couple Pass',
      ticketLabel: 'Couple Pass',
      amount: '₹7,996',
      relativeTime: '10m ago',
    },
    {
      id: 'summary-5',
      ticket: '1x General Entry',
      ticketLabel: 'General Entry',
      amount: '₹1,299',
      relativeTime: '12m ago',
    },
  ],
  orders: [
    {
      id: 'order-1',
      guest: 'Rohit Mehta',
      ticket: '2x Couple Pass',
      quantity: 2,
      amountPaise: 799_800,
      status: 'Paid',
    },
    {
      id: 'order-2',
      guest: 'Sneha Iyer',
      ticket: '1x Early Bird',
      quantity: 1,
      amountPaise: 79_900,
      status: 'Paid',
    },
    {
      id: 'order-3',
      guest: 'Aman Verma',
      ticket: '3x General Entry',
      quantity: 3,
      amountPaise: 119_700,
      status: 'Paid',
    },
    {
      id: 'order-4',
      guest: 'Neha Kapoor',
      ticket: '4x Couple Pass',
      quantity: 4,
      amountPaise: 1_599_600,
      status: 'Paid',
    },
    {
      id: 'order-5',
      guest: 'Vikram Singh',
      ticket: '1x General Entry',
      quantity: 1,
      amountPaise: 39_900,
      status: 'Paid',
    },
    {
      id: 'order-6',
      guest: 'Pooja Shah',
      ticket: '1x Early Bird',
      quantity: 1,
      amountPaise: 79_900,
      status: 'Refunded',
    },
  ],
  guests: [
    {
      id: 'guest-1',
      name: 'Aisha Menon',
      initials: 'AM',
      maskedPhone: '•••• 4587',
      ticketType: 'VIP Table',
      checkInStatus: 'Checked in',
      checkInTime: '9:48 PM',
      checkInDateTime: 'Thu 16 Jul, 9:48 PM',
      addedBy: 'Ticket sale',
    },
    {
      id: 'guest-2',
      name: 'Arjun Patel',
      initials: 'AP',
      maskedPhone: '•••• 7214',
      ticketType: 'GA',
      checkInStatus: 'Checked in',
      checkInTime: '9:41 PM',
      checkInDateTime: 'Thu 16 Jul, 9:41 PM',
      addedBy: 'Ticket sale',
    },
    {
      id: 'guest-3',
      name: 'Priya Nair',
      initials: 'PN',
      maskedPhone: '•••• 3321',
      ticketType: 'GA',
      checkInStatus: 'Checked in',
      checkInTime: '9:35 PM',
      checkInDateTime: 'Thu 16 Jul, 9:35 PM',
      addedBy: 'Guest list',
    },
    {
      id: 'guest-4',
      name: 'Rohan Mehta',
      initials: 'RM',
      maskedPhone: '•••• 8890',
      ticketType: 'VIP Table',
      checkInStatus: 'Not arrived',
      checkInTime: null,
      checkInDateTime: null,
      addedBy: 'Ticket sale',
    },
    {
      id: 'guest-5',
      name: 'Neha Iyer',
      initials: 'NI',
      maskedPhone: '•••• 6678',
      ticketType: 'GA',
      checkInStatus: 'Not arrived',
      checkInTime: null,
      checkInDateTime: null,
      addedBy: 'Guest list',
    },
    {
      id: 'guest-6',
      name: 'Karan Shah',
      initials: 'KS',
      maskedPhone: '•••• 1543',
      ticketType: 'GA',
      checkInStatus: 'Not arrived',
      checkInTime: null,
      checkInDateTime: null,
      addedBy: 'Ticket sale',
    },
    {
      id: 'guest-7',
      name: 'Tara Desai',
      initials: 'TD',
      maskedPhone: '•••• 9802',
      ticketType: 'VIP Table',
      checkInStatus: 'Not arrived',
      checkInTime: null,
      checkInDateTime: null,
      addedBy: 'Guest list',
    },
  ],
  information: {
    venue: 'Skyline Rooftop',
    address: 'MG Road, Bengaluru, Karnataka',
    startAndEnd: 'Thu 16 Jul, 10:00 PM – Fri 17 Jul, 2:00 AM',
    ageLimit: '21+',
    dressCode: 'Smart casual',
    entryMethod: 'QR ticket at the main entrance',
    contact: '+91 80 5550 0148',
  },
  promoters: [
    {
      id: 'promoter-karan',
      name: 'Karan Shah',
      initials: 'KS',
      phone: '+91 98765 43210',
      instagram: '@karan.shah.live',
      link: 'https://thec1rcle.com/p/karan-shah',
      ticketsSold: 62,
      commissionPerTicketPaise: 18_000,
      status: 'Active',
    },
    {
      id: 'promoter-aisha',
      name: 'Aisha Khan',
      initials: 'AK',
      phone: '+91 98765 28714',
      instagram: '@aisha.afterdark',
      link: 'https://thec1rcle.com/p/aisha-khan',
      ticketsSold: 38,
      commissionPerTicketPaise: 18_000,
      status: 'Active',
    },
    {
      id: 'promoter-rohit',
      name: 'Rohit Verma',
      initials: 'RV',
      phone: '+91 98765 18306',
      instagram: null,
      link: 'https://thec1rcle.com/p/rohit-verma',
      ticketsSold: 31,
      commissionPerTicketPaise: 18_000,
      status: 'Active',
    },
    {
      id: 'promoter-sneha',
      name: 'Sneha Iyer',
      initials: 'SI',
      phone: '+91 98765 62418',
      instagram: '@sneha.nights',
      link: 'https://thec1rcle.com/p/sneha-iyer',
      ticketsSold: 25,
      commissionPerTicketPaise: 18_000,
      status: 'Active',
    },
    {
      id: 'promoter-vikram',
      name: 'Vikram Singh',
      initials: 'VS',
      phone: '+91 98765 91270',
      instagram: null,
      link: 'https://thec1rcle.com/p/vikram-singh',
      ticketsSold: 18,
      commissionPerTicketPaise: 18_000,
      status: 'Invite pending',
    },
  ],
  activeCampaign: {
    name: 'Final ticket reminder',
    channel: 'SMS',
    scheduledFor: 'Scheduled today at 6:00 PM',
    audienceSize: '2,140 guests',
    status: 'Ready',
  },
  recentMessages: [
    {
      id: 'message-selling-fast',
      message: 'Selling fast 🔥',
      channel: 'SMS',
      sentAt: 'Wed 15 Jul, 3:00 PM',
      providerResult: null,
    },
    {
      id: 'message-early-bird',
      message: 'Early bird ends soon',
      channel: 'Email',
      sentAt: 'Tue 14 Jul, 11:00 AM',
      providerResult: '842 opened',
    },
    {
      id: 'message-lineup',
      message: 'Lineup announcement',
      channel: 'Instagram',
      sentAt: 'Mon 13 Jul, 6:00 PM',
      providerResult: null,
    },
    {
      id: 'message-update',
      message: 'Event update',
      channel: 'Push',
      sentAt: 'Sun 12 Jul, 8:00 PM',
      providerResult: 'Delivered',
    },
  ],
  eventUrl: 'https://thec1rcle.com/e/neon-nights',
  platformFeePaise: 2_345_000,
  taxPaise: 895_000,
  payoutDate: 'Payout Fri, 18 Jul',
  payoutAccount: { bankName: 'HDFC Bank', maskedAccount: '••4412' },
  completedPaidTransactions: [
    { id: 'transaction-sale-1', date: '16 Jul 2025, 10:15 PM', amountPaise: 23_840_000 },
    { id: 'transaction-sale-2', date: '16 Jul 2025, 10:20 PM', amountPaise: 18_260_000 },
    { id: 'transaction-sale-3', date: '16 Jul 2025, 10:28 PM', amountPaise: 19_100_000 },
  ],
};

export const buildVenueEventDetailRecord = (
  source: VenueEventDetailFixtureSource,
): VenueEventDetailRecord => {
  const sold = ticketsSold(source.completedPaidTicketQuantity, source.voidedTicketQuantity);
  const ticketCapacity = source.ticketTypes.reduce(
    (capacity, ticketType) => capacity + ticketType.capacity,
    0,
  );
  const remaining = Math.max(0, source.issuedGuests - source.checkedInGuests);
  const ticketTypes = source.ticketTypes.map((ticketType) => ({
    ...ticketType,
    price: formatInr(ticketType.pricePaise),
    soldPercent: percentage(ticketType.sold, ticketType.capacity),
  }));
  const promoters = source.promoters.map((promoter) => {
    const earningsPaise = promoter.ticketsSold * promoter.commissionPerTicketPaise;
    return { ...promoter, earningsPaise, earnings: formatInr(earningsPaise) };
  });
  const promoterTicketsSold = promoters.reduce(
    (total, promoter) => total + promoter.ticketsSold,
    0,
  );
  const deductionsPaise =
    source.completedRefundAmountPaise + source.platformFeePaise + source.taxPaise;
  const expectedPayoutPaise = Math.max(0, source.completedPaidOrderValuePaise - deductionsPaise);
  const financeTransactions: VenueEventFinanceModel['transactions'] = [
    ...source.completedPaidTransactions.map((transaction) => ({
      ...transaction,
      description: 'Ticket sales',
      status: 'Paid' as const,
      amount: formatInr(transaction.amountPaise),
    })),
    {
      id: 'transaction-refund',
      date: '16 Jul 2025, 10:35 PM',
      description: 'Refund',
      status: 'Refunded',
      amountPaise: -source.completedRefundAmountPaise,
      amount: formatInr(-source.completedRefundAmountPaise),
    },
    {
      id: 'transaction-fees',
      date: '16 Jul 2025, 11:05 PM',
      description: 'Platform fees',
      status: 'Paid',
      amountPaise: -source.platformFeePaise,
      amount: formatInr(-source.platformFeePaise),
    },
    {
      id: 'transaction-taxes',
      date: '16 Jul 2025, 11:05 PM',
      description: 'Taxes',
      status: 'Paid',
      amountPaise: -source.taxPaise,
      amount: formatInr(-source.taxPaise),
    },
  ];
  const sales: VenueEventSalesModel = {
    metrics: [
      {
        label: 'Gross sales',
        value: formatInr(source.completedPaidOrderValuePaise),
        definition: 'Completed paid ticket-order value before fees.',
      },
      {
        label: 'Tickets sold',
        value: `${sold.toLocaleString('en-IN')} / ${ticketCapacity.toLocaleString('en-IN')}`,
        definition: 'Completed paid ticket quantities minus voided tickets.',
      },
      {
        label: 'Refunds',
        value: formatInr(source.completedRefundAmountPaise),
        definition: 'Completed refund amounts.',
      },
    ],
    chart: {
      labels: source.salesLabels,
      salesRupees: source.dailySalesRupees,
      tickets: source.dailyTickets,
      salesSummary: 'Sales rose from ₹18,000 on Jul 10 to ₹1,20,000 on Jul 16.',
      ticketsSummary: 'Daily ticket sales rose from 18 on Jul 10 to 116 on Jul 16.',
    },
    ticketTypes,
    orders: source.orders.map((order) => ({ ...order, amount: formatInr(order.amountPaise) })),
  };

  return {
    header: source.header,
    summary: {
      metrics: {
        ticketsSold: `${sold.toLocaleString('en-IN')} / ${ticketCapacity.toLocaleString('en-IN')}`,
        grossSales: formatInr(source.completedPaidOrderValuePaise),
        guestsCheckedIn: source.checkedInGuests.toLocaleString('en-IN'),
      },
      salesProgress: {
        labels: source.salesLabels,
        valuesRupees: source.summarySalesRupees,
        accessibleSummary: 'Cumulative sales rose from ₹90,000 on Jul 10 to ₹5,45,000 on Jul 16.',
      },
      recentOrders: source.summaryOrders,
      ticketTypes,
      information: source.information,
    },
    sales,
    guests: {
      checkedIn: source.checkedInGuests,
      remaining,
      issuedGuests: source.issuedGuests,
      checkedInPercent: percentage(source.checkedInGuests, source.issuedGuests),
      guests: source.guests,
    },
    promoters: {
      activePromoters: promoters.filter((promoter) => promoter.status === 'Active').length,
      ticketsSold: promoterTicketsSold,
      promoters,
    },
    marketing: {
      activeCampaign: source.activeCampaign,
      recentMessages: source.recentMessages.map(({ providerResult, ...message }) => ({
        ...message,
        // Results are copied only from the channel provider; absent attribution is never inferred.
        result: providerResult ?? 'Result unavailable',
      })),
      eventUrl: source.eventUrl,
    },
    finance: {
      summary: {
        // Gross sales are completed paid ticket orders before fees.
        grossSales: formatInr(source.completedPaidOrderValuePaise),
        deductions: formatInr(deductionsPaise),
        expectedPayout: formatInr(expectedPayoutPaise),
        payoutDate: source.payoutDate,
      },
      breakdown: [
        {
          label: 'Ticket sales',
          amountPaise: source.completedPaidOrderValuePaise,
          amount: formatInr(source.completedPaidOrderValuePaise),
        },
        {
          label: 'Refunds',
          amountPaise: -source.completedRefundAmountPaise,
          amount: formatInr(-source.completedRefundAmountPaise),
        },
        {
          label: 'Platform fees',
          amountPaise: -source.platformFeePaise,
          amount: formatInr(-source.platformFeePaise),
        },
        {
          label: 'Taxes',
          amountPaise: -source.taxPaise,
          amount: formatInr(-source.taxPaise),
        },
        {
          label: 'Expected payout',
          amountPaise: expectedPayoutPaise,
          amount: formatInr(expectedPayoutPaise),
        },
      ],
      payoutAccount: source.payoutAccount,
      transactions: financeTransactions,
    },
  };
};

const fixtureRecord = buildVenueEventDetailRecord(venueEventDetailFixture);

export const getVenueEventDetailRecord = cache((eventId: string): VenueEventDetailRecord | null => {
  if (eventId === fixtureRecord.header.id) return fixtureRecord;
  const event = venueEventSource.events.find((candidate) => candidate.id === eventId);
  if (!event) return null;
  return {
    header: {
      id: event.id,
      name: event.name,
      venue: event.venue,
      dateTimeLabel: `${event.dayLabel} ${event.dateLabel} · ${event.time}`,
      posterSrc: event.artworkSrc,
      posterAlt: event.artworkAlt,
    },
    summary: null,
    sales: null,
    guests: null,
    promoters: null,
    marketing: null,
    finance: null,
  };
});
