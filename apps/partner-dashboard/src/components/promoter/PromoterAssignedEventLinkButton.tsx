'use client';

import { useState } from 'react';

import { getClientEnv } from '@c1rcle/config';

import { CopyLinkButton } from './PromoterShareActions';
import { createPromoterEventLink } from '@/lib/partner/promoter-events-api';

export function PromoterAssignedEventLinkButton({
  assignmentId,
  eventSlug,
}: {
  readonly assignmentId: string | undefined;
  readonly eventSlug: string | undefined;
}) {
  const [guestUrl, setGuestUrl] = useState<string | null>(null);
  const [vanityUrl, setVanityUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [customVanitySlug, setCustomVanitySlug] = useState('');
  const [campaignLabel, setCampaignLabel] = useState('organic');

  async function createLink() {
    if (!assignmentId || !eventSlug || saving) return;
    setSaving(true);
    setError(null);
    try {
      const channel = campaignLabel.trim() || 'organic';
      const link =
        channel === 'organic' && !customCode.trim() && !customVanitySlug.trim()
          ? await createPromoterEventLink(assignmentId)
          : await createPromoterEventLink(assignmentId, channel, customCode, customVanitySlug);
      const guestOrigin = getClientEnv().NEXT_PUBLIC_GUEST_PORTAL_URL.replace(/\/$/, '');
      setGuestUrl(
        buildPromoterShareUrl({
          guestOrigin,
          eventSlug,
          code: link.code,
          channel: link.campaignLabel ?? 'organic',
          vanityPrefix: link.vanityPrefix,
          vanitySlug: link.vanitySlug,
        }),
      );
      if (link.vanityPrefix && link.vanitySlug) {
        setVanityUrl(
          buildPromoterVanityUrl({
            guestOrigin,
            promoterHandle: link.vanityPrefix,
            vanitySlug: link.vanitySlug,
          }),
        );
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create your event link.');
    } finally {
      setSaving(false);
    }
  }

  if (guestUrl)
    return (
      <div>
        <CopyLinkButton value={guestUrl} label="Copy ticket link" />
        {vanityUrl ? <CopyLinkButton value={vanityUrl} label="Copy vanity link" /> : null}
      </div>
    );
  return (
    <div>
      <label className="pd-field-label" htmlFor="promoter-campaign-label">
        Campaign channel
      </label>
      <input
        id="promoter-campaign-label"
        className="pd-input"
        value={campaignLabel}
        maxLength={120}
        onChange={(event) => setCampaignLabel(event.target.value)}
        autoComplete="off"
      />
      <label className="pd-field-label" htmlFor="promoter-custom-code">
        Custom tracking code (optional)
      </label>
      <input
        id="promoter-custom-code"
        className="pd-input"
        value={customCode}
        maxLength={16}
        onChange={(event) => setCustomCode(event.target.value)}
        autoComplete="off"
      />
      <label className="pd-field-label" htmlFor="promoter-vanity-slug">
        Custom vanity path (optional)
      </label>
      <input
        id="promoter-vanity-slug"
        className="pd-input"
        value={customVanitySlug}
        maxLength={60}
        onChange={(event) => setCustomVanitySlug(event.target.value)}
        autoComplete="off"
      />
      <button
        className="pd-button pd-button--primary"
        type="button"
        disabled={!assignmentId || saving}
        onClick={() => void createLink()}
      >
        {saving ? 'Generating…' : 'Generate ticket link'}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}

export function buildPromoterVanityUrl(input: {
  guestOrigin: string;
  promoterHandle: string;
  vanitySlug: string;
}): string {
  return new URL(
    `/${encodeURIComponent(input.promoterHandle)}/${encodeURIComponent(input.vanitySlug)}`,
    input.guestOrigin.replace(/\/$/, ''),
  ).toString();
}

export function buildPromoterShareUrl(input: {
  guestOrigin: string;
  eventSlug: string;
  code: string;
  channel: string;
  vanityPrefix?: string | null;
  vanitySlug?: string | null;
}): string {
  const origin = input.guestOrigin.replace(/\/$/, '');
  const channel =
    input.channel
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '') || 'organic';
  const url = new URL(`/event/${encodeURIComponent(input.eventSlug)}`, origin);
  url.searchParams.set('ref', input.code);
  url.searchParams.set('s', channel);
  return url.toString();
}
