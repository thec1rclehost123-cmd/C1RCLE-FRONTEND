import { beforeEach, describe, expect, it, vi } from 'vitest';

import PromoterOverviewPage from './page';

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));

vi.mock('next/navigation', () => ({ redirect }));

describe('legacy Promoter overview route', () => {
  beforeEach(() => redirect.mockClear());

  it('routes to the M3 overview that marks unsupported promoter metrics unavailable', () => {
    PromoterOverviewPage();
    expect(redirect).toHaveBeenCalledWith('/partner/promoter/overview');
  });
});
