export interface VenueEventsDemographics {
  readonly identifiedGuests: number;
  readonly coveragePercent: number;
  readonly age: readonly {
    readonly label: '18–21' | '22–25' | '26–30' | '31+';
    readonly percent: number;
  }[];
  readonly gender: readonly {
    readonly label: 'Women' | 'Men' | 'Other / prefer not to say';
    readonly percent: number;
  }[];
  /** Unknown demographic records are excluded from this identified-guest denominator. */
  readonly denominatorNote: string;
}

export interface VenueEventsAnalyticsSource {
  readonly currentPeriodLabel: string;
  readonly previousPeriodLabel: string;
  /** Paid ticket-order value before fees and refunds, in paise. */
  readonly grossPaidOrderValuePaise: number;
  readonly previousGrossPaidOrderValuePaise: number;
  /** Completed paid orders, not ticket quantity. This is the AOV denominator. */
  readonly completedPaidOrders: number;
  readonly previousCompletedPaidOrders: number;
  readonly completedPaidTicketQuantity: number;
  readonly voidedTicketQuantity: number;
  readonly previousCompletedPaidTicketQuantity: number;
  readonly previousVoidedTicketQuantity: number;
  readonly sales: {
    readonly labels: readonly string[];
    readonly currentRupees: readonly number[];
    readonly previousRupees: readonly number[];
  };
  readonly demographics: VenueEventsDemographics | null;
}

export interface VenueEventsAnalyticsViewModel {
  readonly dateRangeLabel: string;
  readonly metrics: readonly {
    readonly label: 'Gross sales' | 'Tickets sold' | 'Average order value';
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
    readonly accessibleSummary: string;
  };
  readonly demographics: VenueEventsDemographics | null;
  readonly demographicUnavailableReason: string;
}

const formatInrFromPaise = (paise: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);

const formatPercentChange = (current: number, previous: number): string => {
  if (previous <= 0) return 'No prior period';
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(1)}% vs 3 Jul – 9 Jul`;
};

const ticketsSold = (completedQuantity: number, voidedQuantity: number): number =>
  Math.max(0, completedQuantity - voidedQuantity);

const averageOrderValuePaise = (grossPaise: number, completedOrders: number): number =>
  completedOrders > 0 ? Math.round(grossPaise / completedOrders) : 0;

const peakSummary = (
  values: readonly number[],
  labels: readonly string[],
): { readonly value: number; readonly label: string } => {
  const peak = Math.max(...values, 0);
  const peakIndex = values.indexOf(peak);
  return { value: peak, label: labels[peakIndex] ?? 'the selected period' };
};

/**
 * Local full-data repository fixture for the approved Events Analytics screen.
 * Production adapters must replace these aggregates with authoritative order,
 * ticket, and consented demographic aggregates; visual components never infer them.
 */
export const venueEventsAnalyticsFixture: VenueEventsAnalyticsSource = {
  currentPeriodLabel: '10 Jul – 16 Jul 2025',
  previousPeriodLabel: '3 Jul – 9 Jul 2025',
  grossPaidOrderValuePaise: 117_000_000,
  previousGrossPaidOrderValuePaise: 98_650_927,
  completedPaidOrders: 1_287,
  previousCompletedPaidOrders: 1_125,
  completedPaidTicketQuantity: 1_287,
  voidedTicketQuantity: 3,
  previousCompletedPaidTicketQuantity: 1_052,
  previousVoidedTicketQuantity: 0,
  sales: {
    labels: ['10 Jul', '11 Jul', '12 Jul', '13 Jul', '14 Jul', '15 Jul', '16 Jul'],
    currentRupees: [55_000, 101_000, 119_000, 145_000, 180_000, 150_000, 170_000],
    previousRupees: [35_000, 55_000, 88_000, 74_000, 123_000, 110_000, 145_000],
  },
  demographics: {
    identifiedGuests: 924,
    coveragePercent: 72,
    age: [
      { label: '18–21', percent: 24 },
      { label: '22–25', percent: 43 },
      { label: '26–30', percent: 22 },
      { label: '31+', percent: 11 },
    ],
    gender: [
      { label: 'Women', percent: 48 },
      { label: 'Men', percent: 47 },
      { label: 'Other / prefer not to say', percent: 5 },
    ],
    denominatorNote:
      'Based on consented demographic aggregates. Unknown records are excluded from the identified-guest denominator.',
  },
};

export const buildVenueEventsAnalyticsModel = (
  source: VenueEventsAnalyticsSource = venueEventsAnalyticsFixture,
): VenueEventsAnalyticsViewModel => {
  const currentTickets = ticketsSold(
    source.completedPaidTicketQuantity,
    source.voidedTicketQuantity,
  );
  const previousTickets = ticketsSold(
    source.previousCompletedPaidTicketQuantity,
    source.previousVoidedTicketQuantity,
  );
  const currentAov = averageOrderValuePaise(
    source.grossPaidOrderValuePaise,
    source.completedPaidOrders,
  );
  const previousAov = averageOrderValuePaise(
    source.previousGrossPaidOrderValuePaise,
    source.previousCompletedPaidOrders,
  );
  const currentPeak = peakSummary(source.sales.currentRupees, source.sales.labels);
  const previousPeak = peakSummary(source.sales.previousRupees, source.sales.labels);

  return {
    dateRangeLabel: 'Last 7 days',
    metrics: [
      {
        label: 'Gross sales',
        value: formatInrFromPaise(source.grossPaidOrderValuePaise),
        comparison: formatPercentChange(
          source.grossPaidOrderValuePaise,
          source.previousGrossPaidOrderValuePaise,
        ),
        definition: 'Paid ticket-order value before fees and refunds.',
      },
      {
        label: 'Tickets sold',
        value: currentTickets.toLocaleString('en-IN'),
        comparison: formatPercentChange(currentTickets, previousTickets),
        definition: 'Completed paid ticket quantity minus voided tickets.',
      },
      {
        label: 'Average order value',
        value: formatInrFromPaise(currentAov),
        comparison: formatPercentChange(currentAov, previousAov),
        definition: 'Gross paid order value divided by completed paid orders.',
      },
    ],
    sales: {
      labels: source.sales.labels,
      current: source.sales.currentRupees,
      previous: source.sales.previousRupees,
      currentLabel: source.currentPeriodLabel,
      previousLabel: source.previousPeriodLabel,
      accessibleSummary: `Current sales peaked at ${formatInrFromPaise(currentPeak.value * 100)} on ${currentPeak.label}. The previous seven days peaked at ${formatInrFromPaise(previousPeak.value * 100)} on ${previousPeak.label}.`,
    },
    demographics: source.demographics,
    demographicUnavailableReason:
      'Guest demographics are not available for this period. No age or gender values are inferred.',
  };
};

export const venueEventsAnalyticsModel = buildVenueEventsAnalyticsModel();
