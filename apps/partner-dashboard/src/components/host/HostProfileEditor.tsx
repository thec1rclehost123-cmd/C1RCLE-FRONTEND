'use client';

import { useState } from 'react';

import type { PartnerProfile } from '@/lib/partner/contracts';

export function HostProfileEditor({ profile }: { readonly profile: PartnerProfile }) {
  const [saved, setSaved] = useState(false);
  return (
    <form className="host-profile-editor pd-surface" onSubmit={(event) => { event.preventDefault(); setSaved(true); }}>
      <div><span>Host identity</span><h2>Make every partnership decision easier.</h2><p>This profile is shared with venues and promoters. Financial information never appears here.</p></div>
      <div className="host-form-grid">
        <label><span>Display name</span><input defaultValue={profile.name} onChange={() => { setSaved(false); }} /></label>
        <label><span>Handle</span><input defaultValue={profile.handle} onChange={() => { setSaved(false); }} /></label>
        <label><span>City</span><input defaultValue={profile.city} onChange={() => { setSaved(false); }} /></label>
        <label><span>Categories</span><input defaultValue={profile.categories.join(', ')} onChange={() => { setSaved(false); }} /></label>
        <label className="is-wide"><span>Description</span><textarea rows={5} defaultValue={profile.description} onChange={() => { setSaved(false); }} /></label>
      </div>
      <footer><small>{saved ? 'Preview saved locally.' : 'Backend profile mutation not connected.'}</small><button type="submit">Save preview</button></footer>
    </form>
  );
}
