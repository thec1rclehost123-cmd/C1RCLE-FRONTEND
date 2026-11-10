'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/partner-v3/Button';
import { getPartnerPublicProfile } from '@/lib/partner/partner-profile-repository';

import styles from './partners.module.css';
import { PartnerStatusBadge } from './PartnerStatusBadge';

import type { PartnerRelationship } from '@/data/partner-data-source';

export function PartnerProfilePanel({
  partner,
  closeHref,
  primaryButtonClassName,
  hostAccent = false,
  connecting = false,
  connectError = null,
  onConnect,
  organizationId,
}: {
  readonly partner: PartnerRelationship;
  readonly closeHref: string;
  readonly primaryButtonClassName?: string;
  readonly hostAccent?: boolean;
  readonly connecting?: boolean;
  readonly connectError?: string | null;
  readonly onConnect?: ((partner: PartnerRelationship) => void) | undefined;
  readonly organizationId?: string | null;
}) {
  const router = useRouter();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const [profile, setProfile] = useState<Awaited<
    ReturnType<typeof getPartnerPublicProfile>
  > | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const closeRef = useRef<HTMLAnchorElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const close = useCallback(() => {
    router.push(closeHref);
  }, [closeHref, router]);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [
        ...dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      ];
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [close]);

  useEffect(() => {
    if (!organizationId) return;
    let active = true;
    void getPartnerPublicProfile(organizationId, partner.id, partner.kind)
      .then((result) => {
        if (active) setProfile(result);
      })
      .catch(() => {
        if (active) setProfileError('Full profile details are unavailable right now.');
      });
    return () => {
      active = false;
    };
  }, [organizationId, partner.id, partner.kind]);

  const name = profile?.name ?? partner.name;
  const photoUrl = profile?.photoUrl ?? partner.avatarUrl;
  const coverUrl = profile?.coverUrl ?? partner.coverUrl;
  const genres = profile?.genres ?? partner.genres;
  const stats = profile?.stats ?? partner.stats;
  const bio = profile?.bio ?? partner.bio;
  const events =
    profile?.upcomingEvents.map((event) => ({
      id: event.id,
      name: event.title,
      dateLabel: new Date(event.startAt).toLocaleDateString(undefined, { dateStyle: 'medium' }),
    })) ?? partner.upcomingEvents;
  const profileMeta = [
    ...new Set(
      [partnerLabel(partner.kind), partner.role, partner.location]
        .filter((value) => value && value !== '—')
        .map((value) => value.trim()),
    ),
  ];
  const avatarSrc = photoUrl && !avatarFailed ? photoUrl : '/partner-v3/staff-avatar.png';

  return (
    <div className={styles['profileScrim']}>
      <button
        type="button"
        className={styles['profileScrimBackdrop']}
        aria-label="Close partner profile"
        onClick={close}
      />
      <section
        ref={dialogRef}
        className={styles['profilePanel']}
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-profile-title"
        tabIndex={-1}
      >
        {coverUrl && !coverFailed ? (
          <div className={styles['profileCover']}>
            <Image
              src={coverUrl}
              alt=""
              fill
              sizes="(max-width: 560px) 100vw, 720px"
              unoptimized
              onError={() => {
                setCoverFailed(true);
              }}
            />
          </div>
        ) : null}
        <div className={styles['profilePanelHeader']}>
          <span className={styles['sectionKicker']}>Partner profile</span>
          <Link
            ref={closeRef}
            className={styles['profileClose']}
            href={closeHref}
            aria-label="Close profile"
          >
            ×
          </Link>
        </div>
        <div className={styles['profileIdentity']}>
          <span className={styles['profileAvatar']}>
            <Image
              src={avatarSrc}
              alt={`${name} profile`}
              fill
              sizes="64px"
              unoptimized
              onError={() => {
                setAvatarFailed(true);
              }}
            />
          </span>
          <div>
            <div className={styles['profileNameRow']}>
              <h2 id="partner-profile-title">{name}</h2>
              {profile?.verified || partner.verified ? (
                <span className={styles['verified']} aria-label="Verified partner">
                  ✓
                </span>
              ) : null}
            </div>
            <p>{profileMeta.join(' · ')}</p>
          </div>
          {partner.status ? (
            <PartnerStatusBadge status={partner.status} hostAccent={hostAccent} />
          ) : null}
        </div>
        {profileError ? (
          <p role="status" className={styles['profileLoadError']}>
            {profileError}
          </p>
        ) : null}
        {stats.length ? (
          <section className={styles['profileStats']} aria-label="Partner activity">
            {stats.map((stat) => (
              <div key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </section>
        ) : null}
        {genres.length || events.length || bio || profile?.venue ? (
          <div className={styles['profileDetails']}>
            {bio ? <p className={styles['profileBio']}>{bio}</p> : null}
            {genres.length ? (
              <div>
                <span>Genres</span>
                <strong>{genres.join(' · ')}</strong>
              </div>
            ) : null}
            {profile?.venue ? (
              <div>
                <span>Venue details</span>
                <strong>
                  {[
                    profile.venue.address.city,
                    profile.venue.address.state,
                    profile.venue.capacity ? `Capacity ${String(profile.venue.capacity)}` : null,
                    ...profile.venue.facilities,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </strong>
              </div>
            ) : null}
            {events.length ? (
              <div>
                <span>Upcoming events</span>
                <div className={styles['upcomingEvents']}>
                  {events.map((event) => (
                    <span key={event.id}>
                      <strong>{event.name}</strong>
                      <small>{event.dateLabel}</small>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        {connectError ? (
          <p role="alert" className={styles['requestError'] ?? ''}>
            {connectError}
          </p>
        ) : null}
        {!partner.status && onConnect ? (
          <Button
            type="button"
            variant="primary"
            className={primaryButtonClassName}
            disabled={connecting}
            onClick={() => {
              onConnect(partner);
            }}
          >
            {connecting ? 'Connecting…' : 'Connect'}
          </Button>
        ) : null}
      </section>
    </div>
  );
}

function partnerLabel(kind: PartnerRelationship['kind']): string {
  switch (kind) {
    case 'venue':
      return 'Venue';
    case 'host':
      return 'Host';
    case 'promoter':
      return 'Promoter';
  }
}
