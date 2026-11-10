'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { partnerGlobalSearchResponseSchema } from '@c1rcle/contracts';
import { CalendarIcon, ExternalLinkIcon, PartnerIcon, SearchIcon } from '@c1rcle/icons';

import { apiClient } from '@/lib/api/client';

import styles from './partner-v3.module.css';

import type { StudioRole } from '@/studios/studio-config';
import type { PartnerGlobalSearchResponse } from '@c1rcle/contracts';

export function PartnerGlobalSearch({ organizationId, studio }: { readonly organizationId: string | null; readonly studio: StudioRole }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [results, setResults] = useState<PartnerGlobalSearchResponse['results']>([]);
  const [resultsKey, setResultsKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const activeSearchKey = organizationId ? `${organizationId}\u0000${query.trim()}` : null;
  const matchingResults = resultsKey === activeSearchKey ? results : [];
  const loadingCurrentSearch = loading && loadingKey === activeSearchKey;
  const failedCurrentSearch = failed && resultsKey === activeSearchKey;

  useEffect(() => {
    const term = query.trim();
    if (!organizationId || term.length < 2) return;
    const searchKey = `${organizationId}\u0000${term}`;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setLoadingKey(searchKey);
      void apiClient.get({
        path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/search?q=${encodeURIComponent(term)}`,
        schema: partnerGlobalSearchResponseSchema,
        headers: { 'x-organization-id': organizationId },
      }).then(({ results: next }) => {
        if (!cancelled) {
          setResults(next);
          setResultsKey(searchKey);
          setFailed(false);
        }
      }).catch(() => {
        if (!cancelled) { setResults([]); setResultsKey(searchKey); setFailed(true); }
      }).finally(() => { if (!cancelled) setLoading(false); });
    }, 180);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [organizationId, query]);

  const closeSearch = () => { setOpen(false); setMobileOpen(false); setActiveIndex(-1); };
  const focusSearch = () => {
    setMobileOpen(true);
    setOpen(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };
  const selectResult = (result: PartnerGlobalSearchResponse['results'][number]) => {
    closeSearch();
    setQuery('');
    router.push(result.type === 'event'
      ? `/partner/${studio}/events/${encodeURIComponent(result.id)}`
      : `/partner/${studio}/partners?profile=${encodeURIComponent(result.id)}`);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); focusSearch(); }
      if (event.key === 'Escape' && (open || mobileOpen)) { event.preventDefault(); closeSearch(); inputRef.current?.blur(); }
    };
    const onPointerDown = (event: PointerEvent) => { if (rootRef.current && !rootRef.current.contains(event.target as Node)) closeSearch(); };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => { window.removeEventListener('keydown', onKeyDown); document.removeEventListener('pointerdown', onPointerDown); };
  }, [open, mobileOpen]);

  const fieldClass = [styles['globalSearchField'], mobileOpen ? styles['globalSearchFieldMobileOpen'] : ''].filter(Boolean).join(' ');
  return (
    <div className={styles['globalSearchRoot']} ref={rootRef}>
      <button className={styles['mobileSearchTrigger']} type="button" aria-label="Open global search" onClick={focusSearch}>
        <SearchIcon size={16} aria-hidden="true" />
      </button>
      <div className={fieldClass}>
        <SearchIcon size={15} aria-hidden="true" />
        <input
          ref={inputRef} value={query} placeholder="Search events and partners" aria-label="Search events and partners"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
            setResultsKey(null);
            setLoading(false);
            setFailed(false);
            setResults([]);
            setLoading(false);
          }}
          onFocus={() => { setOpen(true); }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' && matchingResults.length) { event.preventDefault(); setActiveIndex((i) => Math.min(i + 1, matchingResults.length - 1)); }
            if (event.key === 'ArrowUp' && matchingResults.length) { event.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
            if (event.key === 'Enter' && activeIndex >= 0 && matchingResults[activeIndex]) { event.preventDefault(); selectResult(matchingResults[activeIndex]); }
          }}
          role="combobox" aria-controls="partner-global-search-results" aria-expanded={open && Boolean(query.trim())}
          aria-activedescendant={activeIndex >= 0 ? `partner-search-result-${matchingResults[activeIndex]?.id ?? ''}` : undefined}
          aria-autocomplete="list"
        />
        <span className={styles['searchShortcut']}>⌘K</span>
        {open && query.trim() ? <div className={styles['globalSearchPopover']} id="partner-global-search-results" role="listbox" aria-label="Search results">
          {loadingCurrentSearch ? <div className={styles['searchNoResults']} role="status">Searching…</div>
            : failedCurrentSearch ? <div className={styles['searchNoResults']} role="alert">Search failed. Try again.</div>
              : matchingResults.length ? matchingResults.map((result, index) => {
                const Icon = result.type === 'event' ? CalendarIcon : PartnerIcon;
                const active = index === activeIndex;
                return <button key={`${result.type}:${result.id}`} className={[styles['searchResult'], active ? styles['searchResultActive'] : ''].filter(Boolean).join(' ')} type="button" role="option" aria-selected={active} id={`partner-search-result-${result.id}`} onMouseDown={(event) => { event.preventDefault(); }} onClick={() => { selectResult(result); }}>
                  <span className={styles['searchResultIcon']}><Icon size={16} aria-hidden="true" /></span>
                  <span className={styles['searchResultCopy']}><strong>{result.title}</strong><small>{result.subtitle}</small></span>
                  <ExternalLinkIcon size={15} aria-hidden="true" />
                </button>;
              }) : <div className={styles['searchNoResults']}>No matching events or partners.</div>}
        </div> : null}
      </div>
    </div>
  );
}
