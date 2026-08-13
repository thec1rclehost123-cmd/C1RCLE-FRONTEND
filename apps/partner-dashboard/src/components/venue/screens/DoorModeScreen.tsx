'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import { Icon } from '../Icon';
import { useOverlayFocus } from '../useOverlayFocus';
import { doorModeModel, filterDoorGuests, formatDoorCurrency } from '../venue-door-model';

import styles from './DoorMode.module.css';

import type {
  DoorGuest,
  DoorGuestFilter,
  DoorModeAdapters,
  DoorScanState,
  DoorTab,
  DoorWalkInResult,
} from '../venue-door-model';

const tabItems: readonly { readonly id: DoorTab; readonly label: string }[] = [
  { id: 'scanner', label: 'Scanner' },
  { id: 'guests', label: 'Guest list' },
  { id: 'walk-ins', label: 'Walk-ins' },
];

export function DoorModeScreen({
  tab = 'scanner',
  adapters,
}: {
  readonly tab?: DoorTab;
  readonly adapters?: DoorModeAdapters;
}) {
  const auth = useDashboardAuth();
  const canView =
    auth.grantedPermissions.length === 0 ||
    auth.grantedPermissions.includes('*') ||
    auth.hasPermission('VIEW_GUESTS');
  const canManage = auth.canDo('canManageDoorMode');
  const [online, setOnline] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    let reconnectTimer: number | undefined;
    const update = () => {
      const nextOnline = navigator.onLine;
      setOnline(nextOnline);
      if (nextOnline) {
        setReconnecting(true);
        reconnectTimer = window.setTimeout(() => {
          setReconnecting(false);
        }, 900);
      } else {
        setReconnecting(false);
      }
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
    };
  }, []);

  if (!canView) {
    return <RouteState title="Access denied" detail="Your venue role cannot open Door Mode." />;
  }

  return (
    <section className={styles['page']}>
      <header className={styles['eventHeader']}>
        <Image
          src={doorModeModel.event.posterSrc}
          alt=""
          width={148}
          height={148}
          sizes="148px"
          priority
        />
        <div>
          <span className={styles['live']}>Live</span>
          <h1>{doorModeModel.event.name}</h1>
          <p>{doorModeModel.event.venue}</p>
          <p>
            <Icon name="calendar" size={17} /> {doorModeModel.event.dateTime}
          </p>
        </div>
      </header>

      <nav className={styles['tabs']} aria-label="Door Mode sections">
        {tabItems.map((item) => (
          <Link
            key={item.id}
            href={`/venue/door?tab=${item.id}`}
            aria-current={tab === item.id ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {!online || reconnecting ? (
        <div className={styles['network']} role="status" aria-live="polite">
          <Icon name={online ? 'refresh-cw' : 'cloud-off'} size={18} />
          <div>
            <strong>{online ? 'Reconnecting…' : 'Offline'}</strong>
            <span>
              {online
                ? 'Restoring the scanner connection.'
                : 'Scanning and check-in are unavailable until the connection returns.'}
            </span>
          </div>
        </div>
      ) : null}

      {tab === 'scanner' ? (
        <ScannerPanel
          {...(adapters ? { adapters } : {})}
          enabled={canManage && online && !reconnecting}
        />
      ) : null}
      {tab === 'guests' ? (
        <GuestList {...(adapters ? { adapters } : {})} canManage={canManage && online} />
      ) : null}
      {tab === 'walk-ins' ? (
        <WalkIns {...(adapters ? { adapters } : {})} canManage={canManage && online} />
      ) : null}
    </section>
  );
}

function SummaryStrip() {
  const items = [
    ['check-circle-2', 'Checked in', doorModeModel.totals.checkedIn, 'success'],
    ['clock', 'Remaining', doorModeModel.totals.remaining, 'warning'],
    [
      'users',
      'Capacity',
      `${String(doorModeModel.totals.issued)} / ${String(doorModeModel.totals.capacity)}`,
      'neutral',
    ],
  ] as const;
  return (
    <div className={styles['summary']} aria-label="Door summary">
      {items.map(([icon, label, value, tone]) => (
        <article key={label} data-tone={tone}>
          <span>
            <Icon name={icon} size={23} />
          </span>
          <div>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        </article>
      ))}
    </div>
  );
}

function ScannerPanel({
  adapters,
  enabled,
}: {
  readonly adapters?: DoorModeAdapters;
  readonly enabled: boolean;
}) {
  const [scanState, setScanState] = useState<DoorScanState | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !adapters?.startScanner) return;
    let disposed = false;
    let stop: (() => void) | undefined;
    void adapters
      .startScanner((result) => {
        if (!disposed) setScanState(result);
      })
      .then((cleanup) => {
        if (disposed) cleanup?.();
        else stop = cleanup;
      })
      .catch(() => {
        if (!disposed) setScanState({ type: 'permission' });
      });
    return () => {
      disposed = true;
      stop?.();
    };
  }, [adapters, enabled]);

  const recent = doorModeModel.guests.filter((guest) => guest.checkedIn).slice(0, 5);
  return (
    <>
      <SummaryStrip />
      <div className={styles['scannerGrid']}>
        <section className={styles['scanner']} aria-label="QR scanner">
          <i className={styles['corner']} aria-hidden="true" />
          <div>
            <Icon name="scan-line" size={62} />
            <h2>Scan guest QR code</h2>
            {!adapters?.startScanner ? (
              <p>Camera scanning requires the verified scanner adapter.</p>
            ) : null}
          </div>
          <footer>
            <button type="button" disabled title="Flash control is unavailable on this scanner.">
              <Icon name="zap" size={18} /> Flash
            </button>
            <button
              type="button"
              onClick={() => {
                setManualOpen(true);
              }}
            >
              <Icon name="keyboard" size={18} /> Manual code
            </button>
          </footer>
        </section>
        <aside className={styles['scanSide']}>
          <article className={styles['latest']}>
            <header>
              <span>Latest check-in</span>
              <strong>Checked in now</strong>
            </header>
            {recent[0] ? <GuestIdentity guest={recent[0]} /> : <p>No guests checked in yet.</p>}
          </article>
          <article className={styles['recent']}>
            <header>
              <span>Recent scans</span>
            </header>
            {recent.map((guest, index) => (
              <div key={guest.id}>
                <GuestIdentity guest={guest} compact />
                <b>{index === 0 ? 'Now' : `${String(index)}m ago`}</b>
              </div>
            ))}
          </article>
          <button
            className={styles['primaryWide']}
            type="button"
            onClick={() => {
              setManualOpen(true);
            }}
          >
            <Icon name="keyboard" size={18} /> Enter code manually
          </button>
        </aside>
      </div>
      {scannerError ? (
        <p className={styles['error']} role="alert">
          {scannerError}
        </p>
      ) : null}
      <ManualCodeDialog
        open={manualOpen}
        onClose={() => {
          setManualOpen(false);
        }}
        verify={adapters?.verifyManualCode}
        onResult={(result) => {
          setScanState(result);
          setManualOpen(false);
        }}
        onError={setScannerError}
      />
      <ScanResult
        state={scanState}
        onClose={() => {
          setScanState(null);
        }}
      />
    </>
  );
}

