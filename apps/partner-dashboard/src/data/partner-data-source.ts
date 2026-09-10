import type { StudioRole } from '@/studios/studio-config';

export interface StudioShellData {
  readonly role: StudioRole;
  readonly displayName: string;
  readonly dataStatus: 'fixture' | 'api' | 'unavailable';
}

export type OverviewAccent = 'orange' | 'lavender';
export type OverviewActivityTone = 'positive' | 'neutral' | 'negative';
export type OverviewTrendMetric = 'tickets' | 'revenue' | 'clicks';
export type OverviewTrendRange = '1D' | '1W' | '1M' | 'All';

export interface OverviewEvent {
  readonly id: string;
  readonly name: string;
  readonly venue: string;
  readonly dateLabel: string;
  readonly timeLabel: string;
  readonly href: string;
  readonly imageSrc?: string;
  readonly imageAlt?: string;
  readonly status: 'live' | 'draft' | 'past';
  readonly sold: number;
  readonly capacity: number;
}

export interface OverviewTrendSeries {
  readonly metric: OverviewTrendMetric;
  readonly range: OverviewTrendRange;
  readonly value: string;
  readonly delta: string;
  readonly caption: string;
  readonly points: readonly number[];
}

export interface OverviewActivity {
  readonly id: string;
  readonly kind: 'ticket' | 'payout' | 'refund' | 'table';
  readonly name: string;
  readonly meta: string;
  readonly amount: string;
  readonly tone: OverviewActivityTone;
}

export interface OverviewCalendarDay {
  readonly day: number;
  readonly eventCount?: number;
  readonly isToday?: boolean;
}

export interface OverviewNetworkMember {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly initials: string;
  readonly status: 'Partnered' | 'Invite sent' | 'Active';
  readonly statusTone: 'accent' | 'success' | 'neutral';
  readonly accent: 'orange' | 'violet' | 'teal' | 'pink';
}

export interface OverviewData {
  readonly dataStatus: 'fixture';
  readonly todayLabel: string;
  readonly greeting: string;
  readonly nextEvent: OverviewEvent & { readonly doorsLabel: string };
  readonly trends: readonly OverviewTrendSeries[];
  readonly recentActivity: readonly OverviewActivity[];
  readonly calendar: {
    readonly monthLabel: string;
    readonly firstDayOffset: number;
    readonly days: readonly OverviewCalendarDay[];
  };
  readonly upcomingEvents: readonly OverviewEvent[];
  readonly network: readonly OverviewNetworkMember[];
}

export interface OverviewLinks {
  readonly createEvent: string;
  readonly calendar: string;
  readonly events: string;
  readonly finance: string;
  readonly partners: string;
}

export interface PromoterOverviewOrder {
  readonly id: string;
  readonly name: string;
  readonly event: string;
  readonly when: string;
  readonly amount: string;
  readonly initials: string;
}

export interface PromoterOverviewEvent {
  readonly id: string;
  readonly name: string;
  readonly venue: string;
  readonly href: string;
  readonly clicks: number;
  readonly sales: number;
}

export interface PromoterOverviewActivity {
  readonly id: string;
  readonly title: string;
  readonly meta: string;
  readonly time: string;
}

export interface PromoterOverviewData {
  readonly dataStatus: 'fixture';
  readonly totalClicks: number;
  readonly trends: readonly OverviewTrendSeries[];
  readonly latestOrders: readonly PromoterOverviewOrder[];
  readonly upcomingEvents: readonly PromoterOverviewEvent[];
  readonly activity: readonly PromoterOverviewActivity[];
}

export interface PromoterOverviewLinks {
  readonly events: string;
  readonly guests: string;
  readonly analytics: string;
  readonly finance: string;
}

export type PartnerEventStatus = 'Live' | 'Draft' | 'Past' | 'Cancelled';
export type PartnerEventParty = 'venue' | 'hosts';

