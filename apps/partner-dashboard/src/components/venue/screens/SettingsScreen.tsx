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
import { getActiveOrgId } from '@/lib/org/active-org';
import { getMyVenue, getVenueProfile, updateVenueProfile } from '@/lib/venue/venue-repository';

import { resolveVenueSettingsPermissions, venueSettingsSource } from '../venue-settings-model';

import styles from './VenueSettings.module.css';

import type { VenueDto, VenueProfileDto } from '@c1rcle/contracts';

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

/**
 * The form's own working shape — a flat record, not `VenueProfileDto`
 * directly, because the form edits fields that live at different nesting
 * depths on the wire (`public.name`, `public.address.city`,
 * `private.contactEmail`, ...) and "venue type" has no backend field at
 * all (kept local-only, disclosed below, rather than inventing one).
 */
interface VenueProfileForm {
  name: string;
  type: string;
  capacity: number;
  street: string;
  city: string;
  lat: string;
  lng: string;
  phone: string;
  publicEmail: string;
  instagram: string;
}

const EMPTY_FORM: VenueProfileForm = {
  name: '',
  type: 'Nightclub',
  capacity: 0,
  street: '',
  city: '',
  lat: '',
  lng: '',
  phone: '',
  publicEmail: '',
  instagram: '',
};

function toForm(profile: VenueProfileDto, previousType: string): VenueProfileForm {
  return {
    name: profile.public.name,
    // No backend field for this — see the disclosed note by the select
    // below. Preserved across a reload rather than reset to the default.
    type: previousType,
    capacity: profile.public.capacity ?? 0,
    street: profile.public.address.street ?? '',
    city: profile.public.address.city ?? '',
    lat: profile.public.address.lat !== undefined ? String(profile.public.address.lat) : '',
    lng: profile.public.address.lng !== undefined ? String(profile.public.address.lng) : '',
    phone: profile.private.contactPhone ?? '',
    publicEmail: profile.private.contactEmail ?? '',
    instagram: profile.private.socials.instagram ?? '',
  };
}

