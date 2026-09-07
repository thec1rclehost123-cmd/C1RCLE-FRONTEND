export interface VenuePayoutRecord {
  readonly id: string;
  readonly date: string;
  readonly events: string;
  readonly status: 'Paid' | 'Scheduled';
  readonly amountPaise: number;
}

export interface VenueFinanceSource {
  /** Cleared event settlements after provider fees and refunds. */
  readonly clearedSettlementPaise: number | null;
  /** Payouts already paid or reserved by an accepted payout request. */
  readonly paidOrReservedPaise: number | null;
  /** Unsettled order value reported by the payment provider. */
  readonly unsettledOrderPaise: number | null;
  /** Refunds still processing against unsettled order value. */
  readonly unsettledRefundPaise: number | null;
  readonly previousMonthAvailablePaise: number | null;
  readonly bank: {
    readonly name: string;
    readonly maskedAccount: string;
    readonly accountHolder: string;
    readonly verified: boolean;
  } | null;
  readonly nextPayout: string | null;
  readonly payoutHistory: readonly VenuePayoutRecord[];
}

export interface VenueFinanceModel {
  readonly availablePaise: number | null;
  readonly available: string;
  readonly pendingPaise: number | null;
  readonly pending: string;
  readonly monthlyComparisonPaise: number | null;
  readonly monthlyComparison: string;
  readonly previousMonthAvailable: string;
  readonly bank: VenueFinanceSource['bank'];
  readonly nextPayout: string;
  readonly payoutHistory: readonly (VenuePayoutRecord & { readonly amount: string })[];
}

export const formatInrOrUnavailable = (paise: number | null): string =>
  paise === null
    ? 'Unavailable'
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(paise / 100);

export const venueFinanceSource: VenueFinanceSource = {
  clearedSettlementPaise: 84_565_000,
  paidOrReservedPaise: 35_945_000,
  unsettledOrderPaise: 8_605_000,
  unsettledRefundPaise: 360_000,
  previousMonthAvailablePaise: 37_165_000,
  bank: {
    name: 'HDFC Bank',
    maskedAccount: '••4412',
    accountHolder: 'The C1RCLE Venues Pvt. Ltd.',
    verified: true,
  },
  nextPayout: 'Fri, 18 Jul',
  payoutHistory: [
    {
      id: 'payout-2025-07-04',
      date: '04 Jul 2025',
      events: 'Sunset Soirée · Stereo Sundays',
      status: 'Paid',
      amountPaise: 71_285_000,
    },
    {
      id: 'payout-2025-06-27',
      date: '27 Jun 2025',
      events: 'Techno Tides · Bombay Bass',
      status: 'Paid',
      amountPaise: 62_130_000,
    },
    {
      id: 'payout-2025-06-20',
      date: '20 Jun 2025',
      events: 'Afro Beats Night · Ladies Night',
      status: 'Paid',
      amountPaise: 59_345_000,
    },
    {
      id: 'payout-2025-06-13',
      date: '13 Jun 2025',
      events: 'Throwback Thursday · Desi Vibes',
      status: 'Paid',
      amountPaise: 48_200_000,
    },
    {
      id: 'payout-2025-06-06',
      date: '06 Jun 2025',
      events: 'Stereo Fridays · Club Night',
      status: 'Scheduled',
      amountPaise: 43_725_000,
    },
  ],
};

/**
 * Finance formulas:
 * - available = cleared settlement - paid or reserved payouts
 * - pending = unsettled order value - unsettled refunds
 * - payout amount = the provider's payout record amount; it is never recomputed in JSX
 * - monthly comparison = current available - previous month available
 */
export const createVenueFinanceModel = (
  source: VenueFinanceSource = venueFinanceSource,
): VenueFinanceModel => {
  const availablePaise =
    source.clearedSettlementPaise === null || source.paidOrReservedPaise === null
      ? null
      : source.clearedSettlementPaise - source.paidOrReservedPaise;
  const pendingPaise =
    source.unsettledOrderPaise === null || source.unsettledRefundPaise === null
      ? null
      : source.unsettledOrderPaise - source.unsettledRefundPaise;
  const monthlyComparisonPaise =
    availablePaise === null || source.previousMonthAvailablePaise === null
      ? null
      : availablePaise - source.previousMonthAvailablePaise;

  return {
    availablePaise,
    available: formatInrOrUnavailable(availablePaise),
    pendingPaise,
    pending: formatInrOrUnavailable(pendingPaise),
    monthlyComparisonPaise,
    monthlyComparison: formatInrOrUnavailable(monthlyComparisonPaise),
    previousMonthAvailable: formatInrOrUnavailable(source.previousMonthAvailablePaise),
    bank: source.bank,
    nextPayout: source.nextPayout ?? 'Unavailable',
    payoutHistory: source.payoutHistory.map((payout) => ({
      ...payout,
      amount: formatInrOrUnavailable(payout.amountPaise),
    })),
  };
};

export const venueFinanceModel = createVenueFinanceModel();
