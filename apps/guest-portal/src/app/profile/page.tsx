import { ProfileEvents } from '@/features/profile/components/ProfileEvents';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { ProfileOverview } from '@/features/profile/components/ProfileOverview';
import { ProfileSectionNav } from '@/features/profile/components/ProfileSectionNav';
import { ProfileSettings } from '@/features/profile/components/ProfileSettings';
import { profileFixture } from '@/features/profile/fixtures/profile.fixture';

import type {
  ProfileEventFilter,
  ProfileSection,
  ProfileSettingsSection,
} from '@/features/profile/types/profile.types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile | THE C1RCLE',
  description: 'View your C1RCLE profile, events, and account settings.',
  robots: { follow: false, index: false },
};

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

export default async function ProfilePage({ searchParams }: ProfilePageProps = {}) {
  const params = (await searchParams) ?? {};
  const activeSection = resolveProfileSection(firstValue(params.view));
  const activeEventFilter = resolveEventFilter(firstValue(params.filter));
  const activeSettingsSection = resolveSettingsSection(firstValue(params.section));
  const profileEvents =
    activeEventFilter === 'attended'
      ? profileFixture.attendedEvents
      : profileFixture.upcomingEvents;

  return (
    <div className="relative z-10 min-h-screen px-4 pb-24 pt-28 text-white sm:px-6 sm:pt-32 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        <ProfileHeader identity={profileFixture.identity} />

        <div className="my-7 sm:my-9">
          <ProfileSectionNav activeSection={activeSection} />
        </div>

        {activeSection === 'overview' && <ProfileOverview profile={profileFixture} />}
        {activeSection === 'events' && (
          <ProfileEvents activeFilter={activeEventFilter} events={profileEvents} />
        )}
        {activeSection === 'settings' && (
          <ProfileSettings
            activeSection={activeSettingsSection}
            identity={profileFixture.identity}
          />
        )}
      </div>
    </div>
  );
}
