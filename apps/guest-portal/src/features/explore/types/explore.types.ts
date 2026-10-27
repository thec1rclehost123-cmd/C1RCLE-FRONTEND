export interface ExploreMoney {
  amountPaise: number;
  currency: 'INR';
}

export interface ExploreEvent {
  id: string;
  slug: string;
  title: string;
  category: string;
  image: string;
  startsAt: string;
  venueId: string | null;
  venueSlug: string | null;
  venue: string;
  city: string;
  cityKey: string;
  price: ExploreMoney | null;
  /** Null prices are free only when the public event DTO explicitly says so. */
  isFree?: boolean;
  summary?: string;
  availability: 'available' | 'sold-out' | 'unavailable';
  availableQuantity: number | null;
  badge?: 'Trending' | 'Live';
}

export interface ExploreCity {
  label: string;
  value: string;
}

export type ExploreSort = 'soonest' | 'newest' | 'price-low';
export type ExploreDateFilter = 'any' | 'today' | 'weekend';

export interface ExploreFilters {
  search: string;
  city: string;
  category: string;
  date: ExploreDateFilter;
  sort: ExploreSort;
}
