import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { createEmptyEventEditorData } from '@/lib/events/event-editor-data';

import { EventBasicDetails } from './EventEditorParts';

vi.mock('next/image', () => ({ default: () => <span /> }));
function Editor() {
  const data = createEmptyEventEditorData('host');
  const [draft, setDraft] = useState(data.defaultDraft);
  const [open, setOpen] = useState(false);
  return (
    <EventBasicDetails
      data={data}
      draft={draft}
      editMode={false}
      showSchedule={false}
      update={(values) => {
        setDraft((current) => ({ ...current, ...values }));
      }}
      onArtistAdd={vi.fn()}
      onArtistRemove={vi.fn()}
      genrePickerOpen={open}
      onToggleGenres={() => {
        setOpen((value) => !value);
      }}
    />
  );
}
describe('Event genre choices', () => {
  it('shows preset pills and toggles their selection', async () => {
    const user = userEvent.setup();
    render(<Editor />);
    const house = screen.getByRole('button', { name: 'House' });
    expect(house).toHaveAttribute('aria-pressed', 'false');
    await user.click(house);
    expect(house).toHaveAttribute('aria-pressed', 'true');
    await user.click(house);
    expect(house).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('button', { name: 'Hide more' })).not.toBeInTheDocument();
  });
  it('adds a trimmed custom genre using Enter, keeps it selected, and avoids duplicates', async () => {
    const user = userEvent.setup();
    render(<Editor />);
    await user.click(screen.getByRole('button', { name: 'Add custom genre' }));
    await user.type(screen.getByRole('textbox', { name: 'Custom genre' }), '  Disco  {Enter}');
    expect(screen.getByRole('button', { name: 'Disco' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Add custom genre' }));
    await user.type(screen.getByRole('textbox', { name: 'Custom genre' }), 'disco{Enter}');
    expect(screen.getAllByRole('button', { name: /^disco$/i })).toHaveLength(1);
  });
});
