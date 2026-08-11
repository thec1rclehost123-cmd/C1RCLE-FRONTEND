import Link from 'next/link';

import type { ReactNode } from 'react';

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description?: string;
  readonly actions?: ReactNode;
}) {
  return (
    <header className="pd-page-header">
      <div>
        <span className="pd-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="pd-page-actions">{actions}</div> : null}
    </header>
  );
}

export function DashboardButton({
  href,
  children,
  tone = 'secondary',
}: {
  readonly href: string;
  readonly children: ReactNode;
  readonly tone?: 'primary' | 'secondary' | 'ghost';
}) {
  return <Link className={`pd-button pd-button--${tone}`} href={href}>{children}</Link>;
}

export function MetricCard({
  label,
  value,
  trend,
  tone = 'neutral',
  detail,
}: {
  readonly label: string;
  readonly value: string;
  readonly trend?: string;
  readonly tone?: 'neutral' | 'positive' | 'accent' | 'warning';
  readonly detail?: string;
}) {
  return (
    <article className={`pd-metric pd-metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <footer>{trend ? <em>{trend}</em> : null}{detail ? <small>{detail}</small> : null}</footer>
    </article>
  );
}

export function StatusBadge({
  children,
  tone = 'neutral',
}: {
  readonly children: ReactNode;
  readonly tone?: 'neutral' | 'positive' | 'accent' | 'warning' | 'danger';
}) {
  return <span className={`pd-status pd-status--${tone}`}>{children}</span>;
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
}) {
  return (
    <div className="pd-section-heading">
      <div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
      {action}
    </div>
  );
}

export function EmptyState({
  eyebrow,
  title,
  description,
  action,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
}) {
  return (
    <section className="pd-empty-state">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <div>{action}</div> : null}
    </section>
  );
}

export function ErrorState({
  title = 'This view could not be loaded.',
  description,
  retryHref,
}: {
  readonly title?: string;
  readonly description: string;
  readonly retryHref?: string;
}) {
  return <section className="pd-error-state" role="alert"><span aria-hidden="true">!</span><div><h2>{title}</h2><p>{description}</p></div>{retryHref ? <Link href={retryHref}>Try again</Link> : null}</section>;
}

export function DashboardSkeleton({ cards = 4 }: { readonly cards?: number }) {
  return <div className="pd-skeleton" role="status" aria-label="Loading dashboard content"><span /><strong /><section>{Array.from({ length: cards }, (_, index) => <i key={String(index)} />)}</section><article /></div>;
}

export function DateRangeSelector({
  active,
  baseHref,
}: {
  readonly active: '7d' | '30d' | '90d';
  readonly baseHref: string;
}) {
  return <nav className="pd-date-range" aria-label="Analytics date range">{(['7d', '30d', '90d'] as const).map((range) => <Link key={range} href={`${baseHref}${baseHref.includes('?') ? '&' : '?'}range=${range}`} className={active === range ? 'is-active' : undefined} aria-current={active === range ? 'page' : undefined}>{range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}</Link>)}</nav>;
}

export function AnalyticsChartCard({
  title,
  description,
  values,
  label,
  footer,
}: {
  readonly title: string;
  readonly description: string;
  readonly values: readonly number[];
  readonly label: string;
  readonly footer?: ReactNode;
}) {
  return <section className="pd-surface pd-chart-card"><SectionHeading title={title} description={description} /><MiniBars values={values} label={label} />{footer ? <footer>{footer}</footer> : null}</section>;
}

export function PageTabs({
  items,
  active,
}: {
  readonly items: readonly { label: string; href: string; value: string }[];
  readonly active: string;
}) {
  return (
    <nav className="pd-tabs" aria-label="Page sections">
      {items.map((item) => (
        <Link key={item.value} href={item.href} className={item.value === active ? 'is-active' : undefined} aria-current={item.value === active ? 'page' : undefined}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function MiniBars({ values, label }: { readonly values: readonly number[]; readonly label: string }) {
  const max = Math.max(...values, 1);
  const barWidth = 100 / Math.max(values.length, 1);
  return (
    <svg className="pd-mini-bars" role="img" aria-label={label} viewBox="0 0 100 100" preserveAspectRatio="none">
      {values.map((value, index) => {
        const height = (value / max) * 92;
        return <rect key={`${String(index)}-${String(value)}`} x={(index * barWidth) + (barWidth * .18)} y={100 - height} width={barWidth * .64} height={height} rx="1.2" />;
      })}
    </svg>
  );
}
