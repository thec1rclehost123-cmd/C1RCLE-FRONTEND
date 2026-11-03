import { createPromoCodeSchema } from '@c1rcle/contracts';

import { productLocalInputToIsoInstant } from './event-time';

import type { EventEditorDraft } from '@/data/partner-data-source';

export function validatePromoDraft(
  draft: Pick<EventEditorDraft, 'promoCodes' | 'promoCodeSettings'>,
): string[] {
  const errors: string[] = [];
  if (draft.promoCodes.length && !draft.promoCodeSettings)
    return ['Complete the promo-code details in Advanced setup.'];
  const codes = new Set<string>();
  for (const [index, promo] of (draft.promoCodeSettings ?? []).entries()) {
    const label = `Promo ${String(index + 1)}`;
    const code = promo.code.trim().toUpperCase();
    if (!code || code.length > 40) errors.push(`${label}: enter a code of 1–40 characters.`);
    if (codes.has(code)) errors.push(`${label}: use a unique code.`);
    codes.add(code);
    if (
      !Number.isFinite(promo.discountValue) ||
      promo.discountValue <= 0 ||
      (promo.discountType === 'percent' &&
        (!Number.isInteger(promo.discountValue) || promo.discountValue > 100))
    )
      errors.push(
        `${label}: enter a valid discount${promo.discountType === 'percent' ? ' from 1–100%' : ''}.`,
      );
    if (promo.quantity !== null && (!Number.isInteger(promo.quantity) || promo.quantity < 1))
      errors.push(`${label}: quantity must be a positive whole number.`);
    if (promo.endsAt) {
      const expiry = productLocalInputToIsoInstant(promo.endsAt);
      if (!expiry || Date.parse(expiry) <= Date.now())
        errors.push(`${label}: choose a future expiry in IST.`);
    }
  }
  return errors;
}

export function promoRequestsFromDraft(
  draft: Pick<EventEditorDraft, 'promoCodes' | 'promoCodeSettings'>,
) {
  const errors = validatePromoDraft(draft);
  if (errors.length) throw new Error(errors.join(' '));
  return (draft.promoCodeSettings ?? []).map((promo) =>
    createPromoCodeSchema.parse({
      code: promo.code.trim().toUpperCase(),
      type: 'multi_use',
      discountType: promo.discountType,
      discountValue:
        promo.discountType === 'fixed'
          ? Math.round(promo.discountValue * 100)
          : promo.discountValue,
      discountFundingOwner: promo.fundingOwner,
      maxRedemptions: promo.quantity,
      endsAt: promo.endsAt ? productLocalInputToIsoInstant(promo.endsAt) : null,
    }),
  );
}
