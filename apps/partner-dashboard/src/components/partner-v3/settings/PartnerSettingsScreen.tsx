'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import {
  AdminIcon,
  AddIcon,
  BankIcon,
  CheckIcon,
  CloseIcon,
  DragHandleIcon,
  EditIcon,
  ImageIcon,
  NextIcon,
  NotificationIcon,
  UsersIcon,
} from '@c1rcle/icons';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import styles from './settings.module.css';

import type {
  PartnerSettingsData,
  SettingsAccountIcon,
  SettingsSection,
} from '@/data/partner-data-source';

const sections: readonly { readonly value: SettingsSection; readonly label: string }[] = [
  { value: 'presence', label: 'Presence' },
  { value: 'menu', label: 'Menu' },
  { value: 'account', label: 'Account' },
];

const accountIcons: Readonly<Record<SettingsAccountIcon, typeof BankIcon>> = {
  business: BankIcon,
  team: UsersIcon,
  notifications: NotificationIcon,
  security: AdminIcon,
};

export function PartnerSettingsScreen({ data }: { readonly data: PartnerSettingsData }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = parseSection(searchParams.get('section'));
  const updateSection = (value: SettingsSection) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === 'presence') next.delete('section');
    else next.set('section', value);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <PageContainer>
      <div className={styles['settingsPage']} data-accent={data.accent}>
        <header className={styles['settingsHeader']}>
          <h1>Settings</h1>
        </header>
        <nav className={styles['settingsTabs']} aria-label="Settings sections">
          {sections.map((item) => (
            <button
              key={item.value}
              aria-pressed={section === item.value}
              type="button"
              onClick={() => {
                updateSection(item.value);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
        {section === 'presence' ? (
          <PresenceSettings data={data} />
        ) : section === 'menu' ? (
          <MenuSettings data={data} />
        ) : (
          <AccountSettings data={data} />
        )}
      </div>
    </PageContainer>
  );
}

function PresenceSettings({ data }: { readonly data: PartnerSettingsData }) {
  const [displayName, setDisplayName] = useState(data.displayName);
  const [bio, setBio] = useState(data.bio);
  const [highlights, setHighlights] = useState([...data.highlights]);
  const [newHighlight, setNewHighlight] = useState('');
  const [addingHighlight, setAddingHighlight] = useState(false);

  const addHighlight = () => {
    const value = newHighlight.trim();
    if (!value) return;
    setHighlights((current) => [...current, value]);
    setNewHighlight('');
    setAddingHighlight(false);
  };

  return (
    <div className={styles['presenceLayout']}>
      <section className={styles['presenceEditor']} aria-labelledby="presence-editor-title">
        <div className={styles['coverArea']}>
          <div className={styles['coverGlow']} aria-hidden="true" />
          <button
            disabled
            title="Cover image changes are unavailable in fixture mode"
            type="button"
          >
            <ImageIcon size={13} aria-hidden="true" />
            Change cover
          </button>
        </div>
        <div className={styles['editorBody']}>
          <div className={styles['profileAvatar']}>{data.initials}</div>
          <h2 className={styles['srOnly']} id="presence-editor-title">
            Presence editor
          </h2>
          <div className={styles['presenceFields']}>
            <label>
              Display name
              <input
                value={displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                }}
              />
            </label>
            <label>
              Bio
              <textarea
                value={bio}
                onChange={(event) => {
                  setBio(event.target.value);
                }}
              />
            </label>
            <div className={styles['highlightField']}>
              <span>Highlights</span>
              <div className={styles['highlightList']}>
                {highlights.map((highlight) => (
                  <span className={styles['highlightChip']} key={highlight}>
                    {highlight}
                    <button
                      aria-label={`Remove ${highlight}`}
                      type="button"
                      onClick={() => {
                        setHighlights((current) => current.filter((item) => item !== highlight));
                      }}
                    >
                      <CloseIcon size={12} aria-hidden="true" />
                    </button>
                  </span>
                ))}
                {addingHighlight ? (
                  <span className={styles['addHighlight']}>
                    <input
                      aria-label="New highlight"
                      value={newHighlight}
                      onChange={(event) => {
                        setNewHighlight(event.target.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') addHighlight();
                      }}
                      placeholder="Add highlight"
                    />
                    <button aria-label="Confirm highlight" type="button" onClick={addHighlight}>
                      <CheckIcon size={12} aria-hidden="true" />
                    </button>
                  </span>
                ) : (
                  <button
                    className={styles['addButton']}
                    type="button"
                    onClick={() => {
                      setAddingHighlight(true);
                    }}
                  >
                    <AddIcon size={13} aria-hidden="true" />
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className={styles['saveArea']}>
          <button
            className={styles['primaryButton']}
            disabled
            title="Presence save is unavailable in fixture mode"
            type="button"
          >
            <CheckIcon size={16} aria-hidden="true" />
            Save presence
          </button>
          <span>Changes are local to this preview until profile persistence is connected.</span>
        </div>
      </section>
      <PresencePreview data={data} displayName={displayName} bio={bio} highlights={highlights} />
    </div>
  );
}

function PresencePreview({
  data,
  displayName,
  bio,
  highlights,
}: {
  readonly data: PartnerSettingsData;
  readonly displayName: string;
  readonly bio: string;
  readonly highlights: readonly string[];
}) {
  return (
    <aside className={styles['previewColumn']} aria-label="Public presence preview">
      <div className={styles['previewLabel']}>
        <span />
        How guests see you
      </div>
      <div className={styles['previewCard']}>
        <div className={styles['previewCover']}>
          <div className={styles['previewGlow']} aria-hidden="true" />
        </div>
        <div className={styles['previewBody']}>
          <div className={styles['previewAvatar']}>{data.initials}</div>
          <h2>{displayName || 'Your display name'}</h2>
          <p>{bio || 'Your public bio will appear here.'}</p>
          <div className={styles['previewHighlights']}>
            {highlights.map((highlight) => (
              <span key={highlight}>{highlight}</span>
            ))}
          </div>
          <div className={styles['previewStats']}>
            {data.presenceStats.map((stat) => (
              <div key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
          <button disabled title="Following is unavailable in fixture mode" type="button">
            Follow
          </button>
        </div>
      </div>
    </aside>
  );
}

function MenuSettings({ data }: { readonly data: PartnerSettingsData }) {
  const [isLive, setIsLive] = useState(data.menuLive);
  return (
    <section className={styles['narrowSection']} aria-labelledby="menu-settings-title">
      <div className={styles['menuStatus']}>
        <div>
          <h2 id="menu-settings-title">Menu is {isLive ? 'live' : 'hidden'}</h2>
          <p>Guests can see and order these items right now.</p>
        </div>
        <button
          className={styles['toggle']}
          aria-pressed={isLive}
          aria-label="Toggle menu visibility"
          type="button"
          onClick={() => {
            setIsLive((value) => !value);
          }}
        >
          <span />
        </button>
      </div>
      <p className={styles['localNote']}>
        This visibility switch is a local preview only; menu persistence is unavailable.
      </p>
      <div className={styles['menuList']}>
        {data.menuItems.map((item) => (
          <div className={styles['menuRow']} key={item.id}>
            <DragHandleIcon className={styles['dragIcon']} size={16} aria-hidden="true" />
            <span className={styles['menuThumb']} />
            <span className={styles['menuIdentity']}>
              <strong>{item.name}</strong>
              <small>{item.category}</small>
            </span>
            <strong className={styles['menuPrice']}>{item.price}</strong>
            <button
              disabled
              aria-label={`Edit ${item.name}`}
              title="Menu editing is unavailable in fixture mode"
              type="button"
            >
              <EditIcon size={14} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function AccountSettings({ data }: { readonly data: PartnerSettingsData }) {
  return (
    <section className={styles['narrowSection']} aria-labelledby="account-settings-title">
      <h2 className={styles['srOnly']} id="account-settings-title">
        Account settings
      </h2>
      <div className={styles['accountList']}>
        {data.accountRows.map((row) => {
          const Icon = accountIcons[row.icon];
          return (
            <button
              className={styles['accountRow']}
              disabled
              title="Account detail navigation is unavailable in fixture mode"
              type="button"
              key={row.id}
            >
              <span className={styles['accountIcon']}>
                <Icon size={18} aria-hidden="true" />
              </span>
              <span>
                <strong>{row.title}</strong>
                <small>{row.description}</small>
              </span>
              <NextIcon size={18} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function parseSection(value: string | null): SettingsSection {
  return sections.some((item) => item.value === value) ? (value as SettingsSection) : 'presence';
}
