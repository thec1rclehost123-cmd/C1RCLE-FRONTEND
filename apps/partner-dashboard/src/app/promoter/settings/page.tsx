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
  const [profile, finance, links] = await Promise.all([
    partnerRepositories.promoter.getProfile(),
    tab === 'payout' ? partnerRepositories.promoter.getFinance() : Promise.resolve(null),
    tab === 'profile' ? partnerRepositories.promoter.getLinks() : Promise.resolve([]),
  ]);
  const accountParts = finance?.payoutAccount.split(' ');
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
        ...(finance
          ? {
              payout: {
                bankName: accountParts?.[0],
                maskedAccount: accountParts?.slice(1).join(' '),
                status:
                  finance.kycStatus === 'verified'
                    ? 'Verified'
                    : finance.kycStatus === 'pending'
                      ? 'Pending'
                      : 'Unavailable',
                nextPayout: finance.nextPayout,
              },
            }
          : {}),
      }}
      tab={tab}
    />
  );
}
