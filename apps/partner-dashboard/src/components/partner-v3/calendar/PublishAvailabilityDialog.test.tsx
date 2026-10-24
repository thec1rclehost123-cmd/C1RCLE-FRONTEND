import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PublishAvailabilityDialog } from './PublishAvailabilityDialog';

vi.mock('@c1rcle/icons', () => ({ CloseIcon: () => <svg aria-hidden="true" /> }));

describe('PublishAvailabilityDialog', () => {
  it('publishes the explicit date/time/timezone and optional constraints', async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <PublishAvailabilityDialog
        selectedDate="2026-11-06"
        onPublish={onPublish}
        onClose={onClose}
      />,
    );
    fireEvent.change(screen.getByLabelText('Starts'), { target: { value: '2026-11-06T18:30' } });
    fireEvent.change(screen.getByLabelText('Ends'), { target: { value: '2026-11-06T22:30' } });
    await user.selectOptions(screen.getByLabelText('Timezone'), 'Asia/Kolkata');
    await user.type(screen.getByLabelText(/Notes or constraints/i), 'M3 isolated test window');
    await user.click(screen.getByRole('button', { name: 'Publish 2026-11-06' }));
    await waitFor(() => {
      expect(onPublish).toHaveBeenCalledWith({
        startsAtLocal: '2026-11-06T18:30',
        endsAtLocal: '2026-11-06T22:30',
        timezone: 'Asia/Kolkata',
        notes: 'M3 isolated test window',
      });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the dialog open and offers retry after a publish failure', async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn().mockRejectedValueOnce(new Error('overlaps an existing event'));
    render(
      <PublishAvailabilityDialog
        selectedDate="2026-11-06"
        onPublish={onPublish}
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Publish 2026-11-06' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('overlaps an existing event');
    expect(screen.getByRole('button', { name: 'Publish 2026-11-06' })).toBeEnabled();
  });
});
