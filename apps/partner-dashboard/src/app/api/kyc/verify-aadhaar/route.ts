import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    success: true,
    verified: true,
    name: 'Verified Partner Representative',
  });
}
