'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

import { hostAvailability } from './host-studio-model';
import { HostButton, HostStatus, HostUnavailable } from './HostStudioUi';

interface Ticket {
  readonly id: string;
  name: string;
  price: string;
  capacity: string;
}

export function HostCreateEventScreen() {
  const [preflight, setPreflight] = useState(true);
  const [slot, setSlot] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [preview, setPreview] = useState<'web' | 'phone'>('web');
  const [name, setName] = useState('Neon Nights: Afrobeats');
  const [description, setDescription] = useState(
    'A warm, high-energy Afrobeats night hosted by Rhea Kapoor.',
  );
  const [tickets, setTickets] = useState<readonly Ticket[]>([
    { id: 'early', name: 'Early Bird', price: '799', capacity: '150' },
    { id: 'general', name: 'General Entry', price: '1299', capacity: '100' },
  ]);
  const [notice, setNotice] = useState(false);

  const ticketErrors = useMemo(() => {
    const names = tickets.map((ticket) => ticket.name.trim().toLowerCase());
    const duplicate = names.some((value, index) => value && names.indexOf(value) !== index);
    const invalid = tickets.some(
      (ticket) => Number(ticket.price) <= 0 || Number(ticket.capacity) <= 0,
    );
    const total = tickets.reduce((sum, ticket) => sum + (Number(ticket.capacity) || 0), 0);
    return { duplicate, invalid, total, overCapacity: total > 400 };
  }, [tickets]);
  const validTickets =
    !ticketErrors.duplicate && !ticketErrors.invalid && !ticketErrors.overCapacity;

  const updateTicket = (id: string, key: 'name' | 'price' | 'capacity', value: string) => {
    setTickets((current) =>
      current.map((ticket) => (ticket.id === id ? { ...ticket, [key]: value } : ticket)),
    );
  };

  if (preflight)
    return (
      <div className="host-page host-create-page">
        <header className="host-page-header">
          <div>
            <h1>Start an event request</h1>
            <p>Choose an active venue partnership and an available venue slot.</p>
          </div>
        </header>
        <section className="host-preflight host-panel">
          <div className="host-preflight-title">
            <span>Before you begin</span>
            <h2>Confirm venue availability</h2>
            <p>Hosts request a venue slot. The venue reviews and publishes the event.</p>
          </div>
          <div className="host-preflight-check">
            <span>1</span>
            <div>
              <label htmlFor="host-venue">Partner venue</label>
              <select id="host-venue" defaultValue={hostAvailability.venueId}>
                <option value={hostAvailability.venueId}>{hostAvailability.venueName}</option>
              </select>
              <HostStatus tone="success">Active partnership</HostStatus>
            </div>
          </div>
          <div className="host-preflight-check">
            <span>2</span>
            <fieldset>
              <legend>Authoritative available slot</legend>
              {hostAvailability.slots.map((item) => (
                <label key={item.id} className={slot === item.id ? 'is-selected' : undefined}>
                  <input
                    type="radio"
                    name="slot"
                    value={item.id}
                    checked={slot === item.id}
                    onChange={() => {
                      setSlot(item.id);
                    }}
                  />
                  <strong>{item.label}</strong>
                  <small>{item.time}</small>
                </label>
              ))}
            </fieldset>
          </div>
          <footer>
            <HostButton href="/host/events">Cancel</HostButton>
            <button
              className="host-button is-primary"
              type="button"
              disabled={!slot}
              onClick={() => {
                setPreflight(false);
              }}
            >
              Continue to details
            </button>
          </footer>
        </section>
      </div>
    );

  return (
    <div className="host-page host-create-page">
      <div className="host-stepper" aria-label="Event request progress">
        {[1, 2, 3].map((value) => (
          <div
            key={value}
            className={step === value ? 'is-active' : step > value ? 'is-done' : undefined}
          >
            <span>{step > value ? '✓' : value}</span>
            <strong>{value === 1 ? 'Details' : value === 2 ? 'Tickets' : 'Review'}</strong>
          </div>
        ))}
      </div>
      <div className="host-create-layout">
        <section className="host-panel host-create-form">
          {step === 1 ? (
            <>
              <div className="host-section-head">
                <div>
                  <h1>Event details</h1>
                  <p>Tell guests what they need to see.</p>
                </div>
              </div>
              <div className="host-poster-row">
                <Image
                  src="/venue/neon-nights-poster.webp"
                  width={112}
                  height={112}
                  alt="Event poster preview"
                />
                <div>
                  <strong>Event poster</strong>
                  <p>JPG, PNG, or WebP · max 5 MB</p>
                  <button
                    type="button"
                    className="host-button"
                    disabled
                    title="Poster upload is unavailable until the upload adapter is connected"
                  >
                    Change image
                  </button>
                </div>
              </div>
              <div className="host-form-grid">
                <label className="is-wide">
                  Event name
                  <input
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                    }}
                    maxLength={100}
                  />
                </label>
                <label className="is-wide">
                  Venue
                  <input value={hostAvailability.venueName} readOnly />
                </label>
                <label>
                  Date
                  <input
                    value={hostAvailability.slots.find((item) => item.id === slot)?.label ?? ''}
                    readOnly
                  />
                </label>
                <label>
                  Start time
                  <input value="9:00 PM" readOnly />
                </label>
                <label>
                  End time
                  <input value="3:00 AM" readOnly />
                </label>
                <label>
                  Genre and vibe
                  <select defaultValue="Afrobeats / Club">
                    <option>Afrobeats / Club</option>
                    <option>House / Club</option>
                    <option>R&amp;B / Lounge</option>
                  </select>
                </label>
                <label className="is-wide">
                  Short description
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value);
                    }}
                    maxLength={200}
                  />
                </label>
                <label>
                  Age limit
                  <select defaultValue="21+">
                    <option>18+</option>
                    <option>21+</option>
                  </select>
                </label>
              </div>
              <details>
                <summary>More details</summary>
                <p>
                  Additional event details are managed by the venue after the request is accepted.
                </p>
              </details>
            </>
          ) : null}
          {step === 2 ? (
            <>
              <div className="host-section-head">
                <div>
                  <h1>Tickets</h1>
                  <p>Propose the ticket types guests can buy.</p>
                </div>
              </div>
              <div className="host-ticket-editor">
                {tickets.map((ticket) => (
                  <article key={ticket.id}>
                    <label>
                      Ticket name
                      <input
                        value={ticket.name}
                        onChange={(event) => {
                          updateTicket(ticket.id, 'name', event.target.value);
                        }}
                      />
                    </label>
                    <label>
                      Price (₹)
                      <input
                        inputMode="numeric"
                        value={ticket.price}
                        onChange={(event) => {
                          updateTicket(ticket.id, 'price', event.target.value);
                        }}
                      />
                    </label>
                    <label>
                      Capacity
                      <input
                        inputMode="numeric"
                        value={ticket.capacity}
                        onChange={(event) => {
                          updateTicket(ticket.id, 'capacity', event.target.value);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="host-link-button"
                      onClick={() => {
                        setTickets((current) => current.filter((item) => item.id !== ticket.id));
                      }}
                    >
                      Remove
                    </button>
                  </article>
                ))}
              </div>
              <button
                type="button"
                className="host-button"
                onClick={() => {
                  setTickets((current) => [
                    ...current,
                    {
                      id: `ticket-${String(current.length + 1)}`,
                      name: '',
                      price: '',
                      capacity: '',
                    },
                  ]);
                }}
              >
                + Add ticket type
              </button>
              <div className="host-info-list host-ticket-summary">
                <div>
                  <span>Guest fees</span>
                  <strong>Set by venue</strong>
                </div>
                <div>
                  <span>Total capacity</span>
                  <strong>{ticketErrors.total} / 400</strong>
                </div>
              </div>
              {ticketErrors.invalid ? (
                <p className="host-error">Price and capacity must be positive.</p>
              ) : null}
              {ticketErrors.duplicate ? (
                <p className="host-error">Ticket names must be unique.</p>
              ) : null}
              {ticketErrors.overCapacity ? (
                <p className="host-error">Total ticket capacity cannot exceed venue capacity.</p>
              ) : null}
            </>
          ) : null}
          {step === 3 ? (
            <>
              <div className="host-review-title">
                <HostStatus tone="success">Ready to request</HostStatus>
                <h1>Review your slot request</h1>
                <p>The venue will review these details before anything goes live.</p>
              </div>
              <div className="host-review-rows">
                <article>
                  <span>✓</span>
                  <div>
                    <strong>Event details</strong>
                    <p>
                      {name} · {description.slice(0, 48)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                    }}
                  >
                    Edit
                  </button>
                </article>
                <article>
                  <span>✓</span>
                  <div>
                    <strong>Venue and time</strong>
                    <p>{hostAvailability.venueName} · 9:00 PM</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                    }}
                  >
                    Edit
                  </button>
                </article>
                <article>
                  <span>✓</span>
                  <div>
                    <strong>Tickets</strong>
                    <p>
                      {tickets.length} ticket types · From ₹
                      {Math.min(...tickets.map((ticket) => Number(ticket.price) || Infinity))}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(2);
                    }}
                  >
                    Edit
                  </button>
                </article>
                <article>
                  <span>✓</span>
                  <div>
                    <strong>Request</strong>
                    <p>Venue approval required before publication</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPreflight(true);
                    }}
                  >
                    Edit
                  </button>
                </article>
              </div>
              {notice ? <HostUnavailable label="Send slot request unavailable" /> : null}
            </>
          ) : null}
        </section>
        <aside className={`host-panel host-guest-preview is-${preview}`}>
          <div className="host-preview-head">
            <h2>Guest preview</h2>
            <div>
              <button
                type="button"
                className={preview === 'web' ? 'is-active' : undefined}
                onClick={() => {
                  setPreview('web');
                }}
              >
                Web
              </button>
              <button
                type="button"
                className={preview === 'phone' ? 'is-active' : undefined}
                onClick={() => {
                  setPreview('phone');
                }}
              >
                Phone
              </button>
            </div>
          </div>
          <div className="host-preview-card">
            <Image src="/venue/neon-nights-poster.webp" width={560} height={320} alt="" />
            <div>
              <h2>{name || 'Untitled event'}</h2>
              <p>{hostAvailability.venueName} · Mumbai</p>
              <p>{hostAvailability.slots.find((item) => item.id === slot)?.label} · 9:00 PM</p>
              {step > 1 && tickets[0] ? <strong>From ₹{tickets[0].price || '—'}</strong> : null}
            </div>
          </div>
        </aside>
      </div>
      <footer className="host-sticky-actions">
        <button
          className="host-button"
          type="button"
          onClick={() => {
            if (step === 1) setPreflight(true);
            else setStep((step - 1) as 1 | 2);
          }}
        >
          Back
        </button>
        <button
          className="host-button"
          type="button"
          disabled
          title="Draft persistence is unavailable until the host request adapter is connected"
        >
          Save draft
        </button>
        {step < 3 ? (
          <button
            className="host-button is-primary"
            type="button"
            disabled={step === 1 ? name.trim().length < 3 : !validTickets}
            onClick={() => {
              setStep((step + 1) as 2 | 3);
            }}
          >
            Continue to {step === 1 ? 'tickets' : 'review'}
          </button>
        ) : (
          <button
            className="host-button is-primary"
            type="button"
            onClick={() => {
              setNotice(true);
            }}
          >
            Send slot request
          </button>
        )}
      </footer>
    </div>
  );
}
