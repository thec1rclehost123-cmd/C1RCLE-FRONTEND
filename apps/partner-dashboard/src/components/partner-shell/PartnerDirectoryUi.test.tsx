import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  PartnerDrawerShell,
  PartnerModeNavigation,
  PartnerSearchField,
  PartnerTable,
  PartnerTableHeader,
} from './PartnerDirectoryUi';

vi.mock('@c1rcle/icons', () => ({
  CloseIcon: () => <svg aria-hidden="true" />,
  SearchIcon: () => <svg aria-hidden="true" />,
}));

const styles = {
  active: 'active',
  close: 'close',
  dismiss: 'dismiss',
  drawer: 'drawer',
  drawerPortrait: 'drawerPortrait',
  navRow: 'navRow',
  partnerTable: 'partnerTable',
  search: 'search',
  srOnly: 'srOnly',
  subnav: 'subnav',
  tableHead: 'tableHead',
  tabs: 'tabs',
} as const;

describe('PartnerDirectoryUi', () => {
  it('keeps link navigation and interactive role navigation in one primitive', async () => {
    const user = userEvent.setup();
    const onCategoryChange = vi.fn();
    const onViewChange = vi.fn();

    render(
      <PartnerModeNavigation
        styles={styles}
        categories={[{ label: 'Hosts', value: 'hosts', href: '/venue/partners?tab=hosts' }]}
        activeCategory="hosts"
        views={[{ label: 'Find partners', value: 'find' }]}
        activeView="my"
        onViewChange={onViewChange}
        onCategoryChange={onCategoryChange}
      />,
    );

    expect(screen.getByRole('link', { name: 'Hosts' })).toHaveAttribute(
      'href',
      '/venue/partners?tab=hosts',
    );
    await user.click(screen.getByRole('button', { name: 'Find partners' }));
    expect(onViewChange).toHaveBeenCalledWith('find');
    expect(onCategoryChange).not.toHaveBeenCalled();
  });

  it('shares search and table framing without owning role data', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    function SearchHarness() {
      const [value, setValue] = useState('');
      return (
        <PartnerSearchField
          styles={styles}
          label="Search hosts"
          placeholder="Search hosts"
          value={value}
          onChange={(nextValue) => {
            onChange(nextValue);
            setValue(nextValue);
          }}
        />
      );
    }

    render(
      <>
        <SearchHarness />
        <PartnerTable styles={styles} ariaLabel="Host partners" variant="relationshipTable">
          <PartnerTableHeader styles={styles} columns={['Host', 'Status']} />
          <div role="row">
            <span role="cell">Rhea Kapoor</span>
          </div>
        </PartnerTable>
      </>,
    );

    await user.type(screen.getByRole('textbox', { name: 'Search hosts' }), 'Rhea');
    expect(onChange).toHaveBeenLastCalledWith('Rhea');
    expect(screen.getByRole('table', { name: 'Host partners' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
  });

  it('provides the shared drawer semantics while leaving its content to the role screen', () => {
    render(
      <PartnerDrawerShell
        styles={styles}
        open
        onClose={vi.fn()}
        ariaLabel="Rhea Kapoor partner details"
        closeLabel="Close partner details"
        title="Rhea Kapoor"
        subtitle="Host · Bengaluru"
        initials="RK"
        tone="amber"
      >
        <dl>
          <div>
            <dt>Relationship</dt>
            <dd>Active</dd>
          </div>
        </dl>
      </PartnerDrawerShell>,
    );

    expect(screen.getByRole('dialog', { name: 'Rhea Kapoor partner details' })).toBeInTheDocument();
    expect(screen.getByText('Relationship')).toBeInTheDocument();
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Close partner details' }),
    ).toBeInTheDocument();
  });
});
