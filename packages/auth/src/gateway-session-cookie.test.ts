import { describe, expect, it } from 'vitest';

import { withGatewaySessionCookieName } from './gateway-session-cookie.js';

describe('withGatewaySessionCookieName', () => {
  it('adds the __Secure- twin with the same value, keeping every other cookie', () => {
    const out = withGatewaySessionCookieName(
      'c1rcle.active-org=org_1; better-auth.session_token=tok.sig%3D; partner.c1rcle.csrf=c',
    );
    expect(out).toBe(
      'c1rcle.active-org=org_1; better-auth.session_token=tok.sig%3D; partner.c1rcle.csrf=c; __Secure-better-auth.session_token=tok.sig%3D',
    );
  });

  it('matches the cookie when it is the first one in the header', () => {
    expect(withGatewaySessionCookieName('better-auth.session_token=abc')).toBe(
      'better-auth.session_token=abc; __Secure-better-auth.session_token=abc',
    );
  });

  it('leaves a header that already has the prefixed cookie untouched', () => {
    const header = '__Secure-better-auth.session_token=abc; x=1';
    expect(withGatewaySessionCookieName(header)).toBe(header);
  });

  it('leaves a header with no session cookie untouched', () => {
    expect(withGatewaySessionCookieName('c1rcle.active-org=org_1')).toBe('c1rcle.active-org=org_1');
    expect(withGatewaySessionCookieName('')).toBe('');
  });

  it('does not treat a cookie that merely ends in the session name as the session', () => {
    const header = 'x-better-auth.session_token=abc';
    expect(withGatewaySessionCookieName(header)).toBe(header);
  });
});
