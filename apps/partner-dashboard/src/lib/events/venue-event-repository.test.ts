/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@c1rcle/api-client';
import { cancelEventSchema, createEventSchema, createTicketTierSchema } from '@c1rcle/contracts';

import { uploadToSignedUrl } from '@/lib/onboarding/uploadToSignedUrl';

import { formatEventDateLabel } from './event-time';
import {
  eventEndAtFromDraft,
  eventStartAtFromDraft,
  cancelPartnerEvent,
  publishVenueEvent,
  updatePartnerEventDetails,
} from './venue-event-repository';

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
  description: 'An intimate test event with live music and late-night dancing.',
  venueId: 'venue_1',
  date: '2026-09-17',
  dateLabel: 'Thu, Sep 17, 2026',
  time: '9:30 PM',
  endTime: '3:00 AM',
  genres: ['House'],
  artists: ['Artist One'],
  artwork: { type: 'gradient', value: 'sunset' },
  ticketTiers: [
    {
      id: 'ga',
      name: 'General Admission',
      price: 1200,
      quantity: 250,
      pricingPhases: [
        {
          id: 'phase-1',
          name: 'General Admission',
          priceInPaise: 120_000,
          startDate: '17-09',
          endDate: '17-09',
          quantity: 250,
        },
      ],
    },
  ],
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
  it('creates a Host event from the accepted reservation using its exact interval and stable retry key', async () => {
    mocks.post
      .mockResolvedValueOnce({ id: 'evt_m3' })
      .mockResolvedValueOnce({ id: 'tier_m3' })
      .mockResolvedValueOnce({ id: 'evt_m3', status: 'review' })
      .mockResolvedValueOnce({ id: 'evt_m3', status: 'published' });
    const reservation = {
      slotRequestId: 'slot_request_m3',
      startAt: '2026-11-06T12:30:00.000Z',
      endAt: '2026-11-06T16:30:00.000Z',
    };
    await publishVenueEvent('org_host_m3', draft, reservation);
    const eventCall = mocks.post.mock.calls[0]?.[0];
    expect(eventCall?.body).toMatchObject({
      slotRequestId: 'slot_request_m3',
      startAt: reservation.startAt,
      endAt: reservation.endAt,
    });
    const keys = mocks.post.mock.calls.map(([options]) => options.headers?.['Idempotency-Key']);
    expect(keys).toEqual([
      'host-slot-slot_request_m3-event',
      'host-slot-slot_request_m3-tier-0',
      'host-slot-slot_request_m3-review',
      'host-slot-slot_request_m3-publish',
    ]);
  });

  it('creates the event and tiers before review and publish', async () => {
    mocks.post
      .mockResolvedValueOnce({ id: 'evt_1' })
      .mockResolvedValueOnce({ id: 'tier_1' })
      .mockResolvedValueOnce({ id: 'evt_1', status: 'review' })
      .mockResolvedValueOnce({ id: 'evt_1', status: 'published' });

    await expect(
      publishVenueEvent('org_1', { ...draft, visibilityMode: 'unlisted' }),
    ).resolves.toMatchObject({
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
      summary: 'An intimate test event with live music and late-night dancing.',
      description: 'An intimate test event with live music and late-night dancing.',
      startAt: '2026-09-17T16:00:00.000Z',
      endAt: '2026-09-17T21:30:00.000Z',
      imageUrl: null,
      visibilityMode: 'unlisted',
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
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
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

describe('updatePartnerEventDetails', () => {
  it('uses tenant scope, optimistic versioning, and an idempotency key', async () => {
    mocks.patch.mockResolvedValueOnce({ id: 'evt_1', version: 8, title: 'Updated title' });

    await expect(
      updatePartnerEventDetails('org_1', 'evt_1', 7, {
        title: 'Updated title',
        summary: 'Updated summary',
        description: 'Updated description',
      }),
    ).resolves.toMatchObject({ version: 8, title: 'Updated title' });

    expect(mocks.patch).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/events/evt_1',
        body: {
          title: 'Updated title',
          summary: 'Updated summary',
          description: 'Updated description',
        },
        headers: expect.objectContaining({
          'x-organization-id': 'org_1',
          'If-Match': '7',
        }),
      }),
    );
    expect(mocks.patch.mock.calls[0]?.[0].headers?.['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('eventStartAtFromDraft', () => {
  it('converts twelve-hour and twenty-four-hour venue times from IST into UTC instants', () => {
    expect(eventStartAtFromDraft({ date: '2026-09-17', time: '9:30 PM' })).toBe(
      '2026-09-17T16:00:00.000Z',
    );
    expect(eventStartAtFromDraft({ date: '2026-09-17', time: '21:30' })).toBe(
      '2026-09-17T16:00:00.000Z',
    );
  });

  it('rejects invalid calendar dates and times', () => {
    expect(eventStartAtFromDraft({ date: '2026-02-30', time: '9:30 PM' })).toBeNull();
    expect(eventStartAtFromDraft({ date: '2026-09-17', time: 'night' })).toBeNull();
  });
});

describe('formatEventDateLabel', () => {
  it('keeps the accepted calendar date stable across the host machine timezone', () => {
    expect(formatEventDateLabel('2026-11-06', 'Asia/Kolkata')).toBe('6 Nov 2026');
  });

  it('rejects invalid date-only input', () => {
    expect(formatEventDateLabel('2026-02-30', 'Asia/Kolkata')).toBe('');
  });
});

describe('eventEndAtFromDraft', () => {
  it('parses explicit endTime and handles overnight span', () => {
    expect(eventEndAtFromDraft({ date: '2026-09-17', time: '9:30 PM', endTime: '3:00 AM' })).toBe(
      '2026-09-17T21:30:00.000Z',
    );
    expect(eventEndAtFromDraft({ date: '2026-09-17', time: '18:00', endTime: '23:00' })).toBe(
      '2026-09-17T17:30:00.000Z',
    );
  });

  it('parses time range string when endTime is absent', () => {
    expect(eventEndAtFromDraft({ date: '2026-09-17', time: '9:00 PM - 3:00 AM' })).toBe(
      '2026-09-17T21:30:00.000Z',
    );
  });

  it('returns null when no end time is present or invalid', () => {
    expect(eventEndAtFromDraft({ date: '2026-09-17', time: '9:30 PM' })).toBeNull();
  });
});

describe('publishVenueEvent contract and error handling', () => {
  it('sends bodies that satisfy the backend create-event and RSVP/paid tier contracts', async () => {
    mocks.post
      .mockResolvedValueOnce({ id: 'evt_1' })
      .mockResolvedValueOnce({ id: 'tier_paid' })
      .mockResolvedValueOnce({ id: 'tier_rsvp' })
      .mockResolvedValueOnce({ id: 'evt_1' })
      .mockResolvedValueOnce({ id: 'evt_1' });

    await publishVenueEvent('org_1', {
      ...draft,
      ticketTiers: [
        {
          ...draft.ticketTiers[0]!,
          quantity: 90,
          guestCount: 3,
          admissionMode: 'per_person',
          accessMode: 'code',
        },
        { id: 'rsvp', name: 'Guest list', price: 0, quantity: 50, accessType: 'RSVP' },
      ],
    });

    expect(createEventSchema.safeParse(mocks.post.mock.calls[0]?.[0].body).success).toBe(true);
    const paid = createTicketTierSchema.safeParse(mocks.post.mock.calls[1]?.[0].body);
    const rsvp = createTicketTierSchema.safeParse(mocks.post.mock.calls[2]?.[0].body);
    expect(paid.success).toBe(true);
    expect(rsvp.success).toBe(true);
    expect(mocks.post.mock.calls[1]?.[0].body).toMatchObject({
      quantity: 90,
      guestCount: 3,
      admissionMode: 'per_person',
      accessMode: 'code',
    });
    const rsvpBody = mocks.post.mock.calls[2]?.[0].body as Record<string, unknown>;
    expect(rsvpBody).not.toHaveProperty('priceInPaise');
    expect(rsvpBody).not.toHaveProperty('pricingPhases');
    expect(rsvpBody).not.toHaveProperty('doorPriceInPaise');
  });

  it('propagates a 422 from the gateway and never reaches review/publish or a fixture', async () => {
    const failure = new ApiClientError({
      code: 'validation',
      message: 'Request validation failed.',
      status: 422,
      requestId: undefined,
      fieldErrors: { startAt: ['Must be in the future'] },
    });
    mocks.post.mockRejectedValueOnce(failure);

    await expect(publishVenueEvent('org_1', draft)).rejects.toBe(failure);
    expect(mocks.post).toHaveBeenCalledTimes(1);
  });

  it('B2: a retry after a failed publish reuses the SAME per-intent key on every step', async () => {
    // First attempt reaches review (past the event + tier writes) and fails.
    // The retry must pass the caller's ORIGINAL key to every step again, so
    // the gateway dedups `-event` / `-tier-0` instead of a freshly minted key
    // creating a second event.
    const failure = new ApiClientError({
      code: 'server',
      message: 'Request failed.',
      status: 500,
      requestId: undefined,
      fieldErrors: undefined,
    });
    mocks.post
      .mockResolvedValueOnce({ id: 'evt_1' })
      .mockResolvedValueOnce({ id: 'tier_1' })
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce({ id: 'evt_1' })
      .mockResolvedValueOnce({ id: 'tier_1' })
      .mockResolvedValueOnce({ id: 'evt_1', status: 'review' })
      .mockResolvedValueOnce({ id: 'evt_1', status: 'published' });

    const workflowKey = 'flow-abc-123';
    await expect(publishVenueEvent('org_1', draft, workflowKey)).rejects.toBe(failure);
    await expect(publishVenueEvent('org_1', draft, workflowKey)).resolves.toMatchObject({
      id: 'evt_1',
      status: 'published',
    });

    const path = ([options]: [PostOptions]) => options.path;
    const eventKeys = mocks.post.mock.calls
      .filter(([options]) => options.path === '/api/v2/organizations/org_1/events')
      .map(([options]) => options.headers?.['Idempotency-Key']);
    const tierKeys = mocks.post.mock.calls
      .filter(([options]) => options.path.endsWith('/ticket-tiers'))
      .map(([options]) => options.headers?.['Idempotency-Key']);
    const reviewKeys = mocks.post.mock.calls
      .filter(([options]) => path([options]) === '/api/v2/events/evt_1/review')
      .map(([options]) => options.headers?.['Idempotency-Key']);

    // Two attempts, each writing the event and the tier, review reached twice.
    expect(mocks.post).toHaveBeenCalledTimes(7);
    // The retry reused the same derived keys — never a fresh mint.
    expect(eventKeys).toEqual([`${workflowKey}-event`, `${workflowKey}-event`]);
    expect(tierKeys).toEqual([`${workflowKey}-tier-0`, `${workflowKey}-tier-0`]);
    expect(reviewKeys).toEqual([`${workflowKey}-review`, `${workflowKey}-review`]);
  });

  it('stops after a failed tier create instead of publishing a half-built event', async () => {
    const failure = new ApiClientError({
      code: 'validation',
      message: 'Request validation failed.',
      status: 422,
      requestId: undefined,
      fieldErrors: { quantity: ['Too low'] },
    });
    mocks.post.mockResolvedValueOnce({ id: 'evt_1' }).mockRejectedValueOnce(failure);

    await expect(publishVenueEvent('org_1', draft)).rejects.toBe(failure);
    const paths = mocks.post.mock.calls.map(([options]) => options.path);
    expect(paths).not.toContain('/api/v2/events/evt_1/review');
    expect(paths).not.toContain('/api/v2/events/evt_1/publish');
  });
});

describe('cancelPartnerEvent', () => {
  it('sends the tenant-scoped cancellation with a validated reason and stable intent key', async () => {
    mocks.post.mockResolvedValueOnce({ id: 'evt_m3', status: 'cancelled' });

    await cancelPartnerEvent('org_m3', 'evt_m3/unsafe', 'M3 test cancellation', 'cancel-intent-m3');

    const options = mocks.post.mock.calls[0]?.[0];
    expect(options?.path).toBe('/api/v2/events/evt_m3%2Funsafe/cancel');
    expect(cancelEventSchema.safeParse(options?.body).success).toBe(true);
    expect(options?.headers).toEqual({
      'x-organization-id': 'org_m3',
      'Idempotency-Key': 'cancel-intent-m3',
    });
  });

  it('rejects an empty cancellation reason before calling the gateway', async () => {
    await expect(
      cancelPartnerEvent('org_m3', 'evt_m3', '   ', 'cancel-intent-m3'),
    ).rejects.toThrow();
    expect(mocks.post).not.toHaveBeenCalled();
  });
});
