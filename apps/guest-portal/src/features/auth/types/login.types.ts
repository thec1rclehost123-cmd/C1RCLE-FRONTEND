// FIXTURE_ONLY: Temporary UI presentation types for Login page.

export type AuthMode = 'login' | 'signup';

export type AuthStep =
  | 'credentials'
  | 'phone'
  | 'name'
  | 'age'
  | 'gender'
  | 'city'
  | 'verify_otp';

export interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export interface LoginFormState {
  email: string;
  password: string;
  phone: string;
  country: string;
  name: string;
  age: string;
  gender: string;
  city: string;
  otp: string;
}

export interface LoginFixtureData {
  hero: {
    headline: string[];
    tagline: string;
  };
  availableCities: string[];
  demoUser: {
    email: string;
    name: string;
    phone: string;
    age: number;
    gender: string;
    city: string;
  };
  supportedCountries: CountryOption[];
  defaultOtp: string;
}

export interface LoginStatusState {
  type: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}
