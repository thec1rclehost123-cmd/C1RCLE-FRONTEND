import { TicketsClient } from './tickets-client';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tickets',
  description: 'Manage your event passes and digital ticket wallet on THE C1RCLE.',
};

export default function TicketsPage() {
  return <TicketsClient />;
}
