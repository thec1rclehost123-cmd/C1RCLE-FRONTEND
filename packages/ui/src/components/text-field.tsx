import { useId } from 'react';

import { cn } from '@c1rcle/utils';

import type { InputHTMLAttributes, Ref } from 'react';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  readonly ref?: Ref<HTMLInputElement>;
  /** Required. An input without a label is not accessible. */
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
  /** Visually hides the label while keeping it available to screen readers. */
  readonly labelHidden?: boolean;
}

/**
 * A labelled text input.
 *
 * The label is a required prop rather than an optional one: making the
 * accessible path the only path is more reliable than auditing for it later.
 * Hints and errors are wired through `aria-describedby`, and errors are
 * announced politely without stealing focus.
 */
export function TextField({
  label,
  hint,
  error,
  labelHidden = false,
  className,
  ref,
  ...props
}: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy = [hint === undefined ? null : hintId, error === undefined ? null : errorId]
    .filter((value): value is string => value !== null)
    .join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className={cn('text-sm font-medium text-foreground', labelHidden && 'sr-only')}
      >
        {label}
      </label>

      <input
        id={id}
        ref={ref}
        aria-invalid={error !== undefined}
        {...(describedBy === '' ? {} : { 'aria-describedby': describedBy })}
        className={cn(
          'h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error === undefined ? 'border-input' : 'border-destructive',
          className,
        )}
        {...props}
      />

      {hint !== undefined && error === undefined ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}

      {error !== undefined ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
