import Link from 'next/link';

import { PersonalProfileFormClient } from './PersonalProfileFormClient';
import { SignOutControl } from './SignOutControl';

import type { ProfileIdentity, ProfileSettingsSection } from '../types/profile.types';

const settingsSections: readonly {
  href: string;
  label: string;
  value: ProfileSettingsSection;
}[] = [
  { href: '/profile?view=settings&section=personal', label: 'Personal profile', value: 'personal' },
  { href: '/profile?view=settings&section=account', label: 'Account & security', value: 'account' },
];

export function ProfileSettings({
  activeSection,
  identity,
}: {
  activeSection: ProfileSettingsSection;
  identity: ProfileIdentity;
}) {
  return (
    <section id="profile-settings" aria-labelledby="profile-settings-heading">
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF6B4A]">Account</p>
      <h2
        id="profile-settings-heading"
        className="mt-3 text-4xl font-black uppercase tracking-[-0.055em] text-white sm:text-6xl"
      >
        Settings
      </h2>

      <div className="mt-8 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <nav
          aria-label="Settings categories"
          className="flex gap-2 overflow-x-auto rounded-[1.5rem] border border-white/10 bg-black/45 p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:self-start"
        >
          {settingsSections.map((section) => {
            const active = section.value === activeSection;
            return (
              <Link
                key={section.value}
                href={section.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-12 shrink-0 items-center rounded-2xl px-5 text-[9px] font-black uppercase tracking-[0.18em] transition-colors ${
                  active
                    ? 'bg-[#FF4400] text-white'
                    : 'text-white/40 hover:bg-white/10 hover:text-white'
                }`}
              >
                {section.label}
              </Link>
            );
          })}
        </nav>

        {activeSection === 'personal' ? (
          <PersonalProfileFormClient identity={identity} />
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
            <dd className="mt-2 text-sm font-bold text-white">{identity.phoneNumber}</dd>
          </div>
        </dl>
        <p className="mt-7 border-t border-white/10 pt-5 text-xs leading-6 text-white/35">
          Security and recovery follow the sign-in method connected to this account.
        </p>
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
