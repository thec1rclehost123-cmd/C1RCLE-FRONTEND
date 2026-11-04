import { proxyGuestOnboarding } from '@/lib/bff/guest-onboarding';

import type { NextRequest } from 'next/server';

export const GET = (req: NextRequest) => proxyGuestOnboarding(req, 'read');
export const PUT = (req: NextRequest) => proxyGuestOnboarding(req, 'save');
