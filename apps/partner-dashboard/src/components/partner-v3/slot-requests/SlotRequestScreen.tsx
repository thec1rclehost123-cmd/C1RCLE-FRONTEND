'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { BackIcon, RefreshIcon } from '@c1rcle/icons';

import { Button } from '@/components/partner-v3/Button';
import { PageContainer } from '@/components/partner-v3/PagePrimitives';
import {
  applySlotRequestAction,
  loadSlotRequestsData,
  type SlotRequestActionKind,
} from '@/lib/slot-requests/slot-request-repository';

import styles from './slot-requests.module.css';
import { SlotRequestCard } from './SlotRequestCard';
import { SlotRequestReview } from './SlotRequestReview';
import { SlotRequestSummary } from './SlotRequestSummary';

import type {
  SlotRequest,
  SlotRequestDirection,
  SlotRequestStatus,
  SlotRequestsData,
} from '@/data/partner-data-source';

type RequestView = 'pending' | 'all';
type ReviewPanel = 'details' | 'preview';
type PreviewMode = 'guest' | 'mobile';

export interface SlotRequestScreenProps {
  readonly direction: SlotRequestDirection;
  readonly initialView?: RequestView;
  readonly initialRequestId?: string;
  readonly initialPanel?: ReviewPanel;
  readonly initialPreviewMode?: PreviewMode;
}

