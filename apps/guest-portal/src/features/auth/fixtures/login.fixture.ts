/**
 * Static content for the login hero panel, the signup onboarding choices, and
 * the demo email-verification code. The OTP is intentionally fixed at `123456`
 * — it gates the backend signup/login call locally without requiring real
 * email delivery. It never authenticates on its own; the session always comes
 * from the backend (`POST /api/auth/signup|login` → gateway `/api/v2/auth/*`).
 */
import type { LoginFixtureData } from '../types/login.types';

export const loginFixture: LoginFixtureData = {
  hero: {
    headline: ['GET IN', 'THE', 'C1RCLE'],
    tagline: 'DISCOVER LIFE OFFLINE',
  },
  availableCities: [
    'Pune',
    'Mumbai',
    'Delhi',
    'Bengaluru',
    'Goa',
    'Hyderabad',
    'Chennai',
    'Kolkata',
  ],
  tasteOptions: [
    'Underground electronic',
    'Live music',
    'Rooftops',
    'Art & culture',
    'Campus nights',
    'Food & pop-ups',
  ],
  intentOptions: ['Find events', 'Meet people', 'Follow hosts', 'Try something new'],
  defaultOtp: '123456',
};
