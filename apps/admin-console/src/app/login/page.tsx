'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { login } from '@c1rcle/auth';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, TextField } from '@c1rcle/ui';

import type { SyntheticEvent } from 'react';

/**
 * Console sign-in. Credentials are the same gateway session the partner and
 * guest apps use; whether the account is a *platform admin* is decided by the
 * gateway's `AdminAuthorityService` on every admin API call (the console UI
 * only navigates the user to the error surfaced on a non-admin account).
 */

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      // login() calls the BFF /api/auth/login proxy; a 4xx collapses into a
      // single generic message (account-existence oracle suppression).
      await login({ email, password });
      router.replace('/');
    } catch {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Restricted access
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">C1RCLE Admin Console</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Platform operations require an active admin account. Your session expires after 30
              minutes of inactivity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
              <TextField
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => { setEmail(event.target.value); }}
              />
              <TextField
                label="Password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => { setPassword(event.target.value); }}
              />

              {error === '' ? null : (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={loading || email === '' || password === ''}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}