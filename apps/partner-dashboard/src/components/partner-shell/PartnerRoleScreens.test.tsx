import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';


import { HostPartnersScreen } from '@/components/host/HostPartnersScreen';
import { PromoterPartnersScreen } from '@/components/promoter/PromoterPartnersScreen';

import type { PromoterPartner } from '@/lib/partner/contracts';
import type { ReactNode } from 'react';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { readonly children: ReactNode; readonly href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    CheckIcon: Icon,
    CloseIcon: Icon,
    LocationIcon: Icon,
    SearchIcon: Icon,
  };
});

const promoterPartners: readonly PromoterPartner[] = [
  {
    id: 'skyline-rooftop',
    kind: 'venue',
    name: 'Skyline Rooftop',
    city: 'Mumbai',
    category: 'Rooftop · House',
    verified: true,
    status: 'partnered',
    eventsTogether: 5,
    responseTime: 'Usually replies in 1 day',
    accent: 'amber',
  },
  {
    id: 'high-spirits',
    kind: 'host',
    name: 'High Spirits',
    city: 'Pune',
    category: 'House · Afrobeats',
    verified: true,
    status: 'partnered',
    eventsTogether: 0,
    responseTime: 'Usually replies in 2 days',
    accent: 'violet',
  },
];

describe('role partner screens', () => {
  it('keeps Host partner type labels, request modes, and drawer semantics', async () => {
    const user = userEvent.setup();
    render(<HostPartnersScreen initialTab="promoters" />);

    expect(screen.getByRole('table', { name: 'Promoter partners' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Promoter' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Requests' }));
    expect(screen.getByRole('table', { name: 'Requests table' })).toBeInTheDocument();
    expect(screen.getByText('Incoming 1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Incoming 1/ }));
    expect(screen.getAllByText('Monsoon Sessions Invite')).toHaveLength(2);
  });

  it('keeps Promoter venues and hosts distinct and opens a role-labeled drawer', async () => {
    const user = userEvent.setup();
    render(<PromoterPartnersScreen partners={promoterPartners} initialTab="hosts" />);

    expect(screen.getByRole('table', { name: 'Host partners' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Host' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View' }));
    expect(screen.getByRole('dialog', { name: 'Partner profile' })).toBeInTheDocument();
    expect(screen.getByText('Host · Pune · Verified')).toBeInTheDocument();
    expect(screen.getByText('Active partner')).toBeInTheDocument();

    await user.click(within(screen.getByRole('dialog', { name: 'Partner profile' })).getByRole('button', { name: 'Close partner details' }));
    expect(screen.queryByRole('dialog', { name: 'Partner profile' })).not.toBeInTheDocument();
  });
});
