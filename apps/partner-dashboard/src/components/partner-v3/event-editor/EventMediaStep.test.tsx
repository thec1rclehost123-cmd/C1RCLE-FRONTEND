import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { createEmptyEventEditorData } from '@/lib/events/event-editor-data';
import { validateEventMedia } from '@/lib/events/event-media';

import { EventBasicDetails, EventPreview } from './EventEditorParts';
import { EventMediaStep } from './EventMediaStep';

vi.mock('next/image', () => ({ default: () => <span /> }));
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '');
};
function Editor() {
  const [draft, setDraft] = useState(createEmptyEventEditorData('host').defaultDraft);
  return (
    <>
      <EventMediaStep
        draft={draft}
        update={(next) => {
          setDraft((current) => ({ ...current, ...next }));
        }}
      />
      <output aria-label="Saved media">{JSON.stringify(draft.media)}</output>
    </>
  );
}
describe('event media editor', () => {
  it('adds and removes a gallery image', async () => {
    const NativeURL = URL;
    vi.stubGlobal(
      'URL',
      class extends NativeURL {
        static override createObjectURL() {
          return 'blob:test-gallery';
        }
      },
    );
    try {
      const user = userEvent.setup();
      render(<Editor />);
      await user.upload(
        screen.getByLabelText('Add gallery images'),
        new File(['image'], 'gallery.jpg', { type: 'image/jpeg' }),
      );
      expect(screen.getByLabelText('Saved media')).toHaveTextContent('gallery.jpg');
      await user.click(screen.getByRole('button', { name: 'Remove gallery image 1' }));
      expect(screen.getByLabelText('Saved media')).not.toHaveTextContent('gallery.jpg');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('adds, edits and removes a spotlight without requiring a link', async () => {
    const user = userEvent.setup();
    render(<Editor />);
    await user.click(screen.getByRole('button', { name: '+ Add spotlight' }));
    expect(screen.getByRole('button', { name: 'Save spotlight' })).toBeDisabled();
    await user.type(screen.getByLabelText('Title'), 'Artist One');
    await user.type(screen.getByLabelText('Description (optional)'), 'Live set');
    await user.click(screen.getByRole('button', { name: 'Save spotlight' }));
    expect(screen.getByLabelText('Saved media')).toHaveTextContent('Artist One');
    await user.click(screen.getByRole('button', { name: 'Edit spotlight Artist One' }));
    expect(screen.getByLabelText('Title')).toHaveValue('Artist One');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Remove spotlight Artist One' }));
    expect(screen.getByLabelText('Saved media')).not.toHaveTextContent('Artist One');
  });
  it('validates YouTube links and fails closed on restricted image galleries', () => {
    expect(
      validateEventMedia({
        media: { youtubeUrl: 'https://attacker.test/video', gallery: [], spotlights: [] },
      }),
    ).toEqual(['Use a valid HTTPS YouTube link.']);
    expect(
      validateEventMedia({
        visibilityMode: 'invited',
        media: {
          youtubeUrl: '',
          gallery: [{ type: 'image', value: 'https://example.test/photo.jpg' }],
          spotlights: [],
        },
      }),
    ).toHaveLength(1);
  });
});

it('offers eight title fonts and previews the selected family', async () => {
  const update = vi.fn();
  const draft = {
    ...createEmptyEventEditorData('host').defaultDraft,
    name: 'Night Shift',
    media: { youtubeUrl: '', gallery: [], spotlights: [], titleFont: 'eclectic' as const },
  };
  render(
    <>
      <EventBasicDetails
        draft={draft}
        data={createEmptyEventEditorData('host')}
        editMode={false}
        update={update}
        onArtistAdd={vi.fn()}
        onArtistRemove={vi.fn()}
        genrePickerOpen={false}
        onToggleGenres={vi.fn()}
      />
      <EventPreview
        draft={draft}
        venueName="Venue"
        artworkOptions={[]}
        canPreview={false}
        onArtwork={vi.fn()}
        onUpload={vi.fn()}
        onOpen={vi.fn()}
      />
    </>,
  );
  const group = screen.getByRole('group', { name: 'Event title font' });
  expect(group.querySelectorAll('button')).toHaveLength(8);
  expect(group.closest('section')).toContainElement(screen.getByLabelText('Event name'));
  expect(group.closest('aside')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Night Shift' })).toHaveAttribute(
    'data-title-font',
    'eclectic',
  );
  await userEvent.click(screen.getByRole('button', { name: 'Digital' }));
  expect(update).toHaveBeenCalledWith({ media: { ...draft.media, titleFont: 'digital' } });
});
