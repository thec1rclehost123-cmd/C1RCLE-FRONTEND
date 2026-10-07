import { describe, expect, it } from 'vitest';

import { createApiPartnerRepositories, PartnerApiError } from './api-partner-repositories';

import type { ApiPartnerDecoders, PartnerApiTransport } from './api-partner-repositories';
import type { PromoterEvent, PromoterTrackingLink } from './contracts';

const unused = () => {
  throw new Error('Decoder should not be called in this test.');
};
const previewLink: PromoterTrackingLink = {
  id: 'link-1',
  eventId: 'event-1',
  eventName: 'Event One',
  channel: 'Instagram',
  label: 'Story',
  shortUrl: 'c1rcle.in/test',
  status: 'active',
  clicks: 0,
  purchases: 0,
  earningsPaise: 0,
};
const discoveryEvent: PromoterEvent = {
  id: 'event-1',
  name: 'Event One',
  date: 'Fri',
  time: '9 PM',
  venue: 'Venue',
  host: 'Host',
  city: 'Mumbai',
  status: 'requested',
  category: 'House',
  commissionLabel: '₹100 / ticket',
  clicks: 0,
  tickets: 0,
  earningsPaise: 0,
  conversion: 0,
  accent: 'orange',
};

const decoders: ApiPartnerDecoders = {
  organizations: unused,
  hostOverview: unused,
  hostEvents: unused,
  eventDetail: unused,
  analytics: unused,
  relationships: unused,
  hostFinance: unused,
  hostProfile: unused,
  promoterOverview: unused,
  promoterEvents: () => [discoveryEvent],
  promoterPartners: unused,
  promoterFinance: unused,
  promoterLinks: unused,
  promoterProfile: unused,
  promoterNetworkProfile: unused,
  promoterTrackingLink: () => previewLink,
};

describe('API partner repository adapter', () => {
  it('sends authenticated, filtered discovery requests through the gateway boundary', async () => {
    let requestedUrl = '';
    const transport: PartnerApiTransport = {
      request(path) {
        requestedUrl = path;
        return Promise.resolve({ data: [] });
      },
    };
    const repositories = createApiPartnerRepositories({ decoders, transport });
    const result = await repositories.promoter.discoverEvents({
      city: 'Mumbai',
      category: 'House',
    });
    expect(requestedUrl).toBe(
      '/api/v1/partner/promoter/events/discover?city=Mumbai&category=House',
    );
    expect(result).toEqual([discoveryEvent]);
  });

  it('posts tracking-link inputs without making client-side attribution decisions', async () => {
    let method = '';
    let body: unknown;
    const transport: PartnerApiTransport = {
      request(_path, init) {
        method = init?.method ?? 'GET';
        body = init?.body;
        return Promise.resolve({ data: previewLink });
      },
    };
    const repositories = createApiPartnerRepositories({ decoders, transport });
    const result = await repositories.promoter.createTrackingLink({
      eventId: 'event-1',
      channel: 'Instagram',
      label: 'Story',
    });
    expect(method).toBe('POST');
    expect(body).toEqual({ eventId: 'event-1', channel: 'Instagram', label: 'Story' });
    expect(result).toEqual(previewLink);
  });

  it('surfaces non-success responses as typed API errors', async () => {
    const transport: PartnerApiTransport = {
      request(path) {
        return Promise.reject(new PartnerApiError('Forbidden', 403, path));
      },
    };
    const repositories = createApiPartnerRepositories({ decoders, transport });
    await expect(repositories.promoter.getOverview()).rejects.toBeInstanceOf(PartnerApiError);
  });
});
