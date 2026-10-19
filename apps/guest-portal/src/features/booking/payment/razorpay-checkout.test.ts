import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { loadRazorpayScript, openRazorpayCheckout } from './razorpay-checkout';

type Options = ConstructorParameters<NonNullable<Window['Razorpay']>>[0];

/** A stand-in widget that lets each test drive the handler / dismiss / failure callbacks. */
function installWidget() {
  const state: { options?: Options; failed?: (r: { error?: { description?: string } }) => void } =
    {};
  const open = vi.fn();
  window.Razorpay = class {
    constructor(options: Options) {
      state.options = options;
    }
    open = open;
    on(_event: 'payment.failed', callback: (r: { error?: { description?: string } }) => void) {
      state.failed = callback;
    }
  };
  return { state, open };
}

const args = {
  keyId: 'rzp_test_key',
  orderId: 'order_1',
  amountPaise: 50_000,
  title: 'C1RCLE',
  description: 'Sky Night',
};

beforeEach(() => {
  delete window.Razorpay;
  document.head.innerHTML = '';
});

afterEach(() => {
  delete window.Razorpay;
});

describe('openRazorpayCheckout', () => {
  it('opens the widget with the server’s order, amount and key, in INR', async () => {
    const { state, open } = installWidget();

    const pending = openRazorpayCheckout(args);
    await vi.waitFor(() => {
      expect(open).toHaveBeenCalled();
    });

    expect(state.options).toMatchObject({
      key: 'rzp_test_key',
      order_id: 'order_1',
      amount: 50_000,
      currency: 'INR',
      name: 'C1RCLE',
      description: 'Sky Night',
    });
    state.options?.modal.ondismiss();
    await pending;
  });

  it('resolves "paid" with the three values Razorpay returns', async () => {
    const { state, open } = installWidget();

    const pending = openRazorpayCheckout(args);
    await vi.waitFor(() => {
      expect(open).toHaveBeenCalled();
    });
    state.options?.handler({
      razorpay_payment_id: 'pay_1',
      razorpay_order_id: 'order_1',
      razorpay_signature: 'sig_1',
    });

    expect(await pending).toEqual({
      kind: 'paid',
      paymentId: 'pay_1',
      orderId: 'order_1',
      signature: 'sig_1',
    });
  });

  it('resolves "dismissed" when the buyer closes the window', async () => {
    const { state, open } = installWidget();

    const pending = openRazorpayCheckout(args);
    await vi.waitFor(() => {
      expect(open).toHaveBeenCalled();
    });
    state.options?.modal.ondismiss();

    expect(await pending).toEqual({ kind: 'dismissed' });
  });

  it('keeps a failed attempt open for retry, and reports its reason only if the buyer then closes', async () => {
    const { state, open } = installWidget();
    let settled = false;

    const pending = openRazorpayCheckout(args).then((outcome) => {
      settled = true;
      return outcome;
    });
    await vi.waitFor(() => {
      expect(open).toHaveBeenCalled();
    });
    state.failed?.({ error: { description: 'Card declined' } });
    await Promise.resolve();

    expect(settled).toBe(false);
    state.options?.modal.ondismiss();
    expect(await pending).toEqual({ kind: 'dismissed', lastFailure: 'Card declined' });
  });

  it('lets a retry inside the widget succeed after an earlier failure', async () => {
    const { state, open } = installWidget();

    const pending = openRazorpayCheckout(args);
    await vi.waitFor(() => {
      expect(open).toHaveBeenCalled();
    });
    state.failed?.({ error: { description: 'Card declined' } });
    state.options?.handler({
      razorpay_payment_id: 'pay_2',
      razorpay_order_id: 'order_1',
      razorpay_signature: 'sig_2',
    });

    expect((await pending).kind).toBe('paid');
  });
});

describe('loadRazorpayScript', () => {
  it('does not add a script when the widget is already present', async () => {
    installWidget();

    await loadRazorpayScript();

    expect(document.head.querySelector('script')).toBeNull();
  });

  it('loads Razorpay’s own script exactly once, and can retry after a failure', async () => {
    const first = loadRazorpayScript();
    const second = loadRazorpayScript();
    const scripts = document.head.querySelectorAll('script');

    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.src).toBe('https://checkout.razorpay.com/v1/checkout.js');

    scripts[0]?.dispatchEvent(new Event('error'));
    await expect(first).rejects.toThrow(/payment window/i);
    await expect(second).rejects.toThrow(/payment window/i);

    const retry = loadRazorpayScript();
    expect(document.head.querySelectorAll('script')).toHaveLength(1);
    document.head.querySelector('script')?.dispatchEvent(new Event('load'));
    await expect(retry).resolves.toBeUndefined();
  });
});
