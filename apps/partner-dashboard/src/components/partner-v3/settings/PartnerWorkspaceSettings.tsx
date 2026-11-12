'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { PromoterAgreementPanel } from '@/components/promoter/PromoterAgreementPanel';
import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';
import { describeApiError } from '@/lib/api/describe-error';
import {
  getPartnerSettings,
  updatePartnerSettings,
  uploadPartnerProfileImage,
} from '@/lib/settings/partner-settings-repository';
import {
  getMyVenue,
  getVenueMenu,
  getVenueProfile,
  updateVenueMenu,
  updateVenueProfile,
} from '@/lib/venue/venue-repository';

import styles from './PartnerWorkspaceSettings.module.css';

import type { StudioRole } from '@/studios/studio-config';
import type {
  PartnerSettingsDto,
  UpdatePartnerSettingsInput,
  VenueDto,
  VenueMenuDto,
  VenueProfileDto,
} from '@c1rcle/contracts/client';

type Tab =
  | 'profile'
  | 'stats'
  | 'account'
  | 'business'
  | 'team'
  | 'notifications'
  | 'privacy'
  | 'venue'
  | 'agreement';

const TAB_NAMES: Record<Tab, string> = {
  profile: 'Profile',
  stats: 'Profile stats',
  account: 'Account & security',
  business: 'Business & KYC',
  team: 'Team',
  notifications: 'Notifications',
  privacy: 'Privacy',
  venue: 'Menu & door',
  agreement: 'Agreement & handle',
};

type LoadState = 'loading' | 'ready' | 'error';

async function loadSettingsStep<T>(label: string, request: Promise<T>): Promise<T> {
  try {
    return await request;
  } catch (cause) {
    throw new Error(`${label}: ${describeApiError(cause, 'Request failed.')}`, { cause });
  }
}