export interface PartnerEventArtwork {
  readonly type: 'image' | 'gradient';
  readonly value: string;
  readonly alt?: string;
}

export interface PartnerEventRecord {
  readonly id: string;
  readonly name: string;
  readonly tag: string;
  readonly status: PartnerEventStatus;
  readonly party: PartnerEventParty;
  readonly venue: string;
  readonly host: string;
  readonly hostInitials: string;
  readonly dateLabel: string;
  readonly timeLabel: string;
  readonly dayLabel: string;
  readonly monthLabel: string;
  readonly priceLabel: string;
  readonly sold: number;
  readonly capacity: number;
  readonly revenueLabel: string;
  readonly artwork: PartnerEventArtwork;
}

export interface PartnerEventsData {
  readonly dataStatus: 'fixture';
  readonly pendingRequestCount: number;
  readonly events: readonly PartnerEventRecord[];
}

export type VenueEventsData = PartnerEventsData;
export type HostEventsData = PartnerEventsData;

export type EventDetailMetricTone = 'default' | 'success';

export interface EventDetailMetric {
  readonly label: string;
  readonly value: string;
  readonly suffix?: string;
  readonly tone?: EventDetailMetricTone;
}

export interface EventDetailTierSummary {
  readonly name: string;
  readonly count: string;
  readonly money: string;
  readonly fillPercent: number;
  readonly accent: 'orange' | 'violet' | 'teal';
}

export type EventSalesTone =
  'orange' | 'violet' | 'lavender' | 'teal' | 'pink' | 'yellow' | 'green' | 'red' | 'muted';

export interface EventSalesFunnelStat {
  readonly label: string;
  readonly value: string;
  readonly tone: EventSalesTone;
}

export interface EventSalesFunnelStep {
  readonly label: string;
  readonly count: string;
  readonly fillPercent: number;
  readonly tone: EventSalesTone;
}

export interface EventSalesRevenueRow {
  readonly label: string;
  readonly value: string;
  readonly tone: EventSalesTone;
}

export interface EventSalesGenderSegment {
  readonly label: string;
  readonly percent: number;
  readonly tone: EventSalesTone;
  readonly dashArray: string;
  readonly dashOffset: number;
}

export interface EventSalesAgeBracket {
  readonly label: string;
  readonly percent: string;
  readonly count: string;
  readonly fillPercent: number;
  readonly tone: EventSalesTone;
}

export interface EventSalesCrowdSegment {
  readonly label: string;
  readonly value: string;
  readonly sub: string;
  readonly tone: EventSalesTone;
}

export interface EventSalesLoyaltyTier {
  readonly label: string;
  readonly value: string;
  readonly tone: EventSalesTone;
}

export interface EventSalesComparisonRow {
  readonly name: string;
  readonly sold: string;
  readonly revenue: string;
  readonly fill: string;
  readonly tone: EventSalesTone;
  readonly current?: boolean;
}

export interface EventSalesData {
  readonly funnel: {
    readonly stats: readonly EventSalesFunnelStat[];
    readonly steps: readonly EventSalesFunnelStep[];
    readonly note: string;
  };
  readonly revenue: {
    readonly tiers: readonly EventDetailTierSummary[];
    readonly breakdown: readonly EventSalesRevenueRow[];
  };
  readonly crowd: {
    readonly gender: readonly EventSalesGenderSegment[];
    readonly age: readonly EventSalesAgeBracket[];
    readonly segments: readonly EventSalesCrowdSegment[];
    readonly loyalty: readonly EventSalesLoyaltyTier[];
  };
  readonly comparison: readonly EventSalesComparisonRow[];
}

export type EventSalesView = 'summary' | 'funnel' | 'revenue' | 'crowd' | 'compare';

export type EventGuestFilter = 'All' | 'Online' | 'Walk-in' | 'Checked In';

