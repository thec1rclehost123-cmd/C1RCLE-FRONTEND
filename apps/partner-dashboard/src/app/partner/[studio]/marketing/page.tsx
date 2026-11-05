import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import {
  marketingAudienceQuerySchema,
  marketingAudienceSchema,
} from '@c1rcle/contracts/partner-marketing';

import { AudienceWorkspace } from '@/components/partner-v3/marketing/AudienceWorkspace';
import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

import type { MarketingAudience } from '@c1rcle/contracts/partner-marketing';

export default async function StudioMarketingPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ studio: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { studio } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  if (!organizationId)
    return (
      <main className="p-8 text-white">
        <h1>Marketing</h1>
        <p>Select an organization to view its audience.</p>
      </main>
    );
  const raw = await searchParams;
  const query = marketingAudienceQuerySchema.parse(
    Object.fromEntries(
      Object.entries(raw).filter(
        ([key, value]) =>
          ['search', 'eventId', 'tierId', 'offset'].includes(key) &&
          typeof value === 'string' &&
          value !== '',
      ),
    ),
  );
  const queryString = new URLSearchParams(
    Object.entries(query).map(([key, value]) => [key, String(value)]),
  );
  let data: MarketingAudience;
  try {
    data = await createServerApiClient(cookieHeader).get({
      path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/marketing/audience?${queryString}`,
      schema: marketingAudienceSchema,
      headers: { 'x-organization-id': organizationId },
    });
  } catch {
    return (
      <main className="p-8 text-white">
        <h1 className="text-3xl font-bold">Marketing</h1>
        <p className="my-4 text-white/65">
          Audience unavailable. An authorized Host or Venue account with order access is required.
          No incomplete audience is shown.
        </p>
        <a className="underline" href={`/partner/${studio}/marketing`}>
          Try again
        </a>
      </main>
    );
  }
  return <AudienceWorkspace key={queryString.toString()} data={data} studio={studio} {...query} />;
}
