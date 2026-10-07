import { afterEach, describe, expect, it, vi } from 'vitest';

import { abandonWindow, preOpenWindow, showInWindow } from '@/lib/admin/document-window';

function fakeWindow(closed = false) {
  return { closed, opener: 'parent', close: vi.fn(), location: { href: '' } };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('document window', () => {
  it('opens about:blank synchronously and nulls the opener', () => {
    const w = fakeWindow();
    const open = vi.spyOn(window, 'open').mockReturnValue(w as unknown as Window);
    expect(preOpenWindow()).toBe(w);
    expect(open).toHaveBeenCalledWith('about:blank', '_blank');
    expect(w.opener).toBeNull();
  });

  it('returns null when the pop-up is blocked', () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    expect(preOpenWindow()).toBeNull();
  });

  it('navigates the pre-opened window to the signed URL', () => {
    const w = fakeWindow();
    showInWindow(w as unknown as Window, 'https://signed/url');
    expect(w.location.href).toBe('https://signed/url');
  });

  it('falls back to same-tab navigation when there is no window', () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { assign });
    showInWindow(null, 'https://signed/url');
    expect(assign).toHaveBeenCalledWith('https://signed/url');
  });

  it('closes the pre-opened window on failure', () => {
    const w = fakeWindow();
    abandonWindow(w as unknown as Window);
    expect(w.close).toHaveBeenCalledOnce();
    abandonWindow(null);
  });
});
