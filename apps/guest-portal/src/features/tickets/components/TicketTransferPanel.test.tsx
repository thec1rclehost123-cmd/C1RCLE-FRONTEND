import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

import { MANAGEMENT, TRANSFER } from '../fixtures/ticket-management.test-fixtures';

import { TicketTransferPanel } from './TicketTransferPanel';

const { post } = vi.hoisted(() => ({ post: vi.fn<(...args: unknown[]) => Promise<unknown>>() }));
vi.mock('@/lib/bff/bff-client', () => ({
  bffClient: { post: (...args: unknown[]) => post(...args) },
}));
beforeEach(() => {
  post.mockReset();
});
function renderPanel(pending = false) {
  const changed = vi.fn();
  render(
    <TicketTransferPanel
      management={{ ...MANAGEMENT, pendingTransfer: pending ? TRANSFER : null }}
      onBack={vi.fn()}
      onChanged={changed}
    />,
  );
  return changed;
}
function review() {
  fireEvent.change(screen.getByRole('textbox', { name: 'Recipient email' }), {
    target: { value: 'guest@example.test' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Review invitation' }));
}
it('requires an explicit review before creating an invitation and preserves ownership while pending', async () => {
  post.mockResolvedValue(TRANSFER);
  renderPanel();
  review();
  expect(post).not.toHaveBeenCalled();
  expect(screen.getByText('guest@example.test')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Create transfer link' }));
  expect(
    await screen.findByRole('heading', { name: 'Waiting for acceptance' }),
  ).toBeInTheDocument();
  expect(screen.getByText(/ticket stays with its current holder/i)).toBeInTheDocument();
  expect(screen.getByText(/Email delivery is not confirmed/i)).toBeInTheDocument();
  expect(post).toHaveBeenCalledWith(
    expect.objectContaining({
      path: `/api/tickets/${MANAGEMENT.id}/transfers`,
      body: { recipientEmail: 'guest@example.test' },
    }),
  );
});
it('restores pending invitation controls without guessing a recipient identity', () => {
  renderPanel(true);
  expect(screen.getByRole('link', { name: 'Open invitation' })).toHaveAttribute(
    'href',
    `${window.location.origin}/ticket-transfer/${TRANSFER.id}`,
  );
  expect(screen.queryByRole('textbox', { name: 'Recipient email' })).not.toBeInTheDocument();
});
it('confirms cancellation before writing and keeps ownership unchanged', async () => {
  post.mockResolvedValue({ transfer: { ...TRANSFER, status: 'cancelled' } });
  renderPanel(true);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel pending transfer' }));
  expect(post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel invitation' }));
  expect(
    await screen.findByText(/Invitation cancelled. The ticket has not changed holders/),
  ).toBeInTheDocument();
});
it('keeps an already accepted invitation out of the cancelled success state', async () => {
  post.mockResolvedValue({ transfer: { ...TRANSFER, status: 'accepted' } });
  renderPanel(true);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel pending transfer' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel invitation' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('accepted');
  expect(screen.queryByText(/Invitation cancelled/)).not.toBeInTheDocument();
});
it('requests an idempotent resend without claiming delivery', async () => {
  post.mockResolvedValue({ requested: true });
  renderPanel(true);
  fireEvent.click(screen.getByRole('button', { name: 'Resend invitation' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Email delivery is not confirmed');
  const input = post.mock.calls[0]?.[0] as { headers: Record<string, string> };
  expect(typeof input.headers['idempotency-key']).toBe('string');
});
it('copies the invitation link for manual delivery', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  renderPanel(true);
  fireEvent.click(screen.getByRole('button', { name: 'Copy invitation link' }));
  expect(writeText).toHaveBeenCalledWith(
    `${window.location.origin}/ticket-transfer/${TRANSFER.id}`,
  );
  expect(await screen.findByRole('status')).toHaveTextContent('Invitation link copied');
});
it('does not offer a form when transfers are unavailable', () => {
  render(
    <TicketTransferPanel
      management={{
        ...MANAGEMENT,
        canTransfer: false,
        transferUnavailableReason: 'Free RSVPs cannot be transferred.',
      }}
      onBack={vi.fn()}
      onChanged={vi.fn()}
    />,
  );
  expect(screen.getByRole('status')).toHaveTextContent('Free RSVPs cannot be transferred');
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
});
it('does not invent a pending invitation after a failed create request', async () => {
  post.mockRejectedValue(new Error('offline'));
  renderPanel();
  review();
  fireEvent.click(screen.getByRole('button', { name: 'Create transfer link' }));
  expect(await screen.findByRole('alert')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Waiting for acceptance' })).not.toBeInTheDocument();
});
