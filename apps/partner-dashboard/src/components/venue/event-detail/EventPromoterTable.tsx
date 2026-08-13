'use client';

import { useEffect, useRef, useState } from 'react';

import { CloseIcon, CopyIcon, InviteIcon, LinkIcon, TicketIcon } from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import styles from './VenueEventOperations.module.css';

import type { VenueEventPromotersModel } from '../event-detail-model';

export function InvitePromoterAction() {
  const auth = useDashboardAuth();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      window.setTimeout(() => {
        triggerRef.current?.focus();
      }, 0);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!auth.canDo('canApprovePromoter')) return null;

  return (
    <>
      <button
        ref={triggerRef}
        className={styles['primaryButton']}
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        <InviteIcon size={18} aria-hidden="true" />
        Invite promoter
      </button>
      {open ? (
        <div className={styles['dialogBackdrop']} role="presentation">
          <section
            className={styles['inviteDialog']}
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-promoter-title"
          >
            <button
              ref={closeRef}
              className={styles['iconButton']}
              type="button"
              aria-label="Close invite promoter form"
              onClick={() => {
                setOpen(false);
                window.setTimeout(() => {
                  triggerRef.current?.focus();
                }, 0);
              }}
            >
              <CloseIcon size={20} aria-hidden="true" />
            </button>
            <h2 id="invite-promoter-title">Invite promoter</h2>
            <p>Enter the promoter’s contact details.</p>
            <form>
              <label>
                Name
                <input type="text" autoComplete="name" />
              </label>
              <label>
                Phone or email
                <input type="text" autoComplete="email" />
              </label>
              <p role="status">
                Invitation submission is not connected yet. No invite will be sent.
              </p>
              <button type="button" disabled>
                Send invite unavailable
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

export function EventPromoterTable({ model }: { readonly model: VenueEventPromotersModel }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState('Copy link');
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const selected = model.promoters.find((promoter) => promoter.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const drawer = drawerRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        const id = selectedId;
        setSelectedId(null);
        setCopyStatus('Copy link');
        if (id)
          window.setTimeout(() => {
            triggerRef.current?.focus();
          }, 0);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        drawer?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    drawer?.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      drawer?.removeEventListener('keydown', onKeyDown);
    };
  }, [selected, selectedId]);

  const closeDrawer = () => {
    const id = selectedId;
    setSelectedId(null);
    setCopyStatus('Copy link');
    if (id) window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const copyLink = async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected.link);
      setCopyStatus('Copied');
      window.setTimeout(() => {
        setCopyStatus('Copy link');
      }, 1800);
    } catch {
      setCopyStatus('Copy unavailable');
    }
  };

  return (
    <>
      <div className={styles['tableWrap']}>
        <table className={styles['promoterTable']}>
          <thead>
            <tr>
              <th scope="col">Promoter</th>
              <th scope="col">Tickets sold</th>
              <th scope="col">Earnings</th>
              <th scope="col">Status</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {model.promoters.map((promoter) => (
              <tr key={promoter.id}>
                <td data-label="Promoter">
                  <button
                    className={styles['promoterIdentity']}
                    type="button"
                    onClick={(event) => {
                      triggerRef.current = event.currentTarget;
                      setSelectedId(promoter.id);
                    }}
                  >
                    <span className={styles['avatar']} aria-hidden="true">
                      {promoter.initials}
                    </span>
                    <strong>{promoter.name}</strong>
                  </button>
                </td>
                <td data-label="Tickets sold">{promoter.ticketsSold.toLocaleString('en-IN')}</td>
                <td data-label="Earnings">{promoter.earnings}</td>
                <td data-label="Status">
                  <span className={styles['status']} data-status={promoter.status.toLowerCase()}>
                    {promoter.status}
                  </span>
                </td>
                <td data-label="Action">
                  <button
                    type="button"
                    onClick={(event) => {
                      triggerRef.current = event.currentTarget;
                      setSelectedId(promoter.id);
                    }}
                  >
                    Contact
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected ? (
        <>
          <button
            className={styles['drawerBackdrop']}
            type="button"
            aria-label="Dismiss promoter details"
            onClick={closeDrawer}
          />
          <aside
            ref={drawerRef}
            className={styles['promoterDrawer']}
            role="dialog"
            tabIndex={-1}
            aria-modal="true"
            aria-labelledby="promoter-drawer-title"
          >
            <button
              ref={closeRef}
              className={styles['drawerClose']}
              type="button"
              aria-label="Close promoter details"
              onClick={closeDrawer}
            >
              <CloseIcon size={22} aria-hidden="true" />
            </button>
            <span className={styles['drawerAvatar']} aria-hidden="true">
              {selected.initials}
            </span>
            <h2 id="promoter-drawer-title">{selected.name}</h2>
            <span className={styles['status']} data-status={selected.status.toLowerCase()}>
              {selected.status}
            </span>
            <dl>
              <div>
                <dt>Contact</dt>
                <dd>Details hidden for privacy</dd>
              </div>
              <div>
                <dt>
                  <LinkIcon size={18} aria-hidden="true" /> Promoter link
                </dt>
                <dd>{selected.link.replace('https://', '')}</dd>
              </div>
              <div>
                <dt>
                  <TicketIcon size={18} aria-hidden="true" /> Tickets sold
                </dt>
                <dd>{selected.ticketsSold.toLocaleString('en-IN')}</dd>
              </div>
              <div>
                <dt>Earnings</dt>
                <dd>{selected.earnings}</dd>
              </div>
            </dl>
            <button className={styles['copyAction']} type="button" onClick={() => void copyLink()}>
              <CopyIcon size={18} aria-hidden="true" />
              {copyStatus}
            </button>
            <span className={styles['srOnly']} aria-live="polite">
              {copyStatus === 'Copied' ? 'Promoter link copied' : ''}
            </span>
          </aside>
        </>
      ) : null}
    </>
  );
}
