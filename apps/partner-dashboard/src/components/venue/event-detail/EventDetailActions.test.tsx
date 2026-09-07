import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventDetailActions } from './EventDetailActions';

const mocks = vi.hoisted(() => ({
  canDo: vi.fn<(action: string) => boolean>(),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return { DoorModeIcon: Icon, EditIcon: Icon };
});
vi.mock('@/components/providers/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({ canDo: mocks.canDo }),
}));
describe('EventDetailActions', () => {
  beforeEach(() => {
    mocks.canDo.mockReset();
  });

  it('omits actions that the current membership cannot perform', () => {
    mocks.canDo.mockReturnValue(false);
    render(
      <EventDetailActions eventId="neon-nights-afrobeats" eventName="Neon Nights: Afrobeats" />,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders both approved event actions for an authorized membership', () => {
    mocks.canDo.mockReturnValue(true);
    render(
      <EventDetailActions eventId="neon-nights-afrobeats" eventName="Neon Nights: Afrobeats" />,
    );

    expect(screen.getByRole('link', { name: 'Edit event' })).toHaveAttribute(
      'href',
      '/venue/events/neon-nights-afrobeats/edit',
    );
    expect(screen.getByRole('link', { name: 'Open door mode' })).toHaveAttribute(
      'href',
      '/venue/door?eventId=neon-nights-afrobeats',
    );
  });
});
