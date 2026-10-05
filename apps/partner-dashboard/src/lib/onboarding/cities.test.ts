import { describe, expect, it } from 'vitest';

import { CITY_NAMES, findCity, resolveKnownCity, searchCities } from './cities';

describe('searchCities', () => {
  it('leads with the metros when the box is empty', () => {
    // An empty list starting at "Aizawl" is correct and useless.
    const results = searchCities('');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((city) => city.tier === 1)).toBe(true);
    expect(results.map((city) => city.name)).toContain('Mumbai');
  });

  it('honours the limit', () => {
    expect(searchCities('', 3)).toHaveLength(3);
    expect(searchCities('a', 2)).toHaveLength(2);
  });

  it('ranks an exact name above a prefix match', () => {
    expect(searchCities('pune')[0]?.name).toBe('Pune');
  });

  it('is case- and whitespace-insensitive', () => {
    expect(searchCities('  PUNE ')[0]?.name).toBe('Pune');
    expect(searchCities('new   delhi')[0]?.name).toBe('Delhi');
  });

  it('finds a city by its alias', () => {
    expect(searchCities('bangalore')[0]?.name).toBe('Bengaluru');
    expect(searchCities('bombay')[0]?.name).toBe('Mumbai');
  });

  it('falls back to substring matches so a partial spelling still lands', () => {
    expect(searchCities('galore').map((city) => city.name)).toContain('Bengaluru');
  });

  it('prefers the lower tier on a tie, so a metro outranks a smaller namesake', () => {
    // "Pu" matches Pune and Puducherry by prefix; Pune is tier 1.
    expect(searchCities('pu')[0]?.name).toBe('Pune');
  });

  it('surfaces state matches, since applicants type the state too', () => {
    expect(searchCities('maharashtra').length).toBeGreaterThan(1);
  });

  it('returns nothing for a query that matches nothing', () => {
    expect(searchCities('zzzzzz')).toEqual([]);
  });
});

describe('findCity', () => {
  it('resolves canonical names and aliases', () => {
    expect(findCity('Pune')?.state).toBe('Maharashtra');
    expect(findCity('poona')?.name).toBe('Pune');
    expect(findCity(' pune ')?.name).toBe('Pune');
  });

  it('returns null for an unknown name rather than inventing an entry', () => {
    expect(findCity('Atlantis')).toBeNull();
    expect(findCity('')).toBeNull();
  });
});

describe('resolveKnownCity', () => {
  it('canonicalises what the backend may already hold', () => {
    // A draft written before this list existed can say "Bangalore"; echoing it
    // back verbatim keeps the applicant able to resubmit.
    expect(resolveKnownCity('Bangalore')).toBe('Bengaluru');
    expect(resolveKnownCity('bangalore')).toBe('Bengaluru');
    expect(resolveKnownCity('Pune')).toBe('Pune');
  });

  it('falls back to the trimmed input for a city it has never heard of', () => {
    expect(resolveKnownCity('  Kremiling  ')).toBe('Kremiling');
  });

  it('returns null only for an empty value', () => {
    expect(resolveKnownCity('')).toBeNull();
    expect(resolveKnownCity('   ')).toBeNull();
  });
});

describe('the list itself', () => {
  it('has no duplicate canonical names', () => {
    const seen = new Set<string>();
    const duplicates = CITY_NAMES.filter((name) => {
      if (seen.has(name)) return true;
      seen.add(name);
      return false;
    });
    expect(duplicates).toEqual([]);
  });

  it('gives every city a state and a tier', () => {
    for (const name of ['Mumbai', 'Bengaluru', 'Aizawl', 'Panaji']) {
      const city = findCity(name);
      expect(city?.state).toBeTruthy();
      expect([1, 2, 3]).toContain(city?.tier);
    }
  });
});
