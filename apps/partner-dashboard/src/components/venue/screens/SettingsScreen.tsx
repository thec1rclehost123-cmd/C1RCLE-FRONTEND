'use client';

import { useState } from 'react';

const SETTING_SECTIONS = ['Venue profile', 'Operations', 'Restaurant', 'Team & account'] as const;
type SettingSection = (typeof SETTING_SECTIONS)[number];

const AMENITIES = ['Rooftop', 'Accessible entrance', 'Valet', 'Smoking area', 'Bottle service', 'Food available'];

export function SettingsScreen() {
  const [section, setSection] = useState<SettingSection>('Venue profile');
  const [saved, setSaved] = useState(false);

  const saveDraft = () => {
    setSaved(true);
    window.setTimeout(() => { setSaved(false); }, 2400);
  };

  return (
    <div className="venue-settings">
      <header className="venue-settings-header">
        <div><span>Venue identity</span><h1>Settings</h1><p>Control the information guests, hosts and promoters see before they work with you.</p></div>
        <button type="button" onClick={saveDraft}>{saved ? 'Draft saved' : 'Save draft'}</button>
      </header>

      <nav className="venue-settings-tabs" aria-label="Venue settings sections">
        {SETTING_SECTIONS.map((item) => <button key={item} type="button" className={section === item ? 'is-active' : undefined} onClick={() => { setSection(item); }}>{item}</button>)}
      </nav>

      {section === 'Venue profile' ? <VenueProfileSettings /> : null}
      {section === 'Operations' ? <VenueOperationsSettings /> : null}
      {section === 'Restaurant' ? <VenueRestaurantSettings /> : null}
      {section === 'Team & account' ? <VenueAccountSettings /> : null}
    </div>
  );
}

function Field({ label, hint, children }: { readonly label: string; readonly hint?: string; readonly children: React.ReactNode }) {
  return <label className="venue-setting-field"><span>{label}</span>{children}{hint ? <small>{hint}</small> : null}</label>;
}

function VenueProfileSettings() {
  return (
    <div className="venue-settings-grid">
      <section className="venue-settings-card">
        <div className="venue-cover-editor"><span>SKYLINE SOCIAL</span><button type="button">Change cover</button></div>
        <div className="venue-settings-fields">
          <div className="venue-two-fields">
            <Field label="Venue name"><input defaultValue="Skyline Social" /></Field>
            <Field label="Venue category"><select defaultValue="Nightlife venue"><option>Nightlife venue</option><option>Restaurant</option><option>Event space</option><option>Gallery</option></select></Field>
          </div>
          <Field label="Public description" hint="Shown on your Guest Portal profile and event pages."><textarea defaultValue="A rooftop venue built for sunset sessions, late-night culture and city-wide collaborations." /></Field>
          <div className="venue-two-fields">
            <Field label="Public phone"><input defaultValue="+91 98765 43210" /></Field>
            <Field label="Public email"><input type="email" defaultValue="hello@skylinesocial.in" /></Field>
          </div>
          <Field label="Address"><input defaultValue="Linking Road, Bandra West, Mumbai" /></Field>
          <div className="venue-address-map" aria-label="Venue map preview">
            <span aria-hidden="true">⌖</span><div><strong>Skyline Social · Bandra West</strong><small>Map coordinates and pin placement will be confirmed by the venue profile API.</small></div><button type="button">Adjust pin</button>
          </div>
          <div><span className="venue-setting-label">Amenities</span><div className="venue-amenity-grid">{AMENITIES.map((amenity) => <label key={amenity}><input type="checkbox" defaultChecked={amenity !== 'Smoking area'} /><span>{amenity}</span></label>)}</div></div>
          <div><span className="venue-setting-label">Gallery & cover</span><div className="venue-gallery-settings"><button type="button"><strong>Cover image</strong><small>16:9 · WebP or AVIF</small></button><button type="button"><strong>Interior</strong><small>3 images</small></button><button type="button"><strong>Food & tables</strong><small>4 images</small></button><button type="button"><strong>+ Add media</strong><small>Optimized on upload</small></button></div></div>
        </div>
      </section>

      <aside className="venue-profile-preview">
        <div className="venue-preview-cover" />
        <div className="venue-preview-body"><span className="venue-preview-verified">Verified venue</span><h2>Skyline Social</h2><p>Bandra West · Rooftop · 400 capacity</p><div className="venue-preview-chips"><span>Rooftop</span><span>Valet</span><span>Food</span><span>Accessible</span></div><dl><div><dt>4.8</dt><dd>Guest rating</dd></div><div><dt>84</dt><dd>Events</dd></div><div><dt>12.4k</dt><dd>Interested</dd></div></dl><button type="button" disabled>Guest profile preview</button></div>
      </aside>
    </div>
  );
}

