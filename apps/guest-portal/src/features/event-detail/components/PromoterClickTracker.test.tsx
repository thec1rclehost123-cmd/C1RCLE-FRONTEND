import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PromoterClickTracker, readPromoterReferralContext } from './PromoterClickTracker';

interface ClickRequestOptions {
  path: string;
  body: { eventSlug: string; code: string; clickId: string };
  schema: unknown;
}

interface ClickApiClient {
  post(options: ClickRequestOptions): Promise<{ accepted: true }>;
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
    clickApi.postMock.mockResolvedValue({ accepted: true });
    clickApi.getApiClientMock.mockReturnValue({ post: clickApi.postMock });
  });

  it('renders nothing', () => {
    const { container } = render(<PromoterClickTracker eventSlug="summer-fest" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not track when no code is provided', () => {
    render(<PromoterClickTracker eventSlug="summer-fest" />);
    expect(window.sessionStorage.getItem('c1rcle-promoter-referral-context')).toBeNull();
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
    expect(calledOptions?.body.clickId).toMatch(/^[0-9a-f-]{36}$/iu);
    expect(calledOptions?.schema).toBeDefined();
    expect(readPromoterReferralContext('summer-fest')).toBe('SPR-123');
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
    expect(readPromoterReferralContext('summer-fest')).toBe('B');
  });

  it('suppresses duplicate effect delivery for the same event and code in one session', async () => {
    const first = render(<PromoterClickTracker eventSlug="summer-fest" code="SPR-123" />);
    await waitFor(() => {
      expect(clickApi.postMock).toHaveBeenCalledTimes(1);
    });
    first.unmount();

    render(<PromoterClickTracker eventSlug="summer-fest" code="SPR-123" />);
    await Promise.resolve();

    expect(clickApi.postMock).toHaveBeenCalledTimes(1);
  });

  it('keeps referral context after the privacy preserving click acknowledgment', async () => {
    window.history.replaceState({}, '', '/event/summer-fest?ref=BAD');
    render(<PromoterClickTracker eventSlug="summer-fest" code="BAD" />);

    await waitFor(() => {
      expect(readPromoterReferralContext('summer-fest')).toBe('BAD');
    });
    expect(window.location.search).toBe('?ref=BAD');
  });

  it('only returns fresh context for the matching event', () => {
    window.sessionStorage.setItem(
      'c1rcle-promoter-referral-context',
      JSON.stringify({ eventSlug: 'summer-fest', code: 'GOOD', capturedAt: Date.now() }),
    );
    expect(readPromoterReferralContext('other-event')).toBeNull();
    expect(window.sessionStorage.getItem('c1rcle-promoter-referral-context')).toBeNull();
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
