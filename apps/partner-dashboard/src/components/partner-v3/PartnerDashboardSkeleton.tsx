'use client';

import { usePathname } from 'next/navigation';

import styles from './PartnerDashboardSkeleton.module.css';

type ScreenKind =
  | 'overview'
  | 'events'
  | 'analytics'
  | 'calendar'
  | 'door'
  | 'finance'
  | 'partners'
  | 'event-detail'
  | 'table'
  | 'form';

function screenKind(pathname: string): ScreenKind {
  const segments = pathname.split('/').filter(Boolean);
  const route = segments[2] ?? 'overview';
  const eventSubroute = segments[3] ?? '';
  const reservedEventRoutes = ['create', 'invitations', 'analytics'];
  const detailRoute =
    route === 'events' && segments.length >= 4 && !reservedEventRoutes.includes(eventSubroute);
  const detailTab = detailRoute ? (segments[4] ?? 'overview') : eventSubroute || route;

  if (detailRoute) {
    if (detailTab === 'analytics') return 'analytics';
    if (detailTab === 'edit' || detailTab === 'create') return 'form';
    if (detailTab === 'overview') return 'event-detail';
    return 'table';
  }

  if (route === 'events' && eventSubroute === 'analytics') return 'analytics';
  if (route === 'events' && eventSubroute === 'create') return 'form';

  if (
    detailTab === 'overview' ||
    detailTab === 'events' ||
    detailTab === 'analytics' ||
    detailTab === 'calendar' ||
    detailTab === 'door' ||
    detailTab === 'finance' ||
    detailTab === 'partners'
  ) {
    return detailTab;
  }
  if (detailTab === 'create') return 'form';
  return 'table';
}

function HeaderSkeleton() {
  return (
    <header className={styles['heading']}>
      <div className={styles['headingText']}>
        <span className={styles['line']} />
        <span className={styles['lineShort']} />
      </div>
      <div className={styles['headingActions']}>
        <span className={styles['control']} />
        <span className={styles['controlAccent']} />
      </div>
    </header>
  );
}

