import { describe, expect, it } from 'vitest';

import { promoRequestsFromDraft, validatePromoDraft } from './event-promo-codes';

const promo = {
  id: 'p1',
  code: 'early10',
  discountType: 'percent' as const,
  discountValue: 10,
  quantity: 25,
  endsAt: '2099-11-16T19:00',
  fundingOwner: 'venue' as const,
};
describe('event promo configuration', () => {
  it('maps quantity, funding and IST expiry to the authoritative request', () => {
    expect(
      promoRequestsFromDraft({ promoCodes: ['early10'], promoCodeSettings: [promo] })[0],
    ).toMatchObject({
      code: 'EARLY10',
      maxRedemptions: 25,
      endsAt: '2099-11-16T13:30:00.000Z',
      discountValue: 10,
      discountFundingOwner: 'venue',
    });
  });
  it('converts rupees to paise and supports no limit or expiry', () => {
    expect(
      promoRequestsFromDraft({
        promoCodes: ['early10'],
        promoCodeSettings: [
          { ...promo, discountType: 'fixed', discountValue: 100.5, quantity: null, endsAt: '' },
        ],
      })[0],
    ).toMatchObject({ discountValue: 10050, maxRedemptions: null, endsAt: null });
  });
  it('rejects duplicate codes, fractional quantities, invalid percentages and past expiry', () => {
    const errors = validatePromoDraft({
      promoCodes: ['EARLY10'],
      promoCodeSettings: [
        promo,
        { ...promo, quantity: 1.5, discountValue: 101, endsAt: '2000-01-01T00:00' },
      ],
    });
    expect(errors).toHaveLength(4);
    expect(() =>
      promoRequestsFromDraft({
        promoCodes: ['EARLY10'],
        promoCodeSettings: [{ ...promo, quantity: 0 }],
      }),
    ).toThrow('quantity');
  });
  it('requires details for legacy text-only codes', () => {
    expect(validatePromoDraft({ promoCodes: ['OLD'] })).toEqual([
      'Complete the promo-code details in Advanced setup.',
    ]);
  });
});
