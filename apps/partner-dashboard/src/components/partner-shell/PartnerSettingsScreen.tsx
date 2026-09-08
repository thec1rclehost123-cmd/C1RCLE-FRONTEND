import Link from 'next/link';

import { AccountIcon, BankIcon, CalendarIcon, CheckIcon, LockedIcon } from '@c1rcle/icons';

import styles from '../venue/screens/VenueSettings.module.css';

import type { ReactNode } from 'react';

export type PartnerSettingsTab = 'profile' | 'account' | 'availability' | 'payout' | 'security';

export interface PartnerSettingsConfig {
  readonly roleLabel: 'Host' | 'Promoter';
  readonly basePath: string;
  readonly tabs: readonly {
    readonly id: PartnerSettingsTab;
    readonly label: string;
    readonly icon: typeof AccountIcon;
  }[];
  readonly profile: {
    readonly name: string;
    readonly handle?: string | undefined;
    readonly city: string;
    readonly phone?: string | undefined;
    readonly email?: string | undefined;
    readonly bio?: string | undefined;
    readonly verified: boolean;
    readonly linkIdentity?: string | undefined;
  };
  readonly account?: {
    readonly email?: string | undefined;
    readonly phone?: string | undefined;
    readonly reference?: string | undefined;
  };
  readonly availability?: readonly {
    readonly label: string;
    readonly time: string;
    readonly venue: string;
  }[];
  readonly payout?: {
    readonly bankName?: string | undefined;
    readonly maskedAccount?: string | undefined;
    readonly accountHolder?: string | undefined;
    readonly status?: string;
    readonly nextPayout: string;
  };
}

