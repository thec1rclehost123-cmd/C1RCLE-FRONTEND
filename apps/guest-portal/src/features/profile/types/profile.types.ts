export type ProfileSection = 'overview' | 'events' | 'settings';
export type ProfileEventFilter = 'upcoming' | 'attended';
export type ProfileSettingsSection = 'personal' | 'account';
export type PublicProfileTone = 'orange' | 'red' | 'purple';

export interface ProfileIdentity {
  id: string;
  displayName: string;
  initials: string;
  email: string;
  phoneNumber: string;
  city: string;
  instagram: string;
  gender: string;
  memberSince: string;
  badges: readonly string[];
  signInMethod: string;
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

export interface ProfileFixture {
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
