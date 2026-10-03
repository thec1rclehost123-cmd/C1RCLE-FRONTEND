import { describe, expect, it } from 'vitest';

import { relativeTimeLabel, safeNotificationHref } from './notification-format';

describe('safeNotificationHref', () => {
  it('keeps same-origin relative paths', () => {
    expect(safeNotificationHref('/event/rooftop-jazz')).toBe('/event/rooftop-jazz');
  });

  it.each([null, '', 'https://evil.test', '//evil.test/x', '/\\evil.test', 'javascript:alert(1)'])(
    'rejects %s',
    (link) => {
      expect(safeNotificationHref(link)).toBeNull();
    },
  );
});

describe('relativeTimeLabel', () => {
  const now = new Date('2026-10-03T12:00:00.000Z');

  it('formats against the supplied clock', () => {
    expect(relativeTimeLabel('2026-10-03T09:00:00.000Z', now)).toBe('3 hours ago');
    expect(relativeTimeLabel('2026-10-02T12:00:00.000Z', now)).toBe('yesterday');
    expect(relativeTimeLabel('2026-10-03T11:59:40.000Z', now)).toBe('just now');
  });

  it('returns an empty label for an unparseable timestamp', () => {
    expect(relativeTimeLabel('not-a-date', now)).toBe('');
  });
});
