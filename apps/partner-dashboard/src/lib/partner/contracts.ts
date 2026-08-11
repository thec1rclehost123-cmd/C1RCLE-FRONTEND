export type PartnerRole = 'venue' | 'host' | 'promoter';
export type PartnershipStatus = 'partnered' | 'pending' | 'discover';
export type PromoterEventStatus = 'invited' | 'requested' | 'active' | 'paused' | 'completed' | 'declined';
export type PartnerEventStatus = 'draft' | 'scheduled' | 'on-sale' | 'sold-out' | 'live' | 'completed' | 'cancelled';
export type PartnerQueryState = 'loading' | 'loaded' | 'empty' | 'forbidden' | 'not-found' | 'network-error' | 'stale' | 'partial';
export type PartnerMutationState = 'idle' | 'confirming' | 'submitting' | 'succeeded' | 'failed';

export interface PartnerPermissions {
  readonly capabilities: readonly string[];
  readonly tabVisibility: Readonly<Record<string, boolean>>;
  readonly actionPermissions: Readonly<Record<string, boolean>>;
}

export interface PartnerMembershipSummary {
  readonly id: string;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly role: PartnerRole;
  readonly staffRole: 'owner' | 'admin' | 'manager' | 'staff' | 'promoter';
  readonly status: 'active' | 'suspended' | 'revoked';
  readonly permissions: PartnerPermissions;
}

export interface PartnerProfile {
  readonly id: string;
  readonly name: string;
  readonly handle: string;
  readonly city: string;
  readonly verified: boolean;
  readonly completion: number;
  readonly description: string;
  readonly categories: readonly string[];
}

export interface PartnerEventSummary {
  readonly id: string;
  readonly name: string;
  readonly date: string;
  readonly time: string;
  readonly venue: string;
  readonly host: string;
  readonly city: string;
  readonly status: PartnerEventStatus;
  readonly category: string;
  readonly ticketsSold: number;
  readonly capacity: number;
  readonly grossPaise: number;
  readonly checkIns: number;
  readonly accent: string;
}

export interface PartnerEventDetail extends PartnerEventSummary {
  readonly description: string;
  readonly ticketTiers: readonly {
    readonly id: string;
    readonly name: string;
    readonly pricePaise: number;
    readonly sold: number;
    readonly inventory: number;
  }[];
  readonly promoterCount: number;
  readonly salesTrend: readonly number[];
  readonly audienceCities: readonly { readonly label: string; readonly value: number }[];
  readonly attribution: readonly { readonly label: string; readonly clicks: number; readonly tickets: number }[];
}

export interface PartnerOrderSummary {
  readonly id: string;
  readonly eventId: string;
  readonly eventName: string;
  readonly createdAt: string;
  readonly ticketCount: number;
  readonly channel: string;
  readonly amountPaise: number;
  readonly status: 'confirmed' | 'refunded' | 'pending';
}

export interface PartnerPayout {
  readonly id: string;
  readonly createdAt: string;
  readonly amountPaise: number;
  readonly status: 'scheduled' | 'processing' | 'paid' | 'failed';
  readonly accountLabel: string;
}

export interface PartnerFinanceSummary {
  readonly availablePaise: number;
  readonly pendingPaise: number;
  readonly lifetimePaise: number;
  readonly nextPayout: string;
  readonly payoutAccount: string;
  readonly payouts: readonly PartnerPayout[];
}

export interface PartnerRelationship {
  readonly id: string;
  readonly kind: PartnerRole;
  readonly name: string;
  readonly city: string;
  readonly verified: boolean;
  readonly status: PartnershipStatus;
  readonly eventsTogether: number;
  readonly responseTime: string;
  readonly categories: readonly string[];
}

export interface PartnerNotification {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly createdAt: string;
  readonly read: boolean;
  readonly href?: string;
}

export interface PartnerAnalyticsSummary {
  readonly ticketsSold: number;
  readonly grossPaise: number;
  readonly conversion: number;
  readonly checkInRate: number;
  readonly salesTrend: readonly number[];
}

export interface EventDiscoveryFilters {
  readonly query?: string;
  readonly city?: string;
  readonly category?: string;
  readonly date?: string;
  readonly commissionModel?: string;
  readonly venueId?: string;
  readonly hostId?: string;
}

export interface CreateTrackingLinkInput {
  readonly eventId: string;
  readonly channel: string;
  readonly label?: string;
}

export interface PartnerRepository {
  getOrganizations(): Promise<readonly PartnerOrganizationSummary[]>;
  getEvent(eventId: string): Promise<PartnerEventDetail | null>;
  getEventAnalytics(eventId: string): Promise<PartnerAnalyticsSummary | null>;
}

