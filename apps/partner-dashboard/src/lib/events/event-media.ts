import type { EventEditorDraft } from '@/data/partner-data-source';

export function validateEventMedia(
  draft: Pick<EventEditorDraft, 'media' | 'visibilityMode'>,
): string[] {
  const media = draft.media;
  if (!media) return [];
  const errors: string[] = [];
  const https = (value: string) => {
    try {
      return new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  };
  if (media.youtubeUrl) {
    try {
      const url = new URL(media.youtubeUrl);
      if (
        url.protocol !== 'https:' ||
        !['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname)
      )
        errors.push('Use a valid HTTPS YouTube link.');
    } catch {
      errors.push('Use a valid HTTPS YouTube link.');
    }
  }
  if (media.gallery.length > 10) errors.push('Add up to 10 gallery images.');
  if (media.spotlights.length > 12) errors.push('Add up to 12 spotlights.');
  for (const feature of media.spotlights) {
    if (!feature.title.trim()) errors.push('Add a title to every spotlight.');
    if (feature.link && !https(feature.link)) errors.push('Spotlight links must use HTTPS.');
    if (feature.description.length > 350)
      errors.push('Spotlight descriptions must be 350 characters or fewer.');
  }
  const images = [
    ...media.gallery,
    ...media.spotlights.flatMap((feature) => (feature.artwork ? [feature.artwork] : [])),
  ];
  for (const image of images) {
    if (
      image.file &&
      (!['image/jpeg', 'image/png', 'image/webp'].includes(image.file.type) ||
        image.file.size > 5 * 1024 * 1024)
    )
      errors.push('Use JPG, PNG or WebP images up to 5 MB.');
  }
  if ((draft.visibilityMode === 'code' || draft.visibilityMode === 'invited') && images.length)
    errors.push(
      'Gallery and spotlight images are currently available for public or unlisted events only.',
    );
  return [...new Set(errors)];
}
