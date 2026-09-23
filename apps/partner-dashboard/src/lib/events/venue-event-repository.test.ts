import { beforeEach, describe, expect, it, vi } from 'vitest';

import { uploadToSignedUrl } from '@/lib/onboarding/uploadToSignedUrl';

import { eventEndAtFromDraft, eventStartAtFromDraft, publishVenueEvent } from './venue-event-repository';

import type { EventEditorDraft } from '@/data/partner-data-source';

interface PostOptions {
  readonly path: string;
  readonly body?: unknown;
  readonly headers?: Readonly<Record<string, string>>;
}
interface PatchOptions extends PostOptions {
  readonly body?: unknown;
}

const mocks = vi.hoisted(() => ({
  post: vi.fn<(options: PostOptions) => Promise<unknown>>(),
  patch: vi.fn<(options: PatchOptions) => Promise<unknown>>(),
}));

vi.mock('@/lib/api/client', () => ({ apiClient: { post: mocks.post, patch: mocks.patch } }));
vi.mock('@/lib/onboarding/uploadToSignedUrl', () => ({
  uploadToSignedUrl: vi.fn((): Promise<string> => Promise.resolve('https://uploads.invalid/mock')),
}));

const draft: EventEditorDraft = {
  name: 'September Night',
  venueId: 'venue_1',
  date: '2026-09-17',
  dateLabel: 'Thu, Sep 17, 2026',
  time: '9:30 PM',
  endTime: '3:00 AM',
  genres: ['House'],
  artists: ['Artist One'],
  artwork: { type: 'gradient', value: 'sunset' },
  ticketTiers: [{ id: 'ga', name: 'General Admission', price: 1200, quantity: 250 }],
  selectedPromoterIds: [],
  tableType: 'none',
  promoCodes: [],
  pricingRule: '',
  compensation: 'standard',
  commissionRate: 15,
  salaryAmount: 0,
  salaryPeriod: 'per_event',
  salaryNotes: '',
};

beforeEach(() => {
  mocks.post.mockReset();
  mocks.patch.mockReset();
});