export interface HostOverview {
  readonly profile: PartnerProfile;
  readonly nextEvent: PartnerEventSummary | null;
  readonly recentOrders: readonly PartnerOrderSummary[];
  readonly performance: readonly number[];
  readonly calendar: readonly { readonly date: string; readonly label: string; readonly type: 'event' | 'deadline' | 'payout' }[];
}

export interface HostRepository extends PartnerRepository {
  getOverview(): Promise<HostOverview>;
  getEvents(): Promise<readonly PartnerEventSummary[]>;
  getPartners(): Promise<readonly PartnerRelationship[]>;
  getFinance(): Promise<PartnerFinanceSummary>;
  getProfile(): Promise<PartnerProfile>;
}

export interface PartnerOrganizationSummary {
  readonly id: string;
  readonly role: PartnerRole;
  readonly name: string;
  readonly verified: boolean;
}

export interface PromoterProfile {
  readonly id: string;
  readonly name: string;
  readonly handle: string;
  readonly bio: string;
  readonly city: string;
  readonly verified: boolean;
  readonly completion: number;
  readonly categories: readonly string[];
  readonly followers: number;
  readonly eventsPromoted: number;
}

export interface PromoterNetworkProfileData {
  readonly profile: PromoterProfile;
  readonly stats: {
    readonly ticketsMoved: number;
    readonly trackedConversion: number;
    readonly eventsPromoted: number;
    readonly audienceReach: number;
    readonly repeatPartners: number;
    readonly typicalResponse: string;
  };
  readonly recentCollaborators: readonly {
    readonly id: string;
    readonly kind: 'venue' | 'host';
    readonly name: string;
    readonly eventsTogether: number;
  }[];
}

export interface PromoterEvent {
  readonly id: string;
  readonly name: string;
  readonly date: string;
  readonly time: string;
  readonly venue: string;
  readonly host: string;
  readonly city: string;
  readonly status: PromoterEventStatus;
  readonly category: string;
  readonly commissionLabel: string;
  readonly clicks: number;
  readonly tickets: number;
  readonly earningsPaise: number;
  readonly conversion: number;
  readonly accent: string;
}

export interface PromoterOrder {
  readonly id: string;
  readonly eventName: string;
  readonly createdAt: string;
  readonly ticketCount: number;
  readonly channel: string;
  readonly commissionPaise: number;
  readonly status: 'confirmed' | 'refunded' | 'pending';
}

export interface PromoterPartner {
  readonly id: string;
  readonly kind: 'venue' | 'host';
  readonly name: string;
  readonly city: string;
  readonly category: string;
  readonly verified: boolean;
  readonly status: PartnershipStatus;
  readonly eventsTogether: number;
  readonly responseTime: string;
  readonly accent: string;
}

export interface PromoterFinanceSummary {
  readonly availablePaise: number;
  readonly pendingPaise: number;
  readonly lifetimePaise: number;
  readonly nextPayout: string;
  readonly payoutAccount: string;
  readonly kycStatus: 'verified' | 'pending' | 'required';
  readonly payouts: readonly {
    readonly id: string;
    readonly date: string;
    readonly amountPaise: number;
    readonly status: 'scheduled' | 'processing' | 'paid' | 'failed';
  }[];
  readonly adjustments: readonly {
    readonly id: string;
    readonly eventName: string;
    readonly label: string;
    readonly amountPaise: number;
    readonly date: string;
  }[];
}

export interface PromoterTrackingLink {
  readonly id: string;
  readonly eventId: string;
  readonly eventName: string;
  readonly channel: string;
  readonly label: string;
  readonly shortUrl: string;
  readonly status: 'active' | 'paused' | 'expired';
  readonly clicks: number;
  readonly purchases: number;
  readonly earningsPaise: number;
}

export interface PromoterOverview {
  readonly profile: PromoterProfile;
  readonly nextEvent: PromoterEvent | null;
  readonly recentOrders: readonly PromoterOrder[];
  readonly performance: readonly number[];
  readonly calendar: readonly { date: string; label: string; type: 'event' | 'deadline' | 'payout' }[];
}

export interface PromoterRepository {
  getOverview(): Promise<PromoterOverview>;
  getLinkedEvents(): Promise<readonly PromoterEvent[]>;
  discoverEvents(filters?: EventDiscoveryFilters): Promise<readonly PromoterEvent[]>;
  getPartners(): Promise<readonly PromoterPartner[]>;
  getFinance(): Promise<PromoterFinanceSummary>;
  getLinks(): Promise<readonly PromoterTrackingLink[]>;
  getProfile(): Promise<PromoterProfile>;
  getNetworkProfile(): Promise<PromoterNetworkProfileData>;
  createTrackingLink(input: CreateTrackingLinkInput): Promise<PromoterTrackingLink>;
}

export const formatInr = (paise: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
