import { expect, it } from 'vitest';

import { guestContinuePath, guestDestination } from '@/lib/auth/continue-path';
import { isGuestProtectedPath } from '@/lib/auth/protected-path';

import { savedEventReturnPath, trustedSavedEventDestination } from './return-intent';

it('keeps Save intent protected through the existing auth/verification/onboarding continuation', () => {
  const next = savedEventReturnPath('night-a', '?source=saved-check');
  expect(isGuestProtectedPath(next)).toBe(true);
  expect(guestDestination(next)).toBe(next);
  expect(guestContinuePath(next)).toBe(`/auth/continue?next=${encodeURIComponent(next)}`);
  expect(
    trustedSavedEventDestination(
      new URL(next, 'https://example.invalid').searchParams.get('event') ?? undefined,
    ),
  ).toBe('/event/night-a?source=saved-check');
});
it.each([
  'https://outside.invalid',
  '//outside.invalid',
  '/profile/guest-b',
  '/event/../profile',
  '/event/%2f%2foutside.invalid',
])('rejects unsafe or unrelated return destination %s', (value) => {
  expect(trustedSavedEventDestination(value)).toBe('/explore');
});

it('fails closed on repeated or non-text destination parameters', () => {
  expect(trustedSavedEventDestination(['/event/night-a', '//outside.invalid'])).toBe('/explore');
  expect(trustedSavedEventDestination(12)).toBe('/explore');
});
