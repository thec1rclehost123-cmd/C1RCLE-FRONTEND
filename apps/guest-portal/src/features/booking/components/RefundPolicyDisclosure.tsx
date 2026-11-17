import type { BookingEventFixture } from '../types/booking.types';

const cutoffFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
});

export function RefundPolicyDisclosure({
  policy,
}: {
  readonly policy: BookingEventFixture['refundPolicy'];
}) {
  const description = !policy
    ? 'Refund policy not provided for this event. Please check with the organizer before purchase.'
    : policy.kind === 'no_refunds'
      ? 'This event does not offer refunds under its listed policy.'
      : policy.kind === 'organizer_reviewed'
        ? 'Refund requests are reviewed by the event organizer under the listed policy.'
        : `The event lists a refund request cutoff of ${cutoffFormatter.format(new Date(policy.cutoffAt))}. Requests after this time may not be accepted.`;

  return (
    <section
      aria-label="Event refund policy"
      className="mt-4 border-t border-white/10 pt-3 text-xs leading-5 text-white/65"
    >
      <h3 className="font-semibold text-white/85">Event refund policy</h3>
      <p className="mt-1">{description}</p>
    </section>
  );
}
