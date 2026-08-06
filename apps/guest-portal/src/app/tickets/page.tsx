import { TicketsGuestView } from '../../features/tickets/components/TicketsGuestView';
import { ticketsFixture } from '../../features/tickets/fixtures/tickets.fixture';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tickets',
  description: 'Secure your spot at exclusive THE C1RCLE events. Your digital wallet for instant access.',
};

export default function TicketsPage() {
  return (
    <TicketsGuestView
      headline={ticketsFixture.headline}
      tagline={ticketsFixture.tagline}
      items={ticketsFixture.items}
    />
  );
}
