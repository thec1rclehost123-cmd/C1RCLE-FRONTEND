import { PresenceScreen } from '@/components/venue/screens/PresenceScreen';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Presence · Host Studio' };

export default function HostPresencePage() {
  return <PresenceScreen studio="host" tab="page" baseHref="/host/presence" />;
}