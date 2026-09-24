import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AccountIcon, BankIcon, LockedIcon } from '@c1rcle/icons';

import { PartnerSettingsScreen } from './PartnerSettingsScreen';

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

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    AccountIcon: Icon,
    BankIcon: Icon,
    CalendarIcon: Icon,
    CheckIcon: Icon,
    LockedIcon: Icon,
  };
});

const tabs = [
  { id: 'profile', label: 'Promoter profile', icon: AccountIcon },
  { id: 'payout', label: 'Payout account', icon: BankIcon },
  { id: 'security', label: 'Security', icon: LockedIcon },
] as const;

describe('PartnerSettingsScreen', () => {
  it('keeps Promoter settings read-only and preserves tracking identity', () => {
    render(
      <PartnerSettingsScreen
        config={{
          roleLabel: 'Promoter',
          basePath: '/promoter/settings',
          tabs,
          profile: {
            name: 'Zoya Mehta',
            handle: '@zoya',
            city: 'Mumbai',
            verified: true,
            linkIdentity: 'zoya',
          },
          payout: { bankName: 'HDFC Bank', maskedAccount: '••4421', nextPayout: 'Fri, 25 Jul' },
        }}
      />,
    );

    expect(screen.getByDisplayValue('Zoya Mehta')).toHaveAttribute('readonly');
    expect(screen.getByDisplayValue('@zoya')).toHaveAttribute('readonly');
    expect(screen.getByDisplayValue('zoya')).toHaveAttribute('readonly');
    expect(screen.queryByRole('button', { name: /save|manage/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Payout account' })).toHaveAttribute(
      'href',
      '/promoter/settings?tab=payout',
    );
  });

  it('renders Host payout fields only when supplied by the shared config', () => {
    render(
      <PartnerSettingsScreen
        tab="payout"
        config={{
          roleLabel: 'Host',
          basePath: '/host/settings',
          tabs: [
            { id: 'profile', label: 'Host profile', icon: AccountIcon },
            { id: 'payout', label: 'Payout account', icon: BankIcon },
          ],
          profile: { name: 'Rhea Kapoor', city: 'Mumbai', verified: true },
          payout: { bankName: 'HDFC Bank', maskedAccount: '••4421', nextPayout: 'Fri, 25 Jul' },
        }}
      />,
    );

    expect(screen.getByText('HDFC Bank')).toBeInTheDocument();
    expect(screen.getByText('••4421')).toBeInTheDocument();
    expect(screen.queryByText('Account holder')).not.toBeInTheDocument();
    expect(screen.queryByText('Manage')).not.toBeInTheDocument();
  });
});
