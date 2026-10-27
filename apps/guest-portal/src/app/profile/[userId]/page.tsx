import { notFound } from 'next/navigation';

import type { Metadata } from 'next';

interface PublicProfilePageProps {
  params: Promise<{ userId: string }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  await params;
  notFound();
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  await params;
  notFound();
}
