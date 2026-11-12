import type { EventOperationsDto, TicketTierDto } from '@c1rcle/contracts';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export function formatEventStartingPrice(
  event: Pick<EventOperationsDto, 'isFree' | 'startingPricePaise'>,
  tiers?: readonly TicketTierDto[],
): string {
  if (tiers?.length) {
    const pricedTiers = tiers.filter((tier) => tier.accessType !== 'RSVP');
    if (pricedTiers.length === 0) return 'Free';
    const startingPricePaise = Math.min(...pricedTiers.map((tier) => tier.priceInPaise));
    const isFree = event.isFree && pricedTiers.every((tier) => tier.priceInPaise === 0);
    return isFree ? 'Free' : money.format(startingPricePaise / 100);
  }

  if (event.isFree) return 'Free';
  return event.startingPricePaise === null
    ? 'Unavailable'
    : money.format(event.startingPricePaise / 100);
}
