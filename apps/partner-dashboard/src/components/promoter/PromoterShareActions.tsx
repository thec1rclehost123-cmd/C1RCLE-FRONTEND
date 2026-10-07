'use client';

import { useState } from 'react';

export function CopyLinkButton({
  value,
  label = 'Copy link',
}: {
  readonly value: string;
  readonly label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
  };
  return (
    <button
      type="button"
      className="promoter-copy-button"
      onClick={() => {
        void copy();
      }}
    >
      {copied ? 'Copied' : label}
      <span aria-hidden="true">{copied ? '✓' : '↗'}</span>
    </button>
  );
}
