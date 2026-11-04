import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { ConnectedPartnerGuestsIndexScreen } from './ConnectedPartnerGuestsIndexScreen';

describe('ConnectedPartnerGuestsIndexScreen', () => {
  it('links each real event selection to its tenant-scoped attendee roster', async () => {
    const data = await fixturePartnerDataSource.getVenueEvents();
    render(<ConnectedPartnerGuestsIndexScreen data={data} studio="venue" />);

    expect(screen.getByRole('heading', { name: 'Guests' })).toBeInTheDocument();
    const firstEvent = data.events[0];
    if (!firstEvent) throw new Error('fixture must include an event');
    expect(screen.getByRole('link', { name: new RegExp(firstEvent.name) })).toHaveAttribute(
      'href',
      `/partner/venue/events/${firstEvent.id}/guests`,
    );
  });
});