export function PartnerSettingsScreen({
  config,
  tab = 'profile',
}: {
  readonly config: PartnerSettingsConfig;
  readonly tab?: PartnerSettingsTab;
}) {
  const activeTab = config.tabs.some((item) => item.id === tab) ? tab : 'profile';
  return (
    <section className={styles['page']}>
      <header>
        <h1>Settings</h1>
        <p>Manage your {config.roleLabel} profile, account and preferences.</p>
      </header>
      <div className={styles['layout']}>
        <nav className={styles['nav']} aria-label="Settings sections">
          {config.tabs.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={`${config.basePath}?tab=${item.id}`}
                className={activeTab === item.id ? styles['active'] : undefined}
                aria-current={activeTab === item.id ? 'page' : undefined}
              >
                <Icon size={21} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main className={styles['content']}>
          {activeTab === 'profile' ? <ProfileSection config={config} /> : null}
          {activeTab === 'account' && config.account ? (
            <AccountSection account={config.account} />
          ) : null}
          {activeTab === 'availability' && config.availability ? (
            <AvailabilitySection roleLabel={config.roleLabel} availability={config.availability} />
          ) : null}
          {activeTab === 'payout' && config.payout ? (
            <PayoutSection roleLabel={config.roleLabel} payout={config.payout} />
          ) : null}
          {activeTab === 'security' ? <SecuritySection roleLabel={config.roleLabel} /> : null}
        </main>
      </div>
    </section>
  );
}

function ProfileSection({ config }: { readonly config: PartnerSettingsConfig }) {
  const profile = config.profile;
  return (
    <div className={styles['profileForm']}>
      <section className={styles['panel']}>
        <div className={styles['sectionHeader']}>
          <div>
            <h2>{config.roleLabel} profile</h2>
            <p>Identity and information shared with your partner network.</p>
          </div>
          <span className={profile.verified ? styles['verified'] : styles['note']}>
            {profile.verified ? (
              <>
                <CheckIcon size={16} aria-hidden="true" /> Verified
              </>
            ) : (
              'Verification unavailable'
            )}
          </span>
        </div>
        <div className={styles['identityGrid']}>
          <div className={styles['avatar']} aria-hidden="true">
            {profile.name
              .split(' ')
              .map((word) => word[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div>
            <div className={styles['twoColumns']}>
              <Field label="Name">
                <input value={profile.name} readOnly />
              </Field>
              {profile.handle ? (
                <Field label="Handle">
                  <input value={profile.handle} readOnly />
                </Field>
              ) : null}
            </div>
            <Field label="City">
              <input value={profile.city} readOnly />
            </Field>
          </div>
        </div>
        <div className={styles['twoColumns']}>
          {profile.phone ? (
            <Field label="Phone">
              <input value={profile.phone} readOnly />
            </Field>
          ) : null}
          {profile.email ? (
            <Field label="Email">
              <input value={profile.email} readOnly />
            </Field>
          ) : null}
        </div>
        {profile.bio ? (
          <Field label="Bio">
            <textarea value={profile.bio} readOnly rows={4} />
          </Field>
        ) : null}
      </section>
      {profile.linkIdentity ? (
        <section className={styles['panel']}>
          <h2>Promoter link identity</h2>
          <p className={styles['note']}>
            This existing identity is used by tracked links. It is read-only here.
          </p>
          <Field label="Tracked link reference">
            <input value={profile.linkIdentity} readOnly />
          </Field>
        </section>
      ) : null}
    </div>
  );
}

function AccountSection({
  account,
}: {
  readonly account: NonNullable<PartnerSettingsConfig['account']>;
}) {
  return (
    <section className={styles['panel']}>
      <h2>Account</h2>
      <p className={styles['note']}>Account details currently available to this workspace.</p>
      <div className={styles['twoColumns']}>
        {account.email ? (
          <Field label="Email">
            <input value={account.email} readOnly />
          </Field>
        ) : null}
        {account.phone ? (
          <Field label="Phone">
            <input value={account.phone} readOnly />
          </Field>
        ) : null}
      </div>
      {account.reference ? (
        <Field label="Account reference">
          <input value={account.reference} readOnly />
        </Field>
      ) : null}
    </section>
  );
}

function AvailabilitySection({
  roleLabel,
  availability,
}: {
  readonly roleLabel: string;
  readonly availability: NonNullable<PartnerSettingsConfig['availability']>;
}) {
  return (
    <section className={styles['panel']}>
      <div className={styles['sectionHeader']}>
        <div>
          <h2>Availability</h2>
          <p>
            Current {roleLabel.toLowerCase()} availability supplied by the existing workspace data.
          </p>
        </div>
      </div>
      <div className={styles['availabilityList']}>
        {availability.map((item) => (
          <div className={styles['availabilityRow']} key={`${item.label}-${item.venue}`}>
            <CalendarIcon size={19} aria-hidden="true" />
            <span>
              <strong>{item.label}</strong>
              <small>{item.time}</small>
            </span>
            <em>{item.venue}</em>
          </div>
        ))}
      </div>
      <p className={styles['note']}>Availability changes are not connected in this client.</p>
    </section>
  );
}

function PayoutSection({
  roleLabel,
  payout,
}: {
  readonly roleLabel: string;
  readonly payout: NonNullable<PartnerSettingsConfig['payout']>;
}) {
  return (
    <section className={styles['payout']}>
      <header>
        <h2>Payout account</h2>
        <p>Where your {roleLabel.toLowerCase()} payouts arrive.</p>
      </header>
      <div className={styles['bankRow']}>
        <BankIcon size={34} aria-hidden="true" />
        {payout.bankName ? (
          <span>
            <small>Bank name</small>
            <strong>{payout.bankName}</strong>
          </span>
        ) : null}
        {payout.maskedAccount ? (
          <span>
            <small>Account</small>
            <strong>{payout.maskedAccount}</strong>
          </span>
        ) : null}
        {payout.accountHolder ? (
          <span>
            <small>Account holder</small>
            <strong>{payout.accountHolder}</strong>
          </span>
        ) : null}
        {payout.status ? (
          <span>
            <small>Status</small>
            <strong className={styles['verified']}>
              <CheckIcon size={16} aria-hidden="true" />
              {payout.status}
            </strong>
          </span>
        ) : null}
      </div>
      <dl>
        <dt>Next payout</dt>
        <dd>{payout.nextPayout}</dd>
      </dl>
      <p className={styles['note']}>Account changes require the connected payout flow.</p>
    </section>
  );
}

function SecuritySection({ roleLabel }: { readonly roleLabel: string }) {
  return (
    <section className={styles['panel']}>
      <div className={styles['sectionHeader']}>
        <div>
          <h2>Security</h2>
          <p>Protect your {roleLabel} Studio account.</p>
        </div>
        <LockedIcon size={22} aria-hidden="true" />
      </div>
      <p className={styles['note']}>
        Password, two-step verification, session management, and sign-out controls are not exposed
        by the current account provider.
      </p>
    </section>
  );
}

function Field({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <label className={styles['field']}>
      <span>{label}</span>
      {children}
    </label>
  );
}
