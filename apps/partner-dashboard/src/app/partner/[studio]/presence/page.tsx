import { redirect } from 'next/navigation';

export default async function StudioPresencePage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  redirect(`/partner/${studio}/door`);
}
