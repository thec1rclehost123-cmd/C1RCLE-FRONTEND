import type { ComponentType } from 'react';

export type StudioRole = 'venue' | 'host' | 'promoter';

export type StudioIconName =
  | 'dashboard'
  | 'events'
  | 'requests'
  | 'partners'
  | 'marketing'
  | 'finance'
  | 'guests'
  | 'analytics'
  | 'leaderboard'
  | 'settings';

export interface StudioNavigationItem {
  readonly label: string;
  readonly href: string;
  readonly icon: StudioIconName;
}

export interface StudioConfig {
  readonly role: StudioRole;
  readonly label: string;
  readonly description: string;
  readonly navigation: readonly StudioNavigationItem[];
}

const studioPath = (role: StudioRole, segment: string): string => `/partner/${role}/${segment}`;

export const STUDIO_CONFIG: Readonly<Record<StudioRole, StudioConfig>> = {
  venue: {
    role: 'venue',
    label: 'Venue Studio',
    description: 'Operate your venue, events, partners and guest experience.',
    navigation: [
      { label: 'Overview', href: studioPath('venue', 'overview'), icon: 'dashboard' },
      { label: 'Events', href: studioPath('venue', 'events'), icon: 'events' },
      { label: 'Slot requests', href: studioPath('venue', 'slot-requests'), icon: 'requests' },
      { label: 'Partners', href: studioPath('venue', 'partners'), icon: 'partners' },
      { label: 'Marketing', href: studioPath('venue', 'marketing'), icon: 'marketing' },
      { label: 'Finance', href: studioPath('venue', 'finance'), icon: 'finance' },
      { label: 'Settings', href: studioPath('venue', 'settings'), icon: 'settings' },
    ],
  },
  host: {
    role: 'host',
    label: 'Host Studio',
    description: 'Build experiences with partnered venues and teams.',
    navigation: [
      { label: 'Overview', href: studioPath('host', 'overview'), icon: 'dashboard' },
      { label: 'Events', href: studioPath('host', 'events'), icon: 'events' },
      { label: 'Slot requests', href: studioPath('host', 'slot-requests'), icon: 'requests' },
      { label: 'Partners', href: studioPath('host', 'partners'), icon: 'partners' },
      { label: 'Marketing', href: studioPath('host', 'marketing'), icon: 'marketing' },
      { label: 'Finance', href: studioPath('host', 'finance'), icon: 'finance' },
      { label: 'Settings', href: studioPath('host', 'settings'), icon: 'settings' },
    ],
  },
  promoter: {
    role: 'promoter',
    label: 'Promoter Studio',
    description: 'Track opportunities, guests, links and commissions.',
    navigation: [
      { label: 'Overview', href: studioPath('promoter', 'overview'), icon: 'dashboard' },
      { label: 'Events', href: studioPath('promoter', 'events'), icon: 'events' },
      { label: 'Guests', href: studioPath('promoter', 'guests'), icon: 'guests' },
      { label: 'Analytics', href: studioPath('promoter', 'analytics'), icon: 'analytics' },
      { label: 'Finance', href: studioPath('promoter', 'finance'), icon: 'finance' },
      { label: 'Partners', href: studioPath('promoter', 'partners'), icon: 'partners' },
      { label: 'Leaderboard', href: studioPath('promoter', 'leaderboard'), icon: 'leaderboard' },
    ],
  },
};

export const isStudioRole = (value: string): value is StudioRole =>
  value === 'venue' || value === 'host' || value === 'promoter';

export const getStudioConfig = (role: StudioRole): StudioConfig => STUDIO_CONFIG[role];

export type IconComponent = ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
