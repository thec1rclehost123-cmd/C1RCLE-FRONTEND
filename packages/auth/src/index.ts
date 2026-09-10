// Session store exports
export { useSessionStore, useSession, getAccessToken, setSession, clearSession, markAnonymous, markHydrated } from './session-store.js';
export type { SessionState, SessionStatus } from './session-store.js';

// Auth client exports
export { signup, login, refresh, logout, fetchSession } from './auth-client.js';

// Note: server-session is exported separately via the "./server-session" export in package.json
// to ensure it never reaches the browser bundle
