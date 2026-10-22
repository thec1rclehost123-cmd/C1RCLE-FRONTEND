import { PrivateDataUnavailable } from '@/components/private/PrivateDataUnavailable';
import { ProfileClient } from '@/features/profile/components/ProfileClient';
import { requireGuestSession } from '@/lib/auth/require-session';
import { buildPrivateMetadata } from '@/lib/seo/metadata';
import { isProductionSeo } from '@/lib/seo/site';

import type {
  ProfileEventFilter,
  ProfileSection,
  ProfileSettingsSection,
} from '@/features/profile/types/profile.types';
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

/**
 * The session is enforced here (server) and the `user` is handed to
 * `ProfileClient`, so the header shows real identity on the first paint while
 * the profile document and the guest's events are read on the client — the same
 * BFF/public-read split the tickets screen uses. No fixture data is involved.
 */
export default async function ProfilePage({ searchParams }: ProfilePageProps = {}) {
  const { user } = await requireGuestSession('/profile');
  if (isProductionSeo()) return <PrivateDataUnavailable title="Profile unavailable" />;
  const params = (await searchParams) ?? {};
  const activeSection = resolveProfileSection(firstValue(params.view));
  const activeEventFilter = resolveEventFilter(firstValue(params.filter));
  const activeSettingsSection = resolveSettingsSection(firstValue(params.section));

  return (
    <ProfileClient
      user={user}
      activeSection={activeSection}
      activeEventFilter={activeEventFilter}
      activeSettingsSection={activeSettingsSection}
    />
  );
}
