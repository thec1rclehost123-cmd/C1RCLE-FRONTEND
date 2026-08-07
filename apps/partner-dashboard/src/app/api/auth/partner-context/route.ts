import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    tabVisibility: {
      overview: true,
      events: true,
      guests: true,
      promoters: true,
      finance: true,
      settings: true,
    },
    actionPermissions: {
      canEditEvent: true,
      canApprovePromoter: true,
      canManageFinance: true,
    },
    piiPolicy: {
      canViewPhone: true,
      canViewEmail: true,
    },
    grantedPermissions: ['*'],
  });
}