export function PartnerWorkspaceSettings({ studio }: { readonly studio: StudioRole }) {
  const auth = useDashboardAuth();
  const organizationId = auth.profile?.activeMembership?.partnerId ?? null;
  const role = auth.profile?.activeMembership?.role ?? 'member';
  const canEdit = role === 'owner' || role === 'admin' || role === 'manager';
  const tabs = useMemo<Tab[]>(() => {
    const common: Tab[] = [
      'profile',
      'stats',
      'account',
      'business',
      'team',
      'notifications',
      'privacy',
    ];
    if (studio === 'venue') common.push('venue');
    if (studio === 'promoter') common.push('agreement');
    return common;
  }, [studio]);

  const [tab, setTab] = useState<Tab>('profile');
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [data, setData] = useState<PartnerSettingsDto | null>(null);
  const [venue, setVenue] = useState<VenueDto | null>(null);
  const [venueProfile, setVenueProfile] = useState<VenueProfileDto | null>(null);
  const [venueMenu, setVenueMenu] = useState<VenueMenuDto | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [genres, setGenres] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [capacity, setCapacity] = useState('');
  const [facilities, setFacilities] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) {
      setState('error');
      setError('Choose an organization before editing its settings.');
      return;
    }
    setState('loading');
    setError(null);
    try {
      const settings = await loadSettingsStep(
        'Partner settings',
        getPartnerSettings(organizationId),
      );
      let nextVenue: VenueDto | null = null;
      let nextVenueProfile: VenueProfileDto | null = null;
      let nextVenueMenu: VenueMenuDto | null = null;
      if (studio === 'venue') {
        nextVenue = await loadSettingsStep('Venue list', getMyVenue(organizationId));
        if (nextVenue) {
          [nextVenueProfile, nextVenueMenu] = await Promise.all([
            loadSettingsStep('Venue profile', getVenueProfile(nextVenue.id, organizationId)),
            loadSettingsStep('Venue menu', getVenueMenu(nextVenue.id, organizationId)),
          ]);
        }
      }
      setData(settings);
      setVenue(nextVenue);
      setVenueProfile(nextVenueProfile);
      setVenueMenu(nextVenueMenu);
      const publicProfile = nextVenueProfile?.public;
      setName(publicProfile?.name ?? settings.profile.displayName ?? settings.displayName);
      setBio(publicProfile?.description ?? settings.profile.bio ?? '');
      setCity(publicProfile?.address.city ?? settings.profile.city ?? '');
      setGenres((publicProfile?.genres ?? settings.profile.genres ?? []).join(', '));
      setInstagram(nextVenueProfile?.private.socials.instagram ?? settings.profile.instagram ?? '');
      setWebsite(nextVenueProfile?.private.socials.website ?? settings.profile.website ?? '');
      setCapacity(publicProfile?.capacity == null ? '' : String(publicProfile.capacity));
      setFacilities((publicProfile?.facilities ?? []).join(', '));
      setState('ready');
    } catch (cause) {
      setState('error');
      setError(cause instanceof Error ? cause.message : 'Settings could not be loaded.');
    }
  }, [organizationId, studio]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const saveProfile = async () => {
    if (!organizationId || !data) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      let photoUrl = venueProfile?.public.photoUrl ?? data.profile.photoUrl ?? null;
      let coverUrl = venueProfile?.public.coverUrl ?? data.profile.coverUrl ?? null;
      if (photoFile) photoUrl = await uploadPartnerProfileImage(organizationId, photoFile);
      if (coverFile) coverUrl = await uploadPartnerProfileImage(organizationId, coverFile);
      const genreList = genres
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      if (studio === 'venue' && venue && venueProfile) {
        const next = await updateVenueProfile(venue.id, organizationId, venue.version, {
          public: {
            name: name.trim(),
            description: bio,
            photoUrl,
            coverUrl,
            genres: genreList,
            capacity: capacity.trim() ? Number(capacity) : null,
            facilities: facilities
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean),
            address: { ...venueProfile.public.address, city },
          },
          private: {
            socials: {
              ...venueProfile.private.socials,
              ...(instagram ? { instagram } : {}),
              ...(website ? { website } : {}),
            },
          },
        });
        setVenueProfile(next);
        setVenue({ ...venue, version: venue.version + 1, name: next.public.name });
      } else {
        const update: UpdatePartnerSettingsInput = {
          profile: {
            displayName: name.trim(),
            bio,
            city,
            genres: genreList,
            instagram,
            ...(website ? { website } : {}),
            photoUrl,
            coverUrl,
          },
        };
        const next = await updatePartnerSettings(organizationId, update);
        setData(next);
      }
      setPhotoFile(null);
      setCoverFile(null);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your profile could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const updatePreferences = async (update: UpdatePartnerSettingsInput) => {
    if (!organizationId || !data) return;
    setPreferencesSaving(true);
    setError(null);
    try {
      setData(await updatePartnerSettings(organizationId, update));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That setting could not be saved.');
    } finally {
      setPreferencesSaving(false);
    }
  };

  if (state === 'loading') return <div className={styles['state']}>Loading settings…</div>;
  if (state === 'error' || !data) {
    return (
      <section className={styles['state']}>
        <h1>Settings unavailable</h1>
        <p role="alert">{error}</p>
        <button type="button" onClick={() => void load()}>
          Try again
        </button>
      </section>
    );
  }

  return (
    <main className={styles['page']}>
      <header className={styles['header']}>
        <div>
          <span>WORKSPACE</span>
          <h1>Settings</h1>
        </div>
        <p>Manage your {studio} profile and account.</p>
      </header>
      {error ? (
        <p className={styles['error']} role="alert">
          {error}
        </p>
      ) : null}
      <div className={styles['layout']}>
        <div className={styles['tabs']} aria-label="Settings sections" role="group">
          {tabs.map((item) => (
            <button
              id={`settings-tab-${item}`}
              key={item}
              type="button"
              aria-pressed={tab === item}
              aria-controls="settings-panel"
              onClick={() => {
                setTab(item);
                setSaved(false);
                setError(null);
              }}
            >
              {TAB_NAMES[item]}
            </button>
          ))}
        </div>
        <section
          id="settings-panel"
          className={styles['panel']}
          aria-labelledby={`settings-tab-${tab}`}
        >
          {tab === 'profile' ? (
            <>
              <div className={styles['sectionTitle']}>
                <h2>Public profile</h2>
                <p>This is what partners see when they view your profile.</p>
              </div>
              <div className={styles['mediaRow']}>
                <label>
                  Profile photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={!canEdit}
                    onChange={(event) => {
                      setPhotoFile(event.target.files?.[0] ?? null);
                    }}
                  />
                </label>
                <label>
                  Cover photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={!canEdit}
                    onChange={(event) => {
                      setCoverFile(event.target.files?.[0] ?? null);
                    }}
                  />
                </label>
              </div>
              <div className={styles['formGrid']}>
                <label>
                  Display name
                  <input
                    value={name}
                    maxLength={200}
                    disabled={!canEdit}
                    onChange={(event) => {
                      setName(event.target.value);
                    }}
                  />
                </label>
                {studio === 'promoter' ? (
                  <label>
                    Public handle
                    <input value={data.handle} readOnly aria-describedby="handle-help" />
                    <small id="handle-help">Change your handle in Agreement &amp; handle.</small>
                  </label>
                ) : null}
                <label>
                  City or area
                  <input
                    value={city}
                    maxLength={100}
                    disabled={!canEdit}
                    onChange={(event) => {
                      setCity(event.target.value);
                    }}
                  />
                </label>
                <label>
                  Genres
                  <input
                    value={genres}
                    maxLength={500}
                    disabled={!canEdit}
                    onChange={(event) => {
                      setGenres(event.target.value);
                    }}
                  />
                  <small>Separate genres with commas.</small>
                </label>
                {studio === 'venue' ? (
                  <label>
                    Capacity
                    <input
                      type="number"
                      min="0"
                      value={capacity}
                      disabled={!canEdit}
                      onChange={(event) => {
                        setCapacity(event.target.value);
                      }}
                    />
                  </label>
                ) : null}
                <label>
                  Instagram
                  <input
                    value={instagram}
                    maxLength={200}
                    disabled={!canEdit}
                    onChange={(event) => {
                      setInstagram(event.target.value);
                    }}
                  />
                </label>
                <label>
                  Website
                  <input
                    type="url"
                    value={website}
                    maxLength={500}
                    disabled={!canEdit}
                    onChange={(event) => {
                      setWebsite(event.target.value);
                    }}
                  />
                </label>
                {studio === 'venue' ? (
                  <label>
                    Facilities
                    <input
                      value={facilities}
                      maxLength={1000}
                      disabled={!canEdit}
                      onChange={(event) => {
                        setFacilities(event.target.value);
                      }}
                    />
                    <small>Separate facilities with commas.</small>
                  </label>
                ) : null}
              </div>
              <label className={styles['wideField']}>
                About
                <textarea
                  value={bio}
                  maxLength={2000}
                  rows={5}
                  disabled={!canEdit}
                  onChange={(event) => {
                    setBio(event.target.value);
                  }}
                />
              </label>
              {saved ? (
                <p className={styles['success']} role="status">
                  Profile saved.
                </p>
              ) : null}
              <button
                className={styles['primary']}
                type="button"
                disabled={!canEdit || saving || (studio === 'venue' && !venue)}
                onClick={() => void saveProfile()}
              >
                {saving ? 'Saving…' : 'Save profile'}
              </button>
              {!canEdit ? (
                <p className={styles['hint']}>
                  Your role can view this profile but cannot edit it.
                </p>
              ) : null}
            </>
          ) : null}
          {tab === 'stats' ? <StatsPanel settings={data} studio={studio} /> : null}
          {tab === 'account' ? (
            <AccountPanel
              email={auth.profile?.email ?? ''}
              name={auth.profile?.displayName ?? 'Partner'}
              signOut={auth.signOut}
            />
          ) : null}
          {tab === 'business' ? (
            <ReadOnlyPanel
              title="Business & verification"
              description="Business and KYC information is read-only here. Use the existing document-update flow when your application requests changes."
              href="/onboard"
              action="Open onboarding"
            />
          ) : null}
          {tab === 'team' ? (
            <ReadOnlyPanel
              title="Team access"
              description="Manage team members, roles, and invitations using the existing team access controls."
              href={`/partner/${studio}/partners?tab=staff`}
              action="Manage team"
            />
          ) : null}
          {tab === 'notifications' ? (
            <NotificationPanel
              settings={data}
              saving={preferencesSaving}
              onChange={(key, value) => updatePreferences({ inAppNotifications: { [key]: value } })}
            />
          ) : null}
          {tab === 'privacy' ? (
            <PrivacyPanel
              studio={studio}
              settings={data}
              venueProfile={venueProfile}
              venueId={venue?.id ?? null}
              organizationId={organizationId}
              canEdit={canEdit}
              saving={preferencesSaving}
              onSaved={load}
              onOrganizationChange={(value) =>
                updatePreferences({ privacy: { profileVisible: value } })
              }
              onError={setError}
            />
          ) : null}
          {tab === 'venue' ? (
            <VenueMenuPanel
              key={`${organizationId ?? ''}:${venue?.id ?? ''}`}
              venue={venue}
              organizationId={organizationId}
              menu={venueMenu}
              canEdit={canEdit}
              onSaved={(nextMenu) => {
                setVenueMenu(nextMenu);
                setVenue((current) =>
                  current ? { ...current, version: current.version + 1 } : current,
                );
              }}
              onError={setError}
              error={error}
            />
          ) : null}
          {tab === 'agreement' ? (
            <AgreementPanel settings={data} organizationId={organizationId} onSaved={load} />
          ) : null}
        </section>
      </div>
    </main>
  );
}

