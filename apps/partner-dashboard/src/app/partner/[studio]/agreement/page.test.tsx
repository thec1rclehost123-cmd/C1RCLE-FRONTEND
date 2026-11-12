import { describe, expect, it, vi } from 'vitest';

import PromoterAgreementPage from './page';

const { notFound } = vi.hoisted(() => ({ notFound: vi.fn() }));

vi.mock('next/navigation', () => ({ notFound }));
vi.mock('@/components/promoter/PromoterAgreementPanel', () => ({
  PromoterAgreementPanel: () => <div>Promoter agreement panel</div>,
}));

describe('Promoter agreement route', () => {
  it('renders for the Promoter workspace', async () => {
    const page = await PromoterAgreementPage({ params: Promise.resolve({ studio: 'promoter' }) });
    expect(page).toBeTruthy();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('rejects other workspaces', async () => {
    notFound.mockImplementationOnce(() => {
      throw new Error('not found');
    });
    await expect(
      PromoterAgreementPage({ params: Promise.resolve({ studio: 'host' }) }),
    ).rejects.toThrow('not found');
  });
});
