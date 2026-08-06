// FIXTURE_ONLY: Temporary UI development ticket data fixture.
// Must not be used as a production API fallback.

import type { TicketShowcaseItem } from '../types/tickets.types';

export const ticketsFixture: {
  headline: string;
  tagline: string;
  items: TicketShowcaseItem[];
} = {
  headline: 'YOUR PASS TO THE CIRCLE',
  tagline:
    'Secure your spot at exclusive events. Your digital wallet for instant access, live updates, and effortless entry.',
  items: [
    {
      id: 1,
      title: 'GENERAL',
      price: '₹1,500',
      type: 'Standard',
    },
    {
      id: 2,
      title: 'STAG',
      price: '₹2,500',
      type: 'Single Entry',
    },
    {
      id: 3,
      title: 'VIP',
      price: '₹5,000',
      type: 'Priority Access',
      isPopular: true,
    },
    {
      id: 4,
      title: 'COUPLE',
      price: '₹6,500',
      type: 'Pair Pass',
    },
    {
      id: 5,
      title: 'GROUP',
      price: '₹12,000',
      type: 'Group Entry',
    },
  ],
};
