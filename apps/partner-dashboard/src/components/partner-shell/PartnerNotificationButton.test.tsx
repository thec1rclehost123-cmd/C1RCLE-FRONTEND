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
});
