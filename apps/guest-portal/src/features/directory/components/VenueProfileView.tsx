import { ExperienceVenueProfile } from './ExperienceVenueProfile';
import { RestaurantVenueProfile } from './RestaurantVenueProfile';

import type { VenuePublicProfile } from '../types/directory.types';

export function VenueProfileView({ venue }: { venue: VenuePublicProfile }) {
  if (venue.template === 'restaurant-venue') {
    return <RestaurantVenueProfile profile={venue} />;
  }

  return <ExperienceVenueProfile profile={venue} />;
}
