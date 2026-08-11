export type OverviewActivityTone = 'success' | 'info' | 'accent' | 'neutral';

export interface VenueOverviewViewModel {
  readonly greeting: string;
  readonly dateLabel: string;
  readonly tonight: {
    readonly name: string;
    readonly venue: string;
    readonly posterSrc: string;
    readonly doorsIn: string;
    readonly startTime: string;
    readonly ticketsSold: number;
    readonly capacity: number;
    readonly capacityPercent: number;
  };
  readonly activity: readonly {
    readonly label: string;
    readonly context: string;
    readonly time: string;
    readonly icon: 'check' | 'invoice' | 'ticket' | 'guest' | 'campaign';
    readonly tone: OverviewActivityTone;
  }[];
  readonly metrics: readonly {
    readonly label: string;
    readonly value: string;
    readonly comparison: string;
    readonly definition: string;
  }[];
  readonly sales: {
    readonly labels: readonly string[];
    readonly currentRupees: readonly number[];
    readonly previousRupees: readonly number[];
  };
  readonly upcoming: readonly {
    readonly name: string;
    readonly date: string;
    readonly time: string;
    readonly venue: string;
    readonly soldPercent: number;
    readonly artwork: 'bollytech' | 'sunset' | 'urban';
  }[];
  readonly network: readonly {
    readonly label: string;
    readonly value: string;
    readonly icon: 'venues' | 'partners' | 'artists' | 'guests';
    readonly tone: 'orange' | 'purple' | 'blue' | 'green';
  }[];
}

export const formatInrFromPaise = (paise: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);

export const percentageChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const capacityPercentage = (sold: number, capacity: number): number => {
  if (capacity <= 0) return 0;
  return Math.min(100, Math.round((sold / capacity) * 100));
};

const currentGrossPaise = 117_000_000;
const processingAndSettlementPaise = 18_580_000;
const expectedPayoutPaise = currentGrossPaise - processingAndSettlementPaise;
const currentTickets = 1_284;
const previousTickets = 1_052;

/**
 * Canonical Venue Overview model for the approved milestone.
 *
 * Sources and formulas:
 * - Gross sales is the sum of confirmed order value for the current seven-day period.
 * - Expected payout is gross sales less processing and settlement deductions.
 * - Tickets sold is the sum of confirmed ticket quantities for the same period.
 * - Capacity is sold tickets divided by the tonight event inventory.
 * - Comparisons use (current - previous) / previous × 100.
 *
 * The current repository does not expose a Venue Overview endpoint. These values
 * normalize the existing checked-in Venue Studio dataset into one model without
 * changing backend, Firebase, or route contracts.
 */
export const venueOverviewModel: VenueOverviewViewModel = {
  greeting: 'Good evening, Rhea',
  dateLabel: 'Thursday, July 16',
  tonight: {
    name: 'Neon Nights: Afrobeats Edition',
    venue: 'Skyline Rooftop, Bengaluru',
    posterSrc: '/venue/neon-nights-poster.webp',
    doorsIn: '3h 20m',
    startTime: '10:00 PM',
    ticketsSold: 340,
    capacity: 400,
    capacityPercent: capacityPercentage(340, 400),
  },
  activity: [
    {
      label: 'Payout of ₹2,10,000 initiated',
      context: 'To Hype Nights LLP',
      time: 'Today, 6:15 PM',
      icon: 'check',
      tone: 'success',
    },
    {
      label: 'Invoice #SR-2025-116 paid',
      context: 'Skyline Rooftop',
      time: 'Today, 4:02 PM',
      icon: 'invoice',
      tone: 'info',
    },
    {
      label: '162 tickets sold',
      context: 'Neon Nights: Afrobeats Edition',
      time: 'Today, 3:47 PM',
      icon: 'ticket',
      tone: 'accent',
    },
    {
      label: 'Guest list updated',
      context: 'Neon Nights: Afrobeats Edition',
      time: 'Today, 1:28 PM',
      icon: 'guest',
      tone: 'neutral',
    },
    {
      label: 'Campaign ‘Neon Nights Reminder’ sent',
      context: '2,842 recipients',
      time: 'Today, 12:10 PM',
      icon: 'campaign',
      tone: 'info',
    },
  ],
  metrics: [
    {
      label: 'Gross sales',
      value: formatInrFromPaise(currentGrossPaise),
      comparison: `▲ ${percentageChange(currentGrossPaise, 98_650_927).toFixed(1)}% vs last 7 days`,
      definition: 'Confirmed order value during the current seven-day period.',
    },
    {
      label: 'Expected payout',
      value: formatInrFromPaise(expectedPayoutPaise),
      comparison: `▲ ${percentageChange(expectedPayoutPaise, 86_182_137).toFixed(1)}% vs last 7 days`,
      definition: 'Gross sales less payment processing and settlement deductions.',
    },
    {
      label: 'Tickets sold',
      value: currentTickets.toLocaleString('en-IN'),
      comparison: `▲ ${percentageChange(currentTickets, previousTickets).toFixed(1)}% vs last 7 days`,
      definition: 'Confirmed ticket quantities sold during the current seven-day period.',
    },
  ],
  sales: {
    labels: ['Jul 10', 'Jul 11', 'Jul 12', 'Jul 13', 'Jul 14', 'Jul 15', 'Jul 16'],
    currentRupees: [52_000, 112_000, 95_000, 136_000, 103_000, 148_000, 188_000],
    previousRupees: [18_000, 34_000, 38_000, 58_000, 43_000, 72_000, 104_000],
  },
  upcoming: [
    {
      name: 'Bollytech',
      date: 'Jul 18, Sat',
      time: '9:00 PM',
      venue: 'Kitty Ko, Mumbai',
      soldPercent: 63,
      artwork: 'bollytech',
    },
    {
      name: 'Sunset Sessions',
      date: 'Jul 19, Sun',
      time: '5:00 PM',
      venue: 'Skypark Beach Club, Goa',
      soldPercent: 71,
      artwork: 'sunset',
    },
    {
      name: 'Urban Fridays',
      date: 'Jul 24, Fri',
      time: '10:00 PM',
      venue: 'Lodi - The Garden, Delhi',
      soldPercent: 48,
      artwork: 'urban',
    },
  ],
  network: [
    { label: 'Venues', value: '12', icon: 'venues', tone: 'orange' },
    { label: 'Partners', value: '28', icon: 'partners', tone: 'purple' },
    { label: 'Artists & DJs', value: '35', icon: 'artists', tone: 'blue' },
    { label: 'Total guests', value: '4,672', icon: 'guests', tone: 'green' },
  ],
};
