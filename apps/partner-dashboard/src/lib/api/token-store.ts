let currentUser: { getIdToken: (forceRefresh?: boolean) => Promise<string> } | null = null;

export function getAccessToken(): string | null | Promise<string | null> {
  if (!currentUser) return null;
  return currentUser.getIdToken();
}

export function setCurrentUser(
  user: { getIdToken: (forceRefresh?: boolean) => Promise<string> } | null,
): void {
  currentUser = user;
}
