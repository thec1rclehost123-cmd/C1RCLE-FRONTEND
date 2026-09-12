'use client';

import { useEffect, useState } from 'react';

import { useSession } from '@c1rcle/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@c1rcle/ui';

import { listAdmins, listOnboardingApplications, listProposals, listRefunds } from '@/lib/admin/admin-api';
import { formatPaise } from '@/lib/admin/format';

interface LiveStats {
  readonly pendingProposals: number;
  readonly pendingRefunds: number;
  readonly refundValuePaise: number;
  readonly onboardingInReview: number;
  readonly activeAdmins: number;
}

function StatCard({
  label,
  value,
  hint,
}: {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{label}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="mt-1">{hint}</p>
      </CardContent>
    </Card>
  );
}

function LiveStatsCards() {
  const { user } = useSession();
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    // No signed-in admin → nothing to fetch (also keeps the jsdom smoke test
    // offline and silent).
    if (user === null) {
      return;
    }
    let cancelled = false;

    Promise.all([listProposals('pending', 1), listRefunds('pending', 1), listOnboardingApplications('submitted', 1), listAdmins(1)])
      .then(([proposals, refunds, onboarding, admins]) => {
        if (cancelled) {
          return;
        }
        setStats({
          pendingProposals: proposals.pageInfo.total,
          pendingRefunds: refunds.pageInfo.total,
          refundValuePaise: refunds.items.reduce((sum, item) => sum + item.amountPaise, 0),
          onboardingInReview: onboarding.pageInfo.total,
          activeAdmins: admins.items.filter((admin) => admin.isActive).length,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setUnavailable(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (user === null) {
    return null;
  }

  if (stats === null && !unavailable) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-busy="true">
        {[0, 1, 2, 3, 4].map((index) => (
          <Card key={index}>
            <CardContent className="flex h-28 items-center justify-center text-sm text-muted-foreground">
              Loading…
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (stats === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((index) => (
          <Card key={index}>
            <CardContent className="flex h-28 items-center justify-center text-sm text-muted-foreground">
              Unavailable
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard label="Proposals" value={String(stats.pendingProposals)} hint="waiting on confirmation" />
      <StatCard label="Refunds" value={String(stats.pendingRefunds)} hint="pending decision" />
      <StatCard label="Refund value" value={formatPaise(stats.refundValuePaise)} hint="across pending requests" />
      <StatCard label="Onboarding" value={String(stats.onboardingInReview)} hint="awaiting review" />
      <StatCard label="Admins" value={String(stats.activeAdmins)} hint="active accounts" />
    </div>
  );
}

export function OverviewDesk() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">C1RCLE Admin Console</h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          Platform operations, users and oversight. Every privileged action here requires the
          gateway&apos;s tiered admin authority and is appended to the audit trail.
        </p>
      </div>

      <LiveStatsCards />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Dual control</CardTitle>
            <CardDescription>Tier 3 actions move only through the proposal desk.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Financial and provisioning decisions are proposed, confirmed by a second admin, and then
            executed — the review trail is immutable.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gate at the gateway</CardTitle>
            <CardDescription>No browser-side role checks decide what you can do.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The console is a thin client over <code className="font-mono">/api/v2/admin/*</code>; the
            backend re-evaluates role and permission on every request.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit first</CardTitle>
            <CardDescription>Every admin action lands in the trail.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Open the Audit desk to trace who changed what, against which target, with the before/after
            payload and reason.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}