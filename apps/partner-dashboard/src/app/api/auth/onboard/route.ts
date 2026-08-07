import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'Partner onboarding request submitted successfully',
    requestId: 'dummy-onboard-req-8899',
    status: 'pending_approval',
    onboardingComplete: false,
    submittedAt: new Date().toISOString(),
  });
}
