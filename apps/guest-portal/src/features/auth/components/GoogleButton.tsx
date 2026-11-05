'use client';

import Image from 'next/image';
import { useState } from 'react';
import { z } from 'zod';

import { createApiClient } from '@c1rcle/api-client';

import { captureGuestReturnFragment } from '@/lib/auth/return-fragment';

export function GoogleButton({ next }: { readonly next: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  async function start() {
    if (pending) return;
    captureGuestReturnFragment(next);
    setPending(true);
    setError(false);
    try {
      const body = await createApiClient({ baseUrl: window.location.origin }).post({
        path: '/api/auth/google',
        body: { next },
        schema: z.object({ url: z.string() }),
      });
      if (
        typeof body.url !== 'string' ||
        new URL(body.url).origin !== 'https://accounts.google.com'
      )
        throw new Error('Unavailable');
      window.location.assign(body.url);
    } catch {
      setError(true);
      setPending(false);
    }
  }
  return (
    <div className="mb-5 space-y-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          void start();
        }}
        className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-[#747775] bg-white px-3 text-sm font-medium text-[#1F1F1F] disabled:opacity-50"
      >
        <Image src="/auth/google-g.png" width={20} height={20} alt="" aria-hidden />
        {pending ? 'Connecting…' : 'Continue with Google'}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          Google sign-in is unavailable right now. Try again or use your email.
        </p>
      )}
    </div>
  );
}
