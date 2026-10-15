import { Badge } from './Badge';

/**
 * Shared fixture-data disclosure.
 *
 * Every screen fed by `fixturePartnerDataSource` renders one of these so demo
 * numbers are never mistaken for real ones. The gate is the data's own
 * `dataStatus`, so the badge can only ever describe what is actually on screen:
 * a screen that has been wired to the API passes `'api'`/`'live'` and the badge
 * disappears rather than lying. `'unavailable'` (a shell can have no data at
 * all) also renders nothing — there is no data to disclaim.
 */
export function FixtureBadge({
  dataStatus,
  className,
}: {
  readonly dataStatus?: 'fixture' | 'api' | 'live' | 'unavailable' | null;
  readonly className?: string;
}) {
  if (dataStatus !== 'fixture') return null;
  return (
    <Badge tone="warning" {...(className ? { className } : {})}>
      Fixture data
    </Badge>
  );
}
