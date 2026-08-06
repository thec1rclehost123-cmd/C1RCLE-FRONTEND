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
  venue: string;
  city: string;
  cityKey: string;
  price: ExploreMoney | null;
  badge?: 'Trending' | 'Live';
}

export interface ExploreCity {
  label: string;
  value: string;
}

export type ExploreSort = 'trending' | 'soonest' | 'newest' | 'price-low';
export type ExploreDateFilter = 'any' | 'today' | 'weekend';
