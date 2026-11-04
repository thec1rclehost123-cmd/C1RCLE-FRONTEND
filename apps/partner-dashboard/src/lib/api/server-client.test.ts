import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { createServerApiClient } from './server-client';

vi.mock('server-only', () => ({}));

const inner = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@c1rcle/api-client', () => ({
  createApiClient: () => inner,
}));

const schema = z.object({ ok: z.boolean() });

describe('createServerApiClient', () => {
  beforeEach(() => {
    inner.get.mockReset().mockResolvedValue({ ok: true });
    inner.post.mockReset().mockResolvedValue({ ok: true });
  });

  it('forwards the session cookie under both names, so a production gateway sees it', async () => {
    const client = createServerApiClient('c1rcle.active-org=o1; better-auth.session_token=tok');
    await client.get({ path: '/api/v2/organizations/o1/access', schema });

    const sent = inner.get.mock.calls[0]?.[0] as { headers: { cookie: string } };
    expect(sent.headers.cookie).toContain('better-auth.session_token=tok');
    expect(sent.headers.cookie).toContain('__Secure-better-auth.session_token=tok');
  });

  it('does the same for POST and keeps caller headers', async () => {
    const client = createServerApiClient('better-auth.session_token=tok');
    await client.post({
      path: '/api/v2/x',
      schema,
      body: {},
      headers: { 'x-organization-id': 'o1' },
    });

    const sent = inner.post.mock.calls[0]?.[0] as { headers: Record<string, string> };
    expect(sent.headers['x-organization-id']).toBe('o1');
    expect(sent.headers['cookie']).toContain('__Secure-better-auth.session_token=tok');
  });

  it('sends no cookie header at all when the request had no cookies', async () => {
    const client = createServerApiClient('');
    await client.get({ path: '/api/v2/x', schema });

    const sent = inner.get.mock.calls[0]?.[0] as { headers?: Record<string, string> };
    expect(sent.headers).toBeUndefined();
  });
});
