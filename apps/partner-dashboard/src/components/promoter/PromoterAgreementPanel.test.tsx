import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PromoterAgreementPanel } from './PromoterAgreementPanel';

const mocks = vi.hoisted(() => ({
  getMine: vi.fn(),
  getPromoterAgreement: vi.fn(),
  acceptPromoterAgreement: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('@/lib/onboarding/onboarding-repository', () => mocks);
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
const artifact = {
  version: 'staging-v1',
  status: 'staging_only',
  text: 'C1RCLE STAGING PROMOTER AGREEMENT — FOR TESTING ONLY',
  textSha256: 'a'.repeat(64),
};
const application = {
  id: 'application',
  userId: 'owner',
  requestedType: 'promoter',
  promoterAgreementAcceptances: [],
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getMine.mockResolvedValue(application);
  mocks.getPromoterAgreement.mockResolvedValue({ agreement: artifact, activationAvailable: true });
});
describe('Promoter agreement review', () => {
  it('requires an explicit checkbox and binds acceptance to the displayed version', async () => {
    mocks.acceptPromoterAgreement.mockResolvedValue({
      ...application,
      promoterAgreementAcceptances: [
        {
          version: artifact.version,
          artifactStatus: artifact.status,
          textSha256: artifact.textSha256,
          acceptedBy: 'owner',
        },
      ],
    });
    const user = userEvent.setup();
    render(<PromoterAgreementPanel />);
    expect(mocks.getMine).toHaveBeenCalledWith('promoter');
    const button = await screen.findByRole('button', { name: 'Accept agreement' });
    expect(button).toBeDisabled();
    expect(mocks.acceptPromoterAgreement).not.toHaveBeenCalled();
    expect(screen.getByText(/This is not the production legal agreement/)).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox'));
    await user.click(button);
    await waitFor(() => {
      expect(mocks.acceptPromoterAgreement).toHaveBeenCalledWith(
        'application',
        'staging-v1',
        expect.any(String),
      );
    });
    expect(await screen.findByText('You accepted this version.')).toBeInTheDocument();
  });
  it('keeps activation unavailable when no artifact is configured', async () => {
    mocks.getPromoterAgreement.mockResolvedValue({ agreement: null, activationAvailable: false });
    render(<PromoterAgreementPanel />);
    expect(await screen.findByText(/No approved Promoter agreement/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accept agreement' })).not.toBeInTheDocument();
  });
  it('shows a failure and reload control without claiming acceptance', async () => {
    mocks.acceptPromoterAgreement.mockRejectedValue(new Error('Version changed'));
    const user = userEvent.setup();
    render(<PromoterAgreementPanel />);
    await user.click(await screen.findByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Accept agreement' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Acceptance could not be confirmed');
    expect(screen.queryByText('You accepted this version.')).not.toBeInTheDocument();
  });
});
