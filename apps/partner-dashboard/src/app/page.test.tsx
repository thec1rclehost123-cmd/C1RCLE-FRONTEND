import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import OverviewPage from '@/app/page';

describe('C1RCLE Partner Dashboard overview', () => {
  it('renders a single top-level heading', () => {
    render(<OverviewPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('C1RCLE Partner Dashboard');
  });
});
