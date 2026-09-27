import { describe, expect, it } from 'vitest';

import { getActiveOrgId, getActiveOrgIdFromCookieHeader } from './active-org-cookie';

describe('getActiveOrgIdFromCookieHeader', () => {
  it('reads the active org out of a full cookie header', () => {
    expect(getActiveOrgIdFromCookieHeader('session=abc; c1rcle.active-org=org_1; theme=dark')).toBe(
      'org_1',
    );
  });

  it('reads it when it is the only cookie', () => {
    expect(getActiveOrgIdFromCookieHeader('c1rcle.active-org=org_1')).toBe('org_1');
  });

  it('tolerates the spacing a real header has', () => {
    // Browsers emit "; " but a hand-built header may not, and the position
    // varies. Whitespace around the separator must not matter.
    expect(getActiveOrgIdFromCookieHeader('a=1;c1rcle.active-org=org_1;b=2')).toBe('org_1');
  });

  it('url-decodes the value', () => {
    expect(getActiveOrgIdFromCookieHeader('c1rcle.active-org=org%20one')).toBe('org one');
  });

  it('returns null for an empty header', () => {
    expect(getActiveOrgIdFromCookieHeader('')).toBeNull();
  });

  it('returns null when the cookie is absent', () => {
    expect(getActiveOrgIdFromCookieHeader('session=abc; theme=dark')).toBeNull();
  });

  it('returns null when the cookie has an empty value', () => {
    // The cookie is written with `max-age=0` to clear it, which emits an empty
    // value. An empty org id must read as "no org", never as the literal ''.
    expect(getActiveOrgIdFromCookieHeader('c1rcle.active-org=')).toBeNull();
    expect(getActiveOrgIdFromCookieHeader('c1rcle.active-org=; session=abc')).toBeNull();
  });

  it('ignores a segment that has no separator', () => {
    expect(getActiveOrgIdFromCookieHeader('garbage; c1rcle.active-org=org_1')).toBe('org_1');
  });

  it('does not match a cookie whose name merely ends with the key', () => {
    // Substring matching here would read an unrelated cookie as an org id.
    expect(getActiveOrgIdFromCookieHeader('not-c1rcle.active-org=org_999')).toBeNull();
  });

  it('takes the first occurrence when the cookie is duplicated', () => {
    // Matches browser `document.cookie` ordering, where the first wins.
    expect(getActiveOrgIdFromCookieHeader('c1rcle.active-org=org_1; c1rcle.active-org=org_2')).toBe(
      'org_1',
    );
  });
});

describe('getActiveOrgId', () => {
  it('returns null on the server, where there is no document', () => {
    // This is the guard that keeps a Client-Component-shaped module from
    // silently returning null in a Server Component render.
    expect(getActiveOrgId()).toBeNull();
  });
});
