'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { decideExternalVenueRequest, listExternalVenueRequests } from '@/lib/admin/admin-api';
import { formatDateTime } from '@/lib/admin/format';

export default function ExternalVenuesDesk() {
  const queryClient = useQueryClient();
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const queue = useQuery({ queryKey: ['admin', 'external-venues'], queryFn: listExternalVenueRequests });
  const mutation = useMutation({
    mutationFn: ({ eventId, decision }: { eventId: string; decision: 'approve' | 'reject' }) =>
      decideExternalVenueRequest(eventId, decision, reasons[eventId]),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'external-venues'] });
    },
  });

  return (
    <main className="flex flex-col gap-6">
      <PageHeader title="External venues" description="Review event-scoped locations for physical venues that do not have a C1RCLE Venue account. Contact details below are private and visible only to authorized reviewers." />
      {queue.isPending ? <LoadingState label="Loading external venue requests…" /> : null}
      {queue.isError ? <ErrorState description="External venue requests could not be loaded." onRetry={() => void queue.refetch()} /> : null}
      {queue.data?.items.length === 0 ? <EmptyState title="No external venues awaiting review" description="New Host submissions will appear here." /> : null}
      <div className="grid gap-4">
        {queue.data?.items.map((item) => (
          <section key={item.eventId} className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{item.location.name}</h2>
                <p className="text-sm text-muted-foreground">Event: {item.title}</p>
                <p className="text-sm text-muted-foreground">Submitted {formatDateTime(item.submittedAt)}</p>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs">Pending review</span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="font-medium">Public location</dt><dd>{item.location.address}{item.location.city ? `, ${item.location.city}` : ''}{item.location.region ? `, ${item.location.region}` : ''}{item.location.postalCode ? ` ${item.location.postalCode}` : ''}{item.location.country ? `, ${item.location.country}` : ''}</dd></div>
              <div><dt className="font-medium">Private venue contact</dt><dd>{item.location.contact.managerName} · {item.location.contact.phone}{item.location.contact.email ? ` · ${item.location.contact.email}` : ''}</dd></div>
              <div><dt className="font-medium">Host organization</dt><dd>{item.organizationId}</dd></div>
              {item.location.mapUrl ? <div><dt className="font-medium">Map</dt><dd><a className="underline" href={item.location.mapUrl} target="_blank" rel="noreferrer">Open map</a></dd></div> : null}
            </dl>
            <label className="mt-4 block text-sm font-medium" htmlFor={`reason-${item.eventId}`}>Rejection reason</label>
            <textarea id={`reason-${item.eventId}`} className="mt-1 min-h-20 w-full rounded-md border border-border bg-background p-3" value={reasons[item.eventId] ?? ''} onChange={(event) => { setReasons((current) => ({ ...current, [item.eventId]: event.target.value })); }} />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" disabled={mutation.isPending} onClick={() => { mutation.mutate({ eventId: item.eventId, decision: 'approve' }); }}>Approve venue</Button>
              <Button type="button" variant="outline" disabled={mutation.isPending || !reasons[item.eventId]?.trim()} onClick={() => { mutation.mutate({ eventId: item.eventId, decision: 'reject' }); }}>Reject request</Button>
            </div>
            {mutation.isError ? <p className="mt-3 text-sm text-destructive" role="alert">{mutation.error instanceof Error ? mutation.error.message : 'The review decision could not be saved.'}</p> : null}
          </section>
        ))}
      </div>
    </main>
  );
}
