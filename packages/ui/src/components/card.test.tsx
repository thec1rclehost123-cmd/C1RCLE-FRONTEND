import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card.js';

describe('Card', () => {
  it('renders its children', () => {
    render(<Card>content</Card>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('merges a caller-supplied class onto the default chrome', () => {
    render(<Card className="custom-card">content</Card>);
    expect(screen.getByText('content').className).toContain('custom-card');
  });
});

describe('CardHeader', () => {
  it('renders its children', () => {
    render(<CardHeader>header</CardHeader>);
    expect(screen.getByText('header')).toBeInTheDocument();
  });
});

describe('CardTitle', () => {
  it('renders children as a level-3 heading', () => {
    render(<CardTitle>Events near you</CardTitle>);
    expect(screen.getByRole('heading', { level: 3, name: 'Events near you' })).toBeInTheDocument();
  });
});

describe('CardDescription', () => {
  it('renders its children', () => {
    render(<CardDescription>Supporting text</CardDescription>);
    expect(screen.getByText('Supporting text')).toBeInTheDocument();
  });
});

describe('CardContent', () => {
  it('renders its children', () => {
    render(<CardContent>body</CardContent>);
    expect(screen.getByText('body')).toBeInTheDocument();
  });
});
