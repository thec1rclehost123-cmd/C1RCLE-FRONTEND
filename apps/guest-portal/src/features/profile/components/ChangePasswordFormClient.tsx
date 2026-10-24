'use client';

import { useRouter } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import { changePassword } from '@c1rcle/auth';

const inputClass =
  'mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-black/45 px-4 text-sm text-white outline-none focus:border-[#FF6842]';

export function ChangePasswordFormClient() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    if (newPassword.length < 8) {
      setError('Use at least eight characters.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Choose a different new password.');
      return;
    }
    if (newPassword !== confirmation) {
      setError('New passwords do not match.');
      return;
    }

    setPending(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
      setSaved(true);
      router.refresh();
    } catch (caught) {
      setError(
        isApiClientError(caught) && caught.status === 401
          ? 'Your session expired. Sign in again before changing your password.'
          : isApiClientError(caught) && caught.status === 400
            ? 'Your current password could not be confirmed.'
            : 'Your password could not be changed. Please try again.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 sm:p-8"
    >
      <h3 className="text-xl font-black uppercase tracking-[-0.03em] text-white">
        Change password
      </h3>
      <p className="mt-2 text-sm leading-6 text-white/50">
        Your other signed-in sessions will be ended when this changes.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-white/70">Current password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value);
            }}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-white/70">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
            }}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-white/70">Confirm new password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirmation}
            onChange={(event) => {
              setConfirmation(event.target.value);
            }}
            className={inputClass}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="mt-4 text-sm text-emerald-300">
          Password changed.
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !currentPassword || !newPassword || !confirmation}
        className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-white px-6 text-xs font-black uppercase tracking-[0.14em] text-black disabled:opacity-45 sm:w-auto"
      >
        {pending ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}
