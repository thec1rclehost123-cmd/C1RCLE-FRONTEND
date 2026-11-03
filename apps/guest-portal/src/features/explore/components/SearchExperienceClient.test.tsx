import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SearchExperienceClient } from './SearchExperienceClient';

describe('SearchExperienceClient', () => {
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
