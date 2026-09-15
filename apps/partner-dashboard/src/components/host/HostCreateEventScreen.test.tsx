import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HostCreateEventScreen } from './HostCreateEventScreen';

describe('HostCreateEventScreen', () => {
  it('requires an exact range within authoritative availability before composing', () => {
    render(<HostCreateEventScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Open availability' }));
    const continueButton = screen.getByRole('button', { name: 'Build event brief' });
    expect(continueButton).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/Fri, 24 Jul/i));
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '21:00' } });
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '03:00' } });
    expect(continueButton).toBeEnabled();
  });

  it('uses request language and never exposes a publish action', () => {
    render(<HostCreateEventScreen />);
    expect(screen.getByRole('heading', { name: 'Start an event request' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /publish/i })).not.toBeInTheDocument();
  });
});
