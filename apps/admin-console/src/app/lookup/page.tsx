'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, TextField } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { globalLookup } from '@/lib/admin/admin-api';
import { shortId, StatusBadge } from '@/lib/admin/format';

const TYPE_LABELS: Record<string, string> = {
  venue: 'Venue',
  event: 'Event',
  organization: 'Host',
  user: 'User',
};

export default function LookupDesk() {
  const [query, setQuery] = useState('');

  const search = useMutation({
    mutationFn: (q: string) => globalLookup(q),
  });

  const runSearch = () => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return;
    search.mutate(trimmed);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Lookup"
        description="Find a venue, event, host, or user by its exact id. O(1) doc-id fetches across each collection — not a scan, so a partial name won't match."
      />

      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          runSearch();
        }}
      >
        <TextField
          label="Entity id"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder="venue_..., evt_..., org_..., or a user id"
          className="w-96"
        />
        <Button type="submit" disabled={search.isPending || query.trim().length === 0}>
          {search.isPending ? 'Searching…' : 'Search'}
        </Button>
      </form>

      {search.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The lookup failed. Please retry.
        </p>
      ) : null}

      {search.isSuccess ? (
        search.data.items.length === 0 ? (
          <EmptyState
            title="No matches"
            description="Nothing in venues, events, hosts, or users matched that id exactly."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full divide-y divide-border text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Id
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {search.data.items.map((item) => (
                  <tr key={`${item.type}-${item.id}`}>
                    <td className="px-4 py-3">
                      <StatusBadge label={TYPE_LABELS[item.type] ?? item.type} tone="default" />
                    </td>
                    <td className="px-4 py-3 font-medium">{item.label}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {shortId(item.id)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </div>
  );
}
