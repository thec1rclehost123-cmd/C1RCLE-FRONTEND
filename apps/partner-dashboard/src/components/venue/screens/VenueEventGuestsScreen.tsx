'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { CloseIcon, ExportIcon, FilterIcon, SearchIcon, SendIcon } from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import styles from '../event-detail/VenueEventDetail.module.css';
import { useVenueStudio } from '../store';

import type { VenueEventGuestsModel } from '../event-detail-model';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

const csvCell = (value: string): string => JSON.stringify(value);

export function VenueEventGuestsScreen({
  model,
}: {
  readonly model: VenueEventGuestsModel | null;
}) {
  const auth = useDashboardAuth();
  const venue = useVenueStudio();
  const [query, setQuery] = useState('');
  const [ticket, setTicket] = useState<'all' | 'VIP Table' | 'GA'>('all');
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const viewActionRefs = useRef(new Map<string, HTMLButtonElement>());
  const guests = useMemo(() => model?.guests ?? [], [model]);

  const visibleGuests = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return guests.filter((guest) => {
      const matchesQuery =
        !normalized ||
        [guest.name, guest.maskedPhone, guest.ticketType, guest.addedBy].some((value) =>
          value.toLowerCase().includes(normalized),
        );
      const matchesTicket = ticket === 'all' || guest.ticketType === ticket;
      return matchesQuery && matchesTicket;
    });
  }, [guests, query, ticket]);

  const selectedGuest = guests.find((guest) => guest.id === selectedGuestId) ?? null;

  useEffect(() => {
    if (!selectedGuest) return;
    closeRef.current?.focus();
  }, [selectedGuest]);

  const closeDrawer = () => {
    const guestId = selectedGuestId;
    setSelectedGuestId(null);
    if (guestId) window.setTimeout(() => viewActionRefs.current.get(guestId)?.focus(), 0);
  };

  const onDrawerKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDrawer();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      drawerRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

  const exportGuests = () => {
    const csv = [
      'Guest,Phone,Ticket,Check-in,Added by',
      ...visibleGuests.map((guest) =>
        [guest.name, guest.maskedPhone, guest.ticketType, guest.checkInStatus, guest.addedBy]
          .map(csvCell)
          .join(','),
      ),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'event-guests.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles['guestsPage']}>
      {model ? (
        <section className={styles['checkInStrip']} aria-label="Guest check-in summary">
          <div>
            <strong>{model.checkedIn.toLocaleString('en-IN')}</strong>
            <span>checked in</span>
          </div>
          <div>
            <strong>{model.remaining.toLocaleString('en-IN')}</strong>
            <span>remaining</span>
          </div>
          {auth.canDo('canManageDoorMode') ? (
            <button
              type="button"
              onClick={() => {
                venue.go('door');
              }}
            >
              Open door mode
            </button>
          ) : null}
          <progress
            value={model.checkedIn}
            max={model.issuedGuests}
            aria-label={`${String(model.checkedIn)} of ${String(model.issuedGuests)} guests checked in`}
          />
          <b>{model.checkedInPercent}%</b>
        </section>
      ) : null}

      <div className={styles['guestsLayout']} data-drawer-open={selectedGuest ? 'true' : 'false'}>
        <div className={styles['guestListColumn']}>
          <div className={styles['guestToolbar']} aria-label="Find and export guests">
            <label className={styles['guestSearch']}>
              <SearchIcon size={20} aria-hidden="true" />
              <span className={styles['srOnly']}>Search guests</span>
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
                placeholder="Search guests..."
              />
            </label>
            <label className={styles['ticketFilter']}>
              <FilterIcon size={19} aria-hidden="true" />
              <span className={styles['srOnly']}>Ticket type</span>
              <select
                value={ticket}
                onChange={(event) => {
                  setTicket(event.target.value as 'all' | 'VIP Table' | 'GA');
                }}
              >
                <option value="all">All tickets</option>
                <option value="VIP Table">VIP Table</option>
                <option value="GA">GA</option>
              </select>
            </label>
            <button type="button" onClick={exportGuests} disabled={visibleGuests.length === 0}>
              <ExportIcon size={19} aria-hidden="true" />
              Export
            </button>
          </div>

          {visibleGuests.length === 0 ? (
            <section className={styles['guestEmpty']}>
              <strong>{model ? 'No matching guests' : 'Guest data is unavailable'}</strong>
              <p>
                {model
                  ? 'Clear the search or choose another ticket type.'
                  : 'The guest list has not been connected for this event.'}
              </p>
              {model ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setTicket('all');
                  }}
                >
                  Clear filters
                </button>
              ) : (
                <Link href="/venue/events">Return to events</Link>
              )}
            </section>
          ) : (
            <section className={styles['guestTable']} aria-label="Event guests">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Guest</th>
                    <th scope="col">Ticket</th>
                    <th scope="col">Check-in</th>
                    <th scope="col">Added by</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleGuests.map((guest) => (
                    <tr key={guest.id}>
                      <td data-label="Guest">
                        <span className={styles['guestAvatar']} aria-hidden="true">
                          {guest.initials}
                        </span>
                        <span className={styles['guestIdentity']}>
                          <strong>{guest.name}</strong>
                          <small>Contact details hidden</small>
                        </span>
                      </td>
                      <td data-label="Ticket">{guest.ticketType}</td>
                      <td data-label="Check-in">
                        <span
                          className={styles['checkInState']}
                          data-checked-in={guest.checkInTime ? 'true' : 'false'}
                        >
                          {guest.checkInStatus}
                        </span>
                        {guest.checkInTime ? <small>{guest.checkInTime}</small> : null}
                      </td>
                      <td data-label="Added by">{guest.addedBy}</td>
                      <td data-label="Action">
                        <button
                          ref={(element) => {
                            if (element) viewActionRefs.current.set(guest.id, element);
                            else viewActionRefs.current.delete(guest.id);
                          }}
                          type="button"
                          onClick={() => {
                            setSelectedGuestId(guest.id);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>

        {selectedGuest ? (
          <>
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- dialog handles its own keyboard focus trap */}
            <dialog
              open
              ref={drawerRef}
              className={styles['guestDrawer']}
              aria-modal="true"
              aria-labelledby="guest-drawer-title"
              tabIndex={-1}
              onKeyDown={onDrawerKeyDown}
            >
              <button
                ref={closeRef}
                className={styles['drawerClose']}
                type="button"
                aria-label="Close guest details"
                onClick={closeDrawer}
              >
                <CloseIcon size={22} aria-hidden="true" />
              </button>
              <span className={styles['drawerAvatar']} aria-hidden="true">
                {selectedGuest.initials}
              </span>
              <h2 id="guest-drawer-title">{selectedGuest.name}</h2>
              <p>{selectedGuest.ticketType}</p>
              <dl>
                <div>
                  <dt>Contact</dt>
                  <dd>Details hidden for privacy</dd>
                </div>
                <div>
                  <dt>Check-in</dt>
                  <dd>
                    <span data-checked-in={selectedGuest.checkInTime ? 'true' : 'false'}>
                      {selectedGuest.checkInStatus}
                    </span>
                    {selectedGuest.checkInDateTime ? (
                      <small>{selectedGuest.checkInDateTime}</small>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt>Added by</dt>
                  <dd>{selectedGuest.addedBy}</dd>
                </div>
              </dl>
              {auth.canDo('canSendTicket') ? (
                <button className={styles['sendTicket']} type="button">
                  <SendIcon size={18} aria-hidden="true" />
                  Send ticket
                </button>
              ) : null}
            </dialog>
          </>
        ) : null}
      </div>
    </div>
  );
}
