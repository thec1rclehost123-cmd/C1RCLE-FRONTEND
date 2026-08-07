import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email } = body;

  return NextResponse.json({
    success: true,
    uid: 'user_demo_' + Date.now(),
    customToken: 'mock_custom_token_' + Date.now(),
    email: email || 'partner@c1rcle.com',
  });
}