function VenueProfile({ canManage }: { readonly canManage: boolean }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [form, setForm] = useState<VenueProfileForm>(EMPTY_FORM);
  const [venue, setVenue] = useState<VenueDto | null>(null);
  const [profile, setProfile] = useState<VenueProfileDto | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'no-venue' | 'error'>('loading');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    // Same `lifecycle.cancelled` object trick `DashboardAuthProvider.tsx`
    // uses (see its own comment): a plain `let cancelled` gets narrowed to
    // a constant by TS within this closure, since it can't see the
    // cleanup function's later mutation — an object property isn't
    // narrowed that way. Every `setState` also runs inside the async
    // function's microtask continuation, never synchronously in the
    // effect body itself, which is what `react-hooks/set-state-in-effect`
    // requires.
    const lifecycle = { cancelled: false };
    // Read through a function, not a direct `lifecycle.cancelled` property
    // access — after the FIRST such check in a block, TS's control-flow
    // narrowing (wrongly) treats every later access as still `false`,
    // since it can't see the cleanup closure's later mutation. Same fix as
    // `ApiClient.openEventStream`'s `isAborted()` earlier this session.
    const isCancelled = (): boolean => lifecycle.cancelled;
    void (async () => {
      const organizationId = getActiveOrgId();
      if (organizationId === null) {
        setStatus('error');
        return;
      }
      try {
        const myVenue = await getMyVenue(organizationId);
        if (isCancelled()) return;
        if (myVenue === null) {
          setStatus('no-venue');
          return;
        }
        const myProfile = await getVenueProfile(myVenue.id, organizationId);
        if (isCancelled()) return;
        setVenue(myVenue);
        setProfile(myProfile);
        setForm(toForm(myProfile, EMPTY_FORM.type));
        setStatus('ready');
      } catch {
        if (!isCancelled()) setStatus('error');
      }
    })();
    return () => {
      lifecycle.cancelled = true;
    };
  }, []);

  useEffect(
    () => () => {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
    },
    [logoUrl],
  );
  const setField = (field: keyof VenueProfileForm, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }));
  };
  const reset = () => {
    if (profile !== null) setForm(toForm(profile, form.type));
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogoUrl(null);
    setSaveError(null);
  };

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const organizationId = getActiveOrgId();
    if (venue === null || profile === null || organizationId === null) return;

    const lat = form.lat.trim().length > 0 ? Number(form.lat) : undefined;
    const lng = form.lng.trim().length > 0 ? Number(form.lng) : undefined;
    if ((lat !== undefined && Number.isNaN(lat)) || (lng !== undefined && Number.isNaN(lng))) {
      setSaveError('Latitude/longitude must be numbers.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    // The backend does a SHALLOW merge on `public` — sending only the
    // edited address subfields would silently drop whatever wasn't
    // included, so every address field goes through together (see
    // `venue-repository.ts`'s `updateVenueProfile` doc comment).
    void updateVenueProfile(venue.id, organizationId, venue.version, {
      public: {
        name: form.name,
        capacity: form.capacity,
        address: {
          street: form.street.trim().length > 0 ? form.street : undefined,
          city: form.city.trim().length > 0 ? form.city : undefined,
          lat,
          lng,
        },
      },
      private: {
        contactPhone: form.phone.trim().length > 0 ? form.phone : null,
        contactEmail: form.publicEmail.trim().length > 0 ? form.publicEmail : null,
      },
    })
      .then((updated) => {
        setProfile(updated);
        setForm(toForm(updated, form.type));
        setVenue((current) =>
          current === null ? current : { ...current, version: current.version + 1 },
        );
      })
      .catch((error: unknown) => {
        setSaveError(error instanceof Error ? error.message : 'Could not save changes.');
      })
      .finally(() => {
        setSaving(false);
      });
  };

  if (status === 'loading') {
    return <p className={styles['note']}>Loading venue…</p>;
  }
  if (status === 'no-venue') {
    return <p className={styles['note']}>This organization has no venue yet.</p>;
  }
  if (status === 'error') {
    return <p className={styles['note']}>Could not load venue settings. Try reloading the page.</p>;
  }

  return (
    <form className={styles['profileForm']} onSubmit={handleSubmit}>
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
                {venueSettingsSource.profile.logoText.split('\n').map((line) => (
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
                {/* No backend field exists for this yet — kept as a local-only
                    preference rather than fabricating one; not included in
                    the save request. */}
                <small className={styles['note']}>Not saved — no backend field yet.</small>
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
        <div className={styles['twoColumns']}>
          <Field label="Street">
            <input
              value={form.street}
              disabled={!canManage}
              onChange={(event) => {
                setField('street', event.target.value);
              }}
            />
          </Field>
          <Field label="City">
            <input
              value={form.city}
              disabled={!canManage}
              onChange={(event) => {
                setField('city', event.target.value);
              }}
            />
          </Field>
        </div>
        <div className={styles['twoColumns']}>
          <Field label="Latitude">
            <input
              inputMode="decimal"
              placeholder="e.g. 18.5204"
              value={form.lat}
              disabled={!canManage}
              onChange={(event) => {
                setField('lat', event.target.value);
              }}
            />
          </Field>
          <Field label="Longitude">
            <input
              inputMode="decimal"
              placeholder="e.g. 73.8567"
              value={form.lng}
              disabled={!canManage}
              onChange={(event) => {
                setField('lng', event.target.value);
              }}
            />
          </Field>
        </div>
        <small className={styles['note']}>
          Used to confirm door staff are on-site before opening a shift (a soft check layered on top
          of the door code, not a replacement for it).
        </small>
        <div className={styles['twoColumns']}>
          <Field label="Phone">
            <input
              type="tel"
              value={form.phone}
              disabled={!canManage}
              onChange={(event) => {
                setField('phone', event.target.value);
              }}
            />
          </Field>
          <Field label="Public email">
            <input
              type="email"
              value={form.publicEmail}
              disabled={!canManage}
              onChange={(event) => {
                setField('publicEmail', event.target.value);
              }}
            />
          </Field>
        </div>
        <Field label="Instagram">
          <input
            value={form.instagram}
            disabled={!canManage}
            onChange={(event) => {
              setField('instagram', event.target.value);
            }}
          />
        </Field>
      </section>
      {saveError !== null ? <p className={styles['note']}>{saveError}</p> : null}
      <footer>
        <button type="button" onClick={reset} disabled={saving}>
          Cancel
        </button>
        {canManage ? (
          <button type="submit" className={styles['primary']} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
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
                <small>{member.email}</small>
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
