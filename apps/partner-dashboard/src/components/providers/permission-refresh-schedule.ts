export const PERMISSION_REFRESH_INTERVAL_MS = 30_000;
export const PERMISSION_VISIBILITY_STALE_MS = 60_000;

interface PermissionRefreshScheduleOptions {
  readonly refresh: () => Promise<void>;
  readonly getLastRefreshAt: () => number;
  readonly now?: () => number;
  readonly documentTarget?: Pick<
    Document,
    'visibilityState' | 'addEventListener' | 'removeEventListener'
  >;
  readonly windowTarget?: Pick<Window, 'setInterval' | 'clearInterval'>;
}

/**
 * Starts exactly one permission refresh schedule for an authenticated membership.
 * The returned cleanup owns both the interval and visibility listener.
 */
export function startPermissionRefreshSchedule({
  refresh,
  getLastRefreshAt,
  now = Date.now,
  documentTarget = document,
  windowTarget = window,
}: PermissionRefreshScheduleOptions): () => void {
  let disposed = false;
  let inFlight: Promise<void> | null = null;

  const refreshOnce = (): Promise<void> => {
    if (disposed || documentTarget.visibilityState !== 'visible') return Promise.resolve();
    if (inFlight) return inFlight;
    inFlight = refresh().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };

  const onInterval = () => {
    if (now() - getLastRefreshAt() < PERMISSION_REFRESH_INTERVAL_MS) return;
    void refreshOnce();
  };

  const onVisibilityChange = () => {
    if (
      documentTarget.visibilityState === 'visible' &&
      now() - getLastRefreshAt() >= PERMISSION_VISIBILITY_STALE_MS
    ) {
      void refreshOnce();
    }
  };

  const intervalId = windowTarget.setInterval(onInterval, PERMISSION_REFRESH_INTERVAL_MS);
  documentTarget.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    disposed = true;
    windowTarget.clearInterval(intervalId);
    documentTarget.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
