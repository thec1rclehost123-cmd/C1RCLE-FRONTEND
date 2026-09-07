import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HostCreateEventScreen } from './HostCreateEventScreen';

describe('HostCreateEventScreen', () => {
  it('requires an authoritative slot before entering the three-step request flow', () => {
    render(<HostCreateEventScreen />);
    const continueButton = screen.getByRole('button', { name: 'Continue to details' });
    expect(continueButton).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/Fri, 24 Jul/i));
    expect(continueButton).toBeEnabled();
  });

  it('uses request language and never exposes a publish action', () => {
    render(<HostCreateEventScreen />);
    expect(screen.getByRole('heading', { name: 'Start an event request' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /publish/i })).not.toBeInTheDocument();
  });
});
