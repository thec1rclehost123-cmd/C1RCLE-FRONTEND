import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

const mockSessionState = {
  session: null,
  accessToken: null,
  status: 'anonymous' as 'anonymous' | 'authenticated' | 'unknown',
  clearSession: vi.fn(() => {
    Object.assign(mockSessionState, {
      session: null,
      accessToken: null,
      status: 'anonymous',
    });
  }),
  markAnonymous: vi.fn(() => {
    Object.assign(mockSessionState, {
      session: null,
      accessToken: null,
      status: 'anonymous',
    });
  }),
  setSession: vi.fn(),
};

const setState = vi.fn((newState: Partial<typeof mockSessionState>) => {
  Object.assign(mockSessionState, newState);
});

vi.mock('@c1rcle/auth', () => ({
  clearSession: () => {
    mockSessionState.clearSession();
  },
  getAccessToken: () => mockSessionState.accessToken,
  login: vi.fn(() => Promise.resolve()),
  signup: vi.fn(() => Promise.resolve()),
  logout: vi.fn(() => {
    mockSessionState.clearSession();
    return Promise.resolve();
  }),
  refresh: vi.fn(() => Promise.resolve(false)),
  fetchSession: vi.fn(() => Promise.resolve()),
  markAnonymous: () => {
    mockSessionState.markAnonymous();
  },
  markHydrated: vi.fn(),
  setSession: vi.fn(),
  useSession: () => ({
    isAuthenticated: mockSessionState.status === 'authenticated',
    isLoading: mockSessionState.status === 'unknown',
    session: mockSessionState.session,
    user: null,
  }),
  useSessionStore: Object.assign(
    () => mockSessionState,
    {
      getState: () => mockSessionState,
      setState,
    },
  ),
}));

vi.mock('@c1rcle/providers', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});