function GuestList({
  adapters,
  canManage,
}: {
  readonly adapters?: DoorModeAdapters;
  readonly canManage: boolean;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<DoorGuestFilter>('all');
  const [selected, setSelected] = useState<DoorGuest | null>(null);
  const [confirm, setConfirm] = useState<{
    readonly guest: DoorGuest;
    readonly action: 'check-in' | 'undo';
  } | null>(null);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const rows = useMemo(
    () =>
      filterDoorGuests(
        doorModeModel.guests.map((guest) => ({
          ...guest,
          checkedIn: overrides[guest.id] ?? guest.checkedIn,
        })),
        query,
        filter,
      ),
    [filter, overrides, query],
  );

  const perform = async () => {
    if (!confirm) return;
    const mutation = confirm.action === 'check-in' ? adapters?.checkIn : adapters?.undoCheckIn;
    if (!mutation) return;
    setBusy(true);
    setMessage(null);
    try {
      await mutation(confirm.guest.id);
      setOverrides((current) => ({
        ...current,
        [confirm.guest.id]: confirm.action === 'check-in',
      }));
      setMessage(confirm.action === 'check-in' ? 'Guest checked in.' : 'Check-in undone.');
      setConfirm(null);
      setSelected(null);
    } catch {
      setMessage(
        confirm.action === 'check-in' ? 'Check-in failed. Try again.' : 'Undo failed. Try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SummaryStrip />
      <div className={styles['guestToolbar']}>
        <label>
          <Icon name="search" size={18} />
          <span className="sr-only">Search guests</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder="Search guest name or order"
          />
        </label>
        <div role="group" aria-label="Guest filters">
          {(
            [
              ['all', 'All'],
              ['pending', 'Not checked in'],
              ['checked-in', 'Checked in'],
              ['vip', 'VIP'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => {
                setFilter(id);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {message ? (
        <p className={styles['status']} role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
      <div className={styles['guestTable']} role="table" aria-label="Guest list">
        <div className={styles['tableHead']} role="row">
          <span>Guest</span>
          <span>Ticket type</span>
          <span>Qty</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {rows.map((guest) => (
          <div className={styles['guestRow']} role="row" key={guest.id}>
            <button
              type="button"
              className={styles['guestButton']}
              onClick={() => {
                setSelected(guest);
              }}
            >
              <GuestIdentity guest={guest} compact />
            </button>
            <span data-label="Ticket type">{guest.ticketType}</span>
            <span data-label="Quantity">{guest.quantity}</span>
            <span
              data-label="Status"
              className={guest.checkedIn ? styles['checked'] : styles['pending']}
            >
              {guest.checkedIn ? 'Checked in' : 'Not checked in'}
            </span>
            <button
              type="button"
              className={styles['rowAction']}
              disabled={
                !canManage || (guest.checkedIn ? !adapters?.undoCheckIn : !adapters?.checkIn)
              }
              title={!adapters ? 'The check-in mutation adapter is unavailable.' : undefined}
              onClick={() => {
                setConfirm({ guest, action: guest.checkedIn ? 'undo' : 'check-in' });
              }}
            >
              {guest.checkedIn ? 'Undo' : 'Check in'}
            </button>
          </div>
        ))}
      </div>
      <GuestDrawer
        guest={selected}
        onClose={() => {
          setSelected(null);
        }}
        onAction={(guest) => {
          setConfirm({ guest, action: guest.checkedIn ? 'undo' : 'check-in' });
        }}
        canAct={canManage && Boolean(adapters?.checkIn ?? adapters?.undoCheckIn)}
      />
      <ConfirmGuestDialog
        value={confirm}
        busy={busy}
        onClose={() => {
          setConfirm(null);
        }}
        onConfirm={() => void perform()}
      />
    </>
  );
}

function WalkIns({
  adapters,
  canManage,
}: {
  readonly adapters?: DoorModeAdapters;
  readonly canManage: boolean;
}) {
  const firstTicket = doorModeModel.ticketTypes[0];
  const [ticketId, setTicketId] = useState(firstTicket?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [payment, setPayment] = useState<'UPI' | 'Card' | 'Cash'>('UPI');
  const [state, setState] = useState<'idle' | 'pending' | 'failure' | 'success'>('idle');
  const [result, setResult] = useState<DoorWalkInResult | null>(null);
  const selectedTicket =
    doorModeModel.ticketTypes.find((ticket) => ticket.id === ticketId) ?? firstTicket;
  const totalPaise = (selectedTicket?.pricePaise ?? 0) * quantity;
  const valid = name.trim().length > 1 && /^\+?[0-9 ]{10,15}$/.test(phone.trim()) && quantity > 0;
  const totalCollected = doorModeModel.walkIns.reduce((sum, item) => sum + item.amountPaise, 0);

  const submit = async () => {
    if (!valid || !selectedTicket || !adapters?.createWalkIn) return;
    setState('pending');
    try {
      const next = await adapters.createWalkIn({
        ticketTypeId: selectedTicket.id,
        quantity,
        name: name.trim(),
        phone: phone.trim(),
        paymentMethod: payment,
      });
      setResult(next);
      setState('success');
    } catch {
      setState('failure');
    }
  };

  if (state === 'success' && result) {
    return (
      <WalkInSuccess
        result={result}
        sendTicket={adapters?.sendTicket}
        onDone={() => {
          setState('idle');
          setResult(null);
          setName('');
          setPhone('');
        }}
      />
    );
  }

  return (
    <div className={styles['walkInGrid']}>
      <form
        className={styles['walkInForm']}
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <h1>Add walk-in</h1>
        <fieldset>
          <legend>
            <b>1</b> Ticket type
          </legend>
          <div className={styles['ticketChoices']}>
            {doorModeModel.ticketTypes.slice(0, 2).map((ticket) => (
              <label key={ticket.id} data-selected={ticketId === ticket.id}>
                <input
                  type="radio"
                  name="ticket"
                  value={ticket.id}
                  checked={ticketId === ticket.id}
                  onChange={() => {
                    setTicketId(ticket.id);
                  }}
                />
                <span>
                  {ticket.name}
                  <small>{formatDoorCurrency(ticket.pricePaise)}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <b>2</b> Quantity
          </legend>
          <div className={styles['quantity']}>
            <button
              type="button"
              onClick={() => {
                setQuantity((value) => Math.max(1, value - 1));
              }}
            >
              −
            </button>
            <output>{quantity}</output>
            <button
              type="button"
              onClick={() => {
                setQuantity((value) => Math.min(10, value + 1));
              }}
            >
              +
            </button>
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <b>3</b> Guest details
          </legend>
          <div className={styles['fields']}>
            <label>
              Full name
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                }}
                required
              />
            </label>
            <label>
              Phone number
              <input
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                }}
                inputMode="tel"
                required
                aria-describedby="walkin-phone-help"
              />
            </label>
          </div>
          {phone && !/^\+?[0-9 ]{10,15}$/.test(phone.trim()) ? (
            <p id="walkin-phone-help" className={styles['error']}>
              Enter a valid phone number.
            </p>
          ) : null}
        </fieldset>
        <div className={styles['total']}>
          <span>Total</span>
          <strong>{formatDoorCurrency(totalPaise)}</strong>
        </div>
        <div>
          <span className={styles['fieldLabel']}>Payment method</span>
          <div className={styles['paymentChoices']}>
            {(['UPI', 'Card', 'Cash'] as const).map((method) => (
              <button
                type="button"
                key={method}
                aria-pressed={payment === method}
                onClick={() => {
                  setPayment(method);
                }}
              >
                {method}
              </button>
            ))}
          </div>
        </div>
        {state === 'failure' ? (
          <p className={styles['error']} role="alert">
            Payment or ticket creation failed. Try again.
          </p>
        ) : null}
        {!adapters?.createWalkIn ? (
          <p className={styles['unavailable']}>
            Walk-in checkout requires the order, payment, and ticket adapter.
          </p>
        ) : null}
        <button
          className={styles['primaryWide']}
          type="submit"
          disabled={!canManage || !valid || !adapters?.createWalkIn || state === 'pending'}
          aria-busy={state === 'pending'}
        >
          {state === 'pending'
            ? 'Waiting for payment…'
            : state === 'failure'
              ? 'Retry'
              : 'Create ticket'}
        </button>
      </form>
      <aside className={styles['walkInSide']}>
        <article className={styles['walkInSummary']}>
          <h2>Tonight&apos;s walk-ins</h2>
          <div>
            <strong>{doorModeModel.walkIns.reduce((sum, item) => sum + item.quantity, 0)}</strong>
            <span>Guests</span>
          </div>
          <div>
            <strong>{formatDoorCurrency(totalCollected)}</strong>
            <span>Collected</span>
          </div>
        </article>
        <article className={styles['walkInRecent']}>
          <h2>Recent walk-ins</h2>
          {doorModeModel.walkIns.map((item) => (
            <div key={item.id}>
              <span>
                {item.name}
                <small>
                  {String(item.quantity)} × {item.ticketType}
                </small>
              </span>
              <b>{formatDoorCurrency(item.amountPaise)}</b>
              <time>{item.time}</time>
            </div>
          ))}
        </article>
      </aside>
    </div>
  );
}

function GuestIdentity({
  guest,
  compact = false,
}: {
  readonly guest: DoorGuest;
  readonly compact?: boolean;
}) {
  return (
    <span className={styles['identity']} data-compact={compact}>
      <i>{guest.initials}</i>
      <span>
        <strong>{guest.name}</strong>
        <small>
          {guest.quantity} × {guest.ticketType}
          {!compact ? ` · ${guest.orderId}` : ''}
        </small>
      </span>
    </span>
  );
}

function GuestDrawer({
  guest,
  onClose,
  onAction,
  canAct,
}: {
  readonly guest: DoorGuest | null;
  readonly onClose: () => void;
  readonly onAction: (guest: DoorGuest) => void;
  readonly canAct: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const close = useCallback(() => {
    onClose();
  }, [onClose]);
  useOverlayFocus({ containerRef: ref, open: Boolean(guest), onClose: close, lockScroll: true });
  if (!guest) return null;
  return (
    <div className={styles['drawerBackdrop']}>
      <aside
        ref={ref}
        className={styles['drawer']}
        role="dialog"
        aria-modal="true"
        aria-label={`Guest details for ${guest.name}`}
        tabIndex={-1}
      >
        <button
          type="button"
          className={styles['close']}
          aria-label="Close guest details"
          onClick={onClose}
        >
          ×
        </button>
        <GuestIdentity guest={guest} />
        <dl>
          <div>
            <dt>Ticket type</dt>
            <dd>{guest.ticketType}</dd>
          </div>
          <div>
            <dt>Quantity</dt>
            <dd>{guest.quantity} guests</dd>
          </div>
          <div>
            <dt>Order ID</dt>
            <dd>{guest.orderId}</dd>
          </div>
          <div>
            <dt>Contact</dt>
            <dd>Details hidden for privacy</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{guest.checkedIn ? 'Checked in' : 'Not checked in'}</dd>
          </div>
        </dl>
        <button
          type="button"
          className={styles['primaryWide']}
          disabled={!canAct}
          onClick={() => {
            onAction(guest);
          }}
        >
          {guest.checkedIn
            ? 'Undo check-in'
            : `Check in ${String(guest.quantity)} guest${guest.quantity === 1 ? '' : 's'}`}
        </button>
      </aside>
    </div>
  );
}

function ConfirmGuestDialog({
  value,
  busy,
  onClose,
  onConfirm,
}: {
  readonly value: { readonly guest: DoorGuest; readonly action: 'check-in' | 'undo' } | null;
  readonly busy: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    onClose();
  }, [onClose]);
  useOverlayFocus({ containerRef: ref, open: Boolean(value), onClose: close, lockScroll: true });
  if (!value) return null;
  return (
    <div className={styles['modalBackdrop']}>
      <div
        ref={ref}
        className={styles['modal']}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-confirm-title"
        tabIndex={-1}
      >
        <Icon name={value.action === 'undo' ? 'undo-2' : 'users'} size={34} />
        <h2 id="guest-confirm-title">
          {value.action === 'undo'
            ? 'Undo check-in?'
            : `Check in ${String(value.guest.quantity)} guest${value.guest.quantity === 1 ? '' : 's'}?`}
        </h2>
        <p>{value.guest.name}</p>
        <footer>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles['primaryWide']}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'Working…' : value.action === 'undo' ? 'Undo' : 'Confirm'}
          </button>
        </footer>
      </div>
    </div>
  );
}

function ManualCodeDialog({
  open,
  onClose,
  verify,
  onResult,
  onError,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly verify?: DoorModeAdapters['verifyManualCode'];
  readonly onResult: (result: DoorScanState) => void;
  readonly onError: (message: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const close = useCallback(() => {
    onClose();
  }, [onClose]);
  useOverlayFocus({ containerRef: ref, open, onClose: close, lockScroll: true });
  if (!open) return null;
  const submit = async () => {
    if (!verify || code.length !== 6) return;
    setBusy(true);
    try {
      onResult(await verify(code));
    } catch {
      onError('Ticket verification failed. Try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={styles['modalBackdrop']}>
      <div
        ref={ref}
        className={styles['modal']}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-code-title"
        tabIndex={-1}
      >
        <button
          type="button"
          className={styles['close']}
          aria-label="Close manual code"
          onClick={onClose}
        >
          ×
        </button>
        <h2 id="manual-code-title">Enter ticket code</h2>
        <p>Ask the guest for their six-character code.</p>
        <label>
          Ticket code
          <input
            value={code}
            onChange={(event) => {
              setCode(
                event.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, '')
                  .slice(0, 6),
              );
            }}
            maxLength={6}
            autoComplete="off"
          />
        </label>
        {!verify ? (
          <p className={styles['unavailable']}>Manual verification requires the scanner adapter.</p>
        ) : null}
        <footer>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles['primaryWide']}
            disabled={!verify || code.length !== 6 || busy}
            onClick={() => void submit()}
          >
            {busy ? 'Checking…' : 'Check ticket'}
          </button>
        </footer>
      </div>
    </div>
  );
}

function ScanResult({
  state,
  onClose,
}: {
  readonly state: DoorScanState | null;
  readonly onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    onClose();
  }, [onClose]);
  useOverlayFocus({ containerRef: ref, open: Boolean(state), onClose: close, lockScroll: true });
  if (!state) return null;
  const content =
    state.type === 'success'
      ? ['Check-in complete', `${state.guest} · ${String(state.quantity)} × ${state.ticket}`]
      : state.type === 'duplicate'
        ? ['Already checked in', `Originally checked in at ${state.checkedInAt}.`]
        : state.type === 'permission'
          ? ['Camera access needed', 'Enable camera access to scan QR codes at the door.']
          : state.type === 'offline'
            ? ['Scanner unavailable offline', 'Reconnect before checking in this ticket.']
            : ['Ticket not found', 'This QR code is invalid or no longer exists.'];
  return (
    <div className={styles['modalBackdrop']}>
      <div
        ref={ref}
        className={styles['modal']}
        data-result={state.type}
        role="dialog"
        aria-modal="true"
        aria-live="assertive"
        tabIndex={-1}
      >
        <h2>{content[0]}</h2>
        <p>{content[1]}</p>
        <button type="button" className={styles['primaryWide']} onClick={onClose}>
          {state.type === 'invalid' ? 'Try again' : 'Done'}
        </button>
      </div>
    </div>
  );
}

function WalkInSuccess({
  result,
  sendTicket,
  onDone,
}: {
  readonly result: DoorWalkInResult;
  readonly sendTicket?: DoorModeAdapters['sendTicket'];
  readonly onDone: () => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <section className={styles['successState']} aria-live="polite">
      <Icon name="check-circle-2" size={52} />
      <h1>Walk-in ticket created</h1>
      <p>Ticket number</p>
      <strong>{result.ticketNumber}</strong>
      <dl>
        <div>
          <dt>Amount</dt>
          <dd>{formatDoorCurrency(result.amountPaise)}</dd>
        </div>
        <div>
          <dt>Payment</dt>
          <dd>{result.paymentMethod}</dd>
        </div>
      </dl>
      <button
        type="button"
        disabled={!sendTicket}
        onClick={() => {
          if (!sendTicket) return;
          void sendTicket(result.ticketNumber)
            .then(() => {
              setMessage('Ticket sent.');
            })
            .catch(() => {
              setMessage('Ticket delivery failed.');
            });
        }}
      >
        Send ticket{!sendTicket ? ' unavailable' : ''}
      </button>
      <button type="button" className={styles['primaryWide']} onClick={onDone}>
        Done
      </button>
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}

function RouteState({ title, detail }: { readonly title: string; readonly detail: string }) {
  return (
    <section className={styles['routeState']} role="alert">
      <Icon name="lock" size={42} />
      <h1>{title}</h1>
      <p>{detail}</p>
      <Link href="/venue/events">Go back</Link>
    </section>
  );
}
