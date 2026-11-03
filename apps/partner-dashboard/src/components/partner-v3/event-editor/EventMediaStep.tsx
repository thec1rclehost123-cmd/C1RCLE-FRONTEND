import Image from 'next/image';
import { useState } from 'react';

import { validateEventMedia } from '@/lib/events/event-media';

import styles from './event-editor.module.css';

import type {
  EventEditorDraft,
  EventEditorMediaDraft,
  PartnerEventArtwork,
} from '@/data/partner-data-source';

type Spotlight = EventEditorMediaDraft['spotlights'][number];
export function EventMediaStep({
  draft,
  update,
}: {
  readonly draft: EventEditorDraft;
  readonly update: (next: Partial<EventEditorDraft>) => void;
}) {
  const media = draft.media ?? { youtubeUrl: '', gallery: [], spotlights: [] };
  const [editing, setEditing] = useState<Spotlight | null>(null);
  const [error, setError] = useState('');
  const change = (values: Partial<EventEditorMediaDraft>) => {
    update({ media: { ...media, ...values } });
  };
  const artwork = (file: File): PartnerEventArtwork | null => {
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError('Use JPG, PNG or WebP images up to 5 MB.');
      return null;
    }
    setError('');
    return { type: 'image', value: URL.createObjectURL(file), alt: file.name, file };
  };
  return (
    <section className={styles['mediaStep']} aria-labelledby="media-heading">
      <h2 id="media-heading">Media</h2>
      <label className={styles['mediaField']}>
        YouTube video (optional)
        <input
          type="url"
          placeholder="https://www.youtube.com/watch?v=…"
          value={media.youtubeUrl}
          onChange={(event) => {
            change({ youtubeUrl: event.target.value });
          }}
        />
      </label>
      <div className={styles['promoHeading']}>
        <h3>Image gallery</h3>
        <label className={styles['mediaUpload']}>
          + Add images
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            aria-label="Add gallery images"
            disabled={media.gallery.length >= 10}
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              const images = files
                .map(artwork)
                .filter((image): image is PartnerEventArtwork => image !== null);
              if (media.gallery.length + images.length > 10) {
                setError('Add up to 10 gallery images.');
                return;
              }
              change({ gallery: [...media.gallery, ...images] });
              event.target.value = '';
            }}
          />
        </label>
      </div>
      <div className={styles['mediaGallery']}>
        {media.gallery.map((image, index) => (
          <div key={image.value}>
            {image.type === 'image' ? (
              <Image src={image.value} alt={image.alt ?? ''} width={200} height={160} unoptimized />
            ) : null}
            <button
              type="button"
              aria-label={`Remove gallery image ${String(index + 1)}`}
              onClick={() => {
                change({ gallery: media.gallery.filter((_, position) => position !== index) });
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className={styles['promoHeading']}>
        <h3>Artist & sponsor spotlights</h3>
        <button
          type="button"
          className={styles['outlineButton']}
          disabled={media.spotlights.length >= 12}
          onClick={() => {
            setEditing({
              id: crypto.randomUUID(),
              title: '',
              link: '',
              description: '',
              startTime: '',
              endTime: '',
            });
          }}
        >
          + Add spotlight
        </button>
      </div>
      {media.spotlights.map((feature) => (
        <div className={styles['compactTierRow']} key={feature.id}>
          <div>
            <strong>{feature.title}</strong>
            <span>{feature.description}</span>
          </div>
          <div className={styles['tierActions']}>
            <button
              type="button"
              className={styles['tierEdit']}
              aria-label={`Edit spotlight ${feature.title}`}
              onClick={() => {
                setEditing(feature);
              }}
            >
              ✎
            </button>
            <button
              type="button"
              className={styles['tierEdit']}
              aria-label={`Remove spotlight ${feature.title}`}
              onClick={() => {
                change({ spotlights: media.spotlights.filter((item) => item.id !== feature.id) });
              }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
      {error ? <p role="alert">{error}</p> : null}
      {editing ? (
        <dialog
          className={styles['tierDialog']}
          aria-label="Edit spotlight"
          ref={(node) => {
            if (node && !node.open) node.showModal();
          }}
          onCancel={() => {
            setEditing(null);
          }}
        >
          <div className={styles['tierDialogHeader']}>
            <h2>Spotlight</h2>
            <button
              type="button"
              aria-label="Close spotlight"
              onClick={() => {
                setEditing(null);
              }}
            >
              ×
            </button>
          </div>
          <div className={styles['spotlightFields']}>
            <label>
              Title
              <input
                value={editing.title}
                maxLength={120}
                onChange={(event) => {
                  setEditing({ ...editing, title: event.target.value });
                }}
              />
            </label>
            <label>
              Link (optional)
              <input
                type="url"
                value={editing.link}
                onChange={(event) => {
                  setEditing({ ...editing, link: event.target.value });
                }}
              />
            </label>
            <label className={styles['mediaUpload']}>
              Upload image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Spotlight image"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    const image = artwork(file);
                    if (image) setEditing({ ...editing, artwork: image });
                  }
                }}
              />
            </label>
            {editing.artwork?.type === 'image' ? (
              <div className={styles['spotlightImage']}>
                <Image
                  src={editing.artwork.value}
                  alt={editing.title}
                  width={140}
                  height={140}
                  unoptimized
                />
                <button
                  type="button"
                  className={styles['outlineButton']}
                  onClick={() => {
                    const { artwork: _image, ...rest } = editing;
                    setEditing(rest);
                  }}
                >
                  Remove image
                </button>
              </div>
            ) : null}
            <div className={styles['promoFields']}>
              <label>
                Start time (IST)
                <input
                  type="time"
                  value={editing.startTime}
                  onChange={(event) => {
                    setEditing({ ...editing, startTime: event.target.value });
                  }}
                />
              </label>
              <label>
                End time (IST)
                <input
                  type="time"
                  value={editing.endTime}
                  onChange={(event) => {
                    setEditing({ ...editing, endTime: event.target.value });
                  }}
                />
              </label>
            </div>
            <label>
              Description (optional)
              <textarea
                rows={3}
                maxLength={350}
                value={editing.description}
                onChange={(event) => {
                  setEditing({ ...editing, description: event.target.value });
                }}
              />
            </label>
          </div>
          <div className={styles['tierDialogFooter']}>
            <button
              type="button"
              className={styles['outlineButton']}
              onClick={() => {
                setEditing(null);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={
                validateEventMedia({ media: { ...media, spotlights: [editing] } }).length > 0
              }
              onClick={() => {
                change({
                  spotlights: media.spotlights.some((item) => item.id === editing.id)
                    ? media.spotlights.map((item) => (item.id === editing.id ? editing : item))
                    : [...media.spotlights, editing],
                });
                setEditing(null);
              }}
            >
              Save spotlight
            </button>
          </div>
        </dialog>
      ) : null}
    </section>
  );
}
