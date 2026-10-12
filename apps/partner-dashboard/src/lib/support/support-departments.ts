import type { SupportTicketCategory } from '@c1rcle/contracts';

export interface SupportDepartment {
  readonly id: string;
  readonly name: string;
  readonly gatewayCategory: SupportTicketCategory;
  readonly subcategories: readonly string[];
}

/**
 * 9 distinct departments with specific subcategories for partner support requests
 * as specified in THEC1RCLE Support Module documentation.
 */
export const SUPPORT_DEPARTMENTS: readonly SupportDepartment[] = [
  {
    id: 'account',
    name: 'Account',
    gatewayCategory: 'account',
    subcategories: [
      'Login Issues',
      'Password Reset',
      'Email Verification',
      'Phone Verification',
      'Team Access',
      'Role Permission Issues',
    ],
  },
  {
    id: 'event-management',
    name: 'Event Management',
    gatewayCategory: 'event',
    subcategories: [
      'Unable to Publish Event',
      'Event Approval Delay',
      'Event Rejected',
      'Event Not Visible',
      'Editing Event Issues',
      'Event Cancellation',
    ],
  },
  {
    id: 'ticketing',
    name: 'Ticketing',
    gatewayCategory: 'order',
    subcategories: [
      'Ticket Inventory Problems',
      'Incorrect Pricing',
      'Discount Issues',
      'Promo Code Issues',
      'QR Code Problems',
      'Guest List Issues',
      'Ticket Transfer Issues',
    ],
  },
  {
    id: 'payments-finance',
    name: 'Payments & Finance',
    gatewayCategory: 'billing',
    subcategories: [
      'Subscription Billing',
      'Failed Payment',
      'Refund Request',
      'Payout Delay',
      'Commission Issues',
      'Invoice Request',
      'GST & Tax Issues',
    ],
  },
  {
    id: 'door-management',
    name: 'Door Management',
    gatewayCategory: 'event',
    subcategories: [
      'Scanner Not Working',
      'Check-in Failed',
      'Duplicate Entry',
      'Walk-in Entry Issue',
      'Offline Entry Problems',
    ],
  },
  {
    id: 'partners',
    name: 'Partners',
    gatewayCategory: 'other',
    subcategories: [
      'Host Connection Issues',
      'Promoter Connection Issues',
      'Duplicate Partnership Requests',
      'Partnership Approval',
      'Remove Partner Request',
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    gatewayCategory: 'other',
    subcategories: [
      'WhatsApp Broadcast Issues',
      'Email Campaign Issues',
      'Audience Management',
      'Push Notification Problems',
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    gatewayCategory: 'other',
    subcategories: [
      'Revenue Mismatch',
      'Missing Reports',
      'Incorrect Statistics',
    ],
  },
  {
    id: 'technical',
    name: 'Technical',
    gatewayCategory: 'technical',
    subcategories: [
      'Dashboard Bug',
      'Slow Performance',
      'Dashboard Crash',
      'Mobile Responsiveness Issues',
      'Browser Compatibility',
      'Feature Not Working',
    ],
  },
] as const;

export function findDepartmentByName(name: string): SupportDepartment | undefined {
  return SUPPORT_DEPARTMENTS.find(
    (dept) => dept.name.toLowerCase() === name.trim().toLowerCase(),
  );
}

export function findDepartmentById(id: string): SupportDepartment | undefined {
  return SUPPORT_DEPARTMENTS.find((dept) => dept.id === id);
}

export function parseDepartmentFromSubject(subject: string): {
  department: string | null;
  subcategory: string | null;
  cleanSubject: string;
} {
  const match = /^\[([^·|\]]+)(?:[·|]\s*([^\]]+))?\]\s*(.*)$/i.exec(subject);
  if (!match) {
    return {
      department: null,
      subcategory: null,
      cleanSubject: subject,
    };
  }

  const deptCandidate = match[1]?.trim() ?? null;
  const subCandidate = match[2]?.trim() ?? null;
  const cleanSubject = match[3]?.trim() ?? subject;

  return {
    department: deptCandidate,
    subcategory: subCandidate,
    cleanSubject: cleanSubject.length > 0 ? cleanSubject : subject,
  };
}
