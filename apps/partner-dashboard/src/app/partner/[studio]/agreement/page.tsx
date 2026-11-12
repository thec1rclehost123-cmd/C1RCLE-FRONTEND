import { notFound } from 'next/navigation';

import { PromoterAgreementPanel } from '@/components/promoter/PromoterAgreementPanel';

export default async function PromoterAgreementPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  if (studio !== 'promoter') notFound();

  return <PromoterAgreementPanel />;
}
