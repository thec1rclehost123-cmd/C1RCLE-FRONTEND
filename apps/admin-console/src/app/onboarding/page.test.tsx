import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@c1rcle/api-client';

import OnboardingDesk from '@/app/onboarding/page';

import type * as AdminApi from '@/lib/admin/admin-api';

const apiError = (init: {
  code: ApiClientError['code'];
  message: string;
  status: number;
  fieldErrors?: Record<string, string[]>;
}) => new ApiClientError({ requestId: undefined, fieldErrors: undefined, ...init });

vi.mock('@/lib/admin/admin-api', async (importOriginal) => {
  const actual = await importOriginal<typeof AdminApi>();
  return {
    ...actual,
    listOnboardingApplications: vi.fn(),
    getOnboardingApplication: vi.fn(),
    getOnboardingDocumentReadUrl: vi.fn(),
    approveOnboardingApplication: vi.fn(),
    rejectOnboardingApplication: vi.fn(),
    requestOnboardingChanges: vi.fn(),
  };
});

const api = await import('@/lib/admin/admin-api');

const doc = (label: string, status: 'pending' | 'verified') => ({
  label,
  storagePath: `p/${label}`,
  uploadedAt: '2026-09-01T00:00:00.000Z',
  status,
  reviewedBy: null,
  reviewedAt: null,
  rejectionReason: null,
});

const base = {
  userId: 'user_12345678',
  status: 'submitted',
  requestedType: 'venue',
  plan: 'basic',
  missingDocuments: [],
  submittedAt: '2026-09-01T00:00:00.000Z',
  reviewedBy: null,
  reviewedAt: null,
  reviewNote: null,
  provisionedOrganizationId: null,
  version: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};
const profile = { contactPerson: 'A', phone: '123456', city: 'Pune' };
const individualDocs = ['id_front', 'id_back', 'selfie'].map((l) => doc(l, 'verified'));

const verified = {
  ...base,
  id: 'app_ok',
  profile: { ...profile, legalName: 'Verified Co' },
  documents: individualDocs,
};
const unverified = {
  ...base,
  id: 'app_no',
  profile: { ...profile, legalName: 'Pending Co' },
  documents: [doc('id_front', 'pending')],
};
const business = {
  ...base,
  id: 'app_biz',
  profile: { ...profile, legalName: 'Biz Co', entityType: 'business' },
  documents: individualDocs,
};

function renderDesk() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingDesk />
    </QueryClientProvider>,
  );
}

const rowOf = (name: string) => screen.getByText(name).closest('tr') as HTMLElement;
const clickIn = (user: ReturnType<typeof userEvent.setup>, name: string, label: string) =>
  user.click(within(rowOf(name)).getByRole('button', { name: label }));

describe('Onboarding review desk', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.listOnboardingApplications).mockResolvedValue({
      items: [verified, unverified, business],
      pageInfo: { page: 1, pageSize: 100, total: 3, hasNextPage: false },
    } as never);
  });

  it('renders the list and gates Approve on required docs (individual vs business)', async () => {
    renderDesk();
    await screen.findByText('Verified Co');
    expect(within(rowOf('Verified Co')).getByRole('button', { name: 'Approve' })).toBeEnabled();
    expect(within(rowOf('Pending Co')).getByRole('button', { name: 'Approve' })).toBeDisabled();
    // business entity needs registration_certificate + signatory docs
    expect(within(rowOf('Biz Co')).getByRole('button', { name: 'Approve' })).toBeDisabled();
    expect(screen.getAllByText('Needs KYC verification')).toHaveLength(2);
  });

  it('opens a document via the pre-opened window', async () => {
    const w = { closed: false, opener: 'x', close: vi.fn(), location: { href: '' } };
    const open = vi.spyOn(window, 'open').mockReturnValue(w as unknown as Window);
    vi.mocked(api.getOnboardingDocumentReadUrl).mockResolvedValue({
      readUrl: 'https://signed/x',
    } as never);
    const user = userEvent.setup();
    renderDesk();
    await screen.findByText('Verified Co');
    await clickIn(user, 'Verified Co', 'selfie');
    expect(open).toHaveBeenCalledWith('about:blank', '_blank');
    await waitFor(() => {
      expect(w.location.href).toBe('https://signed/x');
    });
  });

  it('approves with the typed note', async () => {
    vi.mocked(api.approveOnboardingApplication).mockResolvedValue({} as never);
    const user = userEvent.setup();
    renderDesk();
    await screen.findByText('Verified Co');
    await clickIn(user, 'Verified Co', 'Approve');
    await user.type(screen.getByLabelText('Note'), 'looks good');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => {
      expect(api.approveOnboardingApplication).toHaveBeenCalledWith('app_ok', 'looks good');
    });
  });

  it('shows the gateway 400 "documents must be verified" message on approve', async () => {
    vi.mocked(api.approveOnboardingApplication).mockRejectedValue(
      apiError({
        code: 'validation',
        message: 'documents must be verified',
        status: 400,
      }),
    );
    const user = userEvent.setup();
    renderDesk();
    await screen.findByText('Verified Co');
    await clickIn(user, 'Verified Co', 'Approve');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('documents must be verified');
  });

  it('runs the request-changes flow', async () => {
    vi.mocked(api.requestOnboardingChanges).mockResolvedValue({} as never);
    const user = userEvent.setup();
    renderDesk();
    await screen.findByText('Pending Co');
    await clickIn(user, 'Pending Co', 'Request changes');
    await user.type(screen.getByLabelText('Note'), 'selfie unclear');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => {
      expect(api.requestOnboardingChanges).toHaveBeenCalledWith('app_no', 'selfie unclear');
    });
  });

  it('keeps the review open after a 5xx so the admin can retry the same action', async () => {
    vi.mocked(api.rejectOnboardingApplication)
      .mockRejectedValueOnce(apiError({ code: 'server', message: 'bad gateway', status: 502 }))
      .mockResolvedValueOnce({} as never);
    const user = userEvent.setup();
    renderDesk();
    await screen.findByText('Pending Co');
    await clickIn(user, 'Pending Co', 'Reject');
    await user.type(screen.getByLabelText('Note'), 'fraud');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The review could not be saved. It is safe to retry.',
    );
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => {
      expect(api.rejectOnboardingApplication).toHaveBeenCalledTimes(2);
    });
    expect(api.rejectOnboardingApplication).toHaveBeenLastCalledWith('app_no', 'fraud');
  });
});
