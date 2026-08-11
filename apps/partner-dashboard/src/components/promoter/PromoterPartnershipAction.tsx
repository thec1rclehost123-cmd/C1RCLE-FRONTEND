'use client';

import { useState } from 'react';

import { ConfirmationDialog, DashboardToast } from '@/components/partner-shell/DashboardInteractiveUi';

import type { PromoterPartner } from '@/lib/partner/contracts';

export function PromoterPartnershipAction({ partner }: { readonly partner: PromoterPartner }) {
  const [state, setState] = useState<'idle' | 'confirming' | 'submitting' | 'prepared'>('idle');

  if (partner.status === 'partnered') return <button type="button" className="is-active" title={`${String(partner.eventsTogether)} completed collaborations`}>Relationship active · {partner.eventsTogether} events</button>;
  if (partner.status === 'pending') return <button type="button" disabled>Waiting for {partner.kind}</button>;

  return <>
    <button type="button" onClick={() => { setState('confirming'); }}>Request partnership</button>
    <ConfirmationDialog open={state === 'confirming' || state === 'submitting'} title={`Connect with ${partner.name}?`} description="The live relationship API will submit this request, enforce permissions and prevent duplicates. This fixture prepares the frontend success state only." confirmLabel="Prepare request" busy={state === 'submitting'} onCancel={() => { setState('idle'); }} onConfirm={() => { setState('submitting'); window.setTimeout(() => { setState('prepared'); }, 550); }} />
    <DashboardToast message={state === 'prepared' ? `Partnership request preview prepared for ${partner.name}.` : null} />
  </>;
}
