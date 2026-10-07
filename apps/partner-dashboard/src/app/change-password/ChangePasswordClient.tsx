'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { changePassword, useSessionStore } from '@c1rcle/auth';

import { Button } from '@/components/partner-v3/Button';
import { PageContainer } from '@/components/partner-v3/PagePrimitives';
import styles from '@/components/partner-v3/partners/partners.module.css';
import { EmptyState, LoadingState } from '@/components/partner-v3/States';

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * First-login rotation screen for staff-invitation temporary credentials
 * (also usable for voluntary changes later). The gateway clears the
 * `mustChangePassword` flag on success; every other app route 403s until
 * then, so finishing here unblocks the dashboard.
 */
export function ChangePasswordClient() {
  const sessionState = useSessionStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/partner/select-organization';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!sessionState.hydrated || sessionState.status === 'unknown') {
    return (
      <PageContainer>
        <LoadingState label="Checking your session…" />
      </PageContainer>
    );
  }

  if (sessionState.status !== 'authenticated') {
    return (
      <PageContainer>
        <EmptyState
          title="Sign in first"
          description="Sign in with your invitation credentials, then set your own password."
          action={
            <Link href={`/login?next=${encodeURIComponent('/change-password')}`}>Sign in</Link>
          }
        />
      </PageContainer>
    );
  }

  const mustChange = sessionState.session?.user.mustChangePassword === true;

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const tooShort = newPassword.length > 0 && newPassword.length < 8;
  const sameAsCurrent = newPassword.length > 0 && newPassword === currentPassword;
  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    !mismatch &&
    !sameAsCurrent &&
    !submitting;

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    void changePassword({ currentPassword, newPassword })
      .then(() => {
        router.push(next);
      })
      .catch((submitError: unknown) => {
        setSubmitting(false);
        setError(errorMessage(submitError));
      });
  };

  return (
    <PageContainer>
      <div className={styles['staffSection']}>
        <header className={styles['partnersHeader']}>
          <div>
            <span className={styles['sectionKicker']}>Account security</span>
            <h1>Set your password</h1>
            <p>
              {mustChange
                ? 'You signed in with a temporary invitation password. Set your own password to unlock the dashboard.'
                : 'Change your account password.'}
            </p>
          </div>
        </header>
        <form onSubmit={handleSubmit} className={styles['staffDialog']}>
          <label className={styles['fieldLabel']} htmlFor="current-password">
            Current password
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value);
                setError('');
              }}
            />
          </label>
          <label className={styles['fieldLabel']} htmlFor="new-password">
            New password (min 8 characters)
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                setError('');
              }}
            />
          </label>
          <label className={styles['fieldLabel']} htmlFor="confirm-password">
            Confirm new password
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError('');
              }}
            />
          </label>
          {mismatch ? (
            <p className={styles['dialogNotice']} role="status">
              New passwords don&apos;t match.
            </p>
          ) : null}
          {tooShort ? (
            <p className={styles['dialogNotice']} role="status">
              New password must be at least 8 characters.
            </p>
          ) : null}
          {sameAsCurrent ? (
            <p className={styles['dialogNotice']} role="status">
              New password must be different from the current password.
            </p>
          ) : null}
          {error ? (
            <p className={styles['dialogNotice']} role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="primary" disabled={!canSubmit}>
            {submitting ? 'Saving…' : 'Set password'}
          </Button>
        </form>
      </div>
    </PageContainer>
  );
}