export interface EventGuestRecord {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly tier: string;
  readonly tag: 'VIP' | 'Repeat' | 'New';
  readonly arrival: 'Checked in' | 'Not yet';
  readonly origin: 'Online' | 'Walk-in';
  readonly gender: 'F' | 'M';
  readonly ticketCount: string;
  readonly spend: string;
  readonly contact: string;
  readonly lastPurchase: string;
}

export interface EventGuestsData {
  readonly attendeeCount: string;
  readonly guests: readonly EventGuestRecord[];
}

export interface EventWalkInRecord {
  readonly id: string;
  readonly name: string;
  readonly meta: string;
  readonly time: string;
}

export interface EventOperationsData {
  readonly insideNow: string;
  readonly capacity: string;
  readonly occupancyPercent: number;
  readonly expected: string;
  readonly walkIns: readonly EventWalkInRecord[];
}

export type DoorModeRole = 'venue' | 'host';
export type DoorGuestFilter = 'all' | 'online' | 'walk-in' | 'checked-in';

export interface DoorActivityRecord {
  readonly id: string;
  readonly text: string;
  readonly time: string;
  readonly kind: 'incident' | 'note';
}

export interface DoorEventData {
  readonly event: PartnerEventRecord;
  readonly venueLine: string;
  readonly insideNow: number;
  readonly capacity: number;
  readonly expectedCount: number;
  readonly walkInCount: number;
  readonly guests: EventGuestsData['guests'];
  readonly activity: readonly DoorActivityRecord[];
}

export interface DoorModeData {
  readonly dataStatus: 'fixture';
  readonly role: DoorModeRole;
  readonly accent: 'orange' | 'lavender';
  readonly issueCount: number;
  readonly events: readonly DoorEventData[];
}

export type SettingsSection = 'presence' | 'menu' | 'account';
export type SettingsRole = 'venue' | 'host';

export interface SettingsPresenceStat {
  readonly label: string;
  readonly value: string;
}

export interface SettingsMenuItem {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly price: string;
}

export type SettingsAccountIcon = 'business' | 'team' | 'notifications' | 'security';

export interface SettingsAccountRow {
  readonly id: string;
  readonly icon: SettingsAccountIcon;
  readonly title: string;
  readonly description: string;
}

export interface PartnerSettingsData {
  readonly dataStatus: 'fixture';
  readonly role: SettingsRole;
  readonly accent: 'orange' | 'lavender';
  readonly initials: string;
  readonly displayName: string;
  readonly bio: string;
  readonly highlights: readonly string[];
  readonly presenceStats: readonly SettingsPresenceStat[];
  readonly menuLive: boolean;
  readonly menuItems: readonly SettingsMenuItem[];
  readonly accountRows: readonly SettingsAccountRow[];
}

export interface EventPromoterRecord {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly tickets: string;
  readonly owed: string;
  readonly revenue: string;
  readonly rsvps: string;
  readonly conversion: string;
}

export interface EventPromotersData {
  readonly promoters: readonly EventPromoterRecord[];
}

export interface PartnerEventDetailData {
  readonly dataStatus: 'fixture';
  readonly event: PartnerEventRecord;
  readonly venueLine: string;
  readonly metrics: readonly EventDetailMetric[];
  readonly salesSummary: EventSalesSummary;
  readonly sales: EventSalesData;
  readonly guests: EventGuestsData;
  readonly operations: EventOperationsData;
  readonly promoters: EventPromotersData;
}

export interface EventSalesSummary {
  readonly moneyMade: string;
  readonly moneyDelta: string;
  readonly ticketsSold: string;
  readonly refunds: string;
  readonly moneyTrend: readonly number[];
  readonly tiers: readonly EventDetailTierSummary[];
}

export type PromoterEventAccessState = 'pending' | 'required';

