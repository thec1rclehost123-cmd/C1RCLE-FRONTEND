import { EmptyState } from '@c1rcle/ui';

export default function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you were looking for does not exist or has moved."
    />
  );
}
