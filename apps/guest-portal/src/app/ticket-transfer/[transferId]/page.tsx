import { notFound } from 'next/navigation';

import { TicketTransferClaimClient } from '@/features/tickets/components/TicketTransferClaimClient';

import type { Metadata } from 'next';

interface TicketTransferPageProps {
  params: Promise<{ transferId: string }>;
}

export const metadata: Metadata = {
  title: 'Ticket invitation | THE C1RCLE',
  robots: { index: false, follow: false, noarchive: true },
};

export default async function TicketTransferPage({ params }: TicketTransferPageProps) {
  const { transferId } = await params;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,127}$/.test(transferId)) notFound();

  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-24 text-white">
      <section className="rounded-3xl border border-white/10 bg-black/70 p-6 shadow-2xl sm:p-9">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#FF6842]">
          Ticket invitation
        </p>
        <h1 className="mt-4 text-3xl font-black uppercase tracking-tight">
          A ticket was shared with you
        </h1>
        <div className="mt-5">
          <TicketTransferClaimClient transferId={transferId} />
        </div>
      </section>
    </main>
  );
}
