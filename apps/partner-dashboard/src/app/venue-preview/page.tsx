import { notFound } from 'next/navigation';

import PreviewClient from './PreviewClient';

/**
 * Dev-only shortcut for viewing Venue Studio without a signed-in venue partner.
 *
 * `/venue` is the real, auth-guarded route. This one renders the same dashboard
 * with stub identity so the UI can be reviewed locally, and 404s outside
 * development so it can never be reached in a deployed environment.
 */
export default function VenuePreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <PreviewClient />;
}
