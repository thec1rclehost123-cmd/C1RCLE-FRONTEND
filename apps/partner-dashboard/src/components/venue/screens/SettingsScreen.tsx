'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import {
  AccountIcon,
  BankIcon,
  CheckIcon,
  ImageIcon,
  InviteIcon,
  LockedIcon,
  SettingsIcon,
  SignOutIcon,
  UsersIcon,
} from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import { resolveVenueSettingsPermissions, venueSettingsSource } from '../venue-settings-model';

import styles from './VenueSettings.module.css';

export type SettingsTab = 'profile' | 'payout' | 'team' | 'security';

const TABS: readonly {
  readonly id: SettingsTab;
  readonly label: string;
  readonly icon: typeof AccountIcon;
}[] = [
  { id: 'profile', label: 'Venue profile', icon: AccountIcon },
  { id: 'payout', label: 'Payout account', icon: BankIcon },
  { id: 'team', label: 'Team access', icon: UsersIcon },
  { id: 'security', label: 'Security', icon: LockedIcon },
];

export function SettingsScreen({ tab = 'profile' }: { readonly tab?: SettingsTab }) {
  const auth = useDashboardAuth();
  const permissions = useMemo(() => resolveVenueSettingsPermissions(auth.canDo), [auth.canDo]);
  return (
    <section className={styles['page']}>
      <header>
        <h1>{tab === 'team' ? 'Team access' : tab === 'security' ? 'Security' : 'Settings'}</h1>
        <p>
          {tab === 'team'
            ? 'Control who can manage Venue Studio.'
            : tab === 'security'
              ? 'Protect your Venue Studio account.'
              : 'Manage your venue and account.'}
        </p>
      </header>
      <div className={styles['layout']}>
        <nav className={styles['nav']} aria-label="Settings sections">
          {TABS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={`/venue/settings?tab=${item.id}`}
                className={tab === item.id ? styles['active'] : undefined}
                aria-current={tab === item.id ? 'page' : undefined}
              >
                <Icon size={21} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main className={styles['content']}>
          {tab === 'profile' ? <VenueProfile canManage={permissions.canManageVenue} /> : null}
          {tab === 'payout' ? (
            <PayoutAccount canManage={permissions.canChangePayoutAccount} />
          ) : null}
          {tab === 'team' ? <TeamAccess canManage={permissions.canManageTeam} /> : null}
          {tab === 'security' ? (
            <SecuritySettings canManage={permissions.canManageSecurity} />
          ) : null}
        </main>
      </div>
    </section>
  );
}

function VenueProfile({ canManage }: { readonly canManage: boolean }) {
  const initial = venueSettingsSource.profile;
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [form, setForm] = useState(initial);
  useEffect(
    () => () => {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
    },
    [logoUrl],
  );
  const setField = (field: keyof typeof form, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }));
  };
  const reset = () => {
    setForm(initial);
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogoUrl(null);
  };
  return (
    <form
      className={styles['profileForm']}
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <section className={styles['panel']}>
        <h2>Venue identity</h2>
        <div className={styles['identityGrid']}>
          <label className={styles['logoUpload']}>
            <span className={styles['srOnly']}>Venue logo</span>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL is not an optimizable remote asset
              <img src={logoUrl} alt="Selected venue logo preview" />
            ) : (
              <strong>
                {initial.logoText.split('\n').map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </strong>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={!canManage}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (logoUrl) URL.revokeObjectURL(logoUrl);
                setLogoUrl(URL.createObjectURL(file));
              }}
            />
            <em>
              <ImageIcon size={17} aria-hidden="true" /> Change logo
            </em>
          </label>
          <div>
            <Field label="Venue name">
              <input
                value={form.name}
                disabled={!canManage}
                onChange={(event) => {
                  setField('name', event.target.value);
                }}
              />
            </Field>
            <div className={styles['twoColumns']}>
              <Field label="Venue type">
                <select
                  value={form.type}
                  disabled={!canManage}
                  onChange={(event) => {
                    setField('type', event.target.value);
                  }}
                >
                  <option>Nightclub</option>
                  <option>Bar</option>
                  <option>Live venue</option>
                </select>
              </Field>
              <Field label="Capacity">
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  disabled={!canManage}
                  onChange={(event) => {
                    setField('capacity', Number(event.target.value));
                  }}
                />
              </Field>
            </div>
          </div>
        </div>
      </section>
      <section className={styles['panel']}>
        <h2>Location and contact</h2>
        <Field label="Address">
          <input
            value={form.address}
            disabled={!canManage}
            onChange={(event) => {
              setField('address', event.target.value);
            }}
          />
        </Field>
        <p className={styles['privacyNotice']}>
          Contact details are managed privately and are not displayed in the dashboard.
        </p>
      </section>
      <footer>
        <button type="button" onClick={reset}>
          Cancel
        </button>
        {canManage ? (
          <button
            type="submit"
            className={styles['primary']}
            disabled
            title="Venue profile changes require the settings mutation API."
          >
            Save changes unavailable
          </button>
        ) : (
          <span>You do not have permission to change venue settings.</span>
        )}
      </footer>
    </form>
  );
}

