import { AcceptInvitationClient } from './AcceptInvitationClient';

/**
 * Staff-invitation landing — the flow's front door. The email's Accept CTA
 * points here: the page signs the invitee in (email prefilled from
 * `?email=`, a login-form hint only), walks the first-login rotation, then
 * finishes the accept itself and hands over to the dashboard.
 */
export default async function AcceptInvitationPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ invitationId: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { invitationId } = await params;
  const query = await searchParams;
  const rawEmail = query['email'];
  const emailHint =
    typeof rawEmail === 'string' ? rawEmail : Array.isArray(rawEmail) ? (rawEmail[0] ?? null) : null;
  return <AcceptInvitationClient invitationId={invitationId} emailHint={emailHint} />;
}
