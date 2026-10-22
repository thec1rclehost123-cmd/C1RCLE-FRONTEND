'use client';

import { useEffect, useMemo, useState } from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import {
  entitlementsListResponseSchema,
  eventDtoSchema,
  guestProfileDtoSchema,
  venueDtoSchema,
} from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';
import { bffClient } from '@/lib/bff/bff-client';

import { toProfileEvents, toProfileIdentity } from '../profile-view-model';

import { ProfileEvents } from './ProfileEvents';
import { ProfileHeader } from './ProfileHeader';
import { ProfileOverview } from './ProfileOverview';
import { ProfileSectionNav } from './ProfileSectionNav';
import { ProfileSettings } from './ProfileSettings';

import type { ProfileEventDetails } from '../profile-view-model';
import type {
  ProfileEventFilter,
  ProfileSection,
  ProfileSettingsSection,
  ProfileView,
} from '../types/profile.types';
import type { GuestProfileDto, User } from '@c1rcle/contracts';

const EMPTY_EVENTS: Pick<ProfileView, 'upcomingEvents' | 'attendedEvents'> = {
  upcomingEvents: [],
  attendedEvents: [],
};

interface ProfileClientProps {
  readonly user: User;
  readonly activeSection: ProfileSection;
  readonly activeEventFilter: ProfileEventFilter;
  readonly activeSettingsSection: ProfileSettingsSection;
}

/**
 * The live `/profile` view. The session identity (id, email, displayName) is
 * passed down from the server, so the header renders real data on the first
 * paint; the profile document and the guest's events are then read on the
 * client, where the session-cookie BFF and the public event/venue reads live.
 *
 * `GET /profile/me` legitimately 404s until the guest first saves a profile —
 * that is treated as "no extra profile data", not a failure, and the header
 * falls back to the session identity. The events come from the same wallet the
 * tickets screen reads; a wallet that fails to load renders as empty, never as
 * fixtures or another account's passes.
 */
export function ProfileClient({
  user,
  activeSection,
  activeEventFilter,
  activeSettingsSection,
}: ProfileClientProps) {
  const [profile, setProfile] = useState<GuestProfileDto | null>(null);
  const [events, setEvents] = useState<Pick<
    ProfileView,
    'upcomingEvents' | 'attendedEvents'
  > | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = bffClient
      .get({ path: '/api/profile/me', schema: guestProfileDtoSchema })
      .catch((error: unknown) => {
        // A 404 is the normal "not saved yet" state; any other failure still
        // falls back to the session identity rather than inventing a profile.
        if (isApiClientError(error) && error.code === 'not_found') return null;
        return null;
      });

    const loadEvents = bffClient
      .get({
        path: '/api/wallet/tickets',
        query: { limit: 50 },
        schema: entitlementsListResponseSchema,
      })
      .then((page) =>
        toProfileEvents(page.items, async (eventId) => {
          const event = await apiClient
            .get({
              path: `/api/v2/public/events/${encodeURIComponent(eventId)}`,
              schema: eventDtoSchema,
            })
            .catch(() => null);
          if (!event) return null;
          const venue = event.venueId
            ? await apiClient
                .get({
                  path: `/api/v2/public/venues/by-id/${event.venueId}`,
                  schema: venueDtoSchema,
                })
                .catch(() => null)
            : null;
          return { event, venue } satisfies ProfileEventDetails;
        }),
      )
      .catch(() => EMPTY_EVENTS);

    void Promise.all([loadProfile, loadEvents]).then(([resolvedProfile, resolvedEvents]) => {
      if (cancelled) return;
      setProfile(resolvedProfile);
      setEvents(resolvedEvents);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const identity = useMemo(() => toProfileIdentity(user, profile), [user, profile]);
  const resolvedEvents = events ?? EMPTY_EVENTS;
  const activeEvents =
    activeEventFilter === 'attended'
      ? resolvedEvents.attendedEvents
      : resolvedEvents.upcomingEvents;

  return (
    <div className="relative z-10 min-h-screen px-4 pb-24 pt-28 text-white sm:px-6 sm:pt-32 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        <ProfileHeader identity={identity} />

        <div className="my-7 sm:my-9">
          <ProfileSectionNav activeSection={activeSection} />
        </div>

        {events === null ? (
          <p className="py-16 text-center text-sm font-black uppercase tracking-[0.25em] text-white/35">
            Loading your profile
          </p>
        ) : (
          <>
            {activeSection === 'overview' && (
              <ProfileOverview profile={{ identity, ...resolvedEvents }} />
            )}
            {activeSection === 'events' && (
              <ProfileEvents activeFilter={activeEventFilter} events={activeEvents} />
            )}
            {activeSection === 'settings' && (
              <ProfileSettings activeSection={activeSettingsSection} identity={identity} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
