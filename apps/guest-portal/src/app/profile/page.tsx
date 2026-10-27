import { cookies } from 'next/headers';

import { createApiClient, isApiClientError } from '@c1rcle/api-client';
import {
  entitlementsListResponseSchema,
  eventPublicDetailDtoSchema,
  guestProfileDtoSchema,
  ordersListResponseSchema,
} from '@c1rcle/contracts';

import { EventArtworkBackdrop } from '@/components/layout/EventArtworkBackdrop';
import { getOrderStatusPresentation } from '@/features/booking/status-presentation';
import { ProfileEvents } from '@/features/profile/components/ProfileEvents';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { ProfileOverview } from '@/features/profile/components/ProfileOverview';
import { ProfileSectionNav } from '@/features/profile/components/ProfileSectionNav';
import { ProfileSettings } from '@/features/profile/components/ProfileSettings';
import { requireGuestSession } from '@/lib/auth/require-session';
import { buildPrivateMetadata } from '@/lib/seo/metadata';

import type {
  ProfileEventFilter,
  ProfileFixture,
  ProfileIdentity,
  ProfileSection,
  ProfileSettingsSection,
} from '@/features/profile/types/profile.types';
import type { EntitlementsListResponse, OrdersListResponse } from '@c1rcle/contracts';
import type { Metadata } from 'next';

export const metadata: Metadata = buildPrivateMetadata(
  'Profile',
  'View your C1RCLE profile, events, and account settings.',
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProfilePageProps {
  searchParams?: Promise<{
    filter?: string | string[];
    section?: string | string[];
    view?: string | string[];
  }>;
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveProfileSection(value: string | undefined): ProfileSection {
  return value === 'events' || value === 'settings' ? value : 'overview';
}

function resolveEventFilter(value: string | undefined): ProfileEventFilter {
  return value === 'attended' ? 'attended' : 'upcoming';
}

function resolveSettingsSection(value: string | undefined): ProfileSettingsSection {
  return value === 'account' ? 'account' : 'personal';
}

function initialsFor(displayName: string): string {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return initials || 'C1';
}

async function collectPages<T>(
  getPage: (cursor?: string) => Promise<{
    items: T[];
    pageInfo: { hasNextPage: boolean };
  }>,
): Promise<T[]> {
  const items: T[] = [];
  // The current gateway reports hasNextPage but omits its offset cursor.
  for (;;) {
    const page = await getPage(items.length === 0 ? undefined : String(items.length));
    items.push(...page.items);
    if (!page.pageInfo.hasNextPage) return items;
    if (page.items.length === 0) throw new Error('Profile history pagination did not advance');
  }
}

export default async function ProfilePage({ searchParams }: ProfilePageProps = {}) {
  const session = await requireGuestSession('/profile');
  const cookieHeader = (await cookies()).toString();
  const guestProfile = await createApiClient()
    .get({
      path: '/api/v2/profile/me',
      schema: guestProfileDtoSchema,
      headers: { cookie: cookieHeader },
    })
    .catch((error: unknown) => {
      if (isApiClientError(error) && error.status === 404) return null;
      throw error;
    });
  const client = createApiClient();
  const [orders, entitlements] = await Promise.all([
    collectPages<OrdersListResponse['items'][number]>((cursor) =>
      client.get({
        path: `/api/v2/orders?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
        schema: ordersListResponseSchema,
        headers: { cookie: cookieHeader },
      }),
    ).catch(() => null),
    collectPages<EntitlementsListResponse['items'][number]>((cursor) =>
      client.get({
        path: `/api/v2/wallet/tickets?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
        schema: entitlementsListResponseSchema,
        headers: { cookie: cookieHeader },
      }),
    ).catch(() => null),
  ]);
  const attendedTickets = new Map(
    (entitlements ?? [])
      .filter((ticket) => ticket.status === 'redeemed' && ticket.scanCount > 0)
      .map((ticket) => [ticket.orderId, ticket]),
  );
  const orderEvents = orders
    ? await Promise.all(
        orders.map(async (order) => {
          const event = await client
            .get({
              path: `/api/v2/public/events/${encodeURIComponent(order.eventId)}`,
              schema: eventPublicDetailDtoSchema,
            })
            .catch(() => null);
          return { order, event };
        }),
      )
    : [];
  const now = new Date().getTime();
  const history = orderEvents.map(({ order, event }) => ({
    id: order.id,
    slug: event?.slug ?? order.eventId,
    detailHref: event
      ? `/event/${encodeURIComponent(event.slug)}`
      : `/confirmation/${encodeURIComponent(order.id)}`,
    title: event?.title ?? order.eventCancellation?.eventTitle ?? 'Event details unavailable',
    image: event?.imageUrl ?? '/c1rcle-logo.webp',
    startsAt: event?.startAt ?? attendedTickets.get(order.id)?.scannedAt[0] ?? order.createdAt,
    venue: event?.venue?.name ?? 'Venue unavailable',
    city: event?.venue?.address.city ?? '',
    participationLabel: getOrderStatusPresentation(
      order.eventCancellation && order.status === 'paid' ? 'cancelled' : order.status,
    ).label,
    bookingReference: order.bookingReference,
    bookingHref: `/confirmation/${encodeURIComponent(order.id)}`,
    amountPaise: order.grandTotalPaise,
    isAttended:
      Date.parse(event?.startAt ?? attendedTickets.get(order.id)?.scannedAt[0] ?? '') <= now &&
      attendedTickets.has(order.id) &&
      order.status === 'paid' &&
      order.refundedPaise === 0 &&
      order.eventCancellation === null,
  }));
  const identity: ProfileIdentity = {
    id: session.user.id,
    avatarUrl: session.user.avatarUrl,
    displayName: guestProfile?.displayName ?? session.user.displayName,
    initials: initialsFor(guestProfile?.displayName ?? session.user.displayName),
    email: session.user.email,
    phoneNumber: null,
    city: guestProfile?.city ?? null,
    instagram: null,
    gender: null,
    memberSince: guestProfile?.createdAt ?? null,
    badges: ['Member'],
    signInMethod: 'Email',
  };
  const profile: ProfileFixture = {
    identity,
    upcomingEvents: history
      .filter((event) => Date.parse(event.startsAt) > now)
      .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt)),
    attendedEvents: history
      .filter((event) => event.isAttended)
      .filter((event, index, all) => all.findIndex((item) => item.slug === event.slug) === index)
      .sort((left, right) => Date.parse(right.startsAt) - Date.parse(left.startsAt)),
    orderHistoryAvailable: orders !== null,
    attendanceHistoryAvailable: orders !== null && entitlements !== null,
  };
  const params = (await searchParams) ?? {};
  const activeSection = resolveProfileSection(firstValue(params.view));
  const activeEventFilter = resolveEventFilter(firstValue(params.filter));
  const activeSettingsSection = resolveSettingsSection(firstValue(params.section));
  const profileEvents =
    activeEventFilter === 'attended' ? profile.attendedEvents : profile.upcomingEvents;

  return (
    <div className="relative z-10 min-h-screen px-4 pb-28 pt-24 text-white sm:px-6 sm:pt-28 lg:px-8">
      <EventArtworkBackdrop
        image={profile.upcomingEvents[0]?.image ?? profile.attendedEvents[0]?.image ?? null}
      />
      <div className="relative z-10 mx-auto max-w-[1280px]">
        <ProfileHeader identity={profile.identity} />

        <div className="my-7 sm:my-9">
          <ProfileSectionNav activeSection={activeSection} />
        </div>

        {activeSection === 'overview' && <ProfileOverview profile={profile} />}
        {activeSection === 'events' && (
          <ProfileEvents
            activeFilter={activeEventFilter}
            events={profileEvents}
            available={
              activeEventFilter === 'attended'
                ? (profile.attendanceHistoryAvailable ?? false)
                : (profile.orderHistoryAvailable ?? false)
            }
          />
        )}
        {activeSection === 'settings' && (
          <ProfileSettings
            activeSection={activeSettingsSection}
            identity={profile.identity}
            profileFields={
              guestProfile
                ? {
                    dateOfBirth: guestProfile.dateOfBirth,
                    tastes: guestProfile.tastes,
                    intents: guestProfile.intents,
                  }
                : null
            }
          />
        )}
      </div>
    </div>
  );
}
