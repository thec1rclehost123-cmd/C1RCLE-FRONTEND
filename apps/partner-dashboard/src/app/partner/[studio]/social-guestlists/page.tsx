'use client';

import { useEffect, useState } from 'react';

import { managedSocialEventsSchema, socialEventPolicySchema } from '@c1rcle/contracts/guest-social';
import { Button } from '@c1rcle/ui';

import { bffClient } from '@/lib/bff/bff-client';
import { csrfHeaders } from '@/lib/onboarding/csrf';
import { getActiveOrgId } from '@/lib/org/active-org';

export default function SocialGuestlistsPage() {
  const [events, setEvents] = useState<{ id: string; title: string; enabled: boolean }[] | null>(
    null,
  );
  const [organization, setOrganization] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  async function load() {
    const id = getActiveOrgId();
    setOrganization(id);
    setError('');
    if (!id) {
      setError('Select an approved workspace to manage guestlist privacy.');
      return;
    }
    try {
      setEvents(
        (
          await bffClient.get({
            path: `/api/bff/social-events?organizationId=${encodeURIComponent(id)}`,
            schema: managedSocialEventsSchema,
          })
        ).items,
      );
    } catch {
      setError('Your role cannot manage these social settings, or the service is unavailable.');
    }
  }
  useEffect(() => {
    const id = getActiveOrgId();
    if (!id) return;
    let active = true;
    void bffClient
      .get({
        path: `/api/bff/social-events?organizationId=${encodeURIComponent(id)}`,
        schema: managedSocialEventsSchema,
      })
      .then((value) => {
        if (active) {
          setOrganization(id);
          setEvents(value.items);
        }
      })
      .catch(() => {
        if (active) setError('Social settings could not be loaded.');
      });
    return () => {
      active = false;
    };
  }, []);
  async function toggle(event: { id: string; enabled: boolean }) {
    if (!organization || busy) return;
    setBusy(event.id);
    setError('');
    try {
      const result = await bffClient.patch({
        path: `/api/bff/social-events?organizationId=${encodeURIComponent(organization)}`,
        body: { eventId: event.id, enabled: !event.enabled },
        headers: csrfHeaders(),
        schema: socialEventPolicySchema,
      });
      setEvents(
        (rows) =>
          rows?.map((row) => (row.id === event.id ? { ...row, enabled: result.enabled } : row)) ??
          [],
      );
    } catch {
      setError('The event social setting could not be saved. Try again.');
    } finally {
      setBusy('');
    }
  }
  return (
    <section className="mx-auto max-w-3xl space-y-6 px-5 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Guestlist privacy</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Social guestlists are off by default. Enabling one lets eligible Guests see only people
          who also opt in. Private profiles and individual hides always win.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          This never changes your operational attendee list, ticket ownership or Scanner access.
          Only eligible public upcoming/active events can show a social guestlist.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
      {events === null ? (
        <Button variant="secondary" onClick={() => void load()}>
          Load social event settings
        </Button>
      ) : events.length === 0 ? (
        <p>No events in this workspace yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-medium">{event.title}</span>
              <Button
                variant="secondary"
                disabled={Boolean(busy)}
                onClick={() => void toggle(event)}
              >
                {busy === event.id
                  ? 'Saving…'
                  : event.enabled
                    ? 'Disable social guestlist'
                    : 'Enable social guestlist'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
