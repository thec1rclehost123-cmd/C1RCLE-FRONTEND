'use client';

import { useState } from 'react';

import { hostAvailability, hostProfile } from './host-studio-model';
import { HostButton, HostHeader, HostPage, HostStatus, HostUnavailable } from './HostStudioUi';

export function HostSettingsScreen({ initialTab = 'profile' }: { readonly initialTab?: string }) {
  const [tab, setTab] = useState(initialTab);
  const [notice, setNotice] = useState(false);
  const tabs = ['profile', 'availability', 'payout', 'security'] as const;
  return (
    <HostPage>
      <HostHeader title="Settings" description="Manage your Host identity and account." />
      <div className="host-settings-layout">
        <nav aria-label="Settings sections">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              className={tab === item ? 'is-active' : undefined}
              onClick={() => {
                setTab(item);
                setNotice(false);
              }}
            >
              {item === 'profile'
                ? 'Host profile'
                : item === 'availability'
                  ? 'Availability'
                  : item === 'payout'
                    ? 'Payout account'
                    : 'Security'}
            </button>
          ))}
        </nav>
        <section className="host-panel host-settings-body">
          {tab === 'profile' ? (
            <>
              <div className="host-section-head">
                <div>
                  <h2>Host profile</h2>
                  <p>What venues and promoters see.</p>
                </div>
              </div>
              <form
                className="host-form-grid"
                onSubmit={(event) => {
                  event.preventDefault();
                  setNotice(true);
                }}
              >
                <label>
                  Display name
                  <input defaultValue={hostProfile.name} />
                </label>
                <label>
                  Handle
                  <input defaultValue={hostProfile.handle} />
                </label>
                <label>
                  City
                  <input defaultValue={hostProfile.city} />
                </label>
                <label>
                  Phone
                  <input defaultValue={hostProfile.phone} />
                </label>
                <label className="is-wide">
                  Public email
                  <input defaultValue={hostProfile.email} />
                </label>
                <label className="is-wide">
                  Short bio
                  <textarea rows={4} defaultValue={hostProfile.bio} />
                </label>
                <footer className="is-wide">
                  <HostButton disabled>Cancel</HostButton>
                  <button className="host-button is-primary" type="submit">
                    Save changes
                  </button>
                </footer>
              </form>
            </>
          ) : null}
          {tab === 'availability' ? (
            <>
              <div className="host-section-head">
                <div>
                  <h2>Availability</h2>
                  <p>Tell active venue partners when you can host.</p>
                </div>
              </div>
              <div className="host-availability-week">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                  (day, index) => (
                    <label key={day}>
                      <input type="checkbox" defaultChecked={index >= 3} />
                      <span>{day}</span>
                      <small>{index >= 3 ? '6:00 PM – late' : 'Unavailable'}</small>
                    </label>
                  ),
                )}
              </div>
              <div className="host-form-grid">
                <label>
                  Primary city
                  <select defaultValue="Mumbai">
                    <option>Mumbai</option>
                    <option>Pune</option>
                  </select>
                </label>
                <label>
                  Minimum notice
                  <select defaultValue="7 days">
                    <option>7 days</option>
                    <option>14 days</option>
                  </select>
                </label>
                <label className="is-wide">
                  Unavailable dates
                  <input value="20–23 Jul 2026" readOnly />
                </label>
              </div>
              <section className="host-availability-summary">
                <h3>{hostAvailability.venueName}</h3>
                <p>
                  {hostAvailability.slots.length} venue-supplied available slots · Active
                  partnership
                </p>
              </section>
              <button
                className="host-button is-primary"
                type="button"
                onClick={() => { setNotice(true); }}
              >
                Save availability
              </button>
            </>
          ) : null}
          {tab === 'payout' ? (
            <>
              <div className="host-section-head">
                <div>
                  <h2>Payout account</h2>
                  <p>Where Host payouts arrive.</p>
                </div>
              </div>
              <div className="host-bank-row">
                <div>
                  <strong>HDFC Bank</strong>
                  <span>Account ••4412</span>
                </div>
                <div>
                  <span>Account holder</span>
                  <strong>Rhea Kapoor</strong>
                </div>
                <HostStatus tone="success">Verified</HostStatus>
                <HostButton disabled title="Bank changes require the payout adapter">
                  Change account
                </HostButton>
              </div>
              <div className="host-info-list">
                <div>
                  <span>Next payout</span>
                  <strong>Fri, 18 Jul</strong>
                </div>
                <div>
                  <span>Schedule</span>
                  <strong>Weekly after settlement</strong>
                </div>
              </div>
              <p>Account changes require verification.</p>
            </>
          ) : null}
          {tab === 'security' ? (
            <>
              <div className="host-section-head">
                <div>
                  <h2>Security</h2>
                  <p>Protect your Host Studio account.</p>
                </div>
              </div>
              <div className="host-security-list">
                <article>
                  <div>
                    <h3>Password</h3>
                    <p>Last changed 3 months ago</p>
                  </div>
                  <HostButton disabled title="Password changes are unavailable in this client">
                    Unavailable
                  </HostButton>
                </article>
                <article>
                  <div>
                    <h3>Two-step verification</h3>
                    <p>Authentication provider status unavailable</p>
                  </div>
                  <HostStatus>Unavailable</HostStatus>
                </article>
                <article>
                  <div>
                    <h3>Active sessions</h3>
                    <p>Session inventory is not supplied</p>
                  </div>
                  <HostStatus>Unavailable</HostStatus>
                </article>
                <article>
                  <div>
                    <h3>Sign out everywhere</h3>
                    <p>Last sign-in: Today, 6:15 PM</p>
                  </div>
                  <HostButton disabled title="Global session termination is unavailable">
                    Unavailable
                  </HostButton>
                </article>
              </div>
            </>
          ) : null}
          {notice ? <HostUnavailable label="Save unavailable" /> : null}
        </section>
      </div>
    </HostPage>
  );
}
