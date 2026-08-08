import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

export function GET(req: NextRequest) {
  const headerType = req.headers.get('x-user-type');
  const queryType = req.nextUrl.searchParams.get('type');
  const referer = req.headers.get('referer') ?? '';

  let validUserType = 'venue';
  if (headerType === 'host' || queryType === 'host' || referer.includes('/host')) {
    validUserType = 'host';
  } else if (
    headerType === 'promoter' ||
    queryType === 'promoter' ||
    referer.includes('/promoter')
  ) {
    validUserType = 'promoter';
  } else if (headerType === 'venue' || queryType === 'venue' || referer.includes('/venue')) {
    validUserType = 'venue';
  }

  const partnerName =
    validUserType === 'host'
      ? 'Apex Host Agency'
      : validUserType === 'promoter'
        ? 'Vibe Promoters'
        : 'Club Zenith';

  return NextResponse.json({
    success: true,
    user: {
      uid: 'user_demo_123',
      email: 'partner@c1rcle.com',
      displayName: `Demo ${validUserType.toUpperCase()} Partner`,
      role: validUserType,
      // Required by DashboardAuthProvider: without it `isApproved` stays false
      // and the login screen signs the user back out as "no partner access".
      isApproved: true,
      isBanned: false,
      kycStatus: 'verified',
      onboardingEntityType: validUserType,
      subscriptionPlan: 'pro',
      venueId: validUserType === 'venue' ? 'venue_demo_001' : undefined,
      activeMembership: {
        partnerId: `partner_${validUserType}_001`,
        partnerName,
        partnerType: validUserType,
        role: 'owner',
        status: 'active',
      },
    },
    activeMembership: {
      partnerId: `partner_${validUserType}_001`,
      partnerName,
      partnerType: validUserType,
      role: 'owner',
      status: 'active',
    },
    onboarding: null,
  });
}
