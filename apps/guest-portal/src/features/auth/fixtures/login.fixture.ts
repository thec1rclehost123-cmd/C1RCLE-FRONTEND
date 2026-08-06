// FIXTURE_ONLY: Temporary UI development data.
// Must not be used as a production API fallback.

import type { LoginFixtureData } from '../types/login.types';

export const loginFixture: LoginFixtureData = {
  hero: {
    headline: ['GET IN', 'THE', 'C1RCLE'],
    tagline: 'DISCOVER LIFE OFFLINE',
  },
  availableCities: ['Mumbai', 'Pune', 'Bengaluru', 'Goa'],
  demoUser: {
    email: 'guest@thec1rcle.com',
    name: 'Aayush Sharma',
    phone: '+919876543210',
    age: 24,
    gender: 'Male',
    city: 'Mumbai',
  },
  supportedCountries: [
    { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
    { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
    { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  ],
  defaultOtp: '123456',
};