function VenueOperationsSettings() {
  return (
    <section className="venue-settings-card venue-settings-fields">
      <div className="venue-two-fields"><Field label="Maximum capacity"><input type="number" defaultValue="400" /></Field><Field label="Minimum age"><select defaultValue="21+"><option>18+</option><option>21+</option><option>25+</option></select></Field></div>
      <div><span className="venue-setting-label">Spaces & capacity</span><div className="venue-space-list"><article><div><strong>Main rooftop</strong><small>Standing · primary event space</small></div><b>280</b><button type="button">Edit</button></article><article><div><strong>Indoor lounge</strong><small>Seated · weather fallback</small></div><b>80</b><button type="button">Edit</button></article><article><div><strong>Dining deck</strong><small>Tables · reservation enabled</small></div><b>40</b><button type="button">Edit</button></article></div></div>
      <div className="venue-two-fields"><Field label="Doors open"><input type="time" defaultValue="19:00" /></Field><Field label="Standard closing time"><input type="time" defaultValue="01:30" /></Field></div>
      <div><span className="venue-setting-label">Opening hours</span><div className="venue-hours-grid">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <label key={day}><span>{day}</span><input aria-label={`${day} opening time`} type="time" defaultValue={day === 'Sun' ? '17:00' : '18:00'} /><input aria-label={`${day} closing time`} type="time" defaultValue="23:59" /></label>)}</div></div>
      <Field label="Entry policy"><textarea defaultValue="Government-issued photo ID required. Entry remains subject to venue capacity and conduct policy." /></Field>
      <Field label="Host booking window"><select defaultValue="30 days"><option>14 days</option><option>30 days</option><option>60 days</option><option>90 days</option></select></Field>
      <div className="venue-two-fields"><Field label="Minimum booking notice"><select defaultValue="7 days"><option>48 hours</option><option>7 days</option><option>14 days</option></select></Field><Field label="Cancellation window"><select defaultValue="72 hours"><option>24 hours</option><option>72 hours</option><option>7 days</option></select></Field></div>
      <div><span className="venue-setting-label">Accessibility</span><div className="venue-amenity-grid">{['Step-free entrance', 'Accessible restroom', 'Lift access', 'Low-sensory area', 'Reserved seating'].map((amenity) => <label key={amenity}><input type="checkbox" defaultChecked={amenity !== 'Low-sensory area'} /><span>{amenity}</span></label>)}</div></div>
      <label className="venue-settings-toggle"><span><strong>Accept partnership requests</strong><small>Let verified hosts and promoters request available dates.</small></span><input type="checkbox" aria-label="Accept partnership requests" defaultChecked /></label>
      <label className="venue-settings-toggle"><span><strong>Require manual event approval</strong><small>Nothing appears publicly until a venue owner approves it.</small></span><input type="checkbox" aria-label="Require manual event approval" defaultChecked /></label>
    </section>
  );
}

function VenueRestaurantSettings() {
  return (
    <section className="venue-settings-card venue-settings-fields">
      <div className="venue-settings-callout"><div><span>Optional module</span><strong>Restaurant and table reservations</strong><p>Enable this only if the venue serves food or accepts table bookings.</p></div><input type="checkbox" defaultChecked /></div>
      <div className="venue-two-fields"><Field label="Cuisine"><input defaultValue="Modern Indian · Small plates" /></Field><Field label="Reservation phone"><input defaultValue="+91 98765 43210" /></Field></div>
      <Field label="Menu URL"><input type="url" defaultValue="https://skylinesocial.in/menu" /></Field>
      <div className="venue-two-fields"><Field label="Tables available"><input type="number" defaultValue="18" /></Field><Field label="Maximum party size"><input type="number" defaultValue="12" /></Field></div>
      <label className="venue-settings-toggle"><span><strong>Show Reserve a table</strong><small>Add a reservation CTA to the public venue profile.</small></span><input type="checkbox" aria-label="Show Reserve a table" defaultChecked /></label>
    </section>
  );
}

function VenueAccountSettings() {
  return (
    <div className="venue-settings-grid venue-settings-grid--account">
      <section className="venue-settings-card venue-settings-fields"><h2>Team permissions</h2>{['Maya S. · Door lead', 'Ravi K. · Scan only', 'Tina D. · Menu & orders'].map((member) => <div className="venue-team-row" key={member}><span>{member}</span><button type="button">Manage access</button></div>)}<button className="venue-secondary-button" type="button">Invite teammate</button></section>
      <section className="venue-settings-card venue-settings-fields"><h2>Payout account</h2><div className="venue-bank-summary"><span>HDFC Bank</span><strong>•••• 4412</strong><small>Verified · settlements enabled</small></div><button className="venue-secondary-button" type="button">Manage payout details</button><p className="venue-settings-footnote">Payout changes require identity verification and backend confirmation.</p></section>
    </div>
  );
}
