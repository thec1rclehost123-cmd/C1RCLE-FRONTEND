'use client';

import { useEffect, useState } from 'react';

import { Button, IconButton } from '@/components/partner-v3';
import { staffApi } from '@/lib/api/staff-api';
import { getActiveOrgId } from '@/lib/org/active-org';

import styles from './partners.module.css';

import type { CreateInvitationRequest } from '@/lib/api/staff-api';

type InviteRole = CreateInvitationRequest['role'];

const ROLES: readonly { readonly value: InviteRole; readonly label: string; readonly hint: string }[] = [
  { value: 'member', label: 'Staff', hint: 'Roster access' },
  { value: 'manager', label: 'Manager', hint: 'Runs events & door' },
  { value: 'admin', label: 'Admin', hint: 'Can manage staff' },
];

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function PartnerStaffInviteDialog({
  onClose,
  onInvited,
  defaultCapability,
}: {
  readonly onClose: () => void;
  readonly onInvited?: (() => void) | undefined;
  readonly defaultCapability?: 'venue' | 'host' | undefined;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InviteRole>('member');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const canSubmit = email.trim().length > 0 && confirmed && !submitting;

  const handleProceed = () => {
    const orgId = getActiveOrgId();
    if (!orgId) {
      setNotice('No active organization selected. Select an organization first.');
      return;
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setNotice('Enter an email address to invite.');
      return;
    }
    setSubmitting(true);
    setNotice('');
    void staffApi
      .createInvitation(orgId, {
        email: trimmedEmail,
        role,
        ...(defaultCapability ? { capabilities: [defaultCapability] } : {}),
      })
      .then(() => {
        onInvited?.();
        onClose();
      })
      .catch((error: unknown) => {
        setSubmitting(false);
        setNotice(errorMessage(error));
      });
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
            <p>Invite a teammate by email. We&apos;ll send them a link to join with the role you pick.</p>
          </div>
          <IconButton label="Close add staff dialog" onClick={onClose}>
            ×
          </IconButton>
        </div>
        <label className={styles['fieldLabel']} htmlFor="staff-email">
          Email
          <input
            id="staff-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setNotice('');
            }}
            placeholder="teammate@email.com"
            autoComplete="email"
          />
        </label>
        <fieldset className={styles['permissionFieldset']}>
          <legend>Role</legend>
          <div className={styles['permissionOptions']}>
            {ROLES.map((option) => (
              <button
                key={option.value}
                type="button"
                className={[
                  styles['permissionToggle'],
                  role === option.value ? styles['permissionToggleActive'] : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={role === option.value}
                onClick={() => {
                  setRole(option.value);
                  setNotice('');
                }}
              >
                <span aria-hidden="true">{role === option.value ? '✓' : '+'}</span>
                {option.label} · {option.hint}
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
          <span>
            I confirm this person should have {role === 'member' ? 'staff' : role} access
            {defaultCapability ? ` on this ${defaultCapability} organisation` : ''}.
          </span>
        </label>
        {notice ? (
          <p className={styles['dialogNotice']} role="status">
            {notice}
          </p>
        ) : null}
        <Button
          type="button"
          variant="primary"
          disabled={!canSubmit}
          onClick={handleProceed}
        >
          {submitting ? 'Sending…' : 'Send invite'}
        </Button>
      </section>
    </div>
  );
}

export function AddStaffButton({
  buttonClassName,
  defaultCapability,
  onInvited,
  disabled = false,
  disabledTitle,
}: {
  readonly buttonClassName?: string;
  readonly defaultCapability?: 'venue' | 'host' | undefined;
  readonly onInvited?: (() => void) | undefined;
  readonly disabled?: boolean;
  readonly disabledTitle?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="primary"
        className={buttonClassName}
        disabled={disabled}
        {...(disabled && disabledTitle ? { title: disabledTitle } : {})}
        onClick={() => {
          setOpen(true);
        }}
      >
        Add staff
      </Button>
      {open && !disabled ? (
        <PartnerStaffInviteDialog
          onClose={() => {
            setOpen(false);
          }}
          {...(onInvited ? { onInvited } : {})}
          {...(defaultCapability ? { defaultCapability } : {})}
        />
      ) : null}
    </>
  );
}
