import { venueFinanceModel } from './venue-finance-model';
import { venueStaff } from './venue-partners-model';

export const venueSettingsSource = {
  profile: {
    name: 'Skyline Rooftop',
    type: 'Nightclub',
    capacity: 400,
    address: 'Bandra West, Mumbai',
    phone: '+91 99876 54321',
    publicEmail: 'hello@skylinerooftop.in',
    instagram: '@skylinerooftop',
    logoText: 'SKYLINE\nROOFTOP',
  },
  payoutAccount: venueFinanceModel.bank,
  nextPayout: venueFinanceModel.nextPayout,
  staff: venueStaff,
  security: {
    passwordLastChanged: null as string | null,
    twoStepEnabled: null as boolean | null,
    activeSessions: null as number | null,
    lastSignIn: null as string | null,
  },
} as const;

export interface VenueSettingsPermissions {
  readonly canManageVenue: boolean;
  readonly canChangePayoutAccount: boolean;
  readonly canManageTeam: boolean;
  readonly canManageSecurity: boolean;
}

export const resolveVenueSettingsPermissions = (
  canDo: (action: string) => boolean,
): VenueSettingsPermissions => ({
  canManageVenue: canDo('canManageSettings'),
  canChangePayoutAccount: canDo('canManageFinance'),
  canManageTeam: canDo('canManageStaff'),
  canManageSecurity: canDo('canManageSecurity'),
});
