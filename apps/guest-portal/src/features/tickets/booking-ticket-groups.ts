import type { UserTicketItem } from './types/tickets.types';

/** Groups display cards only; every admission retains its own ID and QR. */
export function groupTicketsByBooking(tickets: readonly UserTicketItem[]) {
  const groups = new Map<string, [UserTicketItem, ...UserTicketItem[]]>();
  for (const ticket of tickets) {
    const key = JSON.stringify([ticket.orderId, ticket.eventId]);
    const group = groups.get(key);
    if (group) group.push(ticket);
    else groups.set(key, [ticket]);
  }
  return [...groups.entries()].map(([key, items]) => ({
    key,
    tickets: items,
    primaryTicket:
      items.find(
        (ticket) =>
          ticket.status === 'active' &&
          ticket.custody !== 'unassigned' &&
          ticket.management?.ownership !== 'transferred',
      ) ?? items[0],
  }));
}

export function summarizeTicketTiers(tickets: readonly UserTicketItem[]) {
  const tiers = new Map<string, { key: string; name: string; quantity: number }>();
  for (const ticket of tickets) {
    const key = ticket.tierId ?? ticket.tierName;
    const tier = tiers.get(key);
    if (tier) tier.quantity += ticket.ticketCount;
    else tiers.set(key, { key, name: ticket.tierName, quantity: ticket.ticketCount });
  }
  return [...tiers.values()];
}
