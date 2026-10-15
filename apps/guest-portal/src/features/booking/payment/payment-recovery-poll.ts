import type { PaymentRecoveryResponse } from '@c1rcle/contracts';

export interface PaymentRecoveryPollDeps {
  read(): Promise<PaymentRecoveryResponse | null>;
  pause(): Promise<void>;
}

/** Bounded, read-only polling. It never creates a hold or payment attempt. */
export async function pollAuthoritativePaymentStatus(
  deps: PaymentRecoveryPollDeps,
  eventId: string,
  onStatus: (status: PaymentRecoveryResponse) => void,
  maxAttempts = 15,
): Promise<PaymentRecoveryResponse | null> {
  let latest: PaymentRecoveryResponse | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const status = await deps.read();
      if (status?.eventId !== eventId) return null;
      latest = status;
      onStatus(status);
      if (status.status !== 'pending' && status.status !== 'processing') return status;
    } catch {
      // A transient read cannot safely be presented as payment failure.
    }
    if (attempt + 1 < maxAttempts) await deps.pause();
  }
  return latest;
}
