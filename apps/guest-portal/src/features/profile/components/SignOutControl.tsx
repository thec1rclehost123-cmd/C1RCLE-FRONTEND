'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { clearSession } from '@c1rcle/auth';

export function SignOutControl() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!dialogOpen) return;

    cancelButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDialogOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [dialogOpen]);

  const signOut = () => {
    clearSession();
    setDialogOpen(false);
    router.replace('/login?next=/profile');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDialogOpen(true);
        }}
        className="inline-flex min-h-11 items-center rounded-full border border-red-400/25 px-5 text-[9px] font-black uppercase tracking-[0.2em] text-red-300 transition-colors hover:bg-red-400 hover:text-black"
      >
        Sign out
      </button>

      {dialogOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sign-out-heading"
            className="w-full max-w-md rounded-[2rem] border border-white/15 bg-[#0A0A0A] p-7 shadow-2xl"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-red-300">Account</p>
            <h3 id="sign-out-heading" className="mt-3 text-3xl font-black uppercase text-white">
              End this session?
            </h3>
            <p className="mt-4 text-sm leading-6 text-white/45">
              Continue to the login screen to access a different account.
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={() => {
                  setDialogOpen(false);
                }}
                className="min-h-11 rounded-full border border-white/15 px-5 text-[9px] font-black uppercase tracking-[0.2em] text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                aria-label="Confirm sign out"
                onClick={signOut}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-[9px] font-black uppercase tracking-[0.2em] text-black"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
