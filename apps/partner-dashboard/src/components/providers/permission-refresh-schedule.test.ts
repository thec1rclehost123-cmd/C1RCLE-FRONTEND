import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  PERMISSION_REFRESH_INTERVAL_MS,
  PERMISSION_VISIBILITY_STALE_MS,
  startPermissionRefreshSchedule,
} from './permission-refresh-schedule';

class VisibilityTarget extends EventTarget {
  visibilityState: DocumentVisibilityState = 'visible';
}

afterEach(() => {
  vi.useRealTimers();
});

describe('permission refresh schedule', () => {
  it('creates one interval and cleans it up on provider unmount or logout', () => {
    vi.useFakeTimers();
    const target = new VisibilityTarget();
    const clearInterval = vi.spyOn(window, 'clearInterval');
    const cleanup = startPermissionRefreshSchedule({
      refresh: vi.fn().mockResolvedValue(undefined),
      getLastRefreshAt: () => Date.now(),
      documentTarget: target,
    });
    expect(vi.getTimerCount()).toBe(1);
    cleanup();
    expect(clearInterval).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not refresh while hidden and resumes only when stale', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(100_000);
    const target = new VisibilityTarget();
    target.visibilityState = 'hidden';
    const refresh = vi.fn().mockResolvedValue(undefined);
    let lastRefreshAt = Date.now();
    const cleanup = startPermissionRefreshSchedule({
      refresh: async () => {
        await refresh();
        lastRefreshAt = Date.now();
      },
      getLastRefreshAt: () => lastRefreshAt,
      documentTarget: target,
    });

    await vi.advanceTimersByTimeAsync(PERMISSION_VISIBILITY_STALE_MS + 1);
    expect(refresh).not.toHaveBeenCalled();

    target.visibilityState = 'visible';
    target.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    expect(refresh).toHaveBeenCalledOnce();

    target.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(PERMISSION_REFRESH_INTERVAL_MS - 1);
    expect(refresh).toHaveBeenCalledOnce();
    cleanup();
  });

  it('deduplicates an in-flight interval and visibility refresh', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(200_000);
    const target = new VisibilityTarget();
    let resolveRefresh: (() => void) | undefined;
    const refresh = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    const cleanup = startPermissionRefreshSchedule({
      refresh,
      getLastRefreshAt: () => 0,
      documentTarget: target,
    });

    await vi.advanceTimersByTimeAsync(PERMISSION_REFRESH_INTERVAL_MS);
    target.dispatchEvent(new Event('visibilitychange'));
    expect(refresh).toHaveBeenCalledOnce();
    resolveRefresh?.();
    await Promise.resolve();
    cleanup();
  });
});
