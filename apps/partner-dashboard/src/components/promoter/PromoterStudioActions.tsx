'use client';

import { useEffect, useRef, useState } from 'react';

export function CopyLinkButton({
  value,
  label = 'Copy link',
}: {
  readonly value: string;
  readonly label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="pr-button pr-button--primary"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          window.setTimeout(() => { setCopied(false); }, 1600);
        });
      }}
    >
      {copied ? 'Copied' : label}
    </button>
  );
}

export function UnavailableAction({
  label,
  title = 'Action unavailable',
  description = 'This workspace does not currently expose a verified write adapter for this action. Nothing has been changed.',
  tone = 'primary',
}: {
  readonly label: string;
  readonly title?: string;
  readonly description?: string;
  readonly tone?: 'primary' | 'secondary' | 'danger';
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [open]);
  return (
    <>
      <button
        type="button"
        className={`pr-button pr-button--${tone}`}
        onClick={() => { setOpen(true); }}
      >
        {label}
      </button>
      <dialog ref={dialogRef} className="pr-dialog" onClose={() => { setOpen(false); }}>
        <form method="dialog">
          <span className="pr-dialog__icon" aria-hidden="true">
            !
          </span>
          <h2>{title}</h2>
          <p>{description}</p>
          <div>
            <button className="pr-button pr-button--primary" type="submit">
              Got it
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function SegmentedControl({
  label,
  options,
}: {
  readonly label: string;
  readonly options: readonly string[];
}) {
  const [active, setActive] = useState(options[0] ?? '');
  return (
    <fieldset className="pr-segmented">
      <legend>{label}</legend>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={active === option ? 'is-active' : undefined}
          onClick={() => { setActive(option); }}
        >
          {option}
        </button>
      ))}
    </fieldset>
  );
}
