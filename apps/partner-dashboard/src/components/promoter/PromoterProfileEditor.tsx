'use client';

import { useState } from 'react';

import type { PromoterProfile } from '@/lib/partner/contracts';

export function PromoterProfileEditor({ profile }: { readonly profile: PromoterProfile }) {
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [city, setCity] = useState(profile.city);
  const [bio, setBio] = useState(profile.bio);
  const [saved, setSaved] = useState(false);
  const save = () => {
    setSaved(true);
    window.setTimeout(() => { setSaved(false); }, 2200);
  };

  return (
    <section className="pd-surface promoter-profile-editor">
      <div><span>Partner profile</span><h2>Control what venues and hosts see.</h2><p>This profile is visible only inside the authenticated Partner Network. Financial data is never included.</p></div>
      <form onSubmit={(event) => { event.preventDefault(); save(); }}>
        <label><span>Display name</span><input value={name} onChange={(event) => { setName(event.target.value); }} required minLength={2} /></label>
        <label><span>Handle</span><input value={handle} onChange={(event) => { setHandle(event.target.value); }} required /></label>
        <label><span>City</span><input value={city} onChange={(event) => { setCity(event.target.value); }} required /></label>
        <label className="is-wide"><span>About your work</span><textarea value={bio} onChange={(event) => { setBio(event.target.value); }} maxLength={260} rows={4} /></label>
        <div className="promoter-profile-save"><small>{saved ? 'Draft saved in this preview.' : 'Backend persistence will replace local preview state.'}</small><button type="submit">Save profile draft</button></div>
      </form>
    </section>
  );
}
