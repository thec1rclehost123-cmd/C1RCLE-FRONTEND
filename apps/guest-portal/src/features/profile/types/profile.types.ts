export type ProfileSection = 'overview' | 'events' | 'settings';
export type ProfileEventFilter = 'upcoming' | 'attended';
export type ProfileSettingsSection = 'personal' | 'account';
export type PublicProfileTone = 'orange' | 'red' | 'purple';

/**
 * The signed-in guest's identity.
 *
 * `displayName`, `email` and `city` are the only fields the API can answer for
 * every guest (`email` from the session, the rest from `GET /profile/me`). The
 * rest are optional because no endpoint currently exposes them — a live profile
 * renders what it has and omits the rows it cannot fill, rather than showing a
 * fixture placeholder next to real data.
 */
export interface ProfileIdentity {
  id: string;
  displayName: string;
  initials: string;
  email: string;
  city: string;
  badges: readonly string[];
  memberSince?: string;
  phoneNumber?: string;
  instagram?: string;
  gender?: string;
  signInMethod?: string;
}

export interface ProfileEventSummary {
  id: string;
  slug: string;
  title: string;
  image: string;
  startsAt: string;
  venue: string;
  city: string;
  participationLabel: string;
}

/** The live profile view model — session identity + profile + wallet events. */
export interface ProfileView {
  identity: ProfileIdentity;
  upcomingEvents: readonly ProfileEventSummary[];
  attendedEvents: readonly ProfileEventSummary[];
}

export interface PublicProfileIdentity {
  id: string;
  displayName: string;
  initials: string;
  city: string;
  instagram?: string;
  bio: string;
  memberSince: string;
  badges: readonly string[];
  interests: readonly string[];
  tone: PublicProfileTone;
}

export interface PublicProfileFixture {
  identity: PublicProfileIdentity;
  upcomingEvents: readonly ProfileEventSummary[];
  attendedEvents: readonly ProfileEventSummary[];
}
