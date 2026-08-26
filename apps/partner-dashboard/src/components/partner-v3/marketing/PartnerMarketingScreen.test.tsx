import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { PartnerMarketingScreen } from './PartnerMarketingScreen';

const navigation = vi.hoisted(() => ({ query: '' }));
const replace = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/partner/venue/marketing',
  useRouter: () => ({ replace, push }),
  useSearchParams: () => {
    const params = new URLSearchParams(navigation.query);
    return { get: (key: string) => params.get(key), toString: () => params.toString() };
  },
}));

describe('PartnerMarketingScreen', () => {
  beforeEach(() => {
    navigation.query = '';
    replace.mockReset();
    push.mockReset();
  });

  it('renders Venue attendee targeting and opens a WhatsApp broadcast for selected guests', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getVenueMarketing();
    render(<PartnerMarketingScreen data={data} />);

    expect(screen.getByRole('heading', { name: 'Marketing' })).toBeInTheDocument();
    expect(screen.getByText('Aisha Menon')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Select Aisha Menon' }));
    expect(screen.getByText('Attendees selected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Start WhatsApp Campaign/ }));

    expect(push).toHaveBeenCalledWith('/partner/venue/marketing?view=compose&broadcast=1&messageChannel=whatsapp', { scroll: false });
  });

  it('keeps search and event filters URL-backed', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getVenueMarketing();
    render(<PartnerMarketingScreen data={data} />);

    const search = screen.getByPlaceholderText('Search attendee, email or phone...');
    await user.clear(search);
    await user.type(search, 'Aisha');
    expect(replace).toHaveBeenLastCalledWith('/partner/venue/marketing?search=Aisha', { scroll: false });
    navigation.query = 'search=Aisha';
    await user.click(screen.getByRole('button', { name: /All Events/ }));
    await user.click(screen.getByRole('button', { name: /Bollywood Brunch/ }));
    expect(replace).toHaveBeenLastCalledWith('/partner/venue/marketing?search=Aisha&event=bollywood-brunch', { scroll: false });
  });

  it('uses Host partnered-event language and keeps delivery actions unavailable', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getHostMarketing();
    navigation.query = 'composer=1';
    render(<PartnerMarketingScreen data={data} />);

    expect(screen.getByText('Guests at Neon Nights: Afrobeats · Skyline Rooftop')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send to/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'WhatsApp' }));
    expect(replace).toHaveBeenCalledWith('/partner/venue/marketing?composer=1&messageChannel=whatsapp', { scroll: false });
  });
});
