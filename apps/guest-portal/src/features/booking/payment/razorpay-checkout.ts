/**
 * Browser wrapper around Razorpay's hosted Checkout widget. The widget is loaded
 * on demand from Razorpay's own origin (never bundled), and card, UPI and bank
 * details are entered inside Razorpay's frame: they never touch this app.
 */

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

export interface RazorpaySuccessResponse {
  readonly razorpay_payment_id: string;
  readonly razorpay_order_id: string;
  readonly razorpay_signature: string;
}

interface RazorpayFailureResponse {
  readonly error?: { readonly description?: string };
}

interface RazorpayWidgetOptions {
  readonly key: string;
  readonly order_id: string;
  readonly amount: number;
  readonly currency: 'INR';
  readonly name: string;
  readonly description: string;
  readonly prefill?: { readonly name?: string; readonly email?: string; readonly contact?: string };
  readonly theme?: { readonly color: string };
  readonly handler: (response: RazorpaySuccessResponse) => void;
  readonly modal: { readonly ondismiss: () => void };
}

interface RazorpayWidget {
  open(): void;
  on(event: 'payment.failed', callback: (response: RazorpayFailureResponse) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayWidgetOptions) => RazorpayWidget;
  }
}

let loading: Promise<void> | null = null;

/** Loads Razorpay's script once; a failed load can be retried by calling again. */
export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window.'));
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      script.remove();
      loading = null;
      reject(new Error('Could not load the payment window.'));
    };
    document.head.append(script);
  });
  return loading;
}

export type RazorpayOutcome =
  | {
      readonly kind: 'paid';
      readonly paymentId: string;
      readonly orderId: string;
      readonly signature: string;
    }
  | { readonly kind: 'dismissed'; readonly lastFailure?: string };

export interface OpenCheckoutArgs {
  readonly keyId: string;
  readonly orderId: string;
  readonly amountPaise: number;
  readonly title: string;
  readonly description: string;
  readonly prefill?: { readonly name?: string; readonly email?: string; readonly contact?: string };
}

/**
 * Opens the widget and resolves exactly once: `paid` with the three values
 * Razorpay returns, or `dismissed` when the buyer closes it. A failed attempt
 * inside the widget does not resolve (Razorpay lets the buyer retry in place);
 * its reason is only kept so that closing afterwards can report it.
 */
export async function openRazorpayCheckout(args: OpenCheckoutArgs): Promise<RazorpayOutcome> {
  await loadRazorpayScript();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error('The payment window is unavailable.');

  return new Promise<RazorpayOutcome>((resolve) => {
    let lastFailure: string | undefined;
    const widget = new Razorpay({
      key: args.keyId,
      order_id: args.orderId,
      amount: args.amountPaise,
      currency: 'INR',
      name: args.title,
      description: args.description,
      ...(args.prefill ? { prefill: args.prefill } : {}),
      theme: { color: '#111111' },
      handler: (response) => {
        resolve({
          kind: 'paid',
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => {
          resolve(
            lastFailure === undefined ? { kind: 'dismissed' } : { kind: 'dismissed', lastFailure },
          );
        },
      },
    });
    widget.on('payment.failed', (response) => {
      lastFailure = response.error?.description;
    });
    widget.open();
  });
}
