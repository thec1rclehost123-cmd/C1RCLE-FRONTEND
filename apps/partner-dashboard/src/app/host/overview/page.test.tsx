import { beforeEach, describe, expect, it, vi } from 'vitest';

import HostOverviewPage from './page';

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));

vi.mock('next/navigation', () => ({ redirect }));

describe('legacy Host overview route', () => {
  beforeEach(() => redirect.mockClear());

  it('routes to the M3 organization-backed overview instead of rendering fixture metrics', () => {
    HostOverviewPage();
    expect(redirect).toHaveBeenCalledWith('/partner/host/overview');
  });
});
