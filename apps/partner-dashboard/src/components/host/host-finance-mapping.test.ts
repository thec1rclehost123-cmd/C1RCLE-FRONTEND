import { describe, expect, it } from 'vitest';

import { fixtureHostRepository } from '@/lib/partner/fixture-host-repository';

import { mapHostPayoutAccount, mapHostPayoutHistory } from './host-finance-mapping';

describe('Host finance mapping', () => {
  it('maps the repository payout account without introducing account fields', () => {
    expect(mapHostPayoutAccount('HDFC ••4412')).toEqual({
      display: 'HDFC ••4412',
      bankName: 'HDFC',
      maskedAccount: '••4412',
    });
    expect(mapHostPayoutAccount('Unavailable')).toEqual({ display: 'Unavailable' });
  });

  it('maps payout history from the repository rows', async () => {
    const finance = await fixtureHostRepository.getFinance();
    const rows = mapHostPayoutHistory(finance);

    expect(rows).toEqual([
      { id: 'pay-901', date: '25 Aug', status: 'Paid', amount: '₹62,400' },
      { id: 'pay-902', date: '25 Jul', status: 'Paid', amount: '₹71,800' },
      { id: 'pay-903', date: '25 Sep', status: 'Scheduled', amount: '₹83,200' },
    ]);
  });
});
