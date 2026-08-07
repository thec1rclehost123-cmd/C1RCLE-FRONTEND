export type PartnerType = 'venue' | 'host' | 'promoter' | 'club';
export type StaffRole = 'owner' | 'admin' | 'manager' | 'staff' | 'promoter';

export interface PartnerMembership {
  uid: string;
  partnerId: string;
  partnerType: PartnerType;
  role: StaffRole;
  joinedAt?: number | undefined;
  isActive?: boolean | undefined;
  partnerName?: string | undefined;
  membershipId?: string | undefined;
}

export interface DashboardProfile {
  uid: string;
  email: string;
  displayName: string;
  activeMembership?: PartnerMembership | null | undefined;
  mustChangePassword?: boolean | undefined;
}
