import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { HostAvailabilityScreen } from './HostAvailabilityScreen';

vi.mock('next/navigation', () => ({
  usePathname: () => '/partner/host/calendar',
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    CheckIcon: Icon,
    EmptyDateIcon: Icon,
    LocationIcon: Icon,
    LockedIcon: Icon,
    NextIcon: Icon,
    PreviousIcon: Icon,
    TimeIcon: Icon,
  };
});

describe('HostAvailabilityScreen', () => {
  it('explains that unavailable dates have no requestable slots', async () => {
    const data = await fixturePartnerDataSource.getHostAvailability();
    render(<HostAvailabilityScreen data={data} initialMonth="2026-11" />);

    expect(screen.getByText(/grey dates have no open slots for requests/i)).toBeInTheDocument();
    expect(screen.queryByText(/grey dates are already taken/i)).not.toBeInTheDocument();
  });
});
