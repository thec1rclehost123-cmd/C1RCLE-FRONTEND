import Image from 'next/image';
import Link from 'next/link';

import type { ReactNode } from 'react';

export function HostPage({
  children,
  className = '',
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return <div className={`host-page ${className}`.trim()}>{children}</div>;
}

export function HostHeader({
  title,
  description,
  action,
}: {
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
}) {
  return (
    <header className="host-page-header">
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function HostTabs({
  items,
  active,
}: {
  readonly items: readonly {
    readonly label: string;
    readonly href: string;
    readonly value: string;
  }[];
  readonly active: string;
}) {
  return (
    <nav className="host-tabs" aria-label="Page sections">
      {items.map((item) => (
        <Link
          key={item.value}
          className={item.value === active ? 'is-active' : undefined}
          aria-current={item.value === active ? 'page' : undefined}
          href={item.href}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function HostStatus({
  children,
  tone = 'neutral',
}: {
  readonly children: ReactNode;
  readonly tone?: 'success' | 'warning' | 'danger' | 'accent' | 'neutral';
}) {
  return <span className={`host-status is-${tone}`}>{children}</span>;
}

export function HostButton({
  children,
  href,
  primary = false,
  disabled = false,
  title,
  onClick,
}: {
  readonly children: ReactNode;
  readonly href?: string;
  readonly primary?: boolean;
  readonly disabled?: boolean;
  readonly title?: string;
  readonly onClick?: () => void;
}) {
  const className = `host-button${primary ? ' is-primary' : ''}`;
  if (href && !disabled)
    return (
      <Link className={className} href={href}>
        {children}
      </Link>
    );
  return (
    <button className={className} type="button" disabled={disabled} title={title} onClick={onClick}>
      {children}
    </button>
  );
}

export function HostMetric({
  label,
  value,
  detail,
  tone,
}: {
  readonly label: string;
  readonly value: string;
  readonly detail?: string;
  readonly tone?: 'success' | 'warning';
}) {
  return (
    <article className="host-metric">
      <span>{label}</span>
      <strong className={tone ? `is-${tone}` : undefined}>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

export function HostEventIdentity({ compact = false }: { readonly compact?: boolean }) {
  return (
    <div className={`host-event-identity${compact ? ' is-compact' : ''}`}>
      <Image
        src="/venue/neon-nights-poster.webp"
        width={compact ? 72 : 112}
        height={compact ? 72 : 112}
        alt="Neon Nights: Afrobeats poster"
        priority={!compact}
      />
      <div>
        <HostStatus tone="success">Live</HostStatus>
        <h2>Neon Nights: Afrobeats</h2>
        <p>Skyline Rooftop · Mumbai</p>
        <span>Thu, 16 Jul 2026 · 9:00 PM onwards</span>
      </div>
    </div>
  );
}

export function HostTable({
  columns,
  children,
  label,
}: {
  readonly columns: readonly string[];
  readonly children: ReactNode;
  readonly label: string;
}) {
  return (
    <div className="host-table-wrap" role="region" aria-label={label}>
      <table className="host-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function HostUnavailable({ label = 'Action unavailable' }: { readonly label?: string }) {
  return (
    <span className="host-unavailable" role="status">
      {label}. This backend action is not connected yet.
    </span>
  );
}
