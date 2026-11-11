import { notFound, redirect } from 'next/navigation';

export default async function StudioPresencePage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  if (studio !== 'host' && studio !== 'venue') notFound();
  redirect(`/partner/${studio}/settings`);
}
