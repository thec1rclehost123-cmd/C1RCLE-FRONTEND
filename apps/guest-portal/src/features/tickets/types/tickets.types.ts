// FIXTURE_ONLY: Temporary UI development tickets view models.

export type TicketCategory = 'GENERAL' | 'STAG' | 'VIP' | 'COUPLE' | 'GROUP';

export interface TicketShowcaseItem {
  id: number;
  title: TicketCategory;
  price: string;
  type: string;
  isPopular?: boolean;
}
