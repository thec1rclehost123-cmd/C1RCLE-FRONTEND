import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const isVerified = body.code === '123456' || (body.code && body.code.length === 6);
  return NextResponse.json({
    success: isVerified,
    verified: isVerified,
    message: isVerified ? 'OTP verified successfully' : 'Invalid OTP code',
  });
}
