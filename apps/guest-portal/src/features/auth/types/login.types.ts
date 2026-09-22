export type AuthMode = 'login' | 'signup';

export type AuthStep =
  | 'credentials'
  | 'verify_otp'
  | 'identity'
  | 'city'
  | 'tastes'
  | 'intent'
  | 'complete';

export interface LoginFormState {
  email: string;
  password: string;
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
  defaultOtp: string;
}

export interface LoginStatusState {
  type: 'idle' | 'info' | 'error';
  message?: string;
}
