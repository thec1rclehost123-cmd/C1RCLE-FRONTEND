import { describe, expect, it } from 'vitest';

import { safeNextPath } from './safe-next-path';

describe('safeNextPath', () => {
  it('keeps same-origin absolute paths with query strings', () => {
    expect(safeNextPath('/venue/events?month=2026-10')).toBe('/venue/events?month=2026-10');
  });

  it.each([
    null,
    '',
    'venue',
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/\\/evil.example',
    'javascript:alert(1)',
    '/venue\r\nSet-Cookie: x=1',
    '/login',
    '/login?next=/venue',
  ])('rejects %j', (value) => {
    expect(safeNextPath(value)).toBeNull();
  });
});
