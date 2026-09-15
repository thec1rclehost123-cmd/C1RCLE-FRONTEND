'use client';

import { useEffect, useMemo, useState } from 'react';

import { createComposerDraft } from '@/components/events/event-composer-model';
import { EventComposer } from '@/components/events/EventComposer';
import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import { initialCreateEventDraft } from '../create-event-model';

import type { CreateEventDraft } from '../create-event-model';
import type { EventComposerDraft } from '@/components/events/event-composer-model';

export interface CreateEventMutations {
  readonly saveDraft: (draft: CreateEventDraft) => Promise<void>;
  readonly publish: (draft: CreateEventDraft) => Promise<void>;
}

export function CreateEventScreen({
  mutations,
  initialDraft = initialCreateEventDraft,
  mode = 'create',
}: {
  readonly mutations?: CreateEventMutations;
  readonly initialDraft?: CreateEventDraft;
  readonly mode?: 'create' | 'edit';
}) {
  const auth = useDashboardAuth();
  const [draft, setDraft] = useState<EventComposerDraft>(() => createComposerDraft(initialDraft));
  const [saved, setSaved] = useState(() => JSON.stringify(createComposerDraft(initialDraft)));
  const dirty = useMemo(() => JSON.stringify(draft) !== saved, [draft, saved]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
    };
  }, [dirty]);

  const save = mutations
    ? async (value: EventComposerDraft) => {
        await mutations.saveDraft(value);
        setSaved(JSON.stringify(value));
      }
    : undefined;
  const publish = mutations
    ? async (value: EventComposerDraft) => {
        await mutations.publish(value);
        setSaved(JSON.stringify(value));
      }
    : undefined;

  return (
    <EventComposer
      actor="venue"
      eyebrow="Venue Studio / Events"
      title={mode === 'edit' ? 'Edit event' : 'Create event'}
      draft={draft}
      onChange={setDraft}
      canEdit={auth.canDo('canEditEvent')}
      canFinalize={auth.canDo('canPublishEvent')}
      finalLabel={mode === 'edit' ? 'Publish changes' : 'Publish event'}
      onSave={save}
      onFinalize={publish}
    />
  );
}
