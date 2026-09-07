'use client';

import { ErrorState } from '@/components/partner-v3/States';

export default function StudioError({ reset }: { readonly reset: () => void }) {
  return <ErrorState description="This Partner Studio route could not be loaded. Retry without changing your workspace." onRetry={reset} />;
}
