import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FixtureBadge } from './FixtureBadge';

describe('FixtureBadge', () => {
  it('discloses fixture data when dataStatus is fixture', () => {
    render(<FixtureBadge dataStatus="fixture" />);
    expect(screen.getByText('Fixture data')).toBeInTheDocument();
  });

  it.each(['api', 'live', 'unavailable', null] as const)(
    'renders nothing when dataStatus is %s',
    (dataStatus) => {
      const { container } = render(<FixtureBadge dataStatus={dataStatus} />);
      expect(container).toBeEmptyDOMElement();
    },
  );

  it('renders nothing when dataStatus is omitted', () => {
    const { container } = render(<FixtureBadge />);
    expect(container).toBeEmptyDOMElement();
  });
});
