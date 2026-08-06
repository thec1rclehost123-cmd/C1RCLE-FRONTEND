import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './button.js';
import { TextField } from './text-field.js';

describe('Button', () => {
  it('is reachable and activatable by keyboard', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('announces a busy state and blocks activation while loading', async () => {
    const onClick = vi.fn();
    render(
      <Button isLoading onClick={onClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('lets a caller override a conflicting utility class', () => {
    render(<Button className="bg-red-500">Save</Button>);
    expect(screen.getByRole('button').className).toContain('bg-red-500');
  });
});

describe('TextField', () => {
  it('associates its label with the input', () => {
    render(<TextField label="Email address" />);
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
  });

  it('exposes the hint through aria-describedby', () => {
    render(<TextField label="Email" hint="We never share this." />);
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('We never share this.');
  });

  it('marks the field invalid and announces the error', () => {
    render(<TextField label="Email" error="Enter a valid email." />);

    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email.');
  });

  it('prefers the error over the hint when both are present', () => {
    render(<TextField label="Email" hint="Optional" error="Required" />);

    expect(screen.queryByText('Optional')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Required');
  });
});
