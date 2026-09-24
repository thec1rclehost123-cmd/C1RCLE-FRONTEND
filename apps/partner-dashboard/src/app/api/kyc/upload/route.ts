import { NextResponse } from 'next/server';

export function POST() {
  return NextResponse.json({
    success: true,
    url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=600&q=80',
    fileId: 'dummy-file-doc-123',
  });
}
