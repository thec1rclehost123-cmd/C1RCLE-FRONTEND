'use client';

import { ErrorState } from '@/components/partner-v3/States';

export default function PartnerError({ reset }: { readonly reset: () => void }) {
  return (
    <ErrorState
      description="The Partner workspace could not be loaded. Your session and navigation remain available."
      onRetry={reset}
    />
  );
}
