import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@c1rcle/api-client';

import { getMine, saveProgress, start, submit, uploadDocument } from './onboarding-repository';

const apiError = (init: {
  code: ApiClientError['code'];
  message: string;
  status: number;
  fieldErrors?: Record<string, string[]>;
}) => new ApiClientError({ requestId: undefined, fieldErrors: undefined, ...init });

interface Options {
  readonly path: string;
  readonly query?: Record<string, string>;
  readonly body?: unknown;
  readonly rawBody?: unknown;
  readonly contentType?: string;
  readonly headers?: Readonly<Record<string, string>>;
}

const mocks = vi.hoisted(() => ({
  apiPost: vi.fn<(o: Options) => Promise<unknown>>(),
  apiPatch: vi.fn<(o: Options) => Promise<unknown>>(),
  bffGet: vi.fn<(o: Options) => Promise<unknown>>(),
  bffPost: vi.fn<(o: Options) => Promise<unknown>>(),
}));

vi.mock('@/lib/api/client', () => ({
  apiClient: { post: mocks.apiPost, patch: mocks.apiPatch },
}));
vi.mock('@/lib/bff/bff-client', () => ({
  bffClient: { get: mocks.bffGet, post: mocks.bffPost },
}));
vi.mock('@/lib/onboarding/csrf', () => ({ csrfHeaders: () => ({ 'x-csrf-token': 'csrf-1' }) }));

const dto = (version: number, extra: Record<string, unknown> = {}) => ({
  id: 'req_1',
  userId: 'user_1',
  status: 'draft',
  requestedType: 'venue',
  plan: 'basic',
  profile: { legalName: 'Acme', contactPerson: 'A', phone: '+919876543210', city: 'Pune' },
  documents: [],
  missingDocuments: ['id_front', 'id_back', 'selfie'],
  submittedAt: null,
  reviewedBy: null,
  reviewedAt: null,
  reviewNote: null,
  provisionedOrganizationId: null,
  version,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...extra,
});

const png = () => new File([new Uint8Array([1, 2, 3])], 'id.png', { type: 'image/png' });
const lastHeaders = (fn: typeof mocks.apiPost, call = -1) =>
  fn.mock.calls.at(call)?.[0].headers ?? {};

describe('onboarding repository', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('getMine resumes saved progress and caches the version for the next write', async () => {
    mocks.bffGet.mockResolvedValue({ request: dto(4) });
    const mine = await getMine();
    expect(mine?.id).toBe('req_1');
    expect(mocks.bffGet.mock.calls[0]?.[0].path).toBe('/api/bff/onboarding/me');

    mocks.apiPatch.mockResolvedValue(dto(5));
    await saveProgress('req_1', { city: 'Mumbai' });
    expect(lastHeaders(mocks.apiPatch)).toMatchObject({ 'If-Match': '4' });
  });

  it('getMine returns null before an application exists', async () => {
    mocks.bffGet.mockResolvedValue({ request: null });
    await expect(getMine()).resolves.toBeNull();
  });

  it('start sends the Idempotency-Key and seeds the version', async () => {
    mocks.apiPost.mockResolvedValue(dto(1));
    await start(
      {
        requestedType: 'venue',
        plan: 'basic',
        profile: { legalName: 'Acme', contactPerson: 'A', phone: '+919876543210', city: 'Pune' },
      },
      'idem-start',
    );
    expect(mocks.apiPost.mock.calls[0]?.[0].path).toBe('/api/v2/onboarding/applications');
    expect(lastHeaders(mocks.apiPost)).toMatchObject({ 'Idempotency-Key': 'idem-start' });

    mocks.apiPatch.mockResolvedValue(dto(2));
    await saveProgress('req_1', { bio: 'x' });
    expect(lastHeaders(mocks.apiPatch)).toMatchObject({ 'If-Match': '1' });
  });

  it('uploads a document through the BFF with label, csrf, idempotency key and If-Match', async () => {
    mocks.apiPost.mockResolvedValue(dto(1));
    await start(
      {
        requestedType: 'venue',
        plan: 'basic',
        profile: { legalName: 'Acme', contactPerson: 'A', phone: '+919876543210', city: 'Pune' },
      },
      'k',
    );
    mocks.bffPost.mockResolvedValue(dto(2));
    const file = png();
    await uploadDocument('req_1', 'sig_id_back', file, 'idem-up');

    const call = mocks.bffPost.mock.calls[0]?.[0];
    expect(call?.path).toBe('/api/bff/onboarding/applications/req_1/documents/upload');
    expect(call?.query).toEqual({ label: 'sig_id_back' });
    expect(call?.rawBody).toBe(file);
    expect(call?.contentType).toBe('image/png');
    expect(call?.headers).toMatchObject({
      'x-csrf-token': 'csrf-1',
      'Idempotency-Key': 'idem-up',
      'If-Match': '1',
    });
  });

  it('advances If-Match across upload then submit', async () => {
    mocks.bffGet.mockResolvedValue({ request: dto(7) });
    await getMine();
    mocks.bffPost.mockResolvedValue(dto(8));
    await uploadDocument('req_1', 'id_front', png(), 'u1');
    mocks.apiPost.mockResolvedValue(dto(9, { status: 'submitted' }));
    const submitted = await submit('req_1', 'idem-submit');

    expect(mocks.bffPost.mock.calls[0]?.[0].headers).toMatchObject({ 'If-Match': '7' });
    expect(lastHeaders(mocks.apiPost)).toMatchObject({
      'Idempotency-Key': 'idem-submit',
      'If-Match': '8',
    });
    expect(submitted.status).toBe('submitted');
  });

  it('on 409 re-reads the version and retries once with the SAME idempotency key', async () => {
    mocks.bffGet.mockResolvedValueOnce({ request: dto(3) });
    await getMine();
    mocks.apiPost
      .mockRejectedValueOnce(apiError({ code: 'conflict', message: 'stale', status: 409 }))
      .mockResolvedValueOnce(dto(6, { status: 'submitted' }));
    mocks.bffGet.mockResolvedValueOnce({ request: dto(5) });

    await submit('req_1', 'same-key');

    expect(mocks.apiPost).toHaveBeenCalledTimes(2);
    expect(mocks.apiPost.mock.calls[0]?.[0].headers).toMatchObject({
      'If-Match': '3',
      'Idempotency-Key': 'same-key',
    });
    expect(mocks.apiPost.mock.calls[1]?.[0].headers).toMatchObject({
      'If-Match': '5',
      'Idempotency-Key': 'same-key',
    });
  });

  it('does not swallow a 422 with fieldErrors', async () => {
    mocks.apiPatch.mockRejectedValue(
      apiError({
        code: 'validation',
        message: 'Invalid',
        status: 422,
        fieldErrors: { phone: ['too short'] },
      }),
    );
    await expect(saveProgress('req_x', { phone: '1' })).rejects.toMatchObject({
      status: 422,
      fieldErrors: { phone: ['too short'] },
    });
    expect(mocks.apiPatch).toHaveBeenCalledTimes(1);
  });
});
