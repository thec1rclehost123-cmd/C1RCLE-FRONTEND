'use client';

import { useEffect, useState } from 'react';

import { useSession } from '@c1rcle/auth';
import { useMounted } from '@c1rcle/hooks';
import {
  AdminIcon,
  ApprovedIcon,
  ComplianceIcon,
  DashboardIcon,
  InviteIcon,
  RefundIcon,
  WalletIcon,
} from '@c1rcle/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@c1rcle/ui';

import { listAdmins, listOnboardingApplications, listProposals, listRefunds } from '@/lib/admin/admin-api';
import { formatPaise } from '@/lib/admin/format';

import type { IconProps } from '@c1rcle/icons';
import type { ComponentType } from 'react';

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
  icon: Icon,
}: {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
  readonly icon: ComponentType<IconProps>;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
          </span>
        </div>
        <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function LiveStatsCards() {
  const { user } = useSession();
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  // `useSession()` reads a client-only singleton that is always
  // unauthenticated during SSR (the server bootstrap proves a session exists
  // but never feeds this store). A returning admin's browser already has it
  // authenticated, so without this gate the very first client render would
  // show the skeleton while the server-rendered HTML shows nothing — a
  // hydration mismatch on every soft navigation back to this page.
  const mounted = useMounted();

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

  if (!mounted || user === null) {
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
      <StatCard
        label="Proposals"
        value={String(stats.pendingProposals)}
        hint="waiting on confirmation"
        icon={ApprovedIcon}
      />
      <StatCard
        label="Refunds"
        value={String(stats.pendingRefunds)}
        hint="pending decision"
        icon={RefundIcon}
      />
      <StatCard
        label="Refund value"
        value={formatPaise(stats.refundValuePaise)}
        hint="across pending requests"
        icon={WalletIcon}
      />
      <StatCard
        label="Onboarding"
        value={String(stats.onboardingInReview)}
        hint="awaiting review"
        icon={InviteIcon}
      />
      <StatCard label="Admins" value={String(stats.activeAdmins)} hint="active accounts" icon={AdminIcon} />
    </div>
  );
}

const PRINCIPLES = [
  {
    icon: ApprovedIcon,
    title: 'Dual control',
    description: 'Tier 3 actions move only through the proposal desk.',
    body: 'Financial and provisioning decisions are proposed, confirmed by a second admin, and then executed — the review trail is immutable.',
  },
  {
    icon: ComplianceIcon,
    title: 'Gate at the gateway',
    description: 'No browser-side role checks decide what you can do.',
    body: 'The console is a thin client over /api/v2/admin/*; the backend re-evaluates role and permission on every request.',
  },
  {
    icon: DashboardIcon,
    title: 'Audit first',
    description: 'Every admin action lands in the trail.',
    body: 'Open the Audit desk to trace who changed what, against which target, with the before/after payload and reason.',
  },
] as const;

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
        {PRINCIPLES.map(({ icon: Icon, title, description, body }) => (
          <Card key={title}>
            <CardHeader className="flex-row items-start gap-3 space-y-0">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{body}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}