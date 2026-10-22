import type { ProfileEventSummary, ProfileIdentity, ProfileView } from './types/profile.types';
import type { EntitlementDto, EventDto, GuestProfileDto, User, VenueDto } from '@c1rcle/contracts';

const FALLBACK_POSTER = '/c1rcle-logo.webp';

export interface ProfileEventDetails {
  event: EventDto;
  venue: VenueDto | null;
}

/**
 * ─── Live profile view model ─────────────────────────────────────────────────
 *
 * Pure mapping from the APIs that back `/profile` into the screen's own shape,
 * so the components stay presentational and this is the only place that knows
 * which field came from where.
 *
 * Identity is composed from two reads: the **session user** (id, email) and
 * `GET /profile/me` (displayName, city, createdAt → "joined"). Fields with no
 * endpoint (`phoneNumber`, `instagram`, `gender`, `signInMethod`) are left
 * absent rather than filled with a fixture value, and the screen omits their
 * rows.
 */

/** Two uppercase letters from the display name, falling back to `?`. */
export function deriveInitials(displayName: string): string {
  const words = displayName.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const second = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return `${first}${second}`.toUpperCase() || '?';
}

export function toProfileIdentity(
  user: User | null,
  profile: GuestProfileDto | null,
): ProfileIdentity {
  const displayName =
    [profile?.displayName, user?.displayName]
      .map((name) => name?.trim())
      .find((name) => name !== undefined && name !== '') ?? 'Guest';
  return {
    id: user?.id ?? profile?.userId ?? '',
    displayName,
    initials: deriveInitials(displayName),
    email: user?.email ?? '',
    city: profile?.city ?? '',
    badges: ['Member'],
    ...(profile?.createdAt ? { memberSince: profile.createdAt } : {}),
  };
}

/**
 * Groups the caller's entitlements by order + tier (one card per bundle) and
 * resolves each card's event display data through `resolve`. Entitlements whose
 * event no longer resolves are skipped, never invented — the same recency split
 * as the ticket wallet: a card is attended once it can no longer admit anyone
 * (`redeemed`/`void`) or its event has ended; otherwise it is upcoming.
 */
export async function toProfileEvents(
  entitlements: readonly EntitlementDto[],
  resolve: (eventId: string) => Promise<ProfileEventDetails | null>,
  now: Date = new Date(),
): Promise<Pick<ProfileView, 'upcomingEvents' | 'attendedEvents'>> {
  const groups = new Map<string, EntitlementDto[]>();
  for (const entitlement of entitlements) {
    const key = `${entitlement.orderId}::${entitlement.tierId}`;
    const group = groups.get(key);
    if (group) {
      group.push(entitlement);
    } else {
      groups.set(key, [entitlement]);
    }
  }

  const cache = new Map<string, Promise<ProfileEventDetails | null>>();
  const detailsOf = (eventId: string): Promise<ProfileEventDetails | null> => {
    const cached = cache.get(eventId);
    if (cached) return cached;
    const fetched = resolve(eventId);
    cache.set(eventId, fetched);
    return fetched;
  };

  const upcomingEvents: ProfileEventSummary[] = [];
  const attendedEvents: ProfileEventSummary[] = [];

  for (const [key, group] of groups) {
    const first = group[0];
    if (!first) continue;
    const details = await detailsOf(first.eventId);
    if (!details) continue;

    const { event, venue } = details;
    const canAdmit = group.some(
      (entitlement) => entitlement.status !== 'redeemed' && entitlement.status !== 'void',
    );
    const endsAt = event.endAt ?? event.startAt;
    const parsedEnd = Date.parse(endsAt);
    const ended = Number.isNaN(parsedEnd) ? false : parsedEnd <= now.getTime();

    const summary: ProfileEventSummary = {
      id: key,
      slug: event.slug,
      title: event.title,
      image: event.imageUrl ?? FALLBACK_POSTER,
      startsAt: event.startAt,
      venue: venue?.name ?? 'Venue TBA',
      city: venue?.city ?? '',
      participationLabel: first.tierName,
    };

    if (canAdmit && !ended) {
      upcomingEvents.push(summary);
    } else {
      attendedEvents.push(summary);
    }
  }

  return { upcomingEvents, attendedEvents };
}
