import { afterEach, describe, expect, it } from 'vitest';

import { csrfHeaders } from './csrf';

afterEach(() => {
  document.cookie = 'guest.c1rcle.csrf=; path=/; max-age=0';
  document.cookie = 'partner.c1rcle.csrf=; path=/; max-age=0';
  document.cookie = 'admin.c1rcle.csrf=; path=/; max-age=0';
});

describe('csrfHeaders', () => {
  it('selects the Guest Portal token when other localhost app tokens exist', () => {
    document.cookie = 'partner.c1rcle.csrf=partner-token; path=/';
    document.cookie = 'admin.c1rcle.csrf=admin-token; path=/';
    document.cookie = 'guest.c1rcle.csrf=guest-token; path=/';

    expect(csrfHeaders()).toEqual({ 'x-csrf-token': 'guest-token' });
  });

  it('does not invent a header when the Guest Portal has no token', () => {
    document.cookie = 'partner.c1rcle.csrf=partner-token; path=/';

    expect(csrfHeaders()).toEqual({});
  });
});
