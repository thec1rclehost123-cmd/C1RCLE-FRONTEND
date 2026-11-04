import { proxyGuestOnboarding } from '@/lib/bff/guest-onboarding';

import type { NextRequest } from 'next/server';

export const POST = (req: NextRequest) => proxyGuestOnboarding(req, 'phone');
