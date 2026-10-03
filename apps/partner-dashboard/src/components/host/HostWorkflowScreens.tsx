'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { getHostRequest } from './host-studio-model';
import { HostButton, HostHeader, HostPage, HostStatus, HostUnavailable } from './HostStudioUi';

export function HostInvitationReviewScreen() {
  const [notice, setNotice] = useState('');
  return (
    <HostPage>
      <div className="host-profile-crumb">
        <Link href="/host/events/invitations">Invitations</Link>
        <span>/</span>
        <strong>Neon Nights: Afrobeats</strong>
      </div>
      <HostHeader
        title="Review invitation"
        description="Confirm the event terms and your availability."
      />
      <div className="host-invitation-layout">
        <section className="host-panel">
          <div className="host-invitation-event">
            <Image src="/venue/neon-nights-poster.webp" width={124} height={124} alt="" />
            <div>
              <HostStatus tone="warning">Response due tomorrow</HostStatus>
              <h2>Neon Nights: Afrobeats</h2>
              <p>Skyline Rooftop · Sat, 28 Jun 2026 · 9:00 PM</p>
            </div>
          </div>
          <div className="host-info-list">
            <div>
              <span>Your role</span>
              <strong>Lead host</strong>
            </div>
            <div>
              <span>Guest allocation</span>
              <strong>340 guests</strong>
            </div>
            <div>
              <span>Host fee</span>
              <strong>₹60,000 + performance bonus</strong>
            </div>
            <div>
              <span>Response deadline</span>
              <strong>Tomorrow, 10:00 AM</strong>
            </div>
          </div>
          <label className="host-confirm-row">
            <input type="checkbox" /> I am available for this date and time.
          </label>
          {notice ? <HostUnavailable label={notice} /> : null}
          <footer className="host-action-row">
            <button
              type="button"
              className="host-button"
              onClick={() => {
                setNotice('Decline invitation unavailable');
              }}
            >
              Decline
            </button>
            <button
              type="button"
              className="host-button"
              onClick={() => {
                setNotice('Date suggestion unavailable');
              }}
            >
              Suggest another date
            </button>
            <button
              type="button"
              className="host-button is-primary"
              onClick={() => {
                setNotice('Accept invitation unavailable');
              }}
            >
              Accept invitation
            </button>
          </footer>
        </section>
        <aside className="host-panel">
          <h2>Venue</h2>
          <h3>Skyline Rooftop</h3>
          <p>Bandra West, Mumbai</p>
          <HostStatus tone="success">Active partner</HostStatus>
          <div className="host-info-list">
            <div>
              <span>Venue contact</span>
              <strong>Arjun Mehta</strong>
            </div>
            <div>
              <span>Typical response</span>
              <strong>Same day</strong>
            </div>
          </div>
          <HostButton href="/host/partners/venues/skyline-rooftop">View venue</HostButton>
        </aside>
      </div>
    </HostPage>
  );
}

export function HostSlotRequestScreen({ id }: { readonly id: string }) {
  const request = getHostRequest(id);
  if (!request)
    return (
      <HostPage>
        <HostHeader title="Request unavailable" />
      </HostPage>
    );
  return (
    <HostPage>
      <div className="host-profile-crumb">
        <Link href="/host/events?tab=requests">Slot requests</Link>
        <span>/</span>
        <strong>{request.id}</strong>
      </div>
      <HostHeader
        title={request.eventName}
        description="Venue slot request"
        action={
          <HostStatus tone={request.status === 'Accepted' ? 'success' : 'warning'}>
            {request.status}
          </HostStatus>
        }
      />
      <div className="host-request-layout">
        <section className="host-panel">
          <h2>Request details</h2>
          <div className="host-info-list">
            <div>
              <span>Venue</span>
              <strong>{request.venue}</strong>
            </div>
            <div>
              <span>Requested date</span>
              <strong>{request.date}</strong>
            </div>
            <div>
              <span>Requested time</span>
              <strong>{request.time}</strong>
            </div>
            <div>
              <span>Updated</span>
              <strong>{request.updatedAt}</strong>
            </div>
          </div>
          <h2>Event proposal</h2>
          <p>A high-energy, guest-first Host concept for an available partner venue slot.</p>
        </section>
        <aside className="host-panel">
          <h2>Request status</h2>
          <HostStatus tone={request.status === 'Accepted' ? 'success' : 'warning'}>
            {request.status}
          </HostStatus>
          <p>
            {request.status === 'Accepted'
              ? 'The venue accepted this slot. Event publication remains controlled by the venue.'
              : 'The venue has not completed this request yet.'}
          </p>
          <HostButton disabled title="Request editing is unavailable after submission">
            Edit unavailable
          </HostButton>
        </aside>
      </div>
    </HostPage>
  );
}