describe('publishVenueEvent', () => {
  it('creates the event and tiers before review and publish', async () => {
    mocks.post
      .mockResolvedValueOnce({ id: 'evt_1' })
      .mockResolvedValueOnce({ id: 'tier_1' })
      .mockResolvedValueOnce({ id: 'evt_1', status: 'review' })
      .mockResolvedValueOnce({ id: 'evt_1', status: 'published' });

    await expect(publishVenueEvent('org_1', draft)).resolves.toMatchObject({
      id: 'evt_1',
      status: 'published',
    });

    expect(mocks.post).toHaveBeenCalledTimes(4);
    expect(mocks.post.mock.calls.map(([options]) => options.path)).toEqual([
      '/api/v2/organizations/org_1/events',
      '/api/v2/events/evt_1/ticket-tiers',
      '/api/v2/events/evt_1/review',
      '/api/v2/events/evt_1/publish',
    ]);
    expect(mocks.post.mock.calls[0]?.[0].body).toMatchObject({
      venueId: 'venue_1',
      title: 'September Night',
      startAt: '2026-09-17T21:30:00.000Z',
      endAt: '2026-09-18T03:00:00.000Z',
      imageUrl: null,
    });
    expect(mocks.post.mock.calls[1]?.[0].body).toMatchObject({
      name: 'General Admission',
      priceInPaise: 120_000,
      quantity: 250,
    });
    for (const [options] of mocks.post.mock.calls) {
      expect(options.headers).toMatchObject({ 'x-organization-id': 'org_1' });
      expect(options.headers?.['Idempotency-Key']).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it('uploads an uploaded-poster blob and persists its public URL as imageUrl', async () => {
    mocks.post
      .mockResolvedValueOnce({
        uploadUrl: 'memory://uploads/posters/org_1/abc.webp',
        method: 'PUT',
        headers: { 'content-type': 'image/webp' },
        storagePath: 'posters/org_1/abc.webp',
        publicUrl: 'https://uploads.invalid/posters/org_1/abc.webp',
        expiresAt: 2_000_000_000_000,
      })
      .mockResolvedValueOnce({ id: 'evt_2' })
      .mockResolvedValueOnce({ id: 'tier_1' })
      .mockResolvedValueOnce({ id: 'evt_2', status: 'review' })
      .mockResolvedValueOnce({ id: 'evt_2', status: 'published' });

    const uploadedDraft: EventEditorDraft = {
      ...draft,
      artwork: { type: 'image', value: 'blob:http://localhost/poster', alt: 'poster.webp' },
    };
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({
        blob: () => Promise.resolve(new Blob([new Uint8Array([1])], { type: 'image/webp' })),
      } as Response);

    await expect(publishVenueEvent('org_1', uploadedDraft)).resolves.toMatchObject({
      id: 'evt_2',
      status: 'published',
    });

    expect(mocks.post).toHaveBeenCalledTimes(5);
    expect(mocks.post.mock.calls.map(([options]) => options.path)).toEqual([
      '/api/v2/organizations/org_1/poster/upload-url',
      '/api/v2/organizations/org_1/events',
      '/api/v2/events/evt_2/ticket-tiers',
      '/api/v2/events/evt_2/review',
      '/api/v2/events/evt_2/publish',
    ]);
    expect(mocks.post.mock.calls[0]?.[0].body).toEqual({ contentType: 'image/webp' });
    expect(mocks.post.mock.calls[1]?.[0].body).toMatchObject({
      imageUrl: 'https://uploads.invalid/posters/org_1/abc.webp',
    });
    expect(uploadToSignedUrl).toHaveBeenCalledWith(
      expect.any(String),
      { 'content-type': 'image/webp' },
      expect.any(File),
    );
    expect(fetchMock).toHaveBeenCalledWith('blob:http://localhost/poster');

    fetchMock.mockRestore();
  });

  it('resolves custom commission rates from local tier ids to server tier ids', async () => {
    const customDraft: EventEditorDraft = {
      ...draft,
      selectedPromoterIds: ['promoter_1'],
      compensation: 'custom',
      tierCommissions: { ga: 25 },
    };
    mocks.post
      .mockResolvedValueOnce({
        id: 'evt_custom',
        version: 1,
        compensation: {
          model: 'custom',
          globalRatePercent: null,
          tierRates: { ga: 25 },
          salaryAmountPaise: null,
          salaryPeriod: null,
          salaryNotes: null,
        },
      })
      .mockResolvedValueOnce({ id: 'tier_server_1' })
      .mockResolvedValueOnce({ id: 'assignment_1' })
      .mockResolvedValueOnce({ id: 'evt_custom', status: 'review' })
      .mockResolvedValueOnce({ id: 'evt_custom', status: 'published' });
    mocks.patch.mockResolvedValueOnce({ id: 'evt_custom', version: 2 });

    await expect(publishVenueEvent('org_1', customDraft)).resolves.toMatchObject({
      status: 'published',
    });

    expect(mocks.patch).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/events/evt_custom',
        body: expect.objectContaining({
          compensation: expect.objectContaining({
            tierRates: { tier_server_1: 25 },
          }),
        }),
        headers: expect.objectContaining({ 'If-Match': '1' }),
      }),
    );
    expect(mocks.post.mock.calls[2]?.[0].body).toMatchObject({
      promoterId: 'promoter_1',
      tierRates: { tier_server_1: { ratePercent: 25, flatPaise: 0 } },
    });
  });

  it('sends salary amount in paise with an explicit payout period', async () => {
    const salaryDraft: EventEditorDraft = {
      ...draft,
      selectedPromoterIds: ['promoter_1'],
      compensation: 'salary',
      salaryAmount: 1250.5,
      salaryPeriod: 'per_event',
    };
    mocks.post
      .mockResolvedValueOnce({ id: 'evt_salary' })
      .mockResolvedValueOnce({ id: 'tier_salary' })
      .mockResolvedValueOnce({ id: 'assignment_salary' })
      .mockResolvedValueOnce({ id: 'evt_salary', status: 'review' })
      .mockResolvedValueOnce({ id: 'evt_salary', status: 'published' });

    await expect(publishVenueEvent('org_1', salaryDraft)).resolves.toMatchObject({
      status: 'published',
    });
    expect(mocks.post.mock.calls[0]?.[0].body).toMatchObject({
      compensation: {
        model: 'salary',
        salaryAmountPaise: 125050,
        salaryPeriod: 'per_event',
        globalRatePercent: null,
        tierRates: {},
      },
    });
  });

  it('persists relative poster image paths as valid absolute URLs', async () => {
    mocks.post
      .mockResolvedValueOnce({ id: 'evt_3' })
      .mockResolvedValueOnce({ id: 'tier_1' })
      .mockResolvedValueOnce({ id: 'evt_3', status: 'review' })
      .mockResolvedValueOnce({ id: 'evt_3', status: 'published' });

    const relativeDraft: EventEditorDraft = {
      ...draft,
      artwork: { type: 'image', value: '/partner-v3/venue/neon-nights-poster.jpg', alt: 'Neon' },
    };

    await expect(publishVenueEvent('org_1', relativeDraft)).resolves.toMatchObject({
      id: 'evt_3',
      status: 'published',
    });

    expect(mocks.post.mock.calls[0]?.[0].body).toMatchObject({
      imageUrl: expect.stringMatching(/^http:\/\/.+\/partner-v3\/venue\/neon-nights-poster\.jpg$/),
    });
  });
});

describe('eventStartAtFromDraft', () => {
  it('parses twelve-hour and twenty-four-hour start times', () => {
    expect(eventStartAtFromDraft({ date: '2026-09-17', time: '9:30 PM' })).toBe(
      '2026-09-17T21:30:00.000Z',
    );
    expect(eventStartAtFromDraft({ date: '2026-09-17', time: '21:30' })).toBe(
      '2026-09-17T21:30:00.000Z',
    );
  });

  it('rejects invalid calendar dates and times', () => {
    expect(eventStartAtFromDraft({ date: '2026-02-30', time: '9:30 PM' })).toBeNull();
    expect(eventStartAtFromDraft({ date: '2026-09-17', time: 'night' })).toBeNull();
  });
});

describe('eventEndAtFromDraft', () => {
  it('parses explicit endTime and handles overnight span', () => {
    expect(
      eventEndAtFromDraft({ date: '2026-09-17', time: '9:30 PM', endTime: '3:00 AM' }),
    ).toBe('2026-09-18T03:00:00.000Z');
    expect(
      eventEndAtFromDraft({ date: '2026-09-17', time: '18:00', endTime: '23:00' }),
    ).toBe('2026-09-17T23:00:00.000Z');
  });

  it('parses time range string when endTime is absent', () => {
    expect(
      eventEndAtFromDraft({ date: '2026-09-17', time: '9:00 PM - 3:00 AM' }),
    ).toBe('2026-09-18T03:00:00.000Z');
  });

  it('returns null when no end time is present or invalid', () => {
    expect(eventEndAtFromDraft({ date: '2026-09-17', time: '9:30 PM' })).toBeNull();
  });
});