function StatsPanel({
  settings,
  studio,
}: {
  readonly settings: PartnerSettingsDto;
  readonly studio: StudioRole;
}) {
  const cards = [
    ['Events', settings.stats.events],
    [
      studio === 'promoter' ? 'Historically attributed tickets' : 'Tickets sold',
      settings.stats.ticketsSold,
    ],
    ...(studio === 'promoter' ? [] : [['Guests checked in', settings.stats.checkIns] as const]),
    ['Connections', settings.stats.connections],
  ] as const;
  return (
    <>
      <div className={styles['sectionTitle']}>
        <h2>Profile stats</h2>
        <p>Aggregate activity only. No guest identity or financial data is shown.</p>
      </div>
      <div className={styles['statsGrid']}>
        {cards.map(([label, value]) => (
          <div key={label}>
            <strong>{value ?? '—'}</strong>
            <span>{label}</span>
          </div>
        ))}
        <div>
          <strong>{new Date(settings.memberSince).toLocaleDateString()}</strong>
          <span>Member since</span>
        </div>
      </div>
    </>
  );
}

function AccountPanel({
  email,
  name,
  signOut,
}: {
  readonly email: string;
  readonly name: string;
  readonly signOut: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const onSignOut = async () => {
    setBusy(true);
    setError(null);
    try {
      await signOut();
    } catch {
      setError('Sign out did not complete. Try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className={styles['sectionTitle']}>
        <h2>Account &amp; security</h2>
        <p>Sign-in details are managed by your account provider.</p>
      </div>
      <dl className={styles['accountDetails']}>
        <div>
          <dt>Name</dt>
          <dd>{name}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{email || 'Unavailable'}</dd>
        </div>
        <div>
          <dt>Email verification</dt>
          <dd>Not exposed by this dashboard</dd>
        </div>
      </dl>
      {error ? (
        <p className={styles['error']} role="alert">
          {error}
        </p>
      ) : null}
      <div className={styles['actions']}>
        <Link href="/change-password">Change password</Link>
        <button type="button" disabled={busy} onClick={() => void onSignOut()}>
          {busy ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </>
  );
}

function ReadOnlyPanel({
  title,
  description,
  href,
  action,
}: {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly action: string;
}) {
  return (
    <div className={styles['sectionTitle']}>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className={styles['textLink']} href={href}>
        {action}
      </Link>
    </div>
  );
}

function NotificationPanel({
  settings,
  saving,
  onChange,
}: {
  readonly settings: PartnerSettingsDto;
  readonly saving: boolean;
  readonly onChange: (
    key: keyof PartnerSettingsDto['inAppNotifications'],
    value: boolean,
  ) => Promise<void>;
}) {
  const labels: readonly [
    Exclude<keyof PartnerSettingsDto['inAppNotifications'], number | symbol>,
    string,
  ][] = [
    ['eventUpdates', 'Event updates'],
    ['orderUpdates', 'Order updates'],
    ['requests', 'Requests'],
    ['partnerships', 'Partnerships'],
    ['payouts', 'Payout updates'],
  ];
  return (
    <>
      <div className={styles['sectionTitle']}>
        <h2>Notifications</h2>
        <p>
          Choose which updates appear in the in-app inbox. Email and WhatsApp preferences are not
          offered because those delivery channels are not configurable here.
        </p>
      </div>
      <div className={styles['toggleList']}>
        {labels.map(([key, label]) => (
          <label key={key}>
            <span>
              {label}
              <small>In-app inbox</small>
            </span>
            <input
              type="checkbox"
              disabled={saving}
              checked={settings.inAppNotifications[key]}
              onChange={(event) => void onChange(key, event.target.checked)}
            />
          </label>
        ))}
      </div>
      {saving ? (
        <p role="status" className={styles['hint']}>
          Saving notification preferences…
        </p>
      ) : null}
    </>
  );
}

function PrivacyPanel({
  studio,
  settings,
  venueProfile,
  venueId,
  organizationId,
  canEdit,
  saving,
  onSaved,
  onOrganizationChange,
  onError,
}: {
  readonly studio: StudioRole;
  readonly settings: PartnerSettingsDto;
  readonly venueProfile: VenueProfileDto | null;
  readonly venueId: string | null;
  readonly organizationId: string | null;
  readonly canEdit: boolean;
  readonly saving: boolean;
  readonly onSaved: () => Promise<void>;
  readonly onOrganizationChange: (value: boolean) => Promise<void>;
  readonly onError: (error: string | null) => void;
}) {
  const [savingVenue, setSavingVenue] = useState(false);
  const guestList = venueProfile?.public.settings.showGuestList ?? false;
  const activity = venueProfile?.public.settings.activityEnabled ?? false;
  const saveVenue = async (showGuestList: boolean, activityEnabled: boolean) => {
    if (!organizationId || !venueId || !venueProfile) return false;
    setSavingVenue(true);
    try {
      const { getMyVenue, updateVenueProfile } = await import('@/lib/venue/venue-repository');
      const venue = await getMyVenue(organizationId);
      if (!venue) throw new Error('Venue profile is unavailable.');
      await updateVenueProfile(venueId, organizationId, venue.version, {
        public: { settings: { showGuestList, activityEnabled } },
      });
      onError(null);
      await onSaved();
      return true;
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'Privacy settings could not be saved.');
      return false;
    } finally {
      setSavingVenue(false);
    }
  };
  return (
    <>
      <div className={styles['sectionTitle']}>
        <h2>Privacy</h2>
        <p>Control what appears on your public partner presence.</p>
      </div>
      <div className={styles['toggleList']}>
        <label>
          <span>
            Public partner profile<small>Let other partners discover and view your profile</small>
          </span>
          <input
            type="checkbox"
            disabled={!canEdit || saving}
            checked={settings.privacy.profileVisible}
            onChange={(event) => void onOrganizationChange(event.target.checked)}
          />
        </label>
        {studio === 'venue' ? (
          <>
            <label>
              <span>
                Guest list visibility<small>Use the existing Venue guest-list setting</small>
              </span>
              <input
                type="checkbox"
                disabled={!canEdit || saving || savingVenue}
                checked={guestList}
                onChange={(event) => {
                  void saveVenue(event.target.checked, activity);
                }}
              />
            </label>
            <label>
              <span>
                Activity visibility<small>Use the existing Venue activity setting</small>
              </span>
              <input
                type="checkbox"
                disabled={!canEdit || saving || savingVenue}
                checked={activity}
                onChange={(event) => {
                  void saveVenue(guestList, event.target.checked);
                }}
              />
            </label>
          </>
        ) : null}
      </div>
      {saving || savingVenue ? (
        <p className={styles['hint']} role="status">
          Saving privacy settings…
        </p>
      ) : null}
    </>
  );
}

function VenueMenuPanel({
  venue,
  organizationId,
  menu,
  canEdit,
  onSaved,
  onError,
  error,
}: {
  readonly venue: VenueDto | null;
  readonly organizationId: string | null;
  readonly menu: VenueMenuDto | null;
  readonly canEdit: boolean;
  readonly onSaved: (menu: VenueMenuDto) => void;
  readonly onError: (error: string | null) => void;
  readonly error: string | null;
}) {
  const [sections, setSections] = useState<VenueMenuDto['sections']>(menu?.sections ?? []);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!venue || !organizationId) return;
    setSaving(true);
    onError(null);
    if (
      sections.some(
        (section) => !section.name.trim() || section.items.some((item) => !item.name.trim()),
      )
    ) {
      onError('Each menu section and item needs a name before it can be saved.');
      setSaving(false);
      return;
    }
    try {
      onSaved(await updateVenueMenu(venue.id, organizationId, venue.version, { sections }));
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'Menu could not be saved.');
    } finally {
      setSaving(false);
    }
  };
  if (!venue || !menu)
    return (
      <div className={styles['sectionTitle']}>
        <h2>Menu &amp; door</h2>
        <p>Create your Venue profile first to configure its menu.</p>
        <Link className={styles['textLink']} href="/partner/venue/door">
          Open Door
        </Link>
      </div>
    );
  return (
    <>
      <div className={styles['sectionTitle']}>
        <h2>Venue menu</h2>
        <p>Menu changes save to this Venue. Door operations remain in the Door section.</p>
      </div>
      {sections.map((section, sectionIndex) => (
        <fieldset className={styles['menuSection']} key={`section-${String(sectionIndex)}`}>
          <legend>Menu section {String(sectionIndex + 1)}</legend>
          <label>
            Section name
            <input
              value={section.name}
              disabled={!canEdit}
              onChange={(event) => {
                setSections((current) =>
                  current.map((item, index) =>
                    index === sectionIndex ? { ...item, name: event.target.value } : item,
                  ),
                );
              }}
            />
          </label>
          {section.items.map((item, itemIndex) => (
            <div
              className={styles['menuItem']}
              key={`item-${String(sectionIndex)}-${String(itemIndex)}`}
            >
              <label>
                Item
                <input
                  value={item.name}
                  disabled={!canEdit}
                  onChange={(event) => {
                    setSections((current) =>
                      current.map((entry, index) =>
                        index === sectionIndex
                          ? {
                              ...entry,
                              items: entry.items.map((candidate, candidateIndex) =>
                                candidateIndex === itemIndex
                                  ? { ...candidate, name: event.target.value }
                                  : candidate,
                              ),
                            }
                          : entry,
                      ),
                    );
                  }}
                />
              </label>
              <label>
                Description
                <input
                  value={item.description ?? ''}
                  disabled={!canEdit}
                  onChange={(event) => {
                    setSections((current) =>
                      current.map((entry, index) =>
                        index === sectionIndex
                          ? {
                              ...entry,
                              items: entry.items.map((candidate, candidateIndex) =>
                                candidateIndex === itemIndex
                                  ? { ...candidate, description: event.target.value }
                                  : candidate,
                              ),
                            }
                          : entry,
                      ),
                    );
                  }}
                />
              </label>
              <label>
                Price (₹)
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={item.pricePaise == null ? '' : String(item.pricePaise / 100)}
                  disabled={!canEdit}
                  onChange={(event) => {
                    setSections((current) =>
                      current.map((entry, index) =>
                        index === sectionIndex
                          ? {
                              ...entry,
                              items: entry.items.map((candidate, candidateIndex) =>
                                candidateIndex === itemIndex
                                  ? {
                                      ...candidate,
                                      pricePaise:
                                        event.target.value === ''
                                          ? null
                                          : Math.round(Number(event.target.value) * 100),
                                    }
                                  : candidate,
                              ),
                            }
                          : entry,
                      ),
                    );
                  }}
                />
              </label>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => {
                  setSections((current) =>
                    current.map((entry, index) =>
                      index === sectionIndex
                        ? {
                            ...entry,
                            items: entry.items.filter(
                              (_, candidateIndex) => candidateIndex !== itemIndex,
                            ),
                          }
                        : entry,
                    ),
                  );
                }}
              >
                Remove item
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => {
              setSections((current) =>
                current.map((entry, index) =>
                  index === sectionIndex
                    ? {
                        ...entry,
                        items: [...entry.items, { name: '', pricePaise: null, tags: [] }],
                      }
                    : entry,
                ),
              );
            }}
          >
            Add item
          </button>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => {
              setSections((current) => current.filter((_, index) => index !== sectionIndex));
            }}
          >
            Remove section
          </button>
        </fieldset>
      ))}
      {error ? (
        <p className={styles['error']} role="alert">
          {error}
        </p>
      ) : null}
      <div className={styles['actions']}>
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => {
            setSections((current) => [...current, { name: '', items: [] }]);
          }}
        >
          Add section
        </button>
        <button
          className={styles['primary']}
          type="button"
          disabled={!canEdit || saving}
          onClick={() => void save()}
        >
          {saving ? 'Saving…' : 'Save menu'}
        </button>
        <Link className={styles['textLink']} href="/partner/venue/door">
          Open Door
        </Link>
      </div>
    </>
  );
}

function AgreementPanel({
  settings,
  organizationId,
  onSaved,
}: {
  readonly settings: PartnerSettingsDto;
  readonly organizationId: string | null;
  readonly onSaved: () => Promise<void>;
}) {
  const [handle, setHandle] = useState(settings.handle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const save = async () => {
    if (!organizationId) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updatePartnerSettings(organizationId, { handle });
      await onSaved();
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Handle could not be saved.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <div className={styles['sectionTitle']}>
        <h2>Promoter agreement &amp; handle</h2>
        <p>Your accepted agreement and public referral identity.</p>
      </div>
      <PromoterAgreementPanel />
      <label className={styles['handleField']}>
        Public handle
        <input
          value={handle}
          maxLength={60}
          onChange={(event) => {
            setHandle(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
          }}
        />
      </label>
      {error ? (
        <p role="alert" className={styles['error']}>
          {error}
        </p>
      ) : null}
      {saved ? (
        <p role="status" className={styles['success']}>
          Public handle saved.
        </p>
      ) : null}
      <button
        className={styles['primary']}
        type="button"
        disabled={saving || !handle.trim()}
        onClick={() => void save()}
      >
        {saving ? 'Saving…' : 'Save handle'}
      </button>
    </>
  );
}
