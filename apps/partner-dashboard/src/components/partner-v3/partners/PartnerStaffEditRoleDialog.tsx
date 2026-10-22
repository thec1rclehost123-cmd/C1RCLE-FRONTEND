'use client';

import { useEffect, useState } from 'react';

import { Avatar, Button, IconButton } from '@/components/partner-v3';
import { staffApi } from '@/lib/api/staff-api';
import { getActiveOrgId } from '@/lib/org/active-org';

import styles from './partners.module.css';

import type { StaffMember } from '@/data/partner-data-source';
import type { UpdateMemberRoleRequest } from '@/lib/api/staff-api';

type EditableRole = UpdateMemberRoleRequest['role'];

const ROLES: readonly {
  readonly value: EditableRole;
  readonly label: string;
  readonly hint: string;
}[] = [
  { value: 'member', label: 'Staff', hint: 'Roster access' },
  { value: 'manager', label: 'Manager', hint: 'Runs events & door' },
  { value: 'admin', label: 'Admin', hint: 'Can manage staff' },
];

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function getInitialRole(backendRole?: string): EditableRole {
  if (backendRole === 'admin') return 'admin';
  if (backendRole === 'manager') return 'manager';
  return 'member';
}

export function PartnerStaffEditRoleDialog({
  member,
  onClose,
  onUpdated,
  organizationId,
}: {
  readonly member: StaffMember;
  readonly onClose: () => void;
  readonly onUpdated?: (() => void) | undefined;
  readonly organizationId?: string | undefined;
}) {
  const initialRole = getInitialRole(member.backendRole);
  const [role, setRole] = useState<EditableRole>(initialRole);
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

  const canSubmit = role !== initialRole && !submitting;

  const handleProceed = () => {
    setSubmitting(true);
    setNotice('');

    const run = async () => {
      let orgId = organizationId ?? getActiveOrgId();
      if (!orgId) {
        try {
          const { resolveBrowserOrganizationId } =
            await import('@/lib/org/resolve-browser-organization');
          orgId = await resolveBrowserOrganizationId('venue');
        } catch {
          // ignore error
        }
      }
      if (!orgId) {
        setSubmitting(false);
        setNotice('No active organization selected.');
        return;
      }

      const targetUserId = member.userId ?? member.id;
      try {
        await staffApi.updateMemberRole(orgId, targetUserId, { role });
        onUpdated?.();
        onClose();
      } catch (error: unknown) {
        setSubmitting(false);
        setNotice(errorMessage(error));
      }
    };

    void run();
  };

  return (
    <div className={styles['dialogRoot']} role="presentation">
      <button
        type="button"
        className={styles['dialogScrim']}
        aria-label="Close edit role dialog"
        onClick={onClose}
      />
      <section
        className={styles['staffDialog']}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-role-title"
      >
        <div className={styles['dialogHeader']}>
          <div>
            <span className={styles['sectionKicker']}>Team access</span>
            <h2 id="edit-role-title">Edit staff role</h2>
            <p>Modify permissions and role assignment for this team member.</p>
          </div>
          <IconButton label="Close edit role dialog" onClick={onClose}>
            ×
          </IconButton>
        </div>

        <div className={styles['memberSummary']}>
          <Avatar name={member.name} />
          <div>
            <h3>{member.name}</h3>
            {member.email ? <p>{member.email}</p> : null}
            <span className={styles['currentRoleTag']}>Current role: {member.role}</span>
          </div>
        </div>

        <fieldset className={styles['permissionFieldset']}>
          <legend>New Role</legend>
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

        {notice ? (
          <p className={styles['dialogNotice']} role="status">
            {notice}
          </p>
        ) : null}

        <div className={styles['dialogActions']}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" variant="primary" disabled={!canSubmit} onClick={handleProceed}>
            {submitting ? 'Saving…' : 'Save role'}
          </Button>
        </div>
      </section>
    </div>
  );
}
