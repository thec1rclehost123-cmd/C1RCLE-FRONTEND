import type { PartnerEventArtwork, SlotRequest } from '@/data/partner-data-source';

export function slotRequestArtwork(request: SlotRequest): PartnerEventArtwork {
  if (request.event.imageUrl) {
    return { type: 'image', value: request.event.imageUrl, alt: request.event.name };
  }

  return {
    type: 'gradient',
    value: request.id.includes('retro')
      ? 'mystery'
      : request.id.includes('sunday')
        ? 'sunset'
        : 'eclipse',
  };
}
