import Link from 'next/link';

import { SocialPrivacyPanel } from '@/features/social/SocialPrivacyPanel';

import { ChangePasswordFormClient } from './ChangePasswordFormClient';
import { PersonalProfileFormClient } from './PersonalProfileFormClient';
import { SignOutControl } from './SignOutControl';

import type { ProfileIdentity, ProfileSettingsSection } from '../types/profile.types';
import type { UpsertGuestProfileRequest } from '@c1rcle/contracts';

const settingsSections: readonly {
  href: string;
  label: string;
  value: ProfileSettingsSection;
}[] = [
  { href: '/profile?view=settings&section=personal', label: 'Personal profile', value: 'personal' },
  {
    href: '/profile?view=settings&section=social',
    label: 'Privacy',
    value: 'social',
  },
  { href: '/profile?view=settings&section=account', label: 'Account & security', value: 'account' },
];

export function ProfileSettings({
  activeSection,
  identity,
  profileFields,
}: {
  activeSection: ProfileSettingsSection;
  identity: ProfileIdentity;
  profileFields: Pick<UpsertGuestProfileRequest, 'dateOfBirth' | 'tastes' | 'intents'> | null;
}) {
  return (
    <section
      id="profile-settings"
      aria-labelledby="profile-settings-heading"
      className="mx-auto max-w-4xl"
    >
      <Link
        href="/profile"
        className="mb-5 inline-flex min-h-11 items-center text-sm text-white/60 hover:text-white"
      >
        ← Profile
      </Link>
      <h1
        id="profile-settings-heading"
        className="text-3xl font-bold uppercase tracking-[-0.04em] text-white sm:text-4xl"
      >
        Settings
      </h1>

      <div className="mt-6 grid gap-8 lg:mt-9 lg:grid-cols-[176px_minmax(0,1fr)] lg:gap-12">
        <nav
          aria-label="Settings categories"
          className="flex flex-wrap gap-x-5 gap-y-1 border-b border-white/10 lg:flex-col lg:gap-x-0 lg:gap-y-1 lg:self-start lg:border-b-0"
        >
          {settingsSections.map((section) => {
            const active = section.value === activeSection;
            return (
              <Link
                key={section.value}
                href={section.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center border-b-2 text-sm transition-colors lg:border-b-0 lg:border-l-2 lg:pl-4 ${
                  active
                    ? 'border-[#FF4400] font-semibold text-white'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                {section.label}
              </Link>
            );
          })}
        </nav>

        {activeSection === 'personal' ? (
          profileFields ? (
            <PersonalProfileFormClient identity={identity} profileFields={profileFields} />
          ) : (
            <div
              role="status"
              className="rounded-[1.75rem] border border-white/10 p-6 text-sm text-white/60"
            >
              Complete profile onboarding before editing these details. Profile setup is not
              available for this account yet.
            </div>
          )
        ) : activeSection === 'social' ? (
          <SocialPrivacyPanel />
        ) : (
          <AccountSecurityPanel identity={identity} />
        )}
      </div>
    </section>
  );
}

function AccountSecurityPanel({ identity }: { identity: ProfileIdentity }) {
  return (
    <div className="space-y-4">
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/35">
          Sign-in identity
        </p>
        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">
              Method
            </dt>
            <dd className="mt-2 text-sm font-bold text-white">{identity.signInMethod}</dd>
          </div>
          <div>
            <dt className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">
              Email
            </dt>
            <dd className="mt-2 break-all text-sm font-bold text-white">{identity.email}</dd>
          </div>
          <div>
            <dt className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">
              Phone
            </dt>
            <dd className="mt-2 text-sm font-bold text-white">
              {identity.phoneNumber ?? 'Not provided'}
            </dd>
          </div>
        </dl>
        <p className="mt-7 border-t border-white/10 pt-5 text-xs leading-6 text-white/50">
          Email and phone changes are not available for this account yet.
        </p>
      </div>

      <ChangePasswordFormClient />

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <h3 className="text-xl font-black uppercase tracking-[-0.03em] text-white">
          Checkout payments
        </h3>
        <p className="mt-2 text-sm leading-6 text-white/50">
          Card, UPI, and bank payment details are entered in Razorpay during checkout. They are not
          stored as profile settings. Guest accounts do not receive payouts, so bank payout details
          do not belong here.
        </p>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <h3 className="text-xl font-black uppercase tracking-[-0.03em] text-white">
          Account recovery
        </h3>
        <p className="mt-2 text-sm leading-6 text-white/50">
          Forgot your current password? Request a secure reset link for your account email.
        </p>
        <Link
          href="/forgot-password"
          className="mt-5 inline-flex min-h-11 items-center rounded-full border border-white/20 px-5 text-xs font-bold text-white hover:bg-white/10"
        >
          Reset with email
        </Link>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-black/55 p-6 sm:p-8">
        <h3 className="text-xl font-black uppercase tracking-[-0.03em] text-white">Legal</h3>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/privacy"
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-[9px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-[9px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white"
          >
            Terms
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-[1.75rem] border border-red-400/15 bg-red-400/[0.04] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h3 className="text-xl font-black uppercase tracking-[-0.03em] text-white">Session</h3>
          <p className="mt-2 text-sm text-white/40">Leave this account and return to login.</p>
        </div>
        <SignOutControl />
      </div>
    </div>
  );
}
