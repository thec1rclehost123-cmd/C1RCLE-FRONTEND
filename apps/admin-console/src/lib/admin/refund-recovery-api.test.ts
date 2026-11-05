import { beforeEach, describe, expect, it, vi } from 'vitest';

import { executeRefund, reconcileRefund, requestOriginalFeeReview } from './admin-api';

const post = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api', () => ({
  getAdminApiClient: () => ({ post }),
  getAdminBffClient: () => ({}),
  newIdempotencyKey: () => 'generated-intent-key',
}));
beforeEach(() => {
  post.mockReset();
  post.mockResolvedValue({});
});
describe('Admin refund reconciliation API', () => {
  it('sends only validated evidence and reason with the supplied stable key', async () => {
    await reconcileRefund(
      'refund/one',
      { providerRefundId: 'rfnd_actual', reason: 'Inspect original execution' },
      'stable-key',
    );
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/admin/refunds/refund%2Fone/reconcile',
        body: { providerRefundId: 'rfnd_actual', reason: 'Inspect original execution' },
        headers: { 'idempotency-key': 'stable-key' },
      }),
    );
  });
  it.each([
    { providerRefundId: 'pay_wrong', reason: 'reason' },
    { providerRefundId: 'rfnd_actual', reason: '   ' },
  ])('rejects invalid recovery evidence before issuing HTTP', (input) => {
    expect(() => reconcileRefund('refund-one', input)).toThrow();
    expect(post).not.toHaveBeenCalled();
  });
  it('requests original-fee policy review without any client amount or cause authority', async () => {
    await requestOriginalFeeReview('refund/one', 'stable-review-key');
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/admin/refunds/refund%2Fone/policy-remedy',
        headers: { 'idempotency-key': 'stable-review-key' },
      }),
    );
    expect(post.mock.calls[0]?.[0]).not.toHaveProperty('body');
  });
  it('allows the resume caller to retain its execution key on retry', async () => {
    await executeRefund('refund-one', 'resume-key');
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/admin/refunds/refund-one/execute',
        headers: { 'idempotency-key': 'resume-key' },
      }),
    );
  });
});
