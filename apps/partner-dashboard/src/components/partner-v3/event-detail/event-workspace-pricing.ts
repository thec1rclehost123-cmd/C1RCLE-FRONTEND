import type { EventOperationsDto } from '@c1rcle/contracts';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

type PriceFields = Pick<
  EventOperationsDto,
  'isFree' | 'startingPricePaise' | 'currentStartingPricePaise'
>;

export function formatEventStartingPrice(event: PriceFields): string {
  if (event.isFree) return 'Free';
  if (event.currentStartingPricePaise == null) return 'No active price';
  return money.format(event.currentStartingPricePaise / 100);
}

export function formatEventBasePrice(event: PriceFields): string {
  if (event.isFree) return 'Free';
  if (event.startingPricePaise === null) return 'Not set';
  return money.format(event.startingPricePaise / 100);
}
