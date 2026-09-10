'use client';

import { useEffect, useState } from 'react';

import { Button, IconButton } from '@/components/partner-v3';

import styles from './partners.module.css';

import type { PartnerPermission } from '@/data/partner-data-source';

const permissions: readonly PartnerPermission[] = [
  'Door check-in',
  'Finance view',
  'Event editing',
  'Guest messaging',
];

export function PartnerStaffInviteDialog({ onClose }: { readonly onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [selected, setSelected] = useState<PartnerPermission[]>(['Door check-in']);
  const [confirmed, setConfirmed] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const togglePermission = (permission: PartnerPermission) => {
    setSelected((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  };

  return (
    <div className={styles['dialogRoot']} role="presentation">
      <button
        type="button"
        className={styles['dialogScrim']}
        aria-label="Close add staff dialog"
        onClick={onClose}
      />
      <section
        className={styles['staffDialog']}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-staff-title"
      >
        <div className={styles['dialogHeader']}>
          <div>
            <span className={styles['sectionKicker']}>Team access</span>
            <h2 id="add-staff-title">Add staff</h2>
            <p>Invite a teammate and set what they can access.</p>
          </div>
          <IconButton label="Close add staff dialog" onClick={onClose}>
            ×
          </IconButton>
        </div>
        <label className={styles['fieldLabel']} htmlFor="staff-email">
          Contact
          <input
            id="staff-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setNotice('');
            }}
            placeholder="teammate@email.com"
          />
        </label>
        <fieldset className={styles['permissionFieldset']}>
          <legend>Access permissions</legend>
          <div className={styles['permissionOptions']}>
            {permissions.map((permission) => (
              <button
                key={permission}
                type="button"
                className={[
                  styles['permissionToggle'],
                  selected.includes(permission) ? styles['permissionToggleActive'] : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={selected.includes(permission)}
                onClick={() => {
                  togglePermission(permission);
                  setNotice('');
                }}
              >
                <span aria-hidden="true">{selected.includes(permission) ? '✓' : '+'}</span>
                {permission}
              </button>
            ))}
          </div>
        </fieldset>
        <label className={styles['confirmLabel']}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => {
              setConfirmed(event.target.checked);
              setNotice('');
            }}
          />{' '}
          <span>I confirm this person should have the access selected above.</span>
        </label>
        {notice ? (
          <p className={styles['dialogNotice']} role="status">
            {notice}
          </p>
        ) : null}
        <Button
          type="button"
          variant="primary"
          disabled={!email || !confirmed}
          onClick={() => {
            setNotice('Staff invitations are unavailable in fixture mode. No invitation was sent.');
          }}
        >
          Proceed
        </Button>
      </section>
    </div>
  );
}

export function AddStaffButton({ buttonClassName }: { readonly buttonClassName?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="primary"
        className={buttonClassName}
        onClick={() => {
          setOpen(true);
        }}
      >
        Add staff
      </Button>
      {open ? (
        <PartnerStaffInviteDialog
          onClose={() => {
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
