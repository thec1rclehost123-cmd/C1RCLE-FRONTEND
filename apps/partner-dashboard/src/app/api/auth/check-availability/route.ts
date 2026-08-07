import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: true, available: true });
}

export async function POST() {
  return NextResponse.json({ success: true, available: true, taken: [] });
}
