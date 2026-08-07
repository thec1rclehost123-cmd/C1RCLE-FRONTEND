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