export interface PromoterDiscoverEvent {
  readonly id: string;
  readonly name: string;
  readonly venue: string;
  readonly city: string;
  readonly dateLabel: string;
  readonly timeLabel: string;
  readonly accessState: PromoterEventAccessState;
  readonly artwork: PartnerEventArtwork;
}

export interface PromoterLinkedEvent {
  readonly id: string;
  readonly name: string;
  readonly venue: string;
  readonly city: string;
  readonly clicks: number;
  readonly sales: number;
  readonly artwork: PartnerEventArtwork;
}

export interface PromoterEventsData {
  readonly dataStatus: 'fixture';
  readonly discoverCount: number;
  readonly linkedCount: number;
  readonly discoverEvents: readonly PromoterDiscoverEvent[];
  readonly linkedEvents: readonly PromoterLinkedEvent[];
}

export type PartnerKind = 'host' | 'promoter' | 'venue';
export type PartnerSegment = 'hosts' | 'venues' | 'promoters' | 'staff';
export type PartnerSubView = 'connected' | 'discover' | 'requests';
export type PartnerRelationshipStatus = 'Partnered' | 'Invite sent' | 'Waiting on them';
export type PartnerRequestDirection = 'incoming' | 'outgoing';
export type PartnerCardTone = 'orange' | 'violet' | 'teal' | 'pink' | 'gold' | 'indigo' | 'slate';
export type PartnerPermission =
  'Door check-in' | 'Finance view' | 'Event editing' | 'Guest messaging';

export interface PartnerStat {
  readonly label: string;
  readonly value: string;
}

export interface PartnerUpcomingEvent {
  readonly id: string;
  readonly name: string;
  readonly dateLabel: string;
}

export interface PartnerProfile {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly kind: PartnerKind;
  readonly role: string;
  readonly location: string;
  readonly genres: readonly string[];
  readonly stats: readonly PartnerStat[];
  readonly upcomingEvents: readonly PartnerUpcomingEvent[];
  readonly verified: boolean;
  readonly cardTone: PartnerCardTone;
}

export interface PartnerRelationship extends PartnerProfile {
  readonly status?: PartnerRelationshipStatus;
}

export interface PartnerRequest {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly kind: PartnerKind;
  readonly direction: PartnerRequestDirection;
  readonly note: string;
}

export interface StaffMember {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly role: string;
  readonly status: 'Active';
  readonly permissions: readonly PartnerPermission[];
}

export interface PartnerRelationshipSet {
  readonly connected: readonly PartnerRelationship[];
  readonly discover: readonly PartnerRelationship[];
  readonly requests: {
    readonly incoming: readonly PartnerRequest[];
    readonly outgoing: readonly PartnerRequest[];
  };
}

export interface VenuePartnersData {
  readonly dataStatus: 'fixture';
  readonly hosts: PartnerRelationshipSet;
  readonly promoters: PartnerRelationshipSet;
  readonly staff: readonly StaffMember[];
}

export interface HostPartnersData {
  readonly dataStatus: 'fixture';
  readonly venues: PartnerRelationshipSet;
  readonly promoters: PartnerRelationshipSet;
  readonly staff: readonly StaffMember[];
}

export type PromoterPartnerTab = 'discover' | 'active' | 'incoming' | 'pending' | 'declined';
export type PromoterPartnerFilter = 'all' | 'venues' | 'hosts';
export type PromoterPartnerState = 'active' | 'discover';

export interface PromoterPartnerRecord extends Omit<PartnerProfile, 'kind'> {
  readonly kind: 'venue' | 'host';
  readonly state: PromoterPartnerState;
  readonly actionLabel: 'Connected' | 'Send Request';
}

export interface PromoterPartnersData {
  readonly dataStatus: 'fixture';
  readonly activePartnersCount: number;
  readonly pendingPartnersCount: number;
  readonly venuesCount: number;
  readonly hostsCount: number;
  readonly active: readonly PromoterPartnerRecord[];
  readonly discover: readonly PromoterPartnerRecord[];
  readonly incoming: readonly PartnerRequest[];
  readonly pending: readonly PartnerRequest[];
  readonly declined: readonly PartnerRequest[];
}

