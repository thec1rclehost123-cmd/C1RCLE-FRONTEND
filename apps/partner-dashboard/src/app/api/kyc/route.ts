import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    success: true,
    entityType: 'business',
    kycStatus: 'in_progress',
    stepSequence: ['kyc_identity', 'kyc_business', 'kyc_signatory', 'bank_setup'],
    kycStepStatus: {
      kyc_identity: 'approved',
      kyc_business: 'in_progress',
      kyc_signatory: 'not_started',
      bank_setup: 'not_started',
    },
    kycStepData: {},
    kycAdminNotes: {},
    resubmissionReasons: {},
  });
}

export function PATCH() {
  return NextResponse.json({
    success: true,
    message: 'Verification step updated successfully',
  });
}
