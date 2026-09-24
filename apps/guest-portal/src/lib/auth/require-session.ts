import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getServerSession } from '@c1rcle/auth/server-session';

export async function requireGuestSession(returnTo: string) {
  noStore();
  const session = await getServerSession((await cookies()).toString());
  if (session === null) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return session;
}
