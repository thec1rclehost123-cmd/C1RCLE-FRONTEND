'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { deactivatePromoterReferralLink } from '@/lib/partner/promoter-assignment-repository';

import type { ReferralLinkDto } from '@c1rcle/contracts';

export function PromoterLinksConnected({
  items,
  page,
  pageSize,
  total,
  nextCursor,
}: {
  items: ReferralLinkDto[];
  page: number;
  pageSize: number;
  total: number;
  nextCursor: string | null;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const previousCursor = page > 2 ? String((page - 2) * pageSize) : null;
  const linksPath = '/partner/promoter/links';

  function pageHref(cursor: string | null) {
    return cursor === null ? linksPath : `${linksPath}?cursor=${encodeURIComponent(cursor)}`;
  }

  async function deactivate(referralLinkId: string) {
    setPendingId(referralLinkId);
    setMessage(null);
    try {
      await deactivatePromoterReferralLink({ referralLinkId });
      setMessage('Referral link deactivated. Past order attribution is preserved.');
      router.refresh();
    } catch {
      setMessage('The link could not be deactivated. Refresh to check its current status.');
    } finally {
      setPendingId(null);
    }
  }

  async function copyLink(path: string) {
    setMessage(null);
    try {
      await navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
      setMessage('Referral link copied.');
    } catch {
      setMessage('Copy was unavailable. Select and copy the public link path below.');
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-8 text-white">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Promoter workspace</p>
        <h1 className="mt-3 text-2xl font-semibold">Promotion links</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/65">
          Referral codes and activity come from the backend. Deactivation stops new attribution
          while keeping historical orders linked to the original campaign.
        </p>
      </header>
      {message ? (
        <p className="mt-5" role="status">
          {message}
        </p>
      ) : null}
      <p className="mt-5 text-xs text-white/50">
        {total === 0
          ? '0 referral links'
          : items.length === 0
            ? `No links on this page · ${String(total)} total`
            : `Showing ${String((page - 1) * pageSize + 1)}–${String((page - 1) * pageSize + items.length)} of ${String(total)} referral links.`}
      </p>
      {items.length === 0 && total === 0 ? (
        <p className="mt-8 rounded-xl border border-white/10 p-5 text-sm text-white/65">
          No referral links yet. Accept an active event invitation, then create a link from its
          campaign page.
        </p>
      ) : items.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {items.map((link) => {
            const path = link.vanitySlug
              ? `/${encodeURIComponent(link.vanityPrefix)}/${encodeURIComponent(link.vanitySlug)}`
              : `/event/${encodeURIComponent(link.eventId)}?ref=${encodeURIComponent(link.code)}`;
            return (
              <li key={link.id} className="rounded-xl border border-white/10 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-medium">{link.eventTitle}</h2>
                    <p className="mt-1 text-sm text-white/65">
                      {link.label} · {link.code}
                    </p>
                    <p className="mt-1 text-xs text-white/50">
                      {link.isActive ? 'Active' : 'Inactive'} · {link.clicks} clicks ·{' '}
                      {link.conversions} conversions
                    </p>
                  </div>
                  {link.isActive ? (
                    <button
                      type="button"
                      disabled={pendingId !== null}
                      onClick={() => {
                        void deactivate(link.id);
                      }}
                      className="rounded-lg border border-white/20 px-3 py-2 text-sm disabled:opacity-50"
                    >
                      {pendingId === link.id ? 'Deactivating…' : 'Deactivate link'}
                    </button>
                  ) : null}
                </div>
                <label className="mt-4 block text-xs text-white/55">
                  Public link path
                  <input
                    className="mt-2 block w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                    aria-label={`Public link path for ${link.eventTitle}`}
                    readOnly
                    value={path}
                    onFocus={(event) => {
                      event.currentTarget.select();
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="mt-3 rounded-lg border border-white/20 px-3 py-2 text-sm"
                  onClick={() => {
                    void copyLink(path);
                  }}
                >
                  Copy referral link
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-8 rounded-xl border border-white/10 p-5 text-sm text-white/65">
          There are no links on this page. Use the page controls to return to the available results.
        </p>
      )}
      {page > 1 || nextCursor !== null ? (
        <nav
          aria-label="Referral link pages"
          className="mt-6 flex items-center justify-between gap-4"
        >
          {page > 1 ? (
            <Link
              className="rounded-lg border border-white/20 px-3 py-2 text-sm"
              href={pageHref(previousCursor)}
            >
              Previous page
            </Link>
          ) : (
            <span />
          )}
          {nextCursor !== null ? (
            <Link
              className="rounded-lg border border-white/20 px-3 py-2 text-sm"
              href={pageHref(nextCursor)}
            >
              Next page
            </Link>
          ) : null}
        </nav>
      ) : null}
    </section>
  );
}
