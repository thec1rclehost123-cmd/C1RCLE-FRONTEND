import type { PaymentRecoveryResponse } from '@c1rcle/contracts';

export interface PaymentRecoveryPollDeps {
  read(): Promise<PaymentRecoveryResponse | null>;
  reconcile?(): Promise<PaymentRecoveryResponse>;
  pause(): Promise<void>;
}

/** Bounded recovery polling; a lost callback may trigger one idempotent server reconciliation. */
export async function pollAuthoritativePaymentStatus(
  deps: PaymentRecoveryPollDeps,
  eventId: string,
  onStatus: (status: PaymentRecoveryResponse) => void,
  maxAttempts = 15,
): Promise<PaymentRecoveryResponse | null> {
  let latest: PaymentRecoveryResponse | null = null;
  let reconciled = false;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const status = await deps.read();
      if (status?.eventId !== eventId) return null;
      latest = status;
      onStatus(status);
      if (status.status !== 'pending' && status.status !== 'processing') return status;
      if (status.status === 'processing' && deps.reconcile && !reconciled) {
        reconciled = true;
        const recovered = await deps.reconcile();
        if (recovered.eventId !== eventId) return null;
        latest = recovered;
        onStatus(recovered);
        if (recovered.status !== 'pending' && recovered.status !== 'processing') return recovered;
      }
    } catch {
      // A transient read cannot safely be presented as payment failure.
    }
    if (attempt + 1 < maxAttempts) await deps.pause();
  }
  return latest;
}
