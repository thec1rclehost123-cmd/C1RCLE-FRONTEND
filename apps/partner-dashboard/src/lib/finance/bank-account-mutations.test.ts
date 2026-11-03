import { describe, expect, it, vi } from 'vitest';

import { addBankAccount, removeBankAccount, setDefaultBankAccount } from './api-finance-repository';

import type { FinanceMutationApiClient } from './api-finance-repository';
import type { BankAccountResponse } from '@c1rcle/contracts';

const account: BankAccountResponse = {
  id: 'ba_1',
  bankName: 'HDFC Bank',
  accountHolder: 'Aarav Rao',
  maskedAccountNumber: 'XXXX4321',
  ifscCode: 'HDFC0001234',
  isDefault: true,
  verified: false,
  createdAt: '2026-11-02T10:00:00.000Z',
};

describe('bank account mutations', () => {
  it('sends Indian bank details only to the organization scoped API and parses the masked response', async () => {
    const post = vi.fn().mockResolvedValue(account);
    const client = { post } as unknown as FinanceMutationApiClient;

    await addBankAccount(client, 'org_1', {
      bankName: 'HDFC Bank',
      accountHolder: 'Aarav Rao',
      accountNumber: '1234567894321',
      ifscCode: 'HDFC0001234',
    });

    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/organizations/org_1/bank-accounts',
        body: {
          bankName: 'HDFC Bank',
          accountHolder: 'Aarav Rao',
          accountNumber: '1234567894321',
          ifscCode: 'HDFC0001234',
        },
        headers: { 'x-organization-id': 'org_1' },
      }),
    );
    expect(Object.keys(account)).not.toContain('accountNumber');
  });

  it('selects the payout account through the scoped route', async () => {
    const post = vi.fn().mockResolvedValue(account);
    const client = { post } as unknown as FinanceMutationApiClient;

    await setDefaultBankAccount(client, 'org_1', 'ba_1');

    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/organizations/org_1/bank-accounts/ba_1/default',
        headers: { 'x-organization-id': 'org_1' },
      }),
    );
  });

  it('removes an account using the authorized organization route', async () => {
    const remove = vi.fn().mockResolvedValue(undefined);
    const client = { delete: remove } as unknown as FinanceMutationApiClient;

    await removeBankAccount(client, 'org_1', 'ba_1');

    expect(remove).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/organizations/org_1/bank-accounts/ba_1',
        headers: { 'x-organization-id': 'org_1' },
      }),
    );
  });
});