function PayoutAccount({ canManage }: { readonly canManage: boolean }) {
  const account = venueSettingsSource.payoutAccount;
  return (
    <section className={styles['payout']}>
      <header>
        <h2>Payout account</h2>
        <p>Where your venue payouts arrive.</p>
      </header>
      <div className={styles['bankRow']}>
        {account ? (
          <>
            <BankIcon size={34} aria-hidden="true" />
            <span>
              <small>Bank name</small>
              <strong>{account.name}</strong>
            </span>
            <span>
              <small>Account</small>
              <strong>{account.maskedAccount}</strong>
            </span>
            <span>
              <small>Account holder</small>
              <strong>{account.accountHolder}</strong>
            </span>
            <span>
              <small>Status</small>
              <strong className={styles['verified']}>
                <CheckIcon size={16} aria-hidden="true" />
                {account.verified ? 'Verified' : 'Unavailable'}
              </strong>
            </span>
            {canManage ? (
              <button
                type="button"
                disabled
                title="Bank changes require the payout account mutation API."
              >
                Change account unavailable
              </button>
            ) : null}
          </>
        ) : (
          <p>Bank account unavailable</p>
        )}
      </div>
      <dl>
        <dt>Next payout</dt>
        <dd>{venueSettingsSource.nextPayout}</dd>
      </dl>
      <p className={styles['note']}>Account changes require verification.</p>
    </section>
  );
}

function TeamAccess({ canManage }: { readonly canManage: boolean }) {
  return (
    <section className={styles['team']}>
      <header>
        {canManage ? (
          <button
            type="button"
            disabled
            title="Staff invitations require the team access mutation API."
          >
            <InviteIcon size={18} aria-hidden="true" /> Invite staff unavailable
          </button>
        ) : null}
      </header>
      <div role="table" aria-label="Team access">
        <div className={styles['teamHead']} role="row">
          <span>Person</span>
          <span>Role</span>
          <span>Access</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {venueSettingsSource.staff.map((member) => (
          <div className={styles['teamRow']} role="row" key={member.id}>
            <span role="cell">
              <em>{member.initials}</em>
              <span>
                <strong>{member.name}</strong>
                <small>Contact details hidden</small>
              </span>
            </span>
            <span role="cell">{member.role}</span>
            <span role="cell">{member.access}</span>
            <span role="cell" data-status={member.status}>
              {member.status}
            </span>
            <span role="cell">
              {canManage ? (
                <button
                  type="button"
                  disabled
                  title="Permission changes require the team access mutation API."
                >
                  Manage unavailable
                </button>
              ) : (
                'Unavailable'
              )}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SecuritySettings({ canManage }: { readonly canManage: boolean }) {
  const security = venueSettingsSource.security;
  return (
    <section className={styles['security']}>
      <SecurityRow
        title="Password"
        detail={security.passwordLastChanged ?? 'Last changed unavailable'}
        action="Change password unavailable"
        canManage={canManage}
      />
      <SecurityRow
        title="Two-step verification"
        detail={
          security.twoStepEnabled === null
            ? 'Status unavailable'
            : security.twoStepEnabled
              ? 'On'
              : 'Off'
        }
        action="Manage unavailable"
        canManage={canManage}
      />
      <SecurityRow
        title="Active sessions"
        detail={
          security.activeSessions === null
            ? 'Unavailable'
            : `${String(security.activeSessions)} devices`
        }
        action="View unavailable"
        canManage={canManage}
      />
      <SecurityRow
        title="Sign out everywhere"
        detail={`Last sign-in ${security.lastSignIn ?? 'unavailable'}`}
        action="Sign out everywhere unavailable"
        canManage={canManage}
        danger
      />
    </section>
  );
}

function SecurityRow({
  title,
  detail,
  action,
  canManage,
  danger = false,
}: {
  readonly title: string;
  readonly detail: string;
  readonly action: string;
  readonly canManage: boolean;
  readonly danger?: boolean;
}) {
  return (
    <div className={styles['securityRow']}>
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      {canManage ? (
        <button
          type="button"
          className={danger ? styles['danger'] : undefined}
          disabled
          title="This security action is not supported by the current authentication API."
        >
          {danger ? (
            <SignOutIcon size={18} aria-hidden="true" />
          ) : (
            <SettingsIcon size={18} aria-hidden="true" />
          )}
          {action}
        </button>
      ) : (
        <em>Unavailable</em>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <label className={styles['field']}>
      <span>{label}</span>
      {children}
    </label>
  );
}
