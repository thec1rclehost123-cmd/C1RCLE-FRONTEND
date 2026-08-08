'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';
import { VenueStudio } from '@/components/venue/VenueStudio';

function Splash({ label }: { readonly label: string }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-border-subtle border-t-white rounded-full animate-spin mb-4" />
      <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em]">{label}</p>
    </div>
  );
}

const initialsFrom = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'C1';

export function VenuePageClient() {
  const router = useRouter();
  const auth = useDashboardAuth();
  const { loading, profile, isApproved, isBanned } = auth;
  const user: unknown = auth.user;

  const membership = profile?.activeMembership ?? null;
  const partnerType = membership?.partnerType ?? null;

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (isBanned) {
      router.replace('/login');
      return;
    }

    // Not through onboarding/approval yet — the onboarding flow owns this user.
    if (!isApproved) {
      router.replace('/onboard');
      return;
    }

    // Signed in as a different partner type: send them to their own dashboard
    // rather than showing venue-only tooling.
    if (partnerType && partnerType !== 'venue') {
      router.replace(`/${partnerType}`);
    }
  }, [loading, user, isApproved, isBanned, partnerType, router]);

  if (loading) return <Splash label="Authorizing Access" />;
  if (!user || isBanned || !isApproved) return <Splash label="Redirecting" />;
  if (partnerType && partnerType !== 'venue') return <Splash label="Redirecting" />;

  const displayName = membership?.partnerName ?? profile?.displayName ?? 'Venue';

  return <VenueStudio initials={initialsFrom(displayName)} venueName={displayName} />;
}
