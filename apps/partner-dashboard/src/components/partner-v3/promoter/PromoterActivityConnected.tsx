import { PRODUCT_TIME_ZONE } from '@c1rcle/contracts';

import type { loadPromoterActivity } from '@/lib/events/load-promoter-activity';

type Activity = Awaited<ReturnType<typeof loadPromoterActivity>>;

const money = (paise: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);

export function PromoterActivityConnected({
  data,
  error,
}: {
  readonly data?: Activity;
  readonly error?: string;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 text-white sm:px-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Promoter workspace</p>
        <h1 className="mt-2 text-3xl font-semibold">Activity</h1>
        <p className="mt-2 text-sm text-white/60">
          Privacy-safe attributed bookings and RSVPs. Guest contact and payment details are not
          shown.
        </p>
      </header>
      {error ? (
        <p className="mt-8 rounded-lg border border-white/15 p-5 text-sm" role="alert">
          {error}
        </p>
      ) : data?.rows.length ? (
        <>
          <div className="mt-8 grid gap-3 sm:hidden">
            {data.rows.map((row) => (
              <article key={row.id} className="rounded-lg border border-white/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-medium">{row.eventName}</h2>
                    <p className="mt-1 text-xs text-white/55">
                      {row.bookingReference ?? 'RSVP'} · {row.status.replaceAll('_', ' ')}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{money(row.attributedTicketValuePaise)}</p>
                </div>
                <p className="mt-4 text-xs text-white/60">
                  {row.ticketCount} tickets ·{' '}
                  {new Intl.DateTimeFormat('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: PRODUCT_TIME_ZONE,
                  }).format(new Date(row.attributedAt))}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-8 hidden overflow-x-auto rounded-lg border border-white/10 sm:block">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs text-white/55">
                <tr>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Type / status</th>
                  <th className="px-4 py-3 font-medium">Tickets</th>
                  <th className="px-4 py-3 font-medium">Attributed value</th>
                  <th className="px-4 py-3 font-medium">Attributed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-4 font-medium">{row.bookingReference ?? 'RSVP'}</td>
                    <td className="px-4 py-4">{row.eventName}</td>
                    <td className="px-4 py-4 capitalize">{row.status.replaceAll('_', ' ')}</td>
                    <td className="px-4 py-4">{row.ticketCount}</td>
                    <td className="px-4 py-4">{money(row.attributedTicketValuePaise)}</td>
                    <td className="px-4 py-4 text-white/65">
                      {new Intl.DateTimeFormat('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: PRODUCT_TIME_ZONE,
                      }).format(new Date(row.attributedAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="mt-8 rounded-lg border border-white/10 p-5 text-sm text-white/60">
          No attributed activity is recorded yet.
        </p>
      )}
      {data?.hasMore ? (
        <p className="mt-3 text-xs text-white/55">
          Showing the latest 100 records. Older activity is not included in this view.
        </p>
      ) : null}
    </main>
  );
}
