import type { PromoterEvent, PromoterOrder, PromoterTrackingLink } from '@/lib/partner/contracts';

export function getPromoterEventLinks(
  eventId: string,
  links: readonly PromoterTrackingLink[],
): readonly PromoterTrackingLink[] {
  return links.filter((link) => link.eventId === eventId);
}

export function getPrimaryPromoterEventLink(
  eventId: string,
  links: readonly PromoterTrackingLink[],
): PromoterTrackingLink | null {
  return getPromoterEventLinks(eventId, links)[0] ?? null;
}

export function getPromoterEventOrders(
  event: PromoterEvent,
  orders: readonly PromoterOrder[],
): readonly PromoterOrder[] {
  return orders.filter((order) => order.eventName === event.name);
}

export function getPromoterEventStatusLabel(status: PromoterEvent['status']): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
