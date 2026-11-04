import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ChartFrame } from './chart-frame.js';
import { Dialog } from './dialog.js';
import { PageContainer, ResponsiveDataView, SectionNavigation } from './layout.js';
import { QuantityControl } from './quantity-control.js';
import { ResultBanner } from './result-banner.js';
import { Skeleton } from './skeleton.js';
import { StatusBadge } from './status-badge.js';

describe('foundation components', () => {
  it('announces result severity without relying on color', () => {
    render(
      <ResultBanner title="Payment failed" description="No charge was completed." tone="danger" />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Payment failed');

    render(<StatusBadge label="Refund pending" tone="warning" />);
    expect(screen.getByText('Refund pending')).toBeInTheDocument();
  });

  it('keeps quantity changes within authoritative bounds', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <QuantityControl label="VIP tickets" value={0} max={2} onChange={onChange} />,
    );
    expect(screen.getByRole('button', { name: 'Decrease VIP tickets' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Increase VIP tickets' }));
    expect(onChange).toHaveBeenCalledWith(1);

    rerender(<QuantityControl label="VIP tickets" value={2} max={2} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Increase VIP tickets' })).toBeDisabled();
  });

  it('marks skeletons as decorative and respects reduced motion', () => {
    const { container } = render(<Skeleton className="h-8" />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstChild).toHaveClass('motion-reduce:animate-none');
  });

  it('provides responsive operational framing with semantic navigation and freshness', () => {
    render(
      <PageContainer width="wide">
        <SectionNavigation label="Finance views">
          <a href="#orders">Orders</a>
        </SectionNavigation>
        <ResponsiveDataView
          table={
            <table aria-label="Orders">
              <tbody>
                <tr>
                  <td>Order 1</td>
                </tr>
              </tbody>
            </table>
          }
          mobile={
            <ul aria-label="Orders mobile">
              <li>Order 1</li>
            </ul>
          }
        />
        <ChartFrame title="Net revenue" generatedAt="2026-10-16T12:00:00.000Z" timeZone="UTC">
          <div>Chart</div>
        </ChartFrame>
      </PageContainer>,
    );

    expect(screen.getByRole('navigation', { name: 'Finance views' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Orders' })).toBeInTheDocument();
    expect(screen.getByText(/^Updated /)).toBeInTheDocument();
  });
});

describe('Dialog', () => {
  it('traps keyboard focus, closes with Escape, and restores prior focus', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <>
        <button type="button">Open settings</button>
        <Dialog open={false} title="Settings" onClose={onClose}>
          <button type="button">Save</button>
        </Dialog>
      </>,
    );
    const trigger = screen.getByRole('button', { name: 'Open settings' });
    trigger.focus();

    rerender(
      <>
        <button type="button">Open settings</button>
        <Dialog open title="Settings" onClose={onClose}>
          <button type="button">Save</button>
        </Dialog>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <>
        <button type="button">Open settings</button>
        <Dialog open={false} title="Settings" onClose={onClose}>
          <button type="button">Save</button>
        </Dialog>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Open settings' })).toHaveFocus();
  });
});
