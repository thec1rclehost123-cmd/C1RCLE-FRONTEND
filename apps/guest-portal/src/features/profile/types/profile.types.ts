export type ProfileSection = 'overview' | 'events' | 'settings';
export type ProfileEventFilter = 'upcoming' | 'attended';
export type ProfileSettingsSection = 'personal' | 'account';
export type PublicProfileTone = 'orange' | 'red' | 'purple';

export interface ProfileIdentity {
  id: string;
  displayName: string;
  initials: string;
  avatarUrl?: string | null;
  email: string;
  phoneNumber: string | null;
  city: string | null;
  instagram: string | null;
  gender: string | null;
  memberSince: string | null;
  badges: readonly string[];
  signInMethod: string;
}

export interface ProfileEventSummary {
  id: string;
  slug: string;
  detailHref?: string;
  title: string;
  image: string;
  startsAt: string;
  venue: string;
  city: string;
  participationLabel: string;
  bookingReference?: string;
  bookingHref?: string;
  amountPaise?: number;
}

export interface ProfileFixture {
  identity: ProfileIdentity;
  upcomingEvents: readonly ProfileEventSummary[];
  attendedEvents: readonly ProfileEventSummary[];
  orderHistoryAvailable?: boolean;
  attendanceHistoryAvailable?: boolean;
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
