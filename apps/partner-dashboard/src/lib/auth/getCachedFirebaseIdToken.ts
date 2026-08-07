export async function getCachedFirebaseIdToken(user: any): Promise<string> {
  if (!user) return '';
  try {
    if (typeof user.getIdToken === 'function') {
      return await user.getIdToken();
    }
  } catch (err) {
    console.error('Error fetching cached Firebase ID token:', err);
  }
  return '';
}
