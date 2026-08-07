import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    profile: {
      uid: 'user_demo_123',
      email: 'partner@c1rcle.com',
      displayName: 'Demo Partner Host',
      isApproved: true,
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({
    success: true,
    profile: body,
  });
}
