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
  const tab = requestedTab === 'presence' || requestedTab === 'identity' || requestedTab === 'payout' || requestedTab === 'security' ? requestedTab : 'profile';
  const [profile, finance, links, publicEvents, publicPartners] = await Promise.all([
    partnerRepositories.promoter.getProfile(),
    tab === 'payout' ? partnerRepositories.promoter.getFinance() : Promise.resolve(null),
    tab === 'identity' ? partnerRepositories.promoter.getLinks() : Promise.resolve([]),
    tab === 'presence' ? partnerRepositories.promoter.getLinkedEvents() : Promise.resolve([]),
    tab === 'presence' ? partnerRepositories.promoter.getPartners() : Promise.resolve([]),
  ]);
  const accountParts = finance?.payoutAccount.split(' ');
  const linkParts = links[0]?.shortUrl.split('/');
  return <PartnerSettingsScreen config={{
    roleLabel: 'Promoter',
    basePath: '/promoter/settings',
    tabs: [
      { id: 'profile', label: 'Promoter profile', icon: AccountIcon },
      { id: 'presence', label: 'Presence', icon: AccountIcon },
      { id: 'identity', label: 'Link identity', icon: AccountIcon },
      { id: 'payout', label: 'Payout account', icon: BankIcon },
      { id: 'security', label: 'Security', icon: LockedIcon },
    ],
    profile: {
      name: profile.name,
      handle: profile.handle,
      city: profile.city,
      bio: profile.bio,
      verified: profile.verified,
    },
    presence: {
      tagline: 'The city after dark, curated.',
      profileHref: `/public/promoter/${profile.id}`,
      events: publicEvents.filter((event) => event.status === 'active').map((event) => ({ id: event.id, name: event.name, date: event.date, time: event.time, venue: `${event.venue} · ${event.city}`, category: event.category, status: event.status })),
      partners: publicPartners.filter((partner) => partner.status === 'partnered').map((partner) => ({ id: partner.id, name: partner.name, role: partner.kind === 'venue' ? 'Venue' : 'Host' })),
      details: profile.categories.map((value) => ({ label: 'Focus', value })),
    },
    trackingIdentity: linkParts?.length && linkParts.length > 1 ? linkParts[1] : undefined,
    ...(finance
      ? {
          payout: {
            bankName: accountParts?.[0],
            maskedAccount: accountParts?.slice(1).join(' '),
            status: finance.kycStatus === 'verified' ? 'Verified' : finance.kycStatus === 'pending' ? 'Pending' : 'Unavailable',
            nextPayout: finance.nextPayout,
          },
        }
      : {}),
  }} tab={tab} />;
}
