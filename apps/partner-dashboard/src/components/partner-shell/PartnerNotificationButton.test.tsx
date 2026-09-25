import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PartnerNotificationButton } from './PartnerNotificationButton';

describe('PartnerNotificationButton', () => {
  it('does not expose a fabricated unread count', () => {
    render(
      <PartnerNotificationButton
        buttonRef={{ current: null }}
        open={false}
        onClick={() => undefined}
      />,
    );

    const button = screen.getByRole('button', { name: 'Notifications' });
    expect(button).not.toHaveTextContent(/\d/);
    expect(button).not.toHaveAttribute('aria-label', expect.stringMatching(/\d/));
  });

  it('shows the unread count in the badge and the accessible label', () => {
    render(
      <PartnerNotificationButton
        buttonRef={{ current: null }}
        open={false}
        unreadCount={3}
        onClick={() => undefined}
      />,
    );

    const button = screen.getByRole('button', { name: 'Notifications (3 unread)' });
    expect(button).toHaveTextContent('3');
  });

  it('caps the badge at 9+ so it stays one token wide', () => {
    render(
      <PartnerNotificationButton
        buttonRef={{ current: null }}
        open={false}
        unreadCount={12}
        onClick={() => undefined}
      />,
    );

    const button = screen.getByRole('button', { name: 'Notifications (12 unread)' });
    expect(button).toHaveTextContent('9+');
  });
});
