import Link from 'next/link';

import { CloseIcon, SearchIcon } from '@c1rcle/icons';

import type { ReactNode, Ref } from 'react';

export type PartnerDirectoryStyles = Readonly<Record<string, string>>;

export interface PartnerModeItem {
  readonly label: string;
  readonly value: string;
  readonly href?: string;
}

export function PartnerModeNavigation({
  styles,
  categories,
  activeCategory,
  onCategoryChange,
  views,
  activeView,
  onViewChange,
  showCategories = true,
}: {
  readonly styles: PartnerDirectoryStyles;
  readonly categories?: readonly PartnerModeItem[] | undefined;
  readonly activeCategory?: string | undefined;
  readonly onCategoryChange?: ((value: string) => void) | undefined;
  readonly views?: readonly PartnerModeItem[] | undefined;
  readonly activeView?: string | undefined;
  readonly onViewChange?: ((value: string) => void) | undefined;
  readonly showCategories?: boolean;
}) {
  const className = (name: string) => styles[name] ?? name;

  return (
    <div className={className('navRow')}>
      {showCategories && categories?.length ? (
        <nav className={className('tabs')} aria-label="Partner categories">
          {categories.map((item) =>
            item.href ? (
              <Link
                key={item.value}
                href={item.href}
                className={activeCategory === item.value ? className('active') : undefined}
                aria-current={activeCategory === item.value ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.value}
                type="button"
                className={activeCategory === item.value ? className('active') : undefined}
                onClick={() => onCategoryChange?.(item.value)}
              >
                {item.label}
              </button>
            ),
          )}
        </nav>
      ) : null}

      {views?.length ? (
        <nav className={className('subnav')} aria-label="Partner views">
          {views.map((item) =>
            item.href ? (
              <Link
                key={item.value}
                href={item.href}
                className={activeView === item.value ? className('active') : undefined}
                aria-current={activeView === item.value ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.value}
                type="button"
                className={activeView === item.value ? className('active') : undefined}
                onClick={() => onViewChange?.(item.value)}
              >
                {item.label}
              </button>
            ),
          )}
        </nav>
      ) : null}
    </div>
  );
}

export function PartnerSearchField({
  styles,
  label,
  placeholder,
  value,
  onChange,
}: {
  readonly styles: PartnerDirectoryStyles;
  readonly label: string;
  readonly placeholder: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <label className={styles['search'] ?? 'search'}>
      <span className={styles['srOnly'] ?? 'srOnly'}>{label}</span>
      <SearchIcon size={19} aria-hidden="true" />
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
      />
    </label>
  );
}

export function PartnerTable({
  styles,
  ariaLabel,
  variant,
  children,
}: {
  readonly styles: PartnerDirectoryStyles;
  readonly ariaLabel: string;
  readonly variant?: 'relationshipTable' | 'requestTable';
  readonly children: ReactNode;
}) {
  return (
    <div
      className={[styles['partnerTable'], variant ? styles[variant] : null]
        .filter(Boolean)
        .join(' ')}
      role="table"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

export function PartnerTableHeader({
  styles,
  columns,
}: {
  readonly styles: PartnerDirectoryStyles;
  readonly columns: readonly string[];
}) {
  return (
    <div className={styles['tableHead']} role="row">
      {columns.map((column) => (
        <span key={column} role="columnheader">
          {column}
        </span>
      ))}
    </div>
  );
}

export function PartnerDrawerShell({
  styles,
  open,
  onClose,
  ariaLabel,
  closeLabel,
  title,
  subtitle,
  initials,
  tone,
  drawerRef,
  closeRef,
  children,
}: {
  readonly styles: PartnerDirectoryStyles;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly ariaLabel: string;
  readonly closeLabel: string;
  readonly title: string;
  readonly subtitle: string;
  readonly initials: string;
  readonly tone: string;
  readonly drawerRef?: Ref<HTMLElement>;
  readonly closeRef?: Ref<HTMLButtonElement>;
  readonly children: ReactNode;
}) {
  if (!open) return null;
  const className = (name: string) => styles[name] ?? name;

  return (
    <div className={className('overlay')}>
      <button
        type="button"
        className={className('dismiss')}
        aria-label={closeLabel}
        onClick={onClose}
      />
      <aside
        ref={drawerRef}
        className={className('drawer')}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        <button
          ref={closeRef}
          type="button"
          className={className('close')}
          aria-label={closeLabel}
          onClick={onClose}
        >
          <CloseIcon size={20} aria-hidden="true" />
        </button>
        <div className={className('drawerPortrait')} data-tone={tone}>
          {initials}
        </div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        {children}
      </aside>
    </div>
  );
}
