export interface DirectoryEventSummary {
  id: string;
  slug: string;
  title: string;
  image: string;
  startsAt: string;
  category: string;
  city: string;
  venue: string;
  venueId: string;
}

export interface HostDirectoryProfile {
  id: string;
  name: string;
  initials: string;
  verified: boolean;
  role: string;
  city: string;
  neighborhood: string;
  handle: string;
  tagline: string;
  bio: string;
  tags: readonly string[];
  coverImage: string;
  events: readonly DirectoryEventSummary[];
}

export interface VenueDirectoryProfile {
  id: string;
  name: string;
  initials: string;
  city: string;
  address: string;
  summary: string;
  knownFor: readonly string[];
  coverImage: string;
  events: readonly DirectoryEventSummary[];
}

export type PublicProfileTemplate = 'restaurant-venue' | 'experience-venue' | 'host';
export type PublicProfileEntityType = 'venue' | 'host';
export type PublicProfileActionTone = 'primary' | 'secondary' | 'quiet';

export interface PublicProfileTheme {
  accent: string;
  accentSoft: string;
  accentText: string;
  displayStyle: 'editorial' | 'bold';
}

export interface PublicProfileMedia {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  focalPoint?: string;
}

export interface PublicProfileAction {
  id: string;
  label: string;
  href?: string;
  tone: PublicProfileActionTone;
  external?: boolean;
  disabled?: boolean;
}

export interface PublicProfileHero {
  eyebrow: string;
  title: string;
  subtitle: string;
  locationLabel: string;
  cover: PublicProfileMedia;
  avatar?: PublicProfileMedia;
  verified?: boolean;
  statusLabel?: string;
}

export interface PublicProfileContact {
  address?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  website?: string;
  mapsHref?: string;
}

export interface PublicProfileBase {
  id: string;
  entityType: PublicProfileEntityType;
  template: PublicProfileTemplate;
  theme: PublicProfileTheme;
  hero: PublicProfileHero;
  actions: readonly PublicProfileAction[];
  contact: PublicProfileContact;
  tags: readonly string[];
  events: readonly DirectoryEventSummary[];
}

export interface RestaurantHoursEntry {
  day: string;
  hours: string;
}

export interface RestaurantMenuItem {
  id: string;
  name: string;
  description: string;
  priceLabel?: string;
  image?: PublicProfileMedia;
}

export interface RestaurantVenuePublicProfile extends PublicProfileBase {
  entityType: 'venue';
  template: 'restaurant-venue';
  story: {
    eyebrow: string;
    headline: string;
    body: readonly string[];
  };
  cuisine: readonly string[];
  hours: readonly RestaurantHoursEntry[];
  menu: readonly RestaurantMenuItem[];
  gallery: readonly PublicProfileMedia[];
  reservationNote: string;
}

export interface ExperienceSpace {
  id: string;
  name: string;
  description: string;
  meta: string;
}

export interface ExperienceVenuePublicProfile extends PublicProfileBase {
  entityType: 'venue';
  template: 'experience-venue';
  summary: string;
  capacityLabel: string;
  formats: readonly string[];
  amenities: readonly string[];
  spaces: readonly ExperienceSpace[];
  gallery: readonly PublicProfileMedia[];
  policyNote: string;
  collaboratorHostIds: readonly string[];
}

export interface HostPrompt {
  id: string;
  prompt: string;
  answer: string;
  image?: PublicProfileMedia;
}

export interface HostSeries {
  id: string;
  name: string;
  description: string;
  venueLabel: string;
  image: PublicProfileMedia;
}

export interface HostPublicProfile extends PublicProfileBase {
  entityType: 'host';
  template: 'host';
  handle: string;
  role: string;
  bio: string;
  prompts: readonly HostPrompt[];
  gallery: readonly PublicProfileMedia[];
  series: readonly HostSeries[];
}

export type VenuePublicProfile = RestaurantVenuePublicProfile | ExperienceVenuePublicProfile;

export type PublicProfile = VenuePublicProfile | HostPublicProfile;
