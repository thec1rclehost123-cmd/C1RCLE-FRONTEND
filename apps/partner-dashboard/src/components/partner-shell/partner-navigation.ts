import type { PartnerNavigationItem } from './types';

export const isPartnerNavigationItemActive = (
  pathname: string,
  item: PartnerNavigationItem,
): boolean =>
  item.match === 'prefix'
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : pathname === item.href;
