import { renderStudioSkeleton } from '../route-helpers';

/**
 * Catch a legacy deep link after the redirect rules have moved it into the
 * connected studio namespace. An explicit unavailable state is safer than
 * reviving the old fixture-backed screen or silently routing the user to a
 * different operational workflow.
 */
export default async function LegacyStudioRoutePage({
  params,
}: {
  readonly params: Promise<{ studio: string; legacy: string[] }>;
}) {
  const { studio, legacy } = await params;
  return renderStudioSkeleton(
    Promise.resolve({ studio }),
    'Legacy workspace route',
    `“/${legacy.join('/')}” is not available in the connected workspace. Use the current navigation to continue.`,
  );
}
