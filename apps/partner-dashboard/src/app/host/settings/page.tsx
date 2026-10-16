import { redirect } from 'next/navigation';

import { AccountIcon, BankIcon, CalendarIcon, LockedIcon } from '@c1rcle/icons';

import { hostAvailability, hostProfile } from '@/components/host/host-studio-model';
import { PartnerSettingsScreen } from '@/components/partner-shell/PartnerSettingsScreen';

export default async function HostSettingsPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestedTab = params['tab'];
  const tab =
    requestedTab === 'account' ||
    requestedTab === 'availability' ||
    requestedTab === 'payout' ||
    requestedTab === 'security'
      ? requestedTab
      : 'profile';
  if (tab === 'payout') redirect('/partner/host/finance?view=bank');
  return (
    <PartnerSettingsScreen
      config={{
        roleLabel: 'Host',
        basePath: '/host/settings',
        tabs: [
          { id: 'profile', label: 'Host profile', icon: AccountIcon },
          { id: 'account', label: 'Account', icon: AccountIcon },
          { id: 'availability', label: 'Availability', icon: CalendarIcon },
          { id: 'payout', label: 'Payout account', icon: BankIcon },
          { id: 'security', label: 'Security', icon: LockedIcon },
        ],
        profile: {
          name: hostProfile.name,
          handle: hostProfile.handle,
          city: hostProfile.city,
          phone: hostProfile.phone,
          email: hostProfile.email,
          bio: hostProfile.bio,
          verified: hostProfile.verified,
        },
        account: { email: hostProfile.email, phone: hostProfile.phone },
        availability: hostAvailability.slots.map((slot) => ({
          label: slot.label,
          time: slot.time,
          venue: hostAvailability.venueName,
        })),
      }}
      tab={tab}
    />
  );
}
