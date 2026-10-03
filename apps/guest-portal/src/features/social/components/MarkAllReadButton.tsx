'use client';

import { useFormStatus } from 'react-dom';

import { markAllNotificationsReadAction } from '../actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/20 bg-black/35 px-5 text-[9px] font-black uppercase tracking-[0.2em] text-white transition-[border-color,opacity] duration-200 hover:border-white/45 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
    >
      {pending ? 'Marking…' : 'Mark all read'}
    </button>
  );
}

export function MarkAllReadButton() {
  return (
    <form action={markAllNotificationsReadAction}>
      <SubmitButton />
    </form>
  );
}
