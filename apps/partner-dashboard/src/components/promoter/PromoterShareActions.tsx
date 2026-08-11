'use client';

import { useState } from 'react';

export function CopyLinkButton({ value, label = 'Copy link' }: { readonly value: string; readonly label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
  window.setTimeout(() => { setCopied(false); }, 1800);
  };
  return <button type="button" className="promoter-copy-button" onClick={() => { void copy(); }}>{copied ? 'Copied' : label}<span aria-hidden="true">{copied ? '✓' : '↗'}</span></button>;
}

export function PromoterProfileShareButton() {
  const [shared, setShared] = useState(false);
  const share = async () => {
    const shareData = { title: 'Zoya Mehta · Promoter profile', text: 'View my verified Partner Network promoter profile.', url: `${window.location.origin}/partner-network/promoters/promoter-nightowl` };
    if (typeof navigator.share === 'function') await navigator.share(shareData);
    else await navigator.clipboard.writeText(shareData.url);
    setShared(true);
    window.setTimeout(() => { setShared(false); }, 1800);
  };
  return <button type="button" className="pd-button pd-button--secondary" onClick={() => { void share(); }}>{shared ? 'Profile link copied' : 'Share partner profile'}</button>;
}
