import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { HostMarketingScreen } from './HostMarketingScreen';

vi.mock('@/components/venue/screens/MarketingScreen', () => ({
  IPhonePreview: ({ channel, message }: { readonly channel: string; readonly message: string }) => (
    <div data-testid="iphone-preview">{channel}: {message}</div>
  ),
}));

describe('HostMarketingScreen', () => {
  it('keeps the composer Host-scoped and reports unsupported scheduling honestly', async () => {
    const user = userEvent.setup();
    render(<HostMarketingScreen />);

    expect(screen.getByRole('combobox', { name: 'Event' })).toHaveValue('neon');
    expect(screen.getByRole('textbox', { name: 'Audience' })).toHaveValue('340 confirmed guests');
    expect(screen.queryByRole('button', { name: /save draft/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'WhatsApp' }));
    expect(screen.getByTestId('iphone-preview')).toHaveTextContent(/^WhatsApp:/);
    await user.click(screen.getByRole('button', { name: 'First name' }));
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue(
      'Neon Nights is tomorrow at Skyline Rooftop. See you on the dance floor.{{first_name}}',
    );
    await user.click(screen.getByRole('button', { name: 'Schedule message' }));
    expect(screen.getByRole('status')).toHaveTextContent(/Scheduling unavailable/);
  });

  it('filters the existing Host campaign history by channel and search text', async () => {
    const user = userEvent.setup();
    render(<HostMarketingScreen initialTab="history" />);

    expect(screen.getByRole('region', { name: 'Campaign history' })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Channel' }), 'WhatsApp');
    expect(screen.getByText('Tickets running low')).toBeInTheDocument();
    expect(screen.queryByText('Neon Nights reminder')).not.toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Search campaigns' }), 'missing');
    expect(screen.queryByText('Tickets running low')).not.toBeInTheDocument();
  });
});
