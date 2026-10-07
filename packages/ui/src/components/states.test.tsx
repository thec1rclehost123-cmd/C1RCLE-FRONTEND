import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EmptyState, ErrorState, LoadingState } from './states.js';

describe('LoadingState', () => {
  it('announces the default label', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  });

  it('renders a custom label', () => {
    render(<LoadingState label="Fetching events…" />);
    expect(screen.getByRole('status')).toHaveTextContent('Fetching events…');
  });
});

describe('EmptyState', () => {
  it('renders the title alone when no description or action is given', () => {
    render(<EmptyState title="Nothing here yet" />);
    expect(screen.getByRole('heading', { name: 'Nothing here yet' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(<EmptyState title="Nothing here yet" description="Try a different filter." />);
    expect(screen.getByText('Try a different filter.')).toBeInTheDocument();
  });

  it('renders the action when provided', () => {
    render(<EmptyState title="Nothing here yet" action={<button>Create one</button>} />);
    expect(screen.getByRole('button', { name: 'Create one' })).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('uses the default title and always shows the description', () => {
    render(<ErrorState description="The request failed." />);

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByText('The request failed.')).toBeInTheDocument();
  });

  it('renders a retry button when onRetry is provided', async () => {
    const onRetry = vi.fn();
    render(<ErrorState description="boom" onRetry={onRetry} retryLabel="Retry now" />);

    await userEvent.click(screen.getByRole('button', { name: 'Retry now' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows the request id in small print when provided', () => {
    render(<ErrorState description="boom" requestId="req_123" />);
    expect(screen.getByText(/req_123/)).toBeInTheDocument();
  });

  it('omits retry and request id when not provided', () => {
    render(<ErrorState description="boom" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
