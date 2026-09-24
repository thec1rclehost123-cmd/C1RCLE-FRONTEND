'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { RatingIcon } from '@c1rcle/icons';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import styles from './promoter-leaderboard.module.css';

import type { PromoterLeaderboardData, PromoterLeaderboardEntry } from '@/data/partner-data-source';

export function PromoterLeaderboardScreen({
  data,
  initialPeriod = 'all',
  initialCity = 'global',
}: {
  readonly data: PromoterLeaderboardData;
  readonly initialPeriod?: string;
  readonly initialCity?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [period, setPeriod] = useState(initialPeriod);
  const [city, setCity] = useState(initialCity);
  const updateUrl = (next: { period?: string; city?: string }) => {
    const params = new URLSearchParams();
    const nextPeriod = next.period ?? period;
    const nextCity = next.city ?? city;
    if (nextPeriod !== 'all') params.set('period', nextPeriod);
    if (nextCity !== 'global') params.set('city', nextCity);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <PageContainer>
      <div className={styles['page']}>
        <header className={styles['header']}>
          <span className={styles['eyebrow']}>Performance network</span>
          <h1>PROMOTER LEADERBOARD</h1>
          <p>See who is moving the most tickets through their links.</p>
        </header>
        <div className={styles['filters']}>
          <select
            aria-label="Leaderboard period"
            value={period}
            onChange={(event) => {
              setPeriod(event.target.value);
              updateUrl({ period: event.target.value });
            }}
          >
            {data.periods.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Leaderboard city"
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              updateUrl({ city: event.target.value });
            }}
          >
            {data.cities.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <section className={styles['podium']} aria-label="Top promoters">
          {data.podium.map((entry) => (
            <PodiumCard key={entry.id} entry={entry} />
          ))}
        </section>
        <section className={styles['ranking']} aria-label="Promoter rankings">
          {data.ranked.map((entry) => (
            <RankedRow key={entry.id} entry={entry} />
          ))}
        </section>
      </div>
    </PageContainer>
  );
}

function PodiumCard({ entry }: { readonly entry: PromoterLeaderboardEntry }) {
  return (
    <article className={[styles['podiumCard'], styles[`rank${String(entry.rank)}`]].join(' ')}>
      <div className={styles['podiumAvatar']} data-tone={entry.avatarTone}>
        {entry.initials}
        <span className={styles['rankBadge']}>{entry.rank}</span>
      </div>
      {entry.rank === 1 ? (
        <RatingIcon className={styles['trophy']} size={17} aria-label="Top promoter" />
      ) : null}
      <strong>{entry.name}</strong>
      <span className={styles['role']}>PROMOTER</span>
      <div className={styles['podiumStats']}>
        <span>
          <b>{entry.tickets}</b> tickets
        </span>
        <span>
          <b>{entry.xp}</b> XP
        </span>
      </div>
    </article>
  );
}

function RankedRow({ entry }: { readonly entry: PromoterLeaderboardEntry }) {
  return (
    <article className={styles['rankedRow']}>
      <strong className={styles['rowRank']}>{entry.rank}</strong>
      <span className={styles['rankedAvatar']} data-tone={entry.avatarTone}>
        {entry.initials}
      </span>
      <span className={styles['rankedName']}>
        <strong>{entry.name}</strong>
        <small>PROMOTER</small>
      </span>
      <span className={styles['xp']}>
        <b>{entry.xp}</b>
        <small>XP SCORE</small>
      </span>
    </article>
  );
}
