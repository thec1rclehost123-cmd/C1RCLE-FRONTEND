import { formatInr } from '@/lib/partner/contracts';

import type { PartnerFinanceSummary } from '@/lib/partner/contracts';

export interface HostPayoutAccountFields {
  readonly display: string;
  readonly bankName?: string;
  readonly maskedAccount?: string;
}

export interface HostPayoutHistoryRow {
  readonly id: string;
  readonly date: string;
  readonly status: string;
  readonly amount: string;
}

export function mapHostPayoutAccount(value: string): HostPayoutAccountFields {
  const display = value.trim();
  const match = display.match(/^(.*?)\s+(••\S+)$/);

  if (match?.[1] && match[2]) {
    return { display, bankName: match[1], maskedAccount: match[2] };
  }

  return { display };
}

export function mapHostPayoutHistory(
  finance: PartnerFinanceSummary,
): readonly HostPayoutHistoryRow[] {
  return finance.payouts.map((payout) => ({
    id: payout.id,
    date: payout.createdAt,
    status: payout.status.charAt(0).toUpperCase() + payout.status.slice(1),
    amount: formatInr(payout.amountPaise),
  }));
}
