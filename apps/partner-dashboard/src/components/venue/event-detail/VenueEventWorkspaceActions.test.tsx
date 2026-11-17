import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VenueEventWorkspaceActions } from './VenueEventWorkspaceActions';

const mocks = vi.hoisted(() => ({ canDo: vi.fn<(permission: string) => boolean>() }));

vi.mock('@c1rcle/icons', () => ({ DoorModeIcon: () => <svg aria-hidden="true" /> }));
vi.mock('@/components/providers/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({ canDo: mocks.canDo }),
}));

describe('VenueEventWorkspaceActions', () => {
  beforeEach(() => mocks.canDo.mockReset());

  it('does not show Door Mode without the Venue permission', () => {
    mocks.canDo.mockReturnValue(false);
    const { container } = render(<VenueEventWorkspaceActions eventId="event 1" />);

    expect(container).toBeEmptyDOMElement();
    expect(mocks.canDo).toHaveBeenCalledWith('canManageDoorMode');
  });

  it('links authorized Venue staff to the Partner Venue Door Mode route', () => {
    mocks.canDo.mockReturnValue(true);
    render(<VenueEventWorkspaceActions eventId="event 1" />);

    expect(screen.getByRole('link', { name: 'Door Mode' })).toHaveAttribute(
      'href',
      '/partner/venue/events/event%201/door',
    );
  });
});
