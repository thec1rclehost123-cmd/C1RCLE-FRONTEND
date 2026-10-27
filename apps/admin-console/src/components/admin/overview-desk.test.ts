import { describe, expect, it } from 'vitest';

import { toLiveStats } from './overview-desk';

describe('toLiveStats', () => {
  it('does not present a bounded refund page or admin page as an exhaustive aggregate', () => {
    const stats = toLiveStats(
      { pageInfo: { total: 3 } },
      { pageInfo: { total: 125 }, items: [{ amountPaise: 1_000 }, { amountPaise: 2_000 }] },
      { pageInfo: { total: 4 } },
      { pageInfo: { total: 150 }, items: [{ isActive: true }, { isActive: false }] },
    );

    expect(stats.refundValuePaise).toBe(3_000);
    expect(stats.refundValueHint).toBe('most recent 2 of 125 pending requests');
    expect(stats.activeAdmins).toBe(1);
    expect(stats.activeAdminsHint).toBe('most recent 2 of 150 admin accounts');
  });

  it('uses exhaustive language only when the page contains every record', () => {
    const stats = toLiveStats(
      { pageInfo: { total: 0 } },
      { pageInfo: { total: 1 }, items: [{ amountPaise: 5_000 }] },
      { pageInfo: { total: 0 } },
      { pageInfo: { total: 1 }, items: [{ isActive: true }] },
    );

    expect(stats.refundValueHint).toBe('across all pending requests');
    expect(stats.activeAdminsHint).toBe('across all admin accounts');
  });
});
