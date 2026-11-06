import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PromoterActivityConnected } from './PromoterActivityConnected';

describe('Promoter activity', () => {
  it('shows attributed booking facts without a contact or payment surface', () => {
    render(
      <PromoterActivityConnected
        data={{
          rows: [
            {
              id: 'order_1',
              bookingReference: 'BK-1042',
              eventId: 'event_1',
              eventName: 'Neon Nights',
              status: 'paid',
              ticketCount: 2,
              attributedTicketValuePaise: 360_000,
              promoterCommissionPaise: 54_000,
              attributedAt: '2026-11-05T17:00:00.000Z',
            },
          ],
          hasMore: false,
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Activity' })).toBeInTheDocument();
    expect(screen.getAllByText('Neon Nights')).toHaveLength(2);
    expect(screen.getAllByText(/BK-1042/)).toHaveLength(2);
    expect(screen.queryByText(/guest@example\.invalid|\+919000000041|pay_[a-z0-9]+/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /export|download|message/i })).toBeNull();
  });
});
