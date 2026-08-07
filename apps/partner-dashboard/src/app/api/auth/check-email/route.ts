import { NextResponse } from 'next/server';

export async function POST(_req: Request) {
  // Returns exists: false by default for seamless new user onboarding
  return NextResponse.json({
    success: true,
    exists: false,
  });
}
