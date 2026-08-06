'use client';

import { ErrorState } from '@c1rcle/ui';

export default function GlobalError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <ErrorState
      description="We could not load this page. Please try again."
      onRetry={reset}
      requestId={error.digest}
    />
  );
}
