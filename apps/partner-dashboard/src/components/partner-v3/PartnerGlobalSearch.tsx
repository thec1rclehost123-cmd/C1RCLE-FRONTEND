'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  BankIcon,
  CalendarIcon,
  ExternalLinkIcon,
  GuestIcon,
  OrderIcon,
  PartnerIcon,
  PendingIcon,
  SearchIcon,
  SettingsIcon,
} from '@c1rcle/icons';

import styles from './partner-v3.module.css';

import type {
  PartnerSearchData,
  PartnerSearchIcon,
  PartnerSearchResult,
} from '@/data/partner-data-source';

const resultIcons: Record<PartnerSearchIcon, typeof CalendarIcon> = {
  event: CalendarIcon,
  partner: PartnerIcon,
  guest: GuestIcon,
  order: OrderIcon,
  request: PendingIcon,
  finance: BankIcon,
  settings: SettingsIcon,
};

export function PartnerGlobalSearch({ data }: { readonly data: PartnerSearchData }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const matchingResults = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return [];
    return data.results
      .filter((result) =>
        [result.title, result.subtitle, ...result.keywords]
          .join(' ')
          .toLocaleLowerCase()
          .includes(normalizedQuery),
      )
      .slice(0, 12);
  }, [data.results, query]);

  const groups = useMemo(() => {
    const grouped = new Map<string, PartnerSearchResult[]>();
    matchingResults.forEach((result) => {
      const group = grouped.get(result.group) ?? [];
      group.push(result);
      grouped.set(result.group, group);
    });
    return Array.from(grouped.entries());
  }, [matchingResults]);

  const closeSearch = () => {
    setOpen(false);
    setMobileOpen(false);
    setActiveIndex(-1);
  };

  const focusSearch = () => {
    setMobileOpen(true);
    setOpen(true);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const selectResult = (result: PartnerSearchResult) => {
    closeSearch();
    setQuery('');
    if (result.href) router.push(result.href);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        focusSearch();
        return;
      }
      if (event.key === 'Escape' && (open || mobileOpen)) {
        event.preventDefault();
        closeSearch();
        inputRef.current?.blur();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) closeSearch();
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [mobileOpen, open]);

  const searchFieldClass = [
    styles['globalSearchField'],
    mobileOpen ? styles['globalSearchFieldMobileOpen'] : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles['globalSearchRoot']} ref={rootRef}>
      <button
        className={styles['mobileSearchTrigger']}
        type="button"
        aria-label="Open global search"
        onClick={focusSearch}
      >
        <SearchIcon size={16} aria-hidden="true" />
      </button>
      <div className={searchFieldClass}>
        <SearchIcon size={15} aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' && matchingResults.length) {
              event.preventDefault();
              setActiveIndex((index) => Math.min(index + 1, matchingResults.length - 1));
            }
            if (event.key === 'ArrowUp' && matchingResults.length) {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            }
            if (event.key === 'Enter' && activeIndex >= 0) {
              event.preventDefault();
              const result = matchingResults[activeIndex];
              if (result) selectResult(result);
            }
          }}
          placeholder="Search events, partners, orders"
          aria-label="Search events, partners, orders"
          aria-controls="partner-global-search-results"
          aria-activedescendant={
            activeIndex >= 0
              ? `partner-search-result-${matchingResults[activeIndex]?.id ?? ''}`
              : undefined
          }
          role="combobox"
          aria-expanded={open && Boolean(query.trim())}
          aria-autocomplete="list"
        />
        <span className={styles['searchShortcut']}>⌘K</span>
        {open && query.trim() ? (
          <div
            className={styles['globalSearchPopover']}
            id="partner-global-search-results"
            role="listbox"
            aria-label="Search results"
          >
            {groups.length ? (
              groups.map(([group, results]) => (
                <div key={group}>
                  <div className={styles['searchGroupLabel']}>{group}</div>
                  {results.map((result) => (
                    <SearchResultButton
                      key={result.id}
                      result={result}
                      active={matchingResults[activeIndex]?.id === result.id}
                      onSelect={selectResult}
                    />
                  ))}
                </div>
              ))
            ) : (
              <div className={styles['searchNoResults']}>
                No matches. Try an event, partner or guest name.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SearchResultButton({
  result,
  active,
  onSelect,
}: {
  readonly result: PartnerSearchResult;
  readonly active: boolean;
  readonly onSelect: (result: PartnerSearchResult) => void;
}) {
  const Icon = resultIcons[result.icon];
  return (
    <button
      className={[styles['searchResult'], active ? styles['searchResultActive'] : '']
        .filter(Boolean)
        .join(' ')}
      type="button"
      role="option"
      aria-selected={active}
      id={`partner-search-result-${result.id}`}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={() => {
        onSelect(result);
      }}
    >
      <span className={styles['searchResultIcon']}>
        <Icon size={16} aria-hidden="true" />
      </span>
      <span className={styles['searchResultCopy']}>
        <strong>{result.title}</strong>
        <small>{result.subtitle}</small>
      </span>
      <ExternalLinkIcon size={15} aria-hidden="true" />
    </button>
  );
}
