import type { PartnerNavigationItem } from './types';

/**
 * The authenticated shell needs labels and destinations only. Keeping this
 * compact index separate prevents event orders, finance, partner, and profile
 * fixtures from entering the globally mounted client shell.
 */
export const promoterShellSearchItems: readonly PartnerNavigationItem[] = [
  {
    label: 'Neon Nights: Afrobeats',
    href: '/promoter/events/neon-nights-afrobeats',
    icon: 'calendar-days',
    match: 'exact',
  },
  {
    label: 'Sunset Sessions Vol. 4',
    href: '/promoter/events/sunset-sessions',
    icon: 'calendar-days',
    match: 'exact',
  },
  {
    label: 'Warehouse Rave',
    href: '/promoter/events/warehouse-rave',
    icon: 'calendar-days',
    match: 'exact',
  },
  {
    label: 'Skyline Rooftop',
    href: '/promoter/partners/venues/skyline-rooftop',
    icon: 'users',
    match: 'exact',
  },
  {
    label: 'District Warehouse',
    href: '/promoter/partners/venues/district-warehouse',
    icon: 'users',
    match: 'exact',
  },
  {
    label: 'Rhea Kapoor',
    href: '/promoter/partners/hosts/rhea-kapoor',
    icon: 'users',
    match: 'exact',
  },
  {
    label: 'Arjun Mehta',
    href: '/promoter/partners/hosts/arjun-mehta',
    icon: 'users',
    match: 'exact',
  },
  {
    label: 'Neon Nights: Afrobeats link',
    href: '/promoter/links/lnk-neon',
    icon: 'link',
    match: 'exact',
  },
  {
    label: 'Warehouse Rave link',
    href: '/promoter/links/lnk-warehouse',
    icon: 'link',
    match: 'exact',
  },
];