export type FinanceView = 'payouts' | 'orders' | 'bank';
export type FinanceDateRange = 'current' | 'all';
export type FinanceAccent = 'orange' | 'lavender';
export type FinancePayoutStatus = 'Paid' | 'Scheduled';
export type FinanceOrderStatus = 'Confirmed' | 'Pending' | 'Refunded' | 'Cancelled';
export type FinanceTone = 'positive' | 'warning' | 'negative' | 'neutral';

export interface FinanceMetric {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly tone?: FinanceTone;
}

export interface FinanceBankAccount {
  readonly bankName: string;
  readonly displayNumber: string;
  readonly accountNumber: string;
  readonly ifscCode: string;
  readonly accountHolder: string;
}

export interface FinancePaymentCard {
  readonly label: string;
  readonly displayNumber: string;
  readonly cardNumber: string;
  readonly holder: string;
  readonly expiry: string;
  readonly cvv: string;
}

export interface FinancePayout {
  readonly id: string;
  readonly date: string;
  readonly detail: string;
  readonly status: FinancePayoutStatus;
  readonly amount: string;
}

export interface FinanceOrder {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly orderNumber: string;
  readonly date: string;
  readonly event: string;
  readonly tickets: number;
  readonly amount: string;
  readonly status: FinanceOrderStatus;
  readonly avatarTone: 'orange' | 'violet' | 'teal' | 'pink' | 'gold' | 'indigo';
}

export interface PartnerFinanceData {
  readonly dataStatus: 'fixture';
  readonly accent: FinanceAccent;
  readonly availableBalance: string;
  readonly balanceDelta: string;
  readonly balanceDetail: string;
  readonly balanceTrend: readonly number[];
  readonly pendingBalance: FinanceMetric;
  readonly nextPayout: FinanceMetric;
  readonly bankAccount: FinanceBankAccount;
  readonly paymentCard: FinancePaymentCard;
  readonly payouts: readonly FinancePayout[];
  readonly orders: readonly FinanceOrder[];
}

export type VenueFinanceData = PartnerFinanceData;
export type HostFinanceData = PartnerFinanceData;

export interface PromoterFinanceData {
  readonly dataStatus: 'fixture';
  readonly walletBalance: string;
  readonly walletStatus: string;
  readonly pendingBalance: string;
  readonly instantAvailable: string;
  readonly withdrawalsMessage: string;
  readonly country: string;
  readonly currency: string;
  readonly statementDescriptor: string;
  readonly payoutSchedule: string;
  readonly bankSectionTitle: string;
  readonly bankSetupLabel: string;
  readonly bankSetupNote: string;
  readonly payoutsTitle: string;
  readonly lastUpdated: string;
  readonly emptyPayoutTitle: string;
  readonly emptyPayoutDescription: string;
}

export interface PromoterGuestRecord {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly tickets: string;
  readonly event: string;
  readonly amount: string;
  readonly commission: string;
  readonly status: 'Ticket';
  readonly when: string;
}

export interface PromoterGuestEventOption {
  readonly id: string;
  readonly name: string;
}

export interface PromoterGuestsData {
  readonly dataStatus: 'fixture';
  readonly totalGuests: number;
  readonly checkedIn: string;
  readonly revenue: string;
  readonly commission: string;
  readonly events: readonly PromoterGuestEventOption[];
  readonly guests: readonly PromoterGuestRecord[];
}

export type PromoterAnalyticsRange = '7D' | '30D' | 'YTD' | 'ALL';
export type PromoterAnalyticsMetric = 'revenue' | 'clicks' | 'sales';

export interface PromoterLinkPerformance {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly clicks: number;
  readonly sales: number;
  readonly conversion: string;
}