function Metrics({ count = 4 }: { readonly count?: number }) {
  return (
    <div className={styles['metrics']}>
      {Array.from({ length: count }, (_, index) => (
        <div className={styles['metric']} key={index}>
          <span className={styles['lineShort']} />
          <span className={styles['lineValue']} />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { readonly rows?: number }) {
  return (
    <section className={styles['panel']}>
      <div className={styles['tableHeader']}>
        <span className={styles['lineShort']} />
        <span className={styles['line']} />
        <span className={styles['lineShort']} />
        <span className={styles['lineShort']} />
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div className={styles['tableRow']} key={index}>
          <span className={styles['avatar']} />
          <span className={styles['line']} />
          <span className={styles['lineShort']} />
          <span className={styles['pill']} />
        </div>
      ))}
    </section>
  );
}

function ChartGrid() {
  return (
    <div className={styles['chartGrid']}>
      {[0, 1].map((index) => (
        <section className={styles['chart']} key={index}>
          <span className={styles['lineShort']} />
          <span className={styles['chartPlot']} />
        </section>
      ))}
    </div>
  );
}

function ScreenBody({ kind }: { readonly kind: ScreenKind }) {
  if (kind === 'overview') {
    return (
      <>
        <div className={styles['overviewGrid']}>
          <div className={styles['stack']}>
            <section className={styles['hero']}>
              <span className={styles['lineShort']} />
              <span className={styles['lineWide']} />
              <span className={styles['line']} />
              <span className={styles['controlAccent']} />
            </section>
            <section className={styles['chart']}>
              <span className={styles['lineShort']} />
              <span className={styles['chartPlot']} />
            </section>
          </div>
          <section className={styles['panel']}>
            <span className={styles['line']} />
            {[0, 1, 2, 3].map((index) => (
              <div className={styles['compactRow']} key={index}>
                <span className={styles['avatar']} />
                <span className={styles['line']} />
                <span className={styles['lineShort']} />
              </div>
            ))}
          </section>
        </div>
      </>
    );
  }

  if (kind === 'events') {
    return (
      <>
        <div className={styles['toolbar']}>
          <span className={styles['search']} />
          <span className={styles['control']} />
          <span className={styles['control']} />
        </div>
        <div className={styles['eventGrid']}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <section className={styles['eventCard']} key={index}>
              <span className={styles['eventPoster']} />
              <span className={styles['line']} />
              <span className={styles['lineShort']} />
              <span className={styles['control']} />
            </section>
          ))}
        </div>
      </>
    );
  }

  if (kind === 'analytics') {
    return (
      <>
        <div className={styles['toolbar']}>
          <span className={styles['control']} />
          <span className={styles['control']} />
          <span className={styles['control']} />
        </div>
        <Metrics />
        <ChartGrid />
        <TableSkeleton rows={3} />
      </>
    );
  }

  if (kind === 'calendar') {
    return (
      <section className={styles['panel']}>
        <div className={styles['toolbar']}>
          <span className={styles['line']} />
          <span className={styles['control']} />
          <span className={styles['control']} />
        </div>
        <div className={styles['calendarGrid']}>
          {Array.from({ length: 35 }, (_, index) => (
            <span className={styles['calendarCell']} key={index} />
          ))}
        </div>
      </section>
    );
  }

  if (kind === 'door') {
    return (
      <>
        <section className={styles['hero']}>
          <span className={styles['lineWide']} />
          <span className={styles['line']} />
          <span className={styles['lineShort']} />
        </section>
        <Metrics count={3} />
        <TableSkeleton />
      </>
    );
  }

  if (kind === 'finance') {
    return (
      <>
        <div className={styles['tabs']}>
          <span className={styles['control']} />
          <span className={styles['control']} />
          <span className={styles['control']} />
        </div>
        <div className={styles['financeHero']}>
          <section className={styles['hero']}>
            <span className={styles['lineShort']} />
            <span className={styles['lineValue']} />
            <span className={styles['control']} />
          </section>
          <section className={styles['hero']}>
            <span className={styles['lineShort']} />
            <span className={styles['lineWide']} />
            <span className={styles['control']} />
          </section>
        </div>
        <Metrics count={3} />
        <TableSkeleton rows={4} />
      </>
    );
  }

  if (kind === 'partners') {
    return (
      <>
        <div className={styles['tabs']}>
          <span className={styles['control']} />
          <span className={styles['control']} />
          <span className={styles['control']} />
        </div>
        <div className={styles['toolbar']}>
          <span className={styles['search']} />
          <span className={styles['controlAccent']} />
        </div>
        <div className={styles['partnerGrid']}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <section className={styles['partnerCard']} key={index}>
              <span className={styles['avatarLarge']} />
              <span className={styles['line']} />
              <span className={styles['control']} />
            </section>
          ))}
        </div>
      </>
    );
  }

  if (kind === 'form') {
    return (
      <section className={styles['formPanel']}>
        {[0, 1, 2, 3, 4].map((index) => (
          <div className={styles['formField']} key={index}>
            <span className={styles['lineShort']} />
            <span className={styles['input']} />
          </div>
        ))}
        <span className={styles['controlAccent']} />
      </section>
    );
  }

  return <TableSkeleton />;
}

export function PartnerDashboardSkeleton({
  label,
  eventContent = false,
}: {
  readonly label?: string;
  readonly eventContent?: boolean;
}) {
  const pathname = (usePathname() as string | null) ?? '';
  const segments = pathname.split('/').filter(Boolean);
  const role = segments[1] ?? 'venue';
  const kind = screenKind(pathname);
  const isNestedEventTab =
    segments[2] === 'events' &&
    segments.length >= 5 &&
    !['create', 'invitations', 'analytics'].includes(segments[3] ?? '');
  const contentOnly = eventContent || isNestedEventTab;
  const loadingLabel = label ?? `Loading ${kind === 'door' ? 'Door Mode' : kind}`;

  return (
    <div
      className={
        contentOnly
          ? [styles['skeletonPage'], styles['contentOnly']].filter(Boolean).join(' ')
          : styles['skeletonPage']
      }
      data-role={role}
      role="status"
      aria-label={loadingLabel}
      aria-busy="true"
    >
      <span className={styles['screenReaderOnly']}>{loadingLabel}</span>
      <div aria-hidden="true">
        {!contentOnly ? (
          kind === 'event-detail' ? (
            <>
              <section className={styles['eventHeader']}>
                <span className={styles['eventPoster']} />
                <div className={styles['eventHeaderDetails']}>
                  <span className={styles['pill']} />
                  <span className={styles['lineWide']} />
                  <span className={styles['line']} />
                  <Metrics count={3} />
                </div>
              </section>
              <div className={styles['tabs']}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <span className={styles['control']} key={index} />
                ))}
              </div>
            </>
          ) : (
            <HeaderSkeleton />
          )
        ) : null}
        <ScreenBody kind={kind} />
      </div>
    </div>
  );
}
