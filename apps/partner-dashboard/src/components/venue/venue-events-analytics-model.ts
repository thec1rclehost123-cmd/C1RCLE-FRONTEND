import { venueOverviewModel } from './overview-model';
import { EVENTS } from './venue-events-model';

const analyticsTiers = [
  { name: 'Early Bird', count: '512', money: '₹4,67,200' },
  { name: 'Phase 1', count: '426', money: '₹3,88,800' },
  { name: 'Phase 2', count: '246', money: '₹2,23,600' },
  { name: 'VIP', count: '68', money: '₹90,400' },
] as const;

export interface VenueEventsAnalyticsViewModel {
  readonly dateRange: string;
  readonly venueFilterLabel: string;
  readonly eventFilterLabel: string;
  readonly metrics: readonly {
    readonly label: string;
    readonly value: string;
    readonly comparison: string;
    readonly definition: string;
  }[];
  readonly sales: {
    readonly labels: readonly string[];
    readonly current: readonly number[];
    readonly previous: readonly number[];
    readonly currentLabel: string;
    readonly previousLabel: string;
  };
  readonly demographics: {
    readonly identifiedGuests: number;
    readonly coveragePercent: number;
    readonly age: readonly { readonly label: string; readonly percent: number }[];
    readonly gender: readonly { readonly label: string; readonly percent: number }[];
  } | null;
  readonly demographicUnavailableReason: string;
  readonly tiers: typeof analyticsTiers;
  readonly eventComparison: readonly {
    readonly id: string;
    readonly name: string;
    readonly artworkSrc: string;
    readonly date: string;
    readonly ticketsSold: number;
    readonly sales: string;
  }[];
}

export const buildVenueEventsAnalyticsModel = (
  demographics: VenueEventsAnalyticsViewModel['demographics'] = null,
): VenueEventsAnalyticsViewModel => ({
  dateRange: '10 Jul – 16 Jul 2025',
  venueFilterLabel: 'All venues',
  eventFilterLabel: 'All events',
  metrics: [
    {
      label: 'Gross sales',
      value: venueOverviewModel.metrics[0]?.value ?? '₹0',
      comparison: '▲ 18.6% vs 3 Jul – 9 Jul',
      definition: 'Confirmed gross order value during the selected period.',
    },
    {
      label: 'Net revenue',
      value: venueOverviewModel.metrics[1]?.value ?? '₹0',
      comparison: '▲ 14.2% vs 3 Jul – 9 Jul',
      definition: 'Gross sales less processing and settlement deductions.',
    },
    {
      label: 'Tickets sold',
      value: venueOverviewModel.metrics[2]?.value ?? '0',
      comparison: '▲ 22.1% vs 3 Jul – 9 Jul',
      definition: 'Confirmed ticket quantities during the selected period.',
    },
    {
      label: 'Average order value',
      value: '₹909',
      comparison: '▲ 3.7% vs 3 Jul – 9 Jul',
      definition: 'Confirmed gross order value divided by confirmed orders.',
    },
  ],
  sales: {
    labels: venueOverviewModel.sales.labels,
    current: venueOverviewModel.sales.currentRupees,
    previous: venueOverviewModel.sales.previousRupees,
    currentLabel: '10 Jul – 16 Jul 2025 · ₹11,70,000',
    previousLabel: '3 Jul – 9 Jul 2025 · ₹9,86,500',
  },
  demographics,
  demographicUnavailableReason:
    'Aggregated guest-profile demographics are not connected for this venue. No demographic values are inferred or estimated.',
  tiers: analyticsTiers,
  eventComparison: EVENTS.slice(0, 4).map((event) => ({
    id: event.id,
    name: event.name,
    artworkSrc: event.artworkSrc,
    date: event.dateLabel,
    ticketsSold: event.ticketsSold,
    sales: event.revenue,
  })),
});

export const venueEventsAnalyticsModel = buildVenueEventsAnalyticsModel();
