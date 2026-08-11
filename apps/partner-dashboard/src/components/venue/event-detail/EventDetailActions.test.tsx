import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventDetailActions } from './EventDetailActions';

const mocks = vi.hoisted(() => ({
  canDo: vi.fn<(action: string) => boolean>(),
  go: vi.fn(),
  openEdit: vi.fn(),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return { DoorModeIcon: Icon, EditIcon: Icon };
});
vi.mock('@/components/providers/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({ canDo: mocks.canDo }),
}));
vi.mock('../store', () => ({
  useVenueStudio: () => ({ go: mocks.go, openEdit: mocks.openEdit }),
}));

describe('EventDetailActions', () => {
  beforeEach(() => {
    mocks.canDo.mockReset();
  });

  it('omits actions that the current membership cannot perform', () => {
    mocks.canDo.mockReturnValue(false);
    render(<EventDetailActions eventName="Neon Nights: Afrobeats" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders both approved event actions for an authorized membership', () => {
    mocks.canDo.mockReturnValue(true);
    render(<EventDetailActions eventName="Neon Nights: Afrobeats" />);

    expect(screen.getByRole('button', { name: 'Edit event' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open door mode' })).toBeInTheDocument();
  });
});
