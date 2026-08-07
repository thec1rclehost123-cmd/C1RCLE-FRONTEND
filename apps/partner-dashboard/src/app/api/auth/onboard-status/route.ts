import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    status: 'pending_approval',
    onboardingComplete: false,
    requestId: 'dummy-onboard-req-8899',
    request: {
      id: 'dummy-onboard-req-8899',
      status: 'pending_approval',
      type: 'venue',
    },
  });
}
