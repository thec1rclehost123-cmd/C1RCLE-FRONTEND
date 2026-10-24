'use client';

import { Dialog } from '@c1rcle/ui';

import type { UserTicketItem } from '../types/tickets.types';

export interface TicketDetailModalProps {
  ticket: UserTicketItem | null;
  onClose: () => void;
}

const STATUS_COPY = {
  active: {
    label: 'Active',
    detail: 'Booking confirmed.',
  },
  used: { label: 'Used', detail: 'This ticket has already been used.' },
  cancelled: { label: 'Cancelled', detail: 'This ticket is no longer valid.' },
  pending: { label: 'Pending', detail: 'This ticket is still being confirmed.' },
  refund_pending: {
    label: 'Refund processing',
    detail: 'A refund is being processed. This ticket cannot be used.',
  },
  refunded: {
    label: 'Refunded',
    detail: 'This ticket was refunded and is no longer valid.',
  },
  unavailable: { label: 'Unavailable', detail: 'Current event details could not be loaded.' },
} as const;

export function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
  const status = ticket ? STATUS_COPY[ticket.status] : null;

  return (
    <Dialog
      open={ticket !== null}
      onClose={onClose}
      title={ticket?.eventTitle ?? 'Ticket details'}
      description="Your pass details."
      className="border-white/15 bg-[#0a0a0a] text-white shadow-[0_32px_120px_rgba(0,0,0,0.75)]"
    >
      {ticket && status ? (
        <div className="space-y-5">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF6842]">
                {ticket.tierName}
              </p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/75">
                {status.label}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/65">{status.detail}</p>
          </div>

          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Detail
              label="Date and time"
              value={[ticket.date, ticket.time].filter(Boolean).join(' · ') || 'Unavailable'}
            />
            <Detail
              label="Venue"
              value={
                [ticket.venueName, ticket.city]
                  .map((part) => part.trim())
                  .filter(Boolean)
                  .join(', ') || 'Unavailable'
              }
            />
            <Detail label="Ticket holder" value={ticket.holderName} />
            <Detail label="Quantity" value={String(ticket.ticketCount)} />
            {ticket.bookingReference ? (
              <Detail label="Booking reference" value={ticket.bookingReference} />
            ) : null}
          </dl>

          {ticket.status === 'active' ? (
            <p className="text-xs text-white/45">Entry code unavailable in this wallet.</p>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">{label}</dt>
      <dd className="mt-1 font-semibold text-white">{value}</dd>
    </div>
  );
}
