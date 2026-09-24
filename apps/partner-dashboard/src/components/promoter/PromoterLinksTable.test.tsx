import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PromoterLinksTable } from './PromoterLinksTable';

import type { ReactNode } from 'react';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    readonly children: ReactNode;
    readonly href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@c1rcle/icons', () => ({
  CopyIcon: () => <svg aria-hidden="true" />,
  ExternalLinkIcon: () => <svg aria-hidden="true" />,
}));

describe('PromoterLinksTable', () => {
  it('keeps one permanent link per event, exposes source breakdown, and copies the full URL', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(
      <PromoterLinksTable
        rows={[
          {
            eventId: 'neon-nights',
            eventName: 'Neon Nights',
            shortUrl: 'c1rcle.in/rhea/neon-nights',
            status: 'active',
            clicks: 120,
            purchases: 12,
            sources: [
              { channel: 'Instagram', label: 'Main story', clicks: 80, purchases: 8 },
              { channel: 'WhatsApp', label: 'Close friends', clicks: 40, purchases: 4 },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByText('Neon Nights')).toBeInTheDocument();
    expect(screen.getByText('Source breakdown')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open Neon Nights link' })).toHaveAttribute(
      'href',
      'https://c1rcle.in/rhea/neon-nights',
    );
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://c1rcle.in/rhea/neon-nights');
    });
  });

  it('keeps the empty state honest when no permanent links exist', () => {
    render(<PromoterLinksTable rows={[]} />);

    expect(screen.getByText('No tracked event links')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument();
  });
});
