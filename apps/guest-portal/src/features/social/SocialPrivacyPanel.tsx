'use client';

import { useEffect, useState } from 'react';

import {
  socialMutationReceiptSchema,
  guestSocialPrivacyStateSchema,
} from '@c1rcle/contracts/guest-social';
import { Button } from '@c1rcle/ui';
import { cn } from '@c1rcle/utils';

import { authButtonClass } from '@/features/auth/components/AuthShell';
import { csrfHeaders } from '@/lib/bff/csrf';

import { socialClient } from './social-client';

import type { GuestSocialPrivacyState } from '@c1rcle/contracts/guest-social';

export function SocialPrivacyPanel() {
  const [state, setState] = useState<GuestSocialPrivacyState | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  async function load() {
    setError('');
    try {
      setState(
        await socialClient.get({
          path: '/api/social/privacy',
          schema: guestSocialPrivacyStateSchema,
        }),
      );
    } catch {
      setError('Privacy settings could not be loaded. Try again.');
    }
  }
  useEffect(() => {
    let active = true;
    void socialClient
      .get({ path: '/api/social/privacy', schema: guestSocialPrivacyStateSchema })
      .then((value) => {
        if (active) setState(value);
      })
      .catch(() => {
        if (active) setError('Privacy settings could not be loaded. Try again.');
      });
    return () => {
      active = false;
    };
  }, []);
  async function save() {
    if (!state || busy) return;
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      setState(
        await socialClient.put({
          path: '/api/social/privacy',
          body: {
            profileVisible: state.profileVisible,
            showOnGuestlists: state.showOnGuestlists,
            showUpcomingEvents: state.showUpcomingEvents,
          },
          headers: csrfHeaders(),
          schema: guestSocialPrivacyStateSchema,
        }),
      );
      setSaved(true);
    } catch {
      setError('Your privacy settings could not be saved. Try again.');
    } finally {
      setBusy(false);
    }
  }
  async function remove(kind: 'blocks' | 'events', id: string) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await socialClient.put({
        path:
          kind === 'blocks'
            ? `/api/social/blocks/${encodeURIComponent(id)}`
            : `/api/social/events/${encodeURIComponent(id)}/visibility`,
        body: kind === 'blocks' ? { blocked: false } : { hidden: false },
        schema: socialMutationReceiptSchema,
        headers: csrfHeaders(),
      });
      await load();
    } catch {
      setError('That privacy change could not be saved. Try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-labelledby="social-privacy-title" className="min-w-0 max-w-xl">
      <h2 id="social-privacy-title" className="text-xl font-semibold text-white">
        Privacy
      </h2>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {error}
        </p>
      )}
      {!state ? (
        error ? (
          <Button variant="outline" className="mt-5 min-h-11" onClick={() => void load()}>
            Retry privacy settings
          </Button>
        ) : (
          <p role="status" className="mt-5 text-sm text-white/60">
            Loading privacy settings…
          </p>
        )
      ) : (
        <>
          <div className="mt-4">
            {(
              [
                ['profileVisible', 'Show my social profile'],
                ['showOnGuestlists', 'Show me on event guestlists'],
                ['showUpcomingEvents', 'Show upcoming events on my profile'],
              ] as const
            ).map(([key, label]) => (
              <label
                aria-label={label}
                key={key}
                htmlFor={`social-${key}`}
                className="flex min-h-12 cursor-pointer items-center gap-3 py-2 text-sm text-white/90 has-disabled:cursor-default has-disabled:text-white/40"
              >
                <input
                  id={`social-${key}`}
                  type="checkbox"
                  checked={state[key]}
                  disabled={busy || (key !== 'profileVisible' && !state.profileVisible)}
                  onChange={(e) => {
                    setState({ ...state, [key]: e.target.checked });
                    setSaved(false);
                  }}
                  className="size-[18px] shrink-0 accent-[#FF4400]"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-white/60">
            Your email, phone and birthday are always private.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
            <button
              className={cn(authButtonClass, 'min-h-11 w-auto px-5')}
              disabled={busy}
              onClick={() => void save()}
            >
              {busy ? 'Saving…' : 'Save privacy settings'}
            </button>
            {saved && (
              <p role="status" className="text-sm text-white/70">
                Privacy settings saved.
              </p>
            )}
          </div>
          <section
            aria-labelledby="blocked-guests-heading"
            className="mt-9 border-t border-white/10 pt-6"
          >
            <h3 id="blocked-guests-heading" className="text-base font-semibold text-white">
              Blocked guests
            </h3>
            {state.blockedUsers.length === 0 ? (
              <p className="mt-3 text-sm text-white/60">No blocked guests.</p>
            ) : (
              <ul className="mt-2 divide-y divide-white/10">
                {state.blockedUsers.map((guest) => (
                  <li
                    key={guest.id}
                    className="flex min-h-14 items-center justify-between gap-4 py-1"
                  >
                    <span className="min-w-0 break-words text-sm text-white/85">
                      {guest.displayName}
                    </span>
                    <Button
                      variant="ghost"
                      className="min-h-11 shrink-0 rounded-full px-3 text-sm text-white/70 hover:text-white"
                      disabled={busy}
                      onClick={() => void remove('blocks', guest.id)}
                    >
                      Unblock
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {state.hiddenEvents.length > 0 && (
            <section
              aria-labelledby="hidden-events-heading"
              className="mt-7 border-t border-white/10 pt-6"
            >
              <h3 id="hidden-events-heading" className="text-base font-semibold text-white">
                Hidden events
              </h3>
              <ul className="mt-2 divide-y divide-white/10">
                {state.hiddenEvents.map((event) => (
                  <li
                    key={event.id}
                    className="flex min-h-14 items-center justify-between gap-4 py-1"
                  >
                    <span className="min-w-0 break-words text-sm text-white/85">{event.title}</span>
                    <Button
                      variant="ghost"
                      className="min-h-11 shrink-0 rounded-full px-3 text-sm text-white/70 hover:text-white"
                      disabled={busy}
                      onClick={() => void remove('events', event.id)}
                    >
                      Unhide
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </section>
  );
}
