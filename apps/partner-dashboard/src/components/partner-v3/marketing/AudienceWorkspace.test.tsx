import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, expect, it, vi } from 'vitest';

import { AudienceWorkspace } from './AudienceWorkspace';
import { previewMessage, safePreviewLink } from './BlastComposer';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn();
});
const data = {
  rows: [
    {
      id: 'row-a',
      name: 'Aisha Menon',
      eventId: 'event-a',
      eventName: 'Night',
      tickets: 2,
      totalSpendPaise: 360000,
    },
  ],
  events: [{ id: 'event-a', name: 'Night' }],
  tiers: [{ id: 'tier-a', eventId: 'event-a', name: 'VIP' }],
  total: 1,
  nextOffset: null,
};
it('selects visible page, clears it and disables composition for an empty selection', () => {
  render(<AudienceWorkspace data={data} studio="host" />);
  const action = screen.getByRole('button', { name: 'Send marketing blast' });
  expect(action).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Select visible (1)' }));
  expect(action).toBeEnabled();
  expect(screen.getByRole('checkbox')).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
  expect(action).toBeDisabled();
  expect(screen.getByRole('checkbox')).not.toBeChecked();
  expect(screen.getAllByRole('columnheader').map((node) => node.textContent)).toEqual([
    'Select',
    'Name',
    'Event',
    'Tickets',
    'Total spend',
  ]);
});
it('updates all four previews without a delivery action or request', () => {
  render(<AudienceWorkspace data={data} studio="host" />);
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Send marketing blast' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Hello [First name]' } });
  expect(screen.getByLabelText('WhatsApp preview')).toHaveTextContent('Hello Aisha');
  for (const channel of ['SMS', 'Email', 'Notification']) {
    fireEvent.click(screen.getByRole('button', { name: channel }));
    expect(screen.getByLabelText(`${channel} preview`)).toHaveTextContent('Hello Aisha');
  }
  expect(screen.getByRole('button', { name: 'Delivery not connected' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Close composer' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('substitutes only the first-name token and rejects executable link protocols', () => {
  expect(previewMessage('Hi [First name] [Last name]', 'Aisha Menon')).toBe('Hi Aisha [Last name]');
  for (const value of ['javascript:alert(1)', 'data:text/html,x', '/relative', 'garbage'])
    expect(safePreviewLink(value)).toBeNull();
  expect(safePreviewLink('https://example.invalid/event')).toBe('https://example.invalid/event');
});
