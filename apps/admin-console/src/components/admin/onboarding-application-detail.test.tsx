import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { OnboardingApplicationDetail } from '@/components/admin/onboarding-application-detail';

import type { OnboardingRequestDto } from '@c1rcle/contracts';

describe('OnboardingApplicationDetail promoter agreement evidence', () => {
  it('shows fixture status, acceptance actor and time, content hash, and legal wording warning', () => {
    const application = {
      id: 'application_123456789',
      userId: 'user_123456789',
      requestedType: 'promoter',
      profile: {
        legalName: 'Test Promoter',
        contactPerson: 'Test User',
        phone: '000',
        city: 'Pune',
      },
      status: 'submitted',
      plan: 'basic',
      submittedAt: '2026-10-28T12:00:00.000Z',
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
      provisionedOrganizationId: null,
      missingDocuments: [],
      version: 1,
      createdAt: '2026-10-28T12:00:00.000Z',
      updatedAt: '2026-10-28T12:00:00.000Z',
      documents: [],
      promoterAgreementAcceptances: [
        {
          version: 'm4-test-fixture-2026-10-28-v1',
          artifactStatus: 'test_fixture',
          acceptedBy: 'user_actor_123456',
          acceptedAt: '2026-10-28T12:00:00.000Z',
          textSha256: 'a'.repeat(64),
        },
      ],
    } as unknown as OnboardingRequestDto;

    render(
      <OnboardingApplicationDetail
        application={application}
        onOpenDocument={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/m4-test-fixture-2026-10-28-v1 · test_fixture/)).toBeInTheDocument();
    expect(
      screen.getByText(/Test fixture only\. This is not approved legal wording/),
    ).toBeInTheDocument();
    const evidence = screen.getByText(/Accepted by/);
    expect(evidence).toHaveTextContent('user_actor_1');
    expect(evidence).toHaveTextContent('28 Oct 2026');
    expect(evidence).toHaveTextContent('SHA-256');
    expect(evidence).toHaveTextContent('a'.repeat(64));
  });
});
