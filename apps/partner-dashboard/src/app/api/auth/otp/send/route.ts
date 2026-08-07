import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({
    success: true,
    message: `OTP sent successfully to ${body.recipient || 'recipient'} (Dummy Code: 123456)`,
  });
}
