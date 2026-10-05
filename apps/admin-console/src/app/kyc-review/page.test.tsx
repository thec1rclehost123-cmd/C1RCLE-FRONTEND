import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@c1rcle/api-client';

import KycReviewDesk from '@/app/kyc-review/page';

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
    verifyOnboardingDocument: vi.fn(),
    rejectOnboardingDocument: vi.fn(),
  };
});

const api = await import('@/lib/admin/admin-api');

const app = {
  id: 'app_1',
  userId: 'user_12345678',
  status: 'submitted',
  requestedType: 'venue',
  plan: 'basic',
  profile: { legalName: 'Acme Lounge', contactPerson: 'A', phone: '123456', city: 'Pune' },
  documents: [
    {
      label: 'id_front',
      storagePath: 'p/id_front',
      uploadedAt: '2026-09-01T00:00:00.000Z',
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
    },
  ],
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

const page = (items: unknown[]) => ({
  items,
  pageInfo: { page: 1, pageSize: 100, total: items.length, hasNextPage: false },
});

const fakeWindow = () => ({ closed: false, opener: 'x', close: vi.fn(), location: { href: '' } });

function renderDesk() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <KycReviewDesk />
    </QueryClientProvider>,
  );
}

describe('KYC review desk', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.listOnboardingApplications).mockImplementation((status) =>
      Promise.resolve(page(status === 'submitted' ? [app] : []) as never),
    );
  });

  it('renders the queue with documents', async () => {
    renderDesk();
    expect(await screen.findByText('Acme Lounge')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'id_front' })).toBeInTheDocument();
    expect(screen.getByText('Needs review')).toBeInTheDocument();
  });

  it('pre-opens the window synchronously, then navigates it to the signed URL', async () => {
    const w = fakeWindow();
    const open = vi.spyOn(window, 'open').mockReturnValue(w as unknown as Window);
    let resolveGrant: (v: unknown) => void = () => undefined;
    vi.mocked(api.getOnboardingDocumentReadUrl).mockReturnValue(
      new Promise((r) => {
        resolveGrant = r;
      }) as never,
    );
    const user = userEvent.setup();
    renderDesk();
    await user.click(await screen.findByRole('button', { name: 'id_front' }));

    expect(open).toHaveBeenCalledWith('about:blank', '_blank');
    expect(w.location.href).toBe('');
    resolveGrant({ readUrl: 'https://signed/doc' });
    await waitFor(() => {
      expect(w.location.href).toBe('https://signed/doc');
    });
  });

  it('closes the pre-opened window and shows an error when the read-url call fails', async () => {
    const w = fakeWindow();
    vi.spyOn(window, 'open').mockReturnValue(w as unknown as Window);
    vi.mocked(api.getOnboardingDocumentReadUrl).mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    renderDesk();
    await user.click(await screen.findByRole('button', { name: 'id_front' }));

    expect(await screen.findByText(/could not be opened/i)).toBeInTheDocument();
    expect(w.close).toHaveBeenCalled();
  });

  it('verifies a document', async () => {
    vi.mocked(api.verifyOnboardingDocument).mockResolvedValue(app as never);
    const user = userEvent.setup();
    renderDesk();
    await user.click(await screen.findByRole('button', { name: 'Verify' }));
    await waitFor(() => {
      expect(api.verifyOnboardingDocument).toHaveBeenCalledWith('app_1', 'id_front');
    });
  });

  it('requires a reason before a document can be rejected', async () => {
    vi.mocked(api.rejectOnboardingDocument).mockResolvedValue(app as never);
    const user = userEvent.setup();
    renderDesk();
    await user.click(await screen.findByRole('button', { name: 'Reject' }));

    const confirm = screen.getByRole('button', { name: 'Confirm rejection' });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText('Rejection reason'), '  blurry  ');
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    await waitFor(() => {
      expect(api.rejectOnboardingDocument).toHaveBeenCalledWith('app_1', 'id_front', 'blurry');
    });
  });

  it('surfaces the gateway 4xx message when verify fails', async () => {
    vi.mocked(api.verifyOnboardingDocument).mockRejectedValue(
      apiError({ code: 'validation', message: 'document already reviewed', status: 400 }),
    );
    const user = userEvent.setup();
    renderDesk();
    await user.click(await screen.findByRole('button', { name: 'Verify' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('document already reviewed');
  });
});
