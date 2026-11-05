import type { OrderDto } from '@c1rcle/contracts';

export interface OrderStatusPresentation {
  heading: string;
  label: string;
  amountLabel: string;
  ticketAccess: boolean;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
}

const ORDER_STATUS_PRESENTATION: Record<OrderDto['status'], OrderStatusPresentation> = {
  pending: {
    heading: 'Booking started',
    label: 'Pending',
    amountLabel: 'Amount due',
    ticketAccess: false,
    tone: 'neutral',
  },
  awaiting_payment: {
    heading: 'Payment processing',
    label: 'Processing',
    amountLabel: 'Amount pending',
    ticketAccess: false,
    tone: 'warning',
  },
  paid: {
    heading: 'You’re on the list.',
    label: 'Confirmed',
    amountLabel: 'Total paid',
    ticketAccess: true,
    tone: 'success',
  },
  expired: {
    heading: 'Booking expired',
    label: 'Expired',
    amountLabel: 'Order total',
    ticketAccess: false,
    tone: 'neutral',
  },
  cancelled: {
    heading: 'Booking cancelled',
    label: 'Cancelled',
    amountLabel: 'Order total',
    ticketAccess: false,
    tone: 'neutral',
  },
  failed: {
    heading: 'Payment failed',
    label: 'Failed',
    amountLabel: 'Attempted total',
    ticketAccess: false,
    tone: 'danger',
  },
  refund_requested: {
    heading: 'Refund processing',
    label: 'Refund pending',
    amountLabel: 'Original total',
    ticketAccess: false,
    tone: 'warning',
  },
  refunded: {
    heading: 'Booking refunded',
    label: 'Refunded',
    amountLabel: 'Original total',
    ticketAccess: false,
    tone: 'neutral',
  },
};

export function getOrderStatusPresentation(
  status: OrderDto['status'],
  fulfillmentState?: OrderDto['fulfillmentState'],
  admissionRefundState?: OrderDto['admissionRefundState'],
): OrderStatusPresentation {
  if (status === 'paid' && admissionRefundState === 'all')
    return {
      heading: 'Admissions refunded',
      label: 'Admissions refunded',
      amountLabel: 'Original total paid',
      ticketAccess: false,
      tone: 'neutral',
    };
  if (status === 'paid' && fulfillmentState === 'pending')
    return {
      heading: 'Booking processing',
      label: 'Processing',
      amountLabel: 'Total paid',
      ticketAccess: false,
      tone: 'warning',
    };
  if (status === 'paid' && admissionRefundState === 'partial')
    return {
      heading: 'Booking partially refunded',
      label: 'Partially refunded',
      amountLabel: 'Original total paid',
      ticketAccess: true,
      tone: 'warning',
    };
  return ORDER_STATUS_PRESENTATION[status];
}
