import { cache } from 'react';

import { venueEventSource } from './venue-events-model';

export type EventOrderStatus = 'Paid' | 'Refunded' | 'Pending';
export type EventGuestCheckInStatus = 'Checked in' | 'Not arrived';
export type EventGuestSource = 'Ticket sale' | 'Guest list';

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

export interface VenueEventDetailRecord {
  readonly header: VenueEventDetailHeaderModel;
  readonly summary: VenueEventSummaryModel | null;
  readonly sales: VenueEventSalesModel | null;
  readonly guests: VenueEventGuestsModel | null;
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
  };
});
