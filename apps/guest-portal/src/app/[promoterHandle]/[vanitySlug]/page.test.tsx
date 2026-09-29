import { beforeEach, describe, expect, it, vi } from 'vitest';

import PromoterVanityLinkPage from './page';

interface ResolutionRequestOptions {
  path: string;
  schema: unknown;
}

interface ResolutionApiClient {
  get(options: ResolutionRequestOptions): Promise<{ eventSlug: string; code: string }>;
}

const resolutionApi = vi.hoisted(() => ({
  getMock: vi.fn<ResolutionApiClient['get']>(),
  redirectMock: vi.fn<() => never>(),
  notFoundMock: vi.fn<() => never>(),
}));

vi.mock('@c1rcle/api-client', () => ({
  createApiClient: () => ({ get: resolutionApi.getMock }),
}));

vi.mock('next/navigation', () => ({
  redirect: resolutionApi.redirectMock,
  notFound: resolutionApi.notFoundMock,
}));

describe('PromoterVanityLinkPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // next/navigation's real redirect()/notFound() throw; emulate that so the
    // page's call sites behave like production.
    resolutionApi.redirectMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
    resolutionApi.notFoundMock.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });
  });

  const pageCall = () =>
    PromoterVanityLinkPage({
      params: Promise.resolve({ promoterHandle: 'jane doe', vanitySlug: 'ok' }),
    });

  it('resolves the vanity link and redirects to the event with the referral code', async () => {
    resolutionApi.getMock.mockResolvedValue({ eventSlug: 'my event', code: 'SPR 123' });

    await expect(pageCall()).rejects.toThrow('NEXT_REDIRECT');

    const calledOptions = resolutionApi.getMock.mock.calls[0]?.[0];
    expect(calledOptions).toBeDefined();
    expect(calledOptions).toMatchObject({
      path: '/api/v2/public/promoter-links/jane%20doe/ok',
    });
    expect(calledOptions?.schema).toBeDefined();
    expect(resolutionApi.redirectMock).toHaveBeenCalledWith('/event/my%20event?ref=SPR%20123');
  });

  it('URL-encodes the resolved slug and code into the redirect target', async () => {
    resolutionApi.getMock.mockResolvedValue({ eventSlug: 'a/b?c=d', code: 'x&y' });

    await expect(pageCall()).rejects.toThrow('NEXT_REDIRECT');

    expect(resolutionApi.redirectMock).toHaveBeenCalledWith('/event/a%2Fb%3Fc%3Dd?ref=x%26y');
  });

  it('serves notFound when the vanity link cannot be resolved', async () => {
    resolutionApi.getMock.mockRejectedValueOnce(new Error('network'));

    await expect(pageCall()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(resolutionApi.notFoundMock).toHaveBeenCalled();
    expect(resolutionApi.redirectMock).not.toHaveBeenCalled();
  });
});
