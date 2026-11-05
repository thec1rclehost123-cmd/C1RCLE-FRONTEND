import type { CheckoutQuoteResponse } from '@c1rcle/contracts';

/** Describes the exact server policy accompanying the quoted amounts; never prices on the client. */
export function BookingFeeDisclosure({
  policy,
}: {
  readonly policy: CheckoutQuoteResponse['feePolicy'];
}) {
  if (!policy) return null;
  return (
    <section
      aria-label="Booking fee and refund policy"
      className="mt-4 space-y-2 border-t border-white/10 pt-3 text-xs leading-5 text-white/65"
    >
      <p className="font-semibold text-white/85">Test pricing policy: {policy.label}</p>
      <p>
        You pay the C1RCLE booking and payment fees shown above. These rates are for non-production
        testing; production rates are not approved.
      </p>
      <p>
        Eligible guest-requested refunds cover the selected tickets’ admission value. Booking and
        payment fees are excluded under this test policy.
      </p>
      <p>
        Organizer or C1RCLE cancellation, or a qualifying material change: refunds include the full
        affected amount originally paid, including applicable fees and taxes.
      </p>
      <p className="text-[10px] text-white/45">Policy version: {policy.version}</p>
    </section>
  );
}
