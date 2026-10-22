import { redirect } from 'next/navigation';

import { AccountIcon, BankIcon, LockedIcon } from '@c1rcle/icons';

import { PartnerSettingsScreen } from '@/components/partner-shell/PartnerSettingsScreen';
import { partnerRepositories } from '@/lib/partner/repositories';

export default async function PromoterSettingsPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestedTab = params['tab'];
  const tab = requestedTab === 'payout' || requestedTab === 'security' ? requestedTab : 'profile';
  if (tab === 'payout') redirect('/partner/promoter/finance?view=bank');
  const [profile, links] = await Promise.all([
    partnerRepositories.promoter.getProfile(),
    tab === 'profile' ? partnerRepositories.promoter.getLinks() : Promise.resolve([]),
  ]);
  const linkParts = links[0]?.shortUrl.split('/');
  return (
    <PartnerSettingsScreen
      config={{
        roleLabel: 'Promoter',
        basePath: '/promoter/settings',
        tabs: [
          { id: 'profile', label: 'Promoter profile', icon: AccountIcon },
          { id: 'payout', label: 'Payout account', icon: BankIcon },
          { id: 'security', label: 'Security', icon: LockedIcon },
        ],
        profile: {
          name: profile.name,
          handle: profile.handle,
          city: profile.city,
          bio: profile.bio,
          verified: profile.verified,
          linkIdentity: linkParts?.length && linkParts.length > 1 ? linkParts[1] : undefined,
        },
      }}
      tab={tab}
    />
  );
}