export interface PromoterAnalyticsActivity {
  readonly id: string;
  readonly title: string;
  readonly meta: string;
  readonly time: string;
}

export interface PromoterAnalyticsData {
  readonly dataStatus: 'fixture';
  readonly totalClicks: string;
  readonly ticketsSold: string;
  readonly conversionRate: string;
  readonly totalEarnings: string;
  readonly activeLinks: number;
  readonly totalLinks: number;
  readonly topLinks: readonly PromoterLinkPerformance[];
  readonly recentActivity: readonly PromoterAnalyticsActivity[];
}

export interface PromoterLeaderboardEntry {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly rank: number;
  readonly xp: number;
  readonly tickets?: number;
  readonly avatarTone: 'silver' | 'gold' | 'bronze' | 'red' | 'purple' | 'blue';
}

export interface PromoterLeaderboardData {
  readonly dataStatus: 'fixture';
  readonly podium: readonly PromoterLeaderboardEntry[];
  readonly ranked: readonly PromoterLeaderboardEntry[];
  readonly periods: readonly { readonly value: string; readonly label: string }[];
  readonly cities: readonly { readonly value: string; readonly label: string }[];
}

export type PartnerSearchResultType =
  'event' | 'partner' | 'guest' | 'order' | 'request' | 'finance' | 'settings';
export type PartnerSearchIcon =
  'event' | 'partner' | 'guest' | 'order' | 'request' | 'finance' | 'settings';

export interface PartnerSearchResult {
  readonly id: string;
  readonly type: PartnerSearchResultType;
  readonly group: string;
  readonly title: string;
  readonly subtitle: string;
  readonly href?: string;
  readonly icon: PartnerSearchIcon;
  readonly keywords: readonly string[];
}

export interface PartnerSearchData {
  readonly dataStatus: 'fixture';
  readonly results: readonly PartnerSearchResult[];
}

export type PartnerNotificationType = 'payout' | 'request' | 'marketing' | 'operations' | 'system';
export type PartnerNotificationIcon =
  'finance' | 'partner' | 'marketing' | 'operations' | 'request';

export interface PartnerNotification {
  readonly id: string;
  readonly description: string;
  readonly time: string;
  readonly type: PartnerNotificationType;
  readonly icon: PartnerNotificationIcon;
  readonly href?: string;
  readonly unread: boolean;
}

export interface PartnerNotificationsData {
  readonly dataStatus: 'fixture';
  readonly notifications: readonly PartnerNotification[];
}

export interface PartnerShellInteractionData {
  readonly dataStatus: 'fixture';
  readonly search: PartnerSearchData;
  readonly notifications: PartnerNotificationsData;
}

export type SlotRequestStatus = 'pending' | 'approved' | 'rejected';
export type SlotRequestDirection = 'incoming' | 'outgoing';
export type SlotRequestAccent = 'orange' | 'lavender';

export interface SlotRequestTier {
  readonly name: string;
  readonly price: string;
  readonly quantity: string;
}

export interface SlotRequestEvent {
  readonly name: string;
  readonly description: string;
  readonly date: string;
  readonly time: string;
  readonly venue: string;
  readonly ticketTier: string;
  readonly note: string;
  readonly artists: readonly string[];
  readonly promoters: readonly string[];
  readonly tiers: readonly SlotRequestTier[];
  readonly pricing: readonly string[];
  readonly tables: string;
  readonly codes: string;
}

export interface SlotRequest {
  readonly id: string;
  readonly status: SlotRequestStatus;
  readonly direction: SlotRequestDirection;
  readonly partnerName: string;
  readonly partnerRoleLabel: 'Host' | 'Venue';
  readonly partnerInitials: string;
  readonly event: SlotRequestEvent;
}

export interface SlotRequestsData {
  readonly dataStatus: 'fixture';
  readonly accent: SlotRequestAccent;
  readonly direction: SlotRequestDirection;
  readonly requests: readonly SlotRequest[];
}

