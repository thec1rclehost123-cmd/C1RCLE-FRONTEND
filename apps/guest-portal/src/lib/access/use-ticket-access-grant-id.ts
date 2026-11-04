'use client';

import { useSyncExternalStore } from 'react';

function currentGrantId(): string | undefined {
  const grantId = new URLSearchParams(window.location.hash.slice(1)).get('accessGrantId');
  return grantId && /^[A-Za-z0-9_-]{1,64}$/.test(grantId) ? grantId : undefined;
}

function subscribeToHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => {
    window.removeEventListener('hashchange', onChange);
  };
}

export function useTicketAccessGrantId(): string | undefined {
  return useSyncExternalStore(subscribeToHash, currentGrantId, () => undefined);
}
