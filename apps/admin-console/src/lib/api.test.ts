import { describe, expect, it, vi } from 'vitest';

import { withIntentKeys } from '@/lib/api';

type Wrapped = ReturnType<typeof withIntentKeys>;

function setup() {
  const request = vi.fn();
  const get = vi.fn().mockResolvedValue('got');
  const wrapped = withIntentKeys({ request, get } as unknown as Wrapped);
  const keyOf = (call: number) =>
    (request.mock.calls[call]?.[0] as { headers: Record<string, string> }).headers[
      'idempotency-key'
    ];
  return { request, get, wrapped, keyOf };
}

const opts = (key: string, body?: unknown) => ({
  path: '/api/v2/admin/onboarding/applications/a1/approve',
  body,
  headers: { 'idempotency-key': key },
  schema: {} as never,
});

describe('withIntentKeys', () => {
  it('reuses the SAME key when the same intent is retried after a failure', async () => {
    const { request, wrapped, keyOf } = setup();
    request.mockRejectedValueOnce(new Error('503')).mockResolvedValueOnce({ ok: true });

    await expect(wrapped.post(opts('k1', { note: 'x' }))).rejects.toThrow('503');
    await wrapped.post(opts('k2', { note: 'x' }));

    expect(keyOf(0)).toBe('k1');
    expect(keyOf(1)).toBe('k1');
    expect(request.mock.calls[1]?.[0]).toMatchObject({ method: 'POST' });
  });

  it('mints a NEW key for the next action after a success', async () => {
    const { request, wrapped, keyOf } = setup();
    request.mockResolvedValue({ ok: true });

    await wrapped.post(opts('k1', { note: 'x' }));
    await wrapped.post(opts('k2', { note: 'x' }));

    expect(keyOf(0)).toBe('k1');
    expect(keyOf(1)).toBe('k2');
  });

  it('treats a changed body (different reject reason) as a new intent', async () => {
    const { request, wrapped, keyOf } = setup();
    request.mockRejectedValue(new Error('network'));

    await expect(wrapped.post(opts('k1', { reason: 'blurry' }))).rejects.toThrow();
    await expect(wrapped.post(opts('k2', { reason: 'expired' }))).rejects.toThrow();

    expect(keyOf(0)).toBe('k1');
    expect(keyOf(1)).toBe('k2');
  });

  it('passes through requests without a key and non-mutating calls', async () => {
    const { request, get, wrapped } = setup();
    request.mockResolvedValue('r');
    await wrapped.delete({ path: '/x', schema: {} as never });
    expect(request.mock.calls[0]?.[0]).toMatchObject({ method: 'DELETE' });
    await expect(wrapped.get({ path: '/y', schema: {} as never })).resolves.toBe('got');
    expect(get).toHaveBeenCalledOnce();
  });
});