export type VenueSlotRequestsData = SlotRequestsData;
export type HostSlotRequestsData = SlotRequestsData;

export type CalendarEventStatus = 'confirmed' | 'pending' | 'blocked';
export type CalendarDayState = 'available' | 'unavailable' | CalendarEventStatus;

export interface CalendarEvent {
  readonly id: string;
  readonly date: string;
  readonly name: string;
  readonly time: string;
  readonly status: CalendarEventStatus;
  readonly venue: string;
  readonly href?: string;
}

export interface CalendarBlock {
  readonly id: string;
  readonly date: string;
  readonly reason: string;
  readonly from: string;
  readonly to: string;
}

export interface AvailabilitySlot {
  readonly id: string;
  readonly label: string;
  readonly status: 'available' | 'unavailable';
}

export interface CalendarDay {
  readonly date: string;
  readonly day: number;
  readonly state: CalendarDayState;
  readonly events: readonly CalendarEvent[];
  readonly slots: readonly AvailabilitySlot[];
}

export interface CalendarMonth {
  readonly key: string;
  readonly label: string;
  readonly firstDayOffset: number;
  readonly daysInMonth: number;
  readonly days: readonly CalendarDay[];
}

export interface PartnerVenueOption {
  readonly id: string;
  readonly name: string;
  readonly meta: string;
  readonly status: 'Partnered';
}

export interface VenueCalendarData {
  readonly dataStatus: 'fixture';
  readonly accent: 'orange';
  readonly months: readonly CalendarMonth[];
  readonly blocks: readonly CalendarBlock[];
}

export interface HostAvailabilityVenue {
  readonly venue: PartnerVenueOption;
  readonly months: readonly CalendarMonth[];
}

export interface HostAvailabilityData {
  readonly dataStatus: 'fixture';
  readonly accent: 'lavender';
  readonly venues: readonly HostAvailabilityVenue[];
}

export type EventEditorRole = 'venue' | 'host';
export type EventEditorStep = 'venue' | 'basics' | 'promoters' | 'review';

export interface EventEditorVenueOption {
  readonly id: string;
  readonly name: string;
  readonly meta: string;
  readonly artwork: PartnerEventArtwork;
}

export interface EventEditorPromoterOption {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly role: string;
}

export interface EventEditorTicketTier {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly quantity: number;
}

export interface EventEditorDraft {
  readonly name: string;
  readonly venueId: string;
  readonly date: string;
  readonly dateLabel: string;
  readonly time: string;
  readonly genres: readonly string[];
  readonly artists: readonly string[];
  readonly artwork: PartnerEventArtwork;
  readonly ticketTiers: readonly EventEditorTicketTier[];
  readonly selectedPromoterIds: readonly string[];
  readonly tableType: 'none' | 'high' | 'low';
  readonly promoCodes: readonly string[];
  readonly pricingRule: string;
  readonly compensation: 'standard' | 'custom' | 'salary';
  readonly commissionRate: number;
  readonly salaryNotes: string;
}

export interface EventEditorData {
  readonly dataStatus: 'fixture';
  readonly role: EventEditorRole;
  readonly venues: readonly EventEditorVenueOption[];
  readonly promoters: readonly EventEditorPromoterOption[];
  readonly genres: readonly string[];
  readonly extraGenres: readonly string[];
  readonly artworkOptions: readonly PartnerEventArtwork[];
  readonly defaultDraft: EventEditorDraft;
}

export type MarketingRole = 'venue' | 'host';
export type MarketingView = 'compose' | 'history' | 'templates';
export type MarketingChannel = 'whatsapp' | 'sms' | 'email' | 'push';
export type MarketingAudienceType = 'event' | 'all' | 'custom';
export type MarketingDeliveryFilter = 'all' | 'walkin' | 'dinein' | 'online';
export type MarketingCampaignStatus = 'sent' | 'scheduled' | 'draft';

