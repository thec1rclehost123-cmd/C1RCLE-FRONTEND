import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StickyEventCheckoutCta } from './StickyEventCheckoutCta';

describe('StickyEventCheckoutCta', () => {
  it('remains available as a button independent of selector visibility', () => {
    render(
      <>
        <aside id="event-ticket-selector">Ticket tiers</aside>
        <StickyEventCheckoutCta label="Buy tickets" className="accent" />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Buy tickets' })).toBeInTheDocument();
  });

  it('opens the ticket selector and restores focus when it closes', async () => {
    const { EventTicketSelectorClient } = await import('./EventTicketSelectorClient');
    const { useRef, useState } = await import('react');
    function Harness() {
      const [open, setOpen] = useState(false);
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <>
          <StickyEventCheckoutCta
            ref={triggerRef}
            label="Get tickets"
            className="accent"
            onClick={() => {
              setOpen(true);
            }}
          />
          <EventTicketSelectorClient
            accentTone="orange"
            eventId="event"
            tiers={[]}
            open={open}
            onClose={() => {
              setOpen(false);
            }}
            triggerRef={triggerRef}
          />
        </>
      );
    }

    render(<Harness />);
    const cta = screen.getByRole('button', { name: 'Get tickets' });
    cta.focus();
    fireEvent.click(cta);
    expect(await screen.findByRole('dialog', { name: 'Get on the list' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(cta).toHaveFocus());
  });
});
