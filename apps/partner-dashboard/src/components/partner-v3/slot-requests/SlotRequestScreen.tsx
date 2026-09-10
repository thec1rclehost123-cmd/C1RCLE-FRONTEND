'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { BackIcon, RefreshIcon } from '@c1rcle/icons';

import { Button } from '@/components/partner-v3/Button';
import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import styles from './slot-requests.module.css';
import { SlotRequestCard } from './SlotRequestCard';
import { SlotRequestReview } from './SlotRequestReview';
import { SlotRequestSummary } from './SlotRequestSummary';

import type { SlotRequest, SlotRequestStatus, SlotRequestsData } from '@/data/partner-data-source';

type RequestView = 'pending' | 'all';
type ReviewPanel = 'details' | 'preview';
type PreviewMode = 'guest' | 'mobile';

export interface SlotRequestScreenProps {
  readonly data: SlotRequestsData;
  readonly initialView?: RequestView;
  readonly initialRequestId?: string;
  readonly initialPanel?: ReviewPanel;
  readonly initialPreviewMode?: PreviewMode;
}

function makeHref(
  pathname: string,
  values: {
    readonly view?: RequestView;
    readonly request?: string;
    readonly panel?: ReviewPanel;
    readonly preview?: PreviewMode;
  },
) {
  const params = new URLSearchParams();
  if (values.view === 'all') params.set('status', 'all');
  if (values.request) params.set('request', values.request);
  if (values.panel === 'preview') params.set('panel', 'preview');
  if (values.preview === 'mobile') params.set('preview', 'mobile');
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function SlotRequestScreen({
  data,
  initialView = 'pending',
  initialRequestId,
  initialPanel = 'details',
  initialPreviewMode = 'guest',
}: SlotRequestScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const visibleView = initialView;
  const selectedRequest = useMemo(
    () => data.requests.find((request) => request.id === initialRequestId),
    [data.requests, initialRequestId],
  );
  const visibleRequests =
    visibleView === 'pending'
      ? data.requests.filter((request) => request.status === 'pending')
      : data.requests;
  const counts: Record<SlotRequestStatus, number> = {
    pending: data.requests.filter((request) => request.status === 'pending').length,
    approved: data.requests.filter((request) => request.status === 'approved').length,
    rejected: data.requests.filter((request) => request.status === 'rejected').length,
  };
  const isIncoming = data.direction === 'incoming';
  const closeReview = () => {
    router.push(makeHref(pathname, { view: visibleView }));
  };
  const openRequest = (request: SlotRequest) => {
    router.push(makeHref(pathname, { view: visibleView, request: request.id }));
  };
  const selectView = (view: RequestView) => {
    router.replace(makeHref(pathname, { view }));
  };
  const reviewQuery = (values: { readonly panel?: ReviewPanel; readonly preview?: PreviewMode }) =>
    selectedRequest
      ? makeHref(pathname, { view: visibleView, request: selectedRequest.id, ...values })
      : pathname;
  const selectPanel = (panel: ReviewPanel) => {
    router.replace(reviewQuery({ panel, preview: initialPreviewMode }));
  };
  const selectPreview = (preview: PreviewMode) => {
    router.replace(reviewQuery({ panel: 'preview', preview }));
  };

  return (
    <PageContainer>
      <div
        className={[styles['page'], data.accent === 'lavender' ? styles['hostTheme'] : '']
          .filter(Boolean)
          .join(' ')}
      >
        <div className={styles['topRow']}>
          <Link
            className={styles['backLink']}
            href={isIncoming ? '/partner/venue/events' : '/partner/host/events'}
          >
            <BackIcon size={16} aria-hidden="true" />
            Back to Events
          </Link>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              window.location.reload();
            }}
          >
            <RefreshIcon size={15} aria-hidden="true" />
            Refresh
          </Button>
        </div>
        <header className={styles['pageHeader']}>
          <div>
            <span className={styles['eyebrow']}>Requests</span>
            <h1>Slot Requests</h1>
            <p>
              {isIncoming
                ? 'Review hosts asking to bring their events to your venue.'
                : 'Track the event slots you have requested from venues.'}
            </p>
          </div>
        </header>
        <SlotRequestSummary counts={counts} />
        <nav className={styles['requestTabs']} aria-label="Slot request views">
          <button
            type="button"
            aria-pressed={visibleView === 'pending'}
            onClick={() => {
              selectView('pending');
            }}
          >
            Pending <span>{counts.pending}</span>
          </button>
          <button
            type="button"
            aria-pressed={visibleView === 'all'}
            onClick={() => {
              selectView('all');
            }}
          >
            All Requests <span>{data.requests.length}</span>
          </button>
        </nav>
        {visibleRequests.length ? (
          <section
            className={styles['requestGrid']}
            aria-label={`${visibleView === 'pending' ? 'Pending' : 'All'} slot requests`}
          >
            {visibleRequests.map((request) => (
              <SlotRequestCard
                key={request.id}
                request={request}
                onOpen={() => {
                  openRequest(request);
                }}
              />
            ))}
          </section>
        ) : (
          <section className={styles['emptyState']}>
            <span className={styles['emptyMark']} aria-hidden="true">
              —
            </span>
            <h2>{isIncoming ? 'No pending requests' : 'No requests sent'}</h2>
            <p>
              {isIncoming
                ? 'All event slot requests have been reviewed.'
                : 'Slot requests you send to venues will show up here.'}
            </p>
            {isIncoming ? (
              <Button
                type="button"
                variant="secondary"
                disabled
                title="Sharing a venue link requires a connected venue profile"
              >
                Share your venue link
              </Button>
            ) : (
              <Link
                className={styles['emptyLink']}
                href="/partner/host/partners?tab=venues&view=discover"
              >
                Browse venues
              </Link>
            )}
          </section>
        )}
        {selectedRequest ? (
          <SlotRequestReview
            request={selectedRequest}
            panel={initialPanel}
            previewMode={initialPreviewMode}
            onPanelChange={selectPanel}
            onPreviewModeChange={selectPreview}
            onClose={closeReview}
          />
        ) : null}
      </div>
    </PageContainer>
  );
}
