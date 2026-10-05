import { describe, expect, it } from 'vitest';

import { safeNextPath } from './safe-next-path';

describe('safeNextPath', () => {
  it('keeps same-origin paths with query strings', () => {
    expect(safeNextPath('/tickets')).toBe('/tickets');
    expect(safeNextPath('/checkout?event=e1')).toBe('/checkout?event=e1');
  });

  it.each([
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    'tickets',
    '/a\nb',
    '/login',
    '/login?next=/x',
  ])('rejects %j', (raw) => {
    expect(safeNextPath(raw)).toBe('/profile');
  });

  it('falls back for missing input', () => {
    expect(safeNextPath(null)).toBe('/profile');
    expect(safeNextPath(undefined, '/')).toBe('/');
    expect(safeNextPath('')).toBe('/profile');
  });
});
