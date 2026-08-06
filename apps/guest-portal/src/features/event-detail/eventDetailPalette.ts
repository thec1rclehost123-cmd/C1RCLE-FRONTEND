import type { EventAccentTone, EventGuestTone } from './types/event-detail.types';

const accentClasses = {
  pink: {
    backdrop: 'bg-[radial-gradient(circle_at_50%_12%,rgb(211_91_151/0.42),transparent_48%)]',
    border: 'border-[#d35b97]/30',
    borderStrong: 'border-[#d35b97]/45',
    panel: 'bg-[#d35b97]/15 shadow-[inset_0_0_34px_rgb(211_91_151/0.08)]',
    panelShadow: 'shadow-[inset_0_0_34px_rgb(211_91_151/0.08)]',
    posterShadow: 'shadow-[0_24px_80px_rgb(0_0_0/0.55),inset_0_0_36px_rgb(211_91_151/0.1)]',
    selected: 'border-[#d35b97]/55 bg-[#d35b97]/15',
    solid: 'bg-[#d35b97]',
    stickyShadow: 'shadow-[0_16px_60px_rgb(0_0_0/0.65),0_0_40px_rgb(211_91_151/0.15)]',
    text: 'text-[#d35b97]',
  },
  purple: {
    backdrop: 'bg-[radial-gradient(circle_at_50%_12%,rgb(158_118_186/0.42),transparent_48%)]',
    border: 'border-[#9e76ba]/30',
    borderStrong: 'border-[#9e76ba]/45',
    panel: 'bg-[#9e76ba]/15 shadow-[inset_0_0_34px_rgb(158_118_186/0.08)]',
    panelShadow: 'shadow-[inset_0_0_34px_rgb(158_118_186/0.08)]',
    posterShadow: 'shadow-[0_24px_80px_rgb(0_0_0/0.55),inset_0_0_36px_rgb(158_118_186/0.1)]',
    selected: 'border-[#9e76ba]/55 bg-[#9e76ba]/15',
    solid: 'bg-[#9e76ba]',
    stickyShadow: 'shadow-[0_16px_60px_rgb(0_0_0/0.65),0_0_40px_rgb(158_118_186/0.15)]',
    text: 'text-[#9e76ba]',
  },
  red: {
    backdrop: 'bg-[radial-gradient(circle_at_50%_12%,rgb(232_25_28/0.42),transparent_48%)]',
    border: 'border-[#e8191c]/30',
    borderStrong: 'border-[#e8191c]/45',
    panel: 'bg-[#e8191c]/15 shadow-[inset_0_0_34px_rgb(232_25_28/0.08)]',
    panelShadow: 'shadow-[inset_0_0_34px_rgb(232_25_28/0.08)]',
    posterShadow: 'shadow-[0_24px_80px_rgb(0_0_0/0.55),inset_0_0_36px_rgb(232_25_28/0.1)]',
    selected: 'border-[#e8191c]/55 bg-[#e8191c]/15',
    solid: 'bg-[#e8191c]',
    stickyShadow: 'shadow-[0_16px_60px_rgb(0_0_0/0.65),0_0_40px_rgb(232_25_28/0.15)]',
    text: 'text-[#e8191c]',
  },
  orange: {
    backdrop: 'bg-[radial-gradient(circle_at_50%_12%,rgb(239_77_28/0.42),transparent_48%)]',
    border: 'border-[#ef4d1c]/30',
    borderStrong: 'border-[#ef4d1c]/45',
    panel: 'bg-[#ef4d1c]/15 shadow-[inset_0_0_34px_rgb(239_77_28/0.08)]',
    panelShadow: 'shadow-[inset_0_0_34px_rgb(239_77_28/0.08)]',
    posterShadow: 'shadow-[0_24px_80px_rgb(0_0_0/0.55),inset_0_0_36px_rgb(239_77_28/0.1)]',
    selected: 'border-[#ef4d1c]/55 bg-[#ef4d1c]/15',
    solid: 'bg-[#ef4d1c]',
    stickyShadow: 'shadow-[0_16px_60px_rgb(0_0_0/0.65),0_0_40px_rgb(239_77_28/0.15)]',
    text: 'text-[#ef4d1c]',
  },
} as const;

const guestToneClasses: Record<EventGuestTone, string> = {
  yellow: 'bg-yellow-400',
  red: 'bg-rose-500',
  purple: 'bg-purple-500',
};

export function getEventAccentClasses(tone: EventAccentTone) {
  return accentClasses[tone];
}

export function getGuestToneClass(tone: EventGuestTone) {
  return guestToneClasses[tone];
}
