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
it('selects and clears all visible page rows from the table control', () => {
  render(<AudienceWorkspace data={data} studio="host" />);
  const action = screen.getByRole('button', { name: 'Compose message' });
  expect(action).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select all visible attendees' }));
  expect(action).toBeEnabled();
  expect(screen.getByRole('checkbox', { name: 'Select all visible attendees' })).toBeChecked();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select all visible attendees' }));
  expect(action).toBeDisabled();
  expect(screen.getByRole('checkbox', { name: 'Select all visible attendees' })).not.toBeChecked();
  expect(screen.getAllByRole('columnheader').map((node) => node.textContent)).toEqual([
    '',
    'Attendee',
    'Event',
    'Tickets',
    'Spend',
    'Status',
  ]);
});
it('filters by event and ticket type through API-backed query controls', () => {
  render(<AudienceWorkspace data={data} studio="host" />);
  expect(screen.queryByLabelText('Event')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
  expect(screen.getByLabelText('Event')).toHaveValue('');
  expect(screen.getByLabelText('Ticket type')).toHaveValue('');
  expect(screen.getByRole('option', { name: 'Night' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'VIP · Night' })).toBeInTheDocument();
});
it('selects all visible recipients with the compact action', () => {
  render(<AudienceWorkspace data={data} studio="host" />);
  fireEvent.click(screen.getByRole('button', { name: 'Select all visible' }));
  expect(screen.getByRole('checkbox', { name: 'Select all visible attendees' })).toBeChecked();
  expect(screen.getByText('1 selected')).toBeInTheDocument();
});
it('updates all four previews without a delivery action or request', () => {
  render(<AudienceWorkspace data={data} studio="host" />);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select all visible attendees' }));
  fireEvent.click(screen.getByRole('button', { name: 'Compose message' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'blast-title');
  expect(screen.getByRole('heading', { name: 'New campaign' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Campaign name'), { target: { value: 'Opening night' } });
  fireEvent.click(screen.getByRole('button', { name: 'Review' }));
  expect(screen.getByRole('list', { name: 'Selected recipients' })).toHaveTextContent('Aisha Menon');
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Hello [First name]' } });
  expect(screen.getByLabelText('WhatsApp preview')).toHaveTextContent('Hello Aisha');
  for (const channel of ['SMS', 'Email', 'Notification']) {
    fireEvent.click(screen.getByRole('button', { name: channel }));
    expect(screen.getByLabelText(`${channel} preview`)).toHaveTextContent('Hello Aisha');
  }
  fireEvent.click(screen.getByRole('button', { name: 'Remove Aisha Menon' }));
  expect(screen.getByRole('list', { name: 'Selected recipients' })).toHaveTextContent('No recipients selected.');
  expect(screen.getByRole('button', { name: 'Sending unavailable' })).toBeDisabled();
  expect(screen.getByRole('note')).toHaveTextContent('Preview only · sending is not connected');
  fireEvent.click(screen.getByRole('button', { name: 'Close composer' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('substitutes only the first-name token and rejects executable link protocols', () => {
  expect(previewMessage('Hi [First name] [Last name]', 'Aisha Menon')).toBe('Hi Aisha [Last name]');
  for (const value of ['javascript:alert(1)', 'data:text/html,x', '/relative', 'garbage'])
    expect(safePreviewLink(value)).toBeNull();
  expect(safePreviewLink('https://example.invalid/event')).toBe('https://example.invalid/event');
});
