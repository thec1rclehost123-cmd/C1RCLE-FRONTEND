import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { OverviewTrendCard } from './OverviewTrendCard';

import type { OverviewTrendSeries } from '@/data/partner-data-source';

const series: readonly OverviewTrendSeries[] = [
  {
    metric: 'tickets',
    range: '1W',
    value: '7',
    delta: 'New',
    caption: 'This week, by day',
    points: [0, 5, 2],
    pointLabels: ['1 Nov', '2 Nov', '3 Nov'],
  },
  {
    metric: 'revenue',
    range: '1W',
    value: '₹100',
    delta: 'New',
    caption: 'This week, by day',
    points: [0, 100, 0],
    pointLabels: ['1 Nov', '2 Nov', '3 Nov'],
  },
];

describe('Overview performance chart', () => {
  it('shows real time labels and exact values when moving over the graph', () => {
    render(<OverviewTrendCard series={series} />);
    expect(screen.getByLabelText('Time axis')).toHaveTextContent('1 Nov2 Nov3 Nov');
    const graph = screen.getByRole('img');
    vi.spyOn(graph, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      width: 600,
      top: 0,
      bottom: 190,
      right: 600,
      height: 190,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    fireEvent(graph, new MouseEvent('pointermove', { bubbles: true, clientX: 300 }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('2 Nov5 tickets');
    fireEvent.pointerLeave(graph);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('supports keyboard exploration and clears the old point when the metric changes', () => {
    render(<OverviewTrendCard series={series} />);
    const graph = screen.getByRole('img');
    fireEvent.focus(graph);
    fireEvent.keyDown(graph, { key: 'ArrowRight' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('5 tickets');
    fireEvent.click(screen.getByRole('button', { name: 'Revenue' }));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.focus(graph);
    fireEvent.keyDown(graph, { key: 'ArrowRight' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('₹100.00');
  });

  it('keeps zero activity readable with a zero baseline and integer scale', () => {
    render(<OverviewTrendCard series={[{ ...series[0]!, points: [0, 0, 0] }]} />);
    expect(screen.getByLabelText('Tickets scale')).toHaveTextContent('210');
    fireEvent.focus(screen.getByRole('img'));
    expect(screen.getByRole('tooltip')).toHaveTextContent('0 tickets');
  });

  it('marks negative changes in red and colors the chart with the same direction', () => {
    render(<OverviewTrendCard series={[{ ...series[0]!, delta: '-100%', points: [8, 4, 0] }]} />);
    expect(screen.getByText('-100%')).toHaveAttribute('data-trend', 'negative');
    expect(screen.getByRole('img').querySelector('path[stroke]')).toHaveAttribute(
      'stroke',
      '#ff5c67',
    );
  });
});
