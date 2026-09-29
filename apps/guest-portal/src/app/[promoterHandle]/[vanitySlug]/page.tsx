import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';

import { createApiClient } from '@c1rcle/api-client';

const resolutionSchema = z.object({ eventSlug: z.string(), code: z.string() });

export default async function PromoterVanityLinkPage({
  params,
}: {
  params: Promise<{ promoterHandle: string; vanitySlug: string }>;
}) {
  const { promoterHandle, vanitySlug } = await params;
  const resolution = await createApiClient()
    .get({
      path: `/api/v2/public/promoter-links/${encodeURIComponent(promoterHandle)}/${encodeURIComponent(vanitySlug)}`,
      schema: resolutionSchema,
    })
    .catch(() => notFound());
  redirect(
    `/event/${encodeURIComponent(resolution.eventSlug)}?ref=${encodeURIComponent(resolution.code)}`,
  );
}
