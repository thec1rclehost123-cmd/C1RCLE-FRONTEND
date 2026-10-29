import Link from 'next/link';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import type { DoorGuest } from '@c1rcle/contracts';

export function ConnectedEventGuestsScreen({
  studio,
  eventId,
  eventTitle,
  guests,
  truncated,
}: {
  readonly studio: 'host' | 'venue';
  readonly eventId: string;
  readonly eventTitle: string;
  readonly guests: readonly DoorGuest[];
  readonly truncated: boolean;
}) {
  return (
    <PageContainer>
      <main className="mx-auto max-w-5xl py-7 text-stone-100">
        <Link
          href={`/partner/${studio}/events/${encodeURIComponent(eventId)}`}
          className="text-sm text-stone-400"
        >
          ← {eventTitle}
        </Link>
        <section className="mt-6 rounded-2xl border border-white/15 bg-neutral-950 p-7">
          <h1 className="text-3xl font-bold">Attendees</h1>
          <p className="mt-2 text-stone-400">
            {truncated
              ? `Showing ${String(guests.length)} matching records; more may exist.`
              : `${String(guests.length)} issued guest record${guests.length === 1 ? '' : 's'}`}
          </p>
          {truncated ? (
            <p role="status" className="mt-2 text-sm text-amber-200">
              This roster is incomplete. A missing name here does not mean the ticket was not
              issued.
            </p>
          ) : null}
          {guests.length === 0 ? (
            <p className="mt-8 text-stone-400">No attendees are recorded for this event.</p>
          ) : (
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/15 text-stone-400">
                  <tr>
                    <th className="py-3">Name</th>
                    <th>Ticket</th>
                    <th>Quantity</th>
                    <th>Custody</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((guest) => (
                    <tr key={guest.id} className="border-b border-white/10">
                      <td className="py-3">
                        {guest.ownershipStatus === 'unassigned'
                          ? 'Unassigned ticket'
                          : guest.name || 'Name not set'}
                      </td>
                      <td>{guest.ticketType}</td>
                      <td>{guest.quantity}</td>
                      <td>{ownershipLabel(guest.ownershipStatus)}</td>
                      <td>{guest.status === 'entered' ? 'Entered' : 'Not entered'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </PageContainer>
  );
}

function ownershipLabel(status: DoorGuest['ownershipStatus']): string {
  switch (status) {
    case 'purchaser':
      return 'Purchaser';
    case 'unassigned':
      return 'Unassigned';
    case 'assigned':
      return 'Assigned attendee';
    case null:
      return 'Door sale';
    case undefined:
      return 'Not recorded';
  }
}
