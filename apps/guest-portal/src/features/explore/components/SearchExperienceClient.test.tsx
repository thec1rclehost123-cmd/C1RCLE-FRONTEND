import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SearchExperienceClient } from './SearchExperienceClient';

import type { EventDto, VenueDto } from '@c1rcle/contracts';

const mockSearchGet = vi.hoisted(() => vi.fn());
vi.mock('@c1rcle/api-client', () => ({ createApiClient: () => ({ get: mockSearchGet }) }));

const ENDED_EVENT: EventDto = {
  id: 'evt_ended',
  organizationId: 'org_1',
  venueId: 'ven_1',
  slug: 'ended-night',
  title: 'Ended Night',
  summary: '',
  description: 'Historical details stay available.',
  imageUrl: 'https://storage.googleapis.com/c1rcle/poster.webp',
  startAt: '2026-10-01T18:00:00.000Z',
  endAt: '2026-10-01T22:00:00.000Z',
  status: 'ended',
  salesStatus: 'ended',
  visibilityMode: 'public',
  addressDisclosure: 'public',
  isPublic: true,
  tags: ['Music'],
  startingPricePaise: 5_000,
  activeStartingPricePaise: null,
  currentStartingPricePaise: null,
  isFree: false,
  cancellationReason: null,
  version: 2,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-10-02T00:00:00.000Z',
};

const VENUE: VenueDto = {
  id: 'ven_1',
  organizationId: 'org_1',
  name: 'Sky Bar',
  slug: 'sky-bar',
  status: 'active',
  description: '',
  capacity: null,
  city: 'Pune',
  version: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('SearchExperienceClient', () => {
  it('searches the public catalog so historical ended events remain discoverable', async () => {
    mockSearchGet.mockImplementation(({ path }: { path: string }) => {
      if (path === '/api/v2/public/search') {
        return Promise.resolve({
          items: [ENDED_EVENT],
          pageInfo: { page: 1, pageSize: 100, total: 1, hasNextPage: false },
        });
      }
      if (path.endsWith('/venues/by-id/ven_1')) return Promise.resolve(VENUE);
      throw new Error(`Unexpected request: ${path}`);
    });
    window.history.replaceState(null, '', '/search');
    render(<SearchExperienceClient events={[]} cities={[]} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Ended Night' } });

    const title = await screen.findByText('Ended Night', { selector: 'h3' });
    expect(title.closest('a')).toHaveAttribute('href', '/event/ended-night');
    expect(title.closest('a')).toHaveAccessibleName(/Event ended/);
    expect(mockSearchGet).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/public/search',
        query: { q: 'Ended Night', limit: 100 },
      }),
    );
    mockSearchGet.mockReset();
  });

  it('preserves the search query in the reloadable URL and removes it when cleared', () => {
    window.history.replaceState(null, '', '/search');
    render(<SearchExperienceClient events={[]} cities={[]} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'M15-CROSS' } });
    expect(new URLSearchParams(window.location.search).get('q')).toBe('M15-CROSS');
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear search' })[0]!);
    expect(new URLSearchParams(window.location.search).has('q')).toBe(false);
  });
  it('keeps city and weekend selections in the URL for reload', () => {
    window.history.replaceState(null, '', '/search?q=night');
    render(
      <SearchExperienceClient
        events={[]}
        cities={[{ value: 'pune', label: 'Pune' }]}
        initialQuery="night"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /^Pune$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'This weekend' }));
    const params = new URLSearchParams(window.location.search);
    expect(params.get('city')).toBe('pune');
    expect(params.get('date')).toBe('weekend');
    expect(params.get('q')).toBe('night');
  });

  it('restores quick filters from server-parsed URL values', () => {
    window.history.replaceState(null, '', '/search?city=pune&date=weekend');
    render(
      <SearchExperienceClient
        events={[]}
        cities={[{ value: 'pune', label: 'Pune' }]}
        initialCity="pune"
        initialWeekend
      />,
    );
    expect(screen.getByRole('button', { name: /^Pune$/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'This weekend' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
