// FIXTURE_ONLY: Temporary UI development data.
// Must not be used as a production API fallback.

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
  intentOptions: [
    'Find events',
    'Meet people',
    'Follow hosts',
    'Try something new',
  ],
  supportedCountries: [
    { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
    { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
    { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  ],
  defaultOtp: '123456',
};
