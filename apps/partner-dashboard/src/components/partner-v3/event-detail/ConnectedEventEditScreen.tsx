'use client';

import Link from 'next/link';
import { useState } from 'react';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';
import { describeApiError } from '@/lib/api/describe-error';
import { updatePartnerEventDetails } from '@/lib/events/venue-event-repository';

import type { EventOperationsDto } from '@c1rcle/contracts';
import type { SyntheticEvent } from 'react';

interface Draft {
  readonly title: string;
  readonly summary: string;
  readonly description: string;
}

export function ConnectedEventEditScreen({
  event,
  organizationId,
  studio,
}: {
  readonly event: EventOperationsDto;
  readonly organizationId: string;
  readonly studio: 'host' | 'venue';
}) {
  const [draft, setDraft] = useState<Draft>({
    title: event.title,
    summary: event.summary,
    description: event.description,
  });
  const [savedDraft, setSavedDraft] = useState(draft);
  const [version, setVersion] = useState(event.version);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasChanges =
    draft.title !== savedDraft.title ||
    draft.summary !== savedDraft.summary ||
    draft.description !== savedDraft.description;

  const update = (changes: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...changes }));
    setMessage(null);
    setError(null);
  };

  const submit = async (form: SyntheticEvent<HTMLFormElement>) => {
    form.preventDefault();
    const title = draft.title.trim();
    if (!title) {
      setError('Enter an event title.');
      setMessage(null);
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updatePartnerEventDetails(organizationId, event.id, version, {
        title,
        summary: draft.summary.trim(),
        description: draft.description.trim(),
      });
      const nextDraft = {
        title: updated.title,
        summary: updated.summary,
        description: updated.description,
      };
      setDraft(nextDraft);
      setSavedDraft(nextDraft);
      setVersion(updated.version);
      setMessage('Event details saved.');
    } catch (caught) {
      setError(describeApiError(caught, 'The event details could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <main className="mx-auto max-w-4xl py-7 text-stone-100">
        <Link
          href={`/partner/${studio}/events/${encodeURIComponent(event.id)}`}
          className="text-sm font-medium text-stone-400 no-underline hover:text-stone-100"
        >
          ← {event.title}
        </Link>
        <section
          aria-labelledby="event-edit-title"
          className="mt-6 rounded-2xl border border-white/15 bg-neutral-950 p-7"
        >
          <h1 id="event-edit-title" className="mb-2 text-3xl font-bold tracking-tight">
            Edit event details
          </h1>
          <p className="m-0 leading-6 text-stone-300">
            Update the event title and guest-facing copy. Dates, ticket tiers, and promoter terms
            are not changed by this form.
          </p>
          <form className="mt-7 grid gap-5" onSubmit={(form) => void submit(form)}>
            <div className="grid gap-2">
              <label htmlFor="event-edit-title-input" className="text-sm font-medium">
                Event title
              </label>
              <input
                id="event-edit-title-input"
                value={draft.title}
                maxLength={200}
                required
                onChange={(change) => {
                  update({ title: change.target.value });
                }}
                className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="event-edit-summary" className="text-sm font-medium">
                Guest-facing summary
              </label>
              <textarea
                id="event-edit-summary"
                value={draft.summary}
                maxLength={1000}
                rows={3}
                onChange={(change) => {
                  update({ summary: change.target.value });
                }}
                className="resize-y rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="event-edit-description" className="text-sm font-medium">
                Event description
              </label>
              <textarea
                id="event-edit-description"
                value={draft.description}
                maxLength={20_000}
                rows={7}
                onChange={(change) => {
                  update({ description: change.target.value });
                }}
                className="resize-y rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
              />
            </div>
            {error ? (
              <p role="alert" className="m-0 text-sm text-red-300">
                {error}
              </p>
            ) : null}
            {message ? (
              <p role="status" aria-live="polite" className="m-0 text-sm text-emerald-300">
                {message}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving || !hasChanges || !draft.title.trim()}
                className="rounded-xl bg-[#FF4400] px-6 py-3 text-xs font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save details'}
              </button>
              <Link
                href={`/partner/${studio}/events/${encodeURIComponent(event.id)}`}
                className="rounded-xl border border-white/20 px-6 py-3 text-xs font-black uppercase tracking-widest text-white no-underline"
              >
                Cancel
              </Link>
            </div>
          </form>
        </section>
      </main>
    </PageContainer>
  );
}
