import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PromoterLinksConnected } from '@/components/partner-v3/promoter/PromoterLinksConnected';
import { loadPromoterLinks } from '@/lib/events/load-promoter-links';
import { isStudioRole } from '@/studios/studio-config';

export default async function StudioLinksPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ studio: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { studio } = await params;
  if (!isStudioRole(studio)) notFound();
  if (studio !== 'promoter') notFound();

  const query = await searchParams;
  const rawCursor = query['cursor'];
  const cursor = rawCursor === undefined ? null : typeof rawCursor === 'string' ? rawCursor : '';
  let links: Awaited<ReturnType<typeof loadPromoterLinks>> | null = null;
  try {
    links = await loadPromoterLinks(cursor);
  } catch {
    // Keep backend failures explicit rather than falling back to fixture data.
  }
  if (links === null) {
    return (
      <section className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-start justify-center px-6 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Promoter workspace</p>
        <h1 className="mt-3 text-2xl font-semibold">Referral links unavailable</h1>
        <p className="mt-3 text-sm text-white/65">
          Referral-link data could not be loaded from the backend. Retry to check the current state.
        </p>
        <Link className="mt-5 underline" href="/partner/promoter/links">
          Try again
        </Link>
      </section>
    );
  }
  return (
    <PromoterLinksConnected
      items={links.items}
      page={links.pageInfo.page}
      pageSize={links.pageInfo.pageSize}
      total={links.pageInfo.total}
      nextCursor={links.pageInfo.nextCursor}
    />
  );
}
