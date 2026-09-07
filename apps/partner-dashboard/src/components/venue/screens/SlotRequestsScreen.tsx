'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useMemo, useRef, useState } from 'react';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import { Icon } from '../Icon';
import { useOverlayFocus } from '../useOverlayFocus';
import { filterSlotRequests } from '../venue-slot-requests-model';

import styles from './SlotRequests.module.css';

import type {
  SlotRequestAdapters,
  SlotRequestTab,
  VenueSlotRequest,
} from '../venue-slot-requests-model';

type Action = 'accept' | 'decline' | 'suggest';

export function SlotRequestsScreen({
  tab = 'pending',
  adapters,
}: {
  readonly tab?: SlotRequestTab;
  readonly adapters?: SlotRequestAdapters;
}) {
  const auth = useDashboardAuth();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<VenueSlotRequest | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canView =
    auth.grantedPermissions.length === 0 ||
    auth.grantedPermissions.includes('*') ||
    auth.hasPermission('VIEW_EVENTS');
  const canManage = auth.canDo('canEditEvent');
  const shown = useMemo(() => filterSlotRequests(tab, query), [query, tab]);

  if (!canView)
    return (
      <SlotState
        title="Permission denied"
        detail="You do not have access to venue slot requests."
      />
    );

  const supported = (kind: Action) =>
    kind === 'accept'
      ? Boolean(adapters?.accept)
      : kind === 'decline'
        ? Boolean(adapters?.decline)
        : Boolean(adapters?.suggestDate);
  return (
    <section className={styles['page']}>
      <header className={styles['header']}>
        <div>
          <h1>Slot requests</h1>
          <p>Review requests to host events at your venue.</p>
        </div>
      </header>
      <div className={styles['toolbar']}>
        <nav aria-label="Slot request status">
          {(['pending', 'accepted', 'declined'] as const).map((item) => (
            <Link
              key={item}
              href={`/venue/slot-requests?tab=${item}`}
              aria-current={tab === item ? 'page' : undefined}
            >
              {item[0]?.toUpperCase()}
              {item.slice(1)}
              {item === 'pending' ? <b>{filterSlotRequests('pending', '').length}</b> : null}
            </Link>
          ))}
        </nav>
        <label>
          <Icon name="search" size={18} />
          <span className="sr-only">Search requests</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder="Search requests…"
          />
        </label>
      </div>
      {message ? (
        <p className={styles['status']} role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
      {shown.length ? (
        <div className={styles['list']}>
          {shown.map((request) => (
            <button
              key={request.id}
              type="button"
              className={styles['requestRow']}
              aria-pressed={selected?.id === request.id}
              onClick={() => {
                setSelected(request);
              }}
            >
              <Image src={request.posterSrc} alt="" width={80} height={80} />
              <span className={styles['requestIdentity']}>
                <strong>{request.eventName}</strong>
                <small>
                  <i>{request.requesterInitials}</i>
                  {request.requester}
                </small>
              </span>
              <span data-label="Date">
                <Icon name="calendar" size={16} />
                {request.date}
                <small>{request.time}</small>
              </span>
              <span data-label="Guests">
                <Icon name="users" size={16} />
                {request.expectedGuests}
                <small>Expected guests</small>
              </span>
              <span data-label="Type">{request.eventType}</span>
              <time>{request.submittedAt}</time>
              <em>{request.status}</em>
            </button>
          ))}
        </div>
      ) : (
        <SlotState
          title={`No ${tab} requests`}
          detail={
            tab === 'pending' ? 'You are all caught up.' : `No requests are currently ${tab}.`
          }
        />
      )}
      <RequestDrawer
        request={selected}
        canManage={canManage}
        supported={supported}
        onAction={setAction}
        onClose={() => {
          setSelected(null);
        }}
      />
      <RequestActionDialog
        request={selected}
        action={action}
        busy={busy}
        supported={action ? supported(action) : false}
        onClose={() => {
          setAction(null);
        }}
        onSubmit={async (values) => {
          if (!selected || !action) return;
          setBusy(true);
          setMessage(null);
          try {
            if (action === 'accept') await adapters?.accept?.(selected.id);
            else if (action === 'decline')
              await adapters?.decline?.(selected.id, values.note || null);
            else
              await adapters?.suggestDate?.(selected.id, {
                date: values.date,
                time: values.time,
                note: values.note || null,
              });
            setMessage(
              action === 'accept'
                ? 'Request accepted.'
                : action === 'decline'
                  ? 'Request declined.'
                  : 'Another date was suggested.',
            );
            setAction(null);
            setSelected(null);
          } catch {
            setMessage('Action unavailable. Try again later.');
          } finally {
            setBusy(false);
          }
        }}
      />
    </section>
  );
}

function RequestDrawer({
  request,
  canManage,
  supported,
  onAction,
  onClose,
}: {
  readonly request: VenueSlotRequest | null;
  readonly canManage: boolean;
  readonly supported: (action: Action) => boolean;
  readonly onAction: (action: Action) => void;
  readonly onClose: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const close = useCallback(() => {
    onClose();
  }, [onClose]);
  useOverlayFocus({ containerRef: ref, open: Boolean(request), onClose: close, lockScroll: true });
  if (!request) return null;
  return (
    <div className={styles['backdrop']}>
      <aside
        ref={ref}
        className={styles['drawer']}
        role="dialog"
        aria-modal="true"
        aria-label={`Request details for ${request.eventName}`}
        tabIndex={-1}
      >
        <button
          type="button"
          className={styles['close']}
          aria-label="Close request details"
          onClick={onClose}
        >
          ×
        </button>
        <h2>Request details</h2>
        <div className={styles['eventCard']}>
          <Image src={request.posterSrc} alt="" width={80} height={72} />
          <span>
            <strong>{request.eventName}</strong>
            <em>{request.status}</em>
          </span>
        </div>
        <section>
          <h3>Requester</h3>
          <p className={styles['requester']}>
            <i>{request.requesterInitials}</i>
            {request.requester}
          </p>
        </section>
        <dl>
          <div>
            <dt>Requested date</dt>
            <dd>{request.date}</dd>
          </div>
          <div>
            <dt>Requested time</dt>
            <dd>{request.time}</dd>
          </div>
          <div>
            <dt>Expected guests</dt>
            <dd>{request.expectedGuests}</dd>
          </div>
          <div>
            <dt>Event type</dt>
            <dd>{request.eventType}</dd>
          </div>
        </dl>
        <section>
          <h3>Note from requester</h3>
          <p className={styles['note']}>{request.note}</p>
        </section>
        {request.history.length ? (
          <section>
            <h3>Event history with this requester</h3>
            {request.history.map((item) => (
              <div className={styles['history']} key={item.id}>
                <span>
                  <strong>{item.eventName}</strong>
                  <small>{item.date}</small>
                </span>
                <em data-status={item.status}>{item.status}</em>
              </div>
            ))}
          </section>
        ) : null}
        {request.status === 'pending' ? (
          <footer>
            <button
              type="button"
              disabled={!canManage || !supported('decline')}
              onClick={() => {
                onAction('decline');
              }}
            >
              Decline
            </button>
            <button
              type="button"
              disabled={!canManage || !supported('suggest')}
              onClick={() => {
                onAction('suggest');
              }}
            >
              Suggest another date
            </button>
            <button
              type="button"
              className={styles['primary']}
              disabled={!canManage || !supported('accept')}
              onClick={() => {
                onAction('accept');
              }}
            >
              Accept request
            </button>
            {!supported('accept') && !supported('decline') && !supported('suggest') ? (
              <p>Slot Request mutation adapters are unavailable.</p>
            ) : null}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

function RequestActionDialog({
  request,
  action,
  busy,
  supported,
  onClose,
  onSubmit,
}: {
  readonly request: VenueSlotRequest | null;
  readonly action: Action | null;
  readonly busy: boolean;
  readonly supported: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (values: {
    readonly date: string;
    readonly time: string;
    readonly note: string;
  }) => Promise<void>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    onClose();
  }, [onClose]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  useOverlayFocus({ containerRef: ref, open: Boolean(action), onClose: close, lockScroll: true });
  if (!request || !action) return null;
  const title =
    action === 'accept'
      ? 'Accept this request?'
      : action === 'decline'
        ? 'Decline this request?'
        : 'Suggest another date';
  const valid = action !== 'suggest' || Boolean(date && time);
  return (
    <div className={styles['modalBackdrop']}>
      <div
        ref={ref}
        className={styles['modal']}
        role="dialog"
        aria-modal="true"
        aria-labelledby="slot-action-title"
        tabIndex={-1}
      >
        <button type="button" className={styles['close']} aria-label="Close" onClick={onClose}>
          ×
        </button>
        <h2 id="slot-action-title">{title}</h2>
        <p>
          {action === 'accept'
            ? 'This will accept the request after the server confirms it.'
            : action === 'decline'
              ? 'Add a short optional reason.'
              : 'Propose an alternative date and time.'}
        </p>
        {action === 'suggest' ? (
          <div className={styles['modalFields']}>
            <label>
              Date
              <input
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                }}
              />
            </label>
            <label>
              Time
              <input
                type="time"
                value={time}
                onChange={(event) => {
                  setTime(event.target.value);
                }}
              />
            </label>
          </div>
        ) : null}
        {action !== 'accept' ? (
          <label>
            Note {action === 'decline' ? '(optional)' : 'to requester (optional)'}
            <textarea
              maxLength={120}
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
              }}
            />
            <small>{note.length}/120</small>
          </label>
        ) : (
          <dl>
            <div>
              <dt>Event</dt>
              <dd>{request.eventName}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{request.date}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{request.time}</dd>
            </div>
          </dl>
        )}
        {!supported ? (
          <p className={styles['unsupported']}>
            This action requires a Slot Request mutation adapter.
          </p>
        ) : null}
        <footer>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles['primary']}
            disabled={!supported || !valid || busy}
            onClick={() => void onSubmit({ date, time, note })}
          >
            {busy
              ? 'Working…'
              : action === 'accept'
                ? 'Accept request'
                : action === 'decline'
                  ? 'Decline request'
                  : 'Send suggestion'}
          </button>
        </footer>
      </div>
    </div>
  );
}

function SlotState({ title, detail }: { readonly title: string; readonly detail: string }) {
  return (
    <section className={styles['empty']} role="status">
      <Icon name="inbox" size={42} />
      <h2>{title}</h2>
      <p>{detail}</p>
    </section>
  );
}
