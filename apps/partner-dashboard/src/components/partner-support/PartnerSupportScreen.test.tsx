import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PartnerSupportScreen } from './PartnerSupportScreen';

import type { PartnerSupportTicket } from '@/lib/support/support-repository';

vi.mock('@/components/providers/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({
    profile: {
      activeMembership: {
        partnerId: 'org_test_01',
      },
    },
  }),
}));

const mockTickets: readonly PartnerSupportTicket[] = [
  {
    id: 'tk_001',
    shortId: 'ABCD1234',
    subject: '[Payments & Finance · Payout Delay] Payout pending for 48h',
    cleanSubject: 'Payout pending for 48h',
    description: 'We have not received the automated transfer.',
    category: 'billing',
    department: 'Payments & Finance',
    subcategory: 'Payout Delay',
    status: 'open',
    priority: 'high',
    mergedInto: null,
    mergedIntoShortId: null,
    mergedFrom: [],
    messages: [
      {
        id: 'msg_01',
        senderRole: 'customer',
        senderId: 'usr_01',
        senderName: 'Partner Admin',
        content: 'We have not received the automated transfer.',
        createdAt: '2026-10-10T10:00:00.000Z',
      },
    ],
    createdAt: '2026-10-10T10:00:00.000Z',
    updatedAt: '2026-10-10T10:00:00.000Z',
    isMerged: false,
  },
  {
    id: 'tk_002',
    shortId: 'MERG9999',
    subject: '[Event Management · Unable to Publish Event] Duplicate event publishing error',
    cleanSubject: 'Duplicate event publishing error',
    description: 'Duplicate inquiry merged into primary ticket.',
    category: 'event',
    department: 'Event Management',
    subcategory: 'Unable to Publish Event',
    status: 'closed',
    priority: 'medium',
    mergedInto: 'tk_001',
    mergedIntoShortId: 'ABCD1234',
    mergedFrom: [],
    messages: [
      {
        id: 'msg_02',
        senderRole: 'customer',
        senderId: 'usr_01',
        senderName: 'Partner Admin',
        content: 'Duplicate inquiry merged into primary ticket.',
        createdAt: '2026-10-11T12:00:00.000Z',
      },
      {
        id: 'msg_03',
        senderRole: 'admin',
        senderId: 'adm_01',
        senderName: 'C1RCLE Desk',
        content: '[Merged from ticket MERG9999] Consolidated into primary inquiry.',
        createdAt: '2026-10-11T14:00:00.000Z',
      },
    ],
    createdAt: '2026-10-11T12:00:00.000Z',
    updatedAt: '2026-10-11T14:00:00.000Z',
    isMerged: true,
  },
];

describe('PartnerSupportScreen', () => {
  it('renders support desk metrics, filters, and ticket list', () => {
    render(<PartnerSupportScreen initialTickets={mockTickets} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Support Desk' })).toBeInTheDocument();
    expect(screen.getByText('Total Requests')).toBeInTheDocument();
    expect(screen.getByText('Active Inquiries')).toBeInTheDocument();

    // Verify tickets rendered
    expect(screen.getByText('#ABCD1234')).toBeInTheDocument();
    expect(screen.getByText('Payout pending for 48h')).toBeInTheDocument();
    expect(screen.getByText('#MERG9999')).toBeInTheDocument();
  });

  it('renders dedicated MERGED status pill for duplicate merged tickets', () => {
    render(<PartnerSupportScreen initialTickets={mockTickets} />);

    expect(screen.getByText('MERGED')).toBeInTheDocument();
    expect(screen.getByText('OPEN')).toBeInTheDocument();
  });

  it('filters tickets by status tab', async () => {
    const user = userEvent.setup();
    render(<PartnerSupportScreen initialTickets={mockTickets} />);

    await user.click(screen.getByRole('tab', { name: /Active/ }));
    expect(screen.getByText('#ABCD1234')).toBeInTheDocument();
    expect(screen.queryByText('#MERG9999')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Closed/ }));
    expect(screen.getByText('#MERG9999')).toBeInTheDocument();
    expect(screen.queryByText('#ABCD1234')).not.toBeInTheDocument();
  });

  it('opens conversation drawer when clicking a ticket', async () => {
    const user = userEvent.setup();
    render(<PartnerSupportScreen initialTickets={mockTickets} />);

    await user.click(screen.getByText('Payout pending for 48h'));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByRole('heading', { level: 2, name: 'Payout pending for 48h' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('We have not received the automated transfer.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Send Reply/i })).toBeInTheDocument();
  });

  it('shows merge info banner and locks controls when inspecting a merged ticket', async () => {
    const user = userEvent.setup();
    render(<PartnerSupportScreen initialTickets={mockTickets} />);

    await user.click(screen.getByText('Duplicate event publishing error'));

    expect(screen.getByText('Merged Ticket')).toBeInTheDocument();
    expect(
      screen.getByText(/This ticket has been consolidated into primary ticket/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText('#ABCD1234')).toHaveLength(2);
    expect(screen.getByText(/Replies are locked for this merged ticket/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Send Reply/i })).not.toBeInTheDocument();
  });

  it('opens raise ticket modal with all 9 departments and dynamic subcategories', async () => {
    const user = userEvent.setup();
    render(<PartnerSupportScreen initialTickets={mockTickets} />);

    await user.click(screen.getByRole('button', { name: 'Raise Support Ticket' }));

    expect(
      screen.getByRole('heading', { level: 2, name: 'Raise Support Ticket' }),
    ).toBeInTheDocument();
    const deptSelect = screen.getByLabelText('Department');
    expect(deptSelect).toBeInTheDocument();

    // Verify department options include all 9 departments
    expect(screen.getAllByRole('option').length).toBeGreaterThanOrEqual(9);

    // Change department to Payments & Finance
    fireEvent.change(deptSelect, { target: { value: 'Payments & Finance' } });
    const subSelect = screen.getByLabelText('Issue Category');
    expect(subSelect).toHaveValue('Subscription Billing');

    // Close modal
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Raise Support Ticket' }),
    ).not.toBeInTheDocument();
  });
});
