// Mock Firebase Auth client for pure UI mode
export function getFirebaseAuth() {
  return {
    currentUser: {
      uid: 'user_demo_123',
      email: 'partner@c1rcle.com',
      getIdToken: async (_forceRefresh?: boolean) => 'mock_token_123',
      getIdTokenResult: async () => ({
        claims: {},
      }),
    },
    signOut: async () => {},
  };
}

export function getFirebaseStorage() {
  return {};
}
