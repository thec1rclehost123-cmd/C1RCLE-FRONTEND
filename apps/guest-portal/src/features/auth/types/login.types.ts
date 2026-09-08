// FIXTURE_ONLY: Temporary UI presentation types for the Login page.

export type AuthProviderPreview = 'apple' | 'google' | 'phone' | null;

export type AuthStep =
  'methods' | 'phone' | 'verify_otp' | 'identity' | 'city' | 'tastes' | 'intent' | 'complete';

export interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export interface LoginFormState {
  phone: string;
  country: string;
  otp: string;
  name: string;
  dateOfBirth: string;
  city: string;
  tastes: string[];
  intents: string[];
}

export interface LoginFixtureData {
  hero: {
    headline: string[];
    tagline: string;
  };
  availableCities: string[];
  tasteOptions: string[];
  intentOptions: string[];
  supportedCountries: CountryOption[];
  defaultOtp: string;
}

export interface LoginStatusState {
  type: 'idle' | 'info' | 'error';
  message?: string;
}