function makeHref(pathname: string, values: { readonly view?: RequestView; readonly request?: string; readonly panel?: ReviewPanel; readonly preview?: PreviewMode }) {
  const params = new URLSearchParams();
  if (values.view === 'all') params.set('status', 'all');
  if (values.request) params.set('request', values.request);
  if (values.panel === 'preview') params.set('panel', 'preview');
  if (values.preview === 'mobile') params.set('preview', 'mobile');
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function SlotRequestScreen({ direction, initialView = 'pending', initialRequestId, initialPanel = 'details', initialPreviewMode = 'guest' }: SlotRequestScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<SlotRequestsData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ readonly id: string; readonly message: string } | null>(null);

  // The initial read runs directly inside the effect with `.then`/`.finally`
  // callbacks — no synchronous setState in the effect body.
  useEffect(() => {
    let isMounted = true;
    loadSlotRequestsData(direction)
      .then((next) => {
        if (isMounted) setData(next);
      })
      .catch((error: unknown) => {
        if (isMounted) setLoadError(errorMessage(error));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [direction]);

  // Manual refresh: reuse the effect's promise pattern but with an explicit
  // busy flag so the "Try again" / Refresh buttons show feedback.
  const load = useCallback(async () => {
    try {
      setData(await loadSlotRequestsData(direction));
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [direction]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    void load();
  }, [load]);

  const visibleView = initialView;
  const selectedRequest = useMemo(() => data?.requests.find((request) => request.id === initialRequestId), [data?.requests, initialRequestId]);
  const visibleRequests = data ? (visibleView === 'pending' ? data.requests.filter((request) => request.status === 'pending') : data.requests) : [];
  const counts: Record<SlotRequestStatus, number> = {
    pending: data?.requests.filter((request) => request.status === 'pending').length ?? 0,
    approved: data?.requests.filter((request) => request.status === 'approved').length ?? 0,
    rejected: data?.requests.filter((request) => request.status === 'rejected').length ?? 0,
    cancelled: data?.requests.filter((request) => request.status === 'cancelled').length ?? 0,
  };
  const isIncoming = direction === 'incoming';
  const closeReview = () => { router.push(makeHref(pathname, { view: visibleView })); };
  const openRequest = (request: SlotRequest) => { router.push(makeHref(pathname, { view: visibleView, request: request.id })); };
  const selectView = (view: RequestView) => { router.replace(makeHref(pathname, { view })); };
  const reviewQuery = (values: { readonly panel?: ReviewPanel; readonly preview?: PreviewMode }) => selectedRequest ? makeHref(pathname, { view: visibleView, request: selectedRequest.id, ...values }) : pathname;
  const selectPanel = (panel: ReviewPanel) => { router.replace(reviewQuery({ panel, preview: initialPreviewMode })); };
  const selectPreview = (preview: PreviewMode) => { router.replace(reviewQuery({ panel: 'preview', preview })); };

  const runAction = useCallback(async (slotRequestId: string, kind: SlotRequestActionKind) => {
    setBusyRequestId(slotRequestId);
    setActionError(null);
    try {
      await applySlotRequestAction(slotRequestId, kind);
      refresh();
    } catch (error) {
      setActionError({ id: slotRequestId, message: errorMessage(error) });
    } finally {
      setBusyRequestId(null);
    }
  }, [refresh]);

  const accent = data?.accent ?? (isIncoming ? 'orange' : 'lavender');

  return (
    <PageContainer>
      <div className={[styles['page'], accent === 'lavender' ? styles['hostTheme'] : ''].filter(Boolean).join(' ')}>
        <div className={styles['topRow']}><Link className={styles['backLink']} href={isIncoming ? '/partner/venue/events' : '/partner/host/events'}><BackIcon size={16} aria-hidden="true" />Back to Events</Link><Button type="button" variant="ghost" onClick={() => { refresh(); }}><RefreshIcon size={15} aria-hidden="true" />Refresh</Button></div>
        <header className={styles['pageHeader']}><div><span className={styles['eyebrow']}>Requests</span><h1>Slot Requests</h1><p>{isIncoming ? 'Review hosts asking to bring their events to your venue.' : 'Track the event slots you have requested from venues.'}</p></div></header>
        <SlotRequestSummary counts={counts} />
        <nav className={styles['requestTabs']} aria-label="Slot request views"><button type="button" aria-pressed={visibleView === 'pending'} onClick={() => { selectView('pending'); }}>Pending <span>{counts.pending}</span></button><button type="button" aria-pressed={visibleView === 'all'} onClick={() => { selectView('all'); }}>All Requests <span>{data?.requests.length ?? 0}</span></button></nav>
        {loadError !== null && data === null ? <section className={styles['emptyState']}><span className={styles['emptyMark']} aria-hidden="true">!</span><h2>Could not load slot requests</h2><p>{loadError}</p><Button type="button" variant="secondary" onClick={() => { refresh(); }}>Try again</Button></section>
          : isLoading && data === null ? <section className={styles['emptyState']} aria-busy="true"><span className={styles['emptyMark']} aria-hidden="true">—</span><h2>Loading slot requests</h2><p>Fetching live requests…</p></section>
          : visibleRequests.length ? <section className={styles['requestGrid']} aria-label={`${visibleView === 'pending' ? 'Pending' : 'All'} slot requests`}>{visibleRequests.map((request) => <SlotRequestCard key={request.id} request={request} busy={busyRequestId === request.id} actionError={actionError?.id === request.id ? actionError.message : null} onOpen={() => { openRequest(request); }} onAction={(id, kind) => { void runAction(id, kind); }} />)}</section>
          : <section className={styles['emptyState']}><span className={styles['emptyMark']} aria-hidden="true">—</span><h2>{isIncoming ? 'No pending requests' : 'No requests sent'}</h2><p>{isIncoming ? 'All event slot requests have been reviewed.' : 'Slot requests you send to venues will show up here.'}</p>{isIncoming ? <Button type="button" variant="secondary" disabled title="Sharing a venue link requires a connected venue profile">Share your venue link</Button> : <Link className={styles['emptyLink']} href="/partner/host/partners?tab=venues&view=discover">Browse venues</Link>}</section>}
        {selectedRequest ? <SlotRequestReview request={selectedRequest} panel={initialPanel} previewMode={initialPreviewMode} onPanelChange={selectPanel} onPreviewModeChange={selectPreview} onClose={closeReview} busy={busyRequestId === selectedRequest.id} actionError={actionError?.id === selectedRequest.id ? actionError.message : null} onAction={(id, kind) => { void runAction(id, kind); }} /> : null}
      </div>
    </PageContainer>
  );
}