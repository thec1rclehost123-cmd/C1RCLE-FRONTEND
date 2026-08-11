import { getVenueEventDetailRecord } from './event-detail-model';

export type EventAnalyticsRange = '7d' | '30d' | '90d';

export interface VenueEventAnalyticsModel {
  readonly event: {
    readonly id: string;
    readonly name: string;
    readonly date: string;
    readonly venue: string;
    readonly posterSrc: string;
  };
  readonly metrics: {
    readonly ticketsSold: number;
    readonly grossSalesPaise: number;
    readonly guestsCheckedIn: number;
  };
  readonly sales: readonly { readonly label: string; readonly valueRupees: number }[];
  readonly previousSales: readonly { readonly label: string; readonly valueRupees: number }[];
  readonly demographics: null | {
    readonly consented: true;
    readonly age: readonly { readonly label: string; readonly value: number }[];
    readonly gender: readonly {
      readonly label: string;
      readonly value: number;
      readonly color: string;
    }[];
  };
  readonly ticketTypes: readonly {
    readonly name: string;
    readonly sold: number;
    readonly capacity: number;
    readonly percent: number;
  }[];
}

export const formatAnalyticsCurrency = (paise: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);

export const getVenueEventAnalyticsModel = (eventId: string): VenueEventAnalyticsModel | null => {
  const record = getVenueEventDetailRecord(eventId);
  if (!record?.summary || !record.sales || !record.guests) return null;
  const grossSalesPaise = record.sales.orders
    .filter((order) => order.status === 'Paid')
    .reduce((sum, order) => sum + order.amountPaise, 0);
  const sales = record.sales.chart.labels.map((label, index) => ({
    label,
    valueRupees: record.sales?.chart.salesRupees[index] ?? 0,
  }));
  return {
    event: {
      id: record.header.id,
      name: record.header.name,
      date: record.header.dateTimeLabel.split('·')[0]?.trim() ?? record.header.dateTimeLabel,
      venue: record.header.venue,
      posterSrc: record.header.posterSrc,
    },
    metrics: {
      ticketsSold: record.summary.ticketTypes.reduce((sum, tier) => sum + tier.sold, 0),
      grossSalesPaise,
      guestsCheckedIn: record.guests.checkedIn,
    },
    sales,
    previousSales: sales.map((point, index) => ({
      ...point,
      valueRupees: Math.round(point.valueRupees * (0.62 + index * 0.025)),
    })),
    // This fixture is an explicitly consented aggregate. Production providers may return null.
    demographics: {
      consented: true,
      age: [
        { label: '18–20', value: 12 },
        { label: '21–24', value: 48 },
        { label: '25–29', value: 28 },
        { label: '30+', value: 12 },
      ],
      gender: [
        { label: 'Women', value: 44, color: '#f44a22' },
        { label: 'Men', value: 53, color: '#34d399' },
        { label: 'Non-binary / Prefer not to say', value: 3, color: '#8b5cf6' },
      ],
    },
    ticketTypes: record.summary.ticketTypes.map((tier) => ({
      name: tier.name,
      sold: tier.sold,
      capacity: tier.capacity,
      percent: tier.soldPercent,
    })),
  };
};