export interface MarketingEventOption {
  readonly id: string;
  readonly name: string;
  readonly date: string;
  readonly venue: string;
  readonly artwork: PartnerEventArtwork;
}

export interface MarketingAudience {
  readonly id: MarketingAudienceType;
  readonly label: string;
  readonly sub: string;
  readonly count: string;
}

export interface MarketingAttendee {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly contact: string;
  readonly email: string;
  readonly gender: 'F' | 'M' | 'Other';
  readonly source: Exclude<MarketingDeliveryFilter, 'all'>;
  readonly eventId: string;
  readonly date: string;
}

export interface MarketingCampaign {
  readonly id: string;
  readonly title: string;
  readonly meta: string;
  readonly channel: MarketingChannel;
  readonly status: MarketingCampaignStatus;
  readonly eventId?: string;
  readonly audienceLabel: string;
  readonly sent: number;
  readonly read: number;
  readonly clicked: number;
}

export interface MarketingTemplate {
  readonly id: string;
  readonly name: string;
  readonly channel: MarketingChannel;
  readonly preview: string;
}

export interface MarketingSchedule {
  readonly mode: 'now' | 'scheduled';
  readonly date: string;
  readonly time: string;
}

export interface MarketingData {
  readonly dataStatus: 'fixture';
  readonly role: MarketingRole;
  readonly accent: 'orange' | 'lavender';
  readonly events: readonly MarketingEventOption[];
  readonly attendees: readonly MarketingAttendee[];
  readonly campaigns: readonly MarketingCampaign[];
  readonly templates: readonly MarketingTemplate[];
  readonly audiences: readonly MarketingAudience[];
  readonly defaultMessage: string;
  readonly defaultEventId: string;
}

export interface PartnerDataSource {
  getStudioShell(role: StudioRole): Promise<StudioShellData>;
  getVenueOverview(): Promise<OverviewData>;
  getHostOverview(): Promise<OverviewData>;
  getPromoterOverview(): Promise<PromoterOverviewData>;
  getVenueEvents(): Promise<VenueEventsData>;
  getVenueEventDetail(eventId: string): Promise<PartnerEventDetailData | null>;
  getHostEvents(): Promise<HostEventsData>;
  getHostEventDetail(eventId: string): Promise<PartnerEventDetailData | null>;
  getPromoterEvents(): Promise<PromoterEventsData>;
  getVenuePartners(): Promise<VenuePartnersData>;
  getHostPartners(): Promise<HostPartnersData>;
  getPromoterPartners(): Promise<PromoterPartnersData>;
  getVenueFinance(): Promise<VenueFinanceData>;
  getHostFinance(): Promise<HostFinanceData>;
  getPromoterFinance(): Promise<PromoterFinanceData>;
  getPromoterGuests(): Promise<PromoterGuestsData>;
  getPromoterAnalytics(): Promise<PromoterAnalyticsData>;
  getPromoterLeaderboard(): Promise<PromoterLeaderboardData>;
  getVenueSlotRequests(): Promise<VenueSlotRequestsData>;
  getHostSlotRequests(): Promise<HostSlotRequestsData>;
  getVenueCalendar(): Promise<VenueCalendarData>;
  getHostAvailability(): Promise<HostAvailabilityData>;
  getVenueEventEditor(): Promise<EventEditorData>;
  getHostEventEditor(): Promise<EventEditorData>;
  getVenueMarketing(): Promise<MarketingData>;
  getHostMarketing(): Promise<MarketingData>;
  getVenueDoorMode(): Promise<DoorModeData>;
  getHostDoorMode(): Promise<DoorModeData>;
  getVenueSettings(): Promise<PartnerSettingsData>;
  getHostSettings(): Promise<PartnerSettingsData>;
  getPartnerShellInteractions(role: StudioRole): Promise<PartnerShellInteractionData>;
}
