import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { buildVenueEventDetailRecord, venueEventDetailFixture } from '../event-detail-model';

import { EventInformationAccordion } from './EventInformationAccordion';

vi.mock('@c1rcle/icons', () => ({ ChevronDownIcon: () => <svg aria-hidden="true" /> }));

const information = buildVenueEventDetailRecord(venueEventDetailFixture).summary?.information;

describe('EventInformationAccordion', () => {
  it('starts collapsed and supports keyboard open and Escape close', async () => {
    const user = userEvent.setup();
    if (!information) throw new Error('Fixture information is required');
    render(<EventInformationAccordion information={information} />);
    const trigger = screen.getByRole('button', { name: /Important event information/ });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('MG Road, Bengaluru, Karnataka')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });
});
