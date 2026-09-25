import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import SupportDesk from '@/app/support/page';

import type * as AdminApi from '@/lib/admin/admin-api';
import type { AdminSupportTicket } from '@/lib/admin/admin-api';

vi.mock('@/lib/admin/admin-api', async (importOriginal) => {
  const actual = await importOriginal<typeof AdminApi>();
  return {
    ...actual,
    listSupportTickets: vi.fn(),
    getSupportTicket: vi.fn(),
    listAdmins: vi.fn(),
    linkSupportTicket: vi.fn(),
    assignSupportTicket: vi.fn(),
    changeSupportTicketPriority: vi.fn(),
    sendAdminSupportReply: vi.fn(),
    addSupportInternalNote: vi.fn(),
    resolveSupportTicket: vi.fn(),
    mergeSupportTicket: vi.fn(),
    escalateSupportTicket: vi.fn(),
    closeSupportTicket: vi.fn(),
    reopenSupportTicket: vi.fn(),
    restoreSupportTicket: vi.fn(),
    deleteSupportTicket: vi.fn(),
  };
});

const adminApi = await import('@/lib/admin/admin-api');

function buildTicket(overrides: Partial<AdminSupportTicket> = {}): AdminSupportTicket {
  return {
    id: 'ticket_1',
    subject: 'Cannot access my ticket',
    description: 'Guest cannot find their QR code.',
    category: 'order',
    status: 'open',
    priority: 'medium',
    requester: { userId: 'user_1', email: 'guest@example.com', organizationId: null },
    assignee: null,
    messages: [],
    internalNotes: [],
    timeline: [],
    links: { venueId: null, eventId: null, orderId: null, organizationId: null, userId: null },
    sla: {
      responseDueAt: '2026-09-22T00:00:00.000Z',
      resolutionDueAt: '2026-09-23T00:00:00.000Z',
      responseBreachedAt: null,
      resolutionBreachedAt: null,
    },
    mergedInto: null,
    mergedFrom: [],
    resolvedAt: null,
    resolvedBy: null,
    closedAt: null,
    closedBy: null,
    deletedAt: null,
    deletedBy: null,
    createdAt: '2026-09-21T00:00:00.000Z',
    updatedAt: '2026-09-21T00:00:00.000Z',
    ...overrides,
  };
}

function renderDesk() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SupportDesk />
    </QueryClientProvider>,
  );
}

describe('Support desk', () => {
  beforeEach(() => {
    vi.mocked(adminApi.listSupportTickets).mockResolvedValue({
      items: [buildTicket()],
      pageInfo: { page: 1, pageSize: 100, total: 1, hasNextPage: false },
    });
    vi.mocked(adminApi.listAdmins).mockResolvedValue({
      items: [],
      pageInfo: { page: 1, pageSize: 100, total: 1, hasNextPage: false },
    });
    vi.mocked(adminApi.getSupportTicket).mockResolvedValue(buildTicket());
  });

  it('renders the ticket queue from listSupportTickets', async () => {
    renderDesk();

    expect(await screen.findByText('Cannot access my ticket')).toBeInTheDocument();
  });

  it('loads ticket detail and exposes a link-ticket control wired to linkSupportTicket', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.linkSupportTicket).mockResolvedValue(buildTicket());

    renderDesk();

    await user.click(await screen.findByText('Cannot access my ticket'));

    const linkButton = await screen.findByRole('button', { name: 'Link' });
    expect(linkButton).toBeDisabled();

    const orderIdInput = screen.getByPlaceholderText('Order id');
    await user.type(orderIdInput, 'order_42');
    expect(linkButton).toBeEnabled();

    await user.click(linkButton);

    await waitFor(() => {
      expect(adminApi.linkSupportTicket).toHaveBeenCalledWith('ticket_1', { orderId: 'order_42' });
    });
  });

  it('assigns a ticket via assignSupportTicket', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.listAdmins).mockResolvedValue({
      items: [{ id: 'admin_1', email: 'ops@c1rcle.com' } as never],
      pageInfo: { page: 1, pageSize: 100, total: 1, hasNextPage: false },
    });
    vi.mocked(adminApi.assignSupportTicket).mockResolvedValue(buildTicket());

    renderDesk();
    await user.click(await screen.findByText('Cannot access my ticket'));

    const assignSelect = await screen.findByLabelText('Assign to');
    await user.selectOptions(assignSelect, 'admin_1');
    await user.click(
      within(assignSelect.closest('div') as HTMLElement).getByRole('button', { name: 'Assign' }),
    );

    await waitFor(() => {
      expect(adminApi.assignSupportTicket).toHaveBeenCalledWith(
        'ticket_1',
        'admin_1',
        'ops@c1rcle.com',
      );
    });
  });
});
