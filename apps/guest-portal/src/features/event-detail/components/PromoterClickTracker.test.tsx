import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PromoterClickTracker } from './PromoterClickTracker';

interface ClickRequestOptions {
  path: string;
  body: { eventSlug: string; code: string };
  schema: unknown;
}

interface ClickApiClient {
  post(options: ClickRequestOptions): Promise<{ tracked: boolean }>;
}

const clickApi = vi.hoisted(() => ({
  postMock: vi.fn<ClickApiClient['post']>(),
  getApiClientMock: vi.fn<() => ClickApiClient>(),
}));

vi.mock('@c1rcle/api-client', () => ({
  getApiClient: () => clickApi.getApiClientMock(),
}));

describe('PromoterClickTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    clickApi.postMock.mockResolvedValue({ tracked: true });
    clickApi.getApiClientMock.mockReturnValue({ post: clickApi.postMock });
  });

  it('renders nothing', () => {
    const { container } = render(<PromoterClickTracker eventSlug="summer-fest" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not track when no code is provided', () => {
    render(<PromoterClickTracker eventSlug="summer-fest" />);
    expect(window.sessionStorage.getItem('c1rcle-promoter-referral-code')).toBeNull();
    expect(clickApi.postMock).not.toHaveBeenCalled();
  });

  it('stores the referral code and reports the click when a code is present', async () => {
    render(<PromoterClickTracker eventSlug="summer-fest" code="SPR-123" />);

    await waitFor(() => {
      expect(clickApi.postMock).toHaveBeenCalledTimes(1);
    });

    const calledOptions = clickApi.postMock.mock.calls[0]?.[0];
    expect(calledOptions).toBeDefined();
    expect(calledOptions).toMatchObject({
      path: '/api/v2/public/promoter-links/click',
      body: { eventSlug: 'summer-fest', code: 'SPR-123' },
    });
    expect(calledOptions?.schema).toBeDefined();
    expect(window.sessionStorage.getItem('c1rcle-promoter-referral-code')).toBe('SPR-123');
  });

  it('re-tracks when the referral code changes', async () => {
    const { rerender } = render(<PromoterClickTracker eventSlug="summer-fest" code="A" />);
    await waitFor(() => {
      expect(clickApi.postMock).toHaveBeenCalledTimes(1);
    });

    rerender(<PromoterClickTracker eventSlug="summer-fest" code="B" />);

    await waitFor(() => {
      expect(clickApi.postMock).toHaveBeenCalledTimes(2);
    });
    expect(window.sessionStorage.getItem('c1rcle-promoter-referral-code')).toBe('B');
  });

  it('swallows failed click requests so a dead endpoint cannot break browsing', async () => {
    clickApi.postMock.mockRejectedValueOnce(new Error('network'));
    const { container } = render(<PromoterClickTracker eventSlug="summer-fest" code="SPR-123" />);

    await waitFor(() => {
      expect(clickApi.postMock).toHaveBeenCalledTimes(1);
    });
    await Promise.resolve();

    expect(container).toBeEmptyDOMElement();
  });
});
