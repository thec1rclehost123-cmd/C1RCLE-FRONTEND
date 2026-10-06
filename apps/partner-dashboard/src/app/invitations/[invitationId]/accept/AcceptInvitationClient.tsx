'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import { useSessionStore } from '@c1rcle/auth';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';
import { EmptyState, ErrorState } from '@/components/partner-v3/States';
import { staffApi } from '@/lib/api/staff-api';
import { setActiveOrg } from '@/lib/org/active-org';
import { resolveLandingPath } from '@/lib/org/route-after-auth';

type AcceptState =
  | { readonly status: 'idle' }
  | { readonly status: 'resolving' }
  | { readonly status: 'done'; readonly title: string }
  | { readonly status: 'expired'; readonly message: string }
  | { readonly status: 'error'; readonly message: string };

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Matches the backend's already-a-member rejection. Newer backends accept
 * idempotently instead of throwing, but older ones (and races) can still
 * surface this — and for the invitee it means the same thing: they're in.
 */
function isAlreadyMemberError(error: unknown): boolean {
  return /already a member/i.test(errorMessage(error));
}

/** A status-coded failure (expired, revoked, invalid) — retrying is futile. */
function isTerminalError(error: unknown): boolean {
  return isApiClientError(error) && typeof error.status === 'number';
}

/**
 * The invitee landing for the email's Accept CTA. Signed-out visitors get a
 * sign-in prompt (email prefilled); signed-in visitors are accepted
 * automatically — the click that brought them here WAS the confirmation —
 * then handed to the dashboard. No second Accept button to wonder about.
 */
export function AcceptInvitationClient({
  invitationId,
  emailHint,
}: {
  readonly invitationId: string;
  readonly emailHint: string | null;
}) {
  const sessionState = useSessionStore();
  const sessionStatus = sessionState.status;
  const hydrated = sessionState.hydrated;
  const router = useRouter();
  const [state, setState] = useState<AcceptState>({ status: 'idle' });
  const attemptedRef = useRef(false);

  const mustChangePassword = sessionState.session?.user.mustChangePassword === true;

  useEffect(() => {
    // Flagged accounts are bounced to the rotation screen by
    // PasswordChangeGuard (with ?next= back here) — never accept on a
    // temporary credential.
    if (!hydrated || sessionStatus !== 'authenticated' || mustChangePassword) return;
    if (attemptedRef.current || state.status !== 'idle') return;
    attemptedRef.current = true;
    setState({ status: 'resolving' });
    void staffApi
      .acceptInvitation(invitationId)
      .then(async (organization) => {
        await setActiveOrg(organization.id);
        setState({ status: 'done', title: `You're on the ${organization.name} team` });
        // Straight into the studio — no workspace picker in between. The
        // overview path resolves from the org's own access record (venue team
        // lands on venue, host team on host), falling back to the picker only
        // when that lookup fails.
        router.replace(await resolveLandingPath(organization.id));
      })
      .catch(async (error: unknown) => {
        if (isAlreadyMemberError(error)) {
          // Legacy backends reject instead of accepting idempotently. The
          // invite still names the org — join it directly the same way.
          try {
            const { items } = await staffApi.listMyInvitations();
            const mine = items.find((invite) => invite.id === invitationId);
            if (mine) {
              await setActiveOrg(mine.organizationId);
              setState({ status: 'done', title: "You're already on this team" });
              router.replace(await resolveLandingPath(mine.organizationId));
              return;
            }
          } catch {
            // Fall through to the picker below.
          }
          setState({ status: 'done', title: "You're already on this team" });
          router.replace('/partner/select-organization');
          return;
        }
        if (isTerminalError(error)) {
          setState({ status: 'expired', message: errorMessage(error) });
          return;
        }
        setState({ status: 'error', message: errorMessage(error) });
      });
  }, [hydrated, sessionStatus, mustChangePassword, state.status, invitationId, router]);

  if (!hydrated || sessionStatus === 'unknown') {
    return (
      <PageContainer>
        <EmptyState title="Checking your session…" description="One moment." />
      </PageContainer>
    );
  }

  if (sessionStatus !== 'authenticated') {
    const signInHref =
      `/login?next=${encodeURIComponent(`/invitations/${invitationId}/accept`)}` +
      (emailHint ? `&email=${encodeURIComponent(emailHint)}` : '');
    return (
      <PageContainer>
        <EmptyState
          title="You've been invited to join a team"
          description="Sign in with your invitation credentials to accept. You'll set your own password right after — then you're in."
          action={<Link href={signInHref}>Sign in to accept</Link>}
        />
      </PageContainer>
    );
  }

  if (state.status === 'done') {
    return (
      <PageContainer>
        <EmptyState title={state.title} description="Taking you to your dashboard…" />
      </PageContainer>
    );
  }

  if (state.status === 'expired') {
    return (
      <PageContainer>
        <EmptyState
          title="This invite is no longer valid"
          description={`${state.message} Ask your manager for a fresh invite.`}
          action={<Link href="/partner/select-organization">Open dashboard</Link>}
        />
      </PageContainer>
    );
  }

  if (state.status === 'error') {
    return (
      <PageContainer>
        <ErrorState
          title="Couldn't accept this invite"
          description={state.message}
          onRetry={() => {
            attemptedRef.current = false;
            setState({ status: 'idle' });
          }}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <EmptyState title="Accepting your invite…" description="One moment — we're adding you to the team." />
    </PageContainer>
  );
}
