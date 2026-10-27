import {
  submitSupportTicketSchema,
  supportTicketDtoSchema,
  supportTicketListResponseSchema,
  supportTicketMessageSchema,
} from '@c1rcle/contracts';

import { bffClient } from '@/lib/bff/bff-client';

import {
  findDepartmentByName,
  parseDepartmentFromSubject,
  SUPPORT_DEPARTMENTS,
} from './support-departments';

import type {
  SupportTicketCategory,
  SupportTicketDto,
  SupportTicketMessageDto,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@c1rcle/contracts';

const DEFAULT_DEPARTMENT = SUPPORT_DEPARTMENTS[0] ?? {
  id: 'account',
  name: 'Account',
  gatewayCategory: 'account' as const,
  subcategories: ['General'],
};

export interface PartnerSupportTicket {
  readonly id: string;
  readonly shortId: string;
  readonly subject: string;
  readonly cleanSubject: string;
  readonly description: string;
  readonly category: SupportTicketCategory;
  readonly department: string;
  readonly subcategory: string;
  readonly status: SupportTicketStatus;
  readonly priority: SupportTicketPriority;
  readonly mergedInto: string | null;
  readonly mergedIntoShortId: string | null;
  readonly mergedFrom: readonly string[];
  readonly messages: readonly SupportTicketMessageDto[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly isMerged: boolean;
}

export interface CreatePartnerTicketInput {
  readonly departmentName: string;
  readonly subcategoryName: string;
  readonly priority: SupportTicketPriority;
  readonly subject: string;
  readonly description: string;
  readonly organizationId?: string | null;
}

export function toShortTicketId(id: string): string {
  const clean = id.replace(/^tk[-_]?/i, '');
  return clean.length > 8 ? clean.slice(-8).toUpperCase() : clean.toUpperCase();
}

export function normalizeTicket(dto: SupportTicketDto): PartnerSupportTicket {
  const parsed = parseDepartmentFromSubject(dto.subject);
  const matchedDept = parsed.department ? findDepartmentByName(parsed.department) : undefined;
  const fallbackDept =
    SUPPORT_DEPARTMENTS.find((dept) => dept.gatewayCategory === dto.category) ?? DEFAULT_DEPARTMENT;

  const department = matchedDept ? matchedDept.name : fallbackDept.name;
  const subcategory = parsed.subcategory ?? matchedDept?.subcategories[0] ?? 'General';
  const cleanSubject = parsed.cleanSubject;
  const isMerged = dto.mergedInto !== null && dto.mergedInto.length > 0;

  return {
    id: dto.id,
    shortId: toShortTicketId(dto.id),
    subject: dto.subject,
    cleanSubject,
    description: dto.description,
    category: dto.category,
    department,
    subcategory,
    status: dto.status,
    priority: dto.priority,
    mergedInto: dto.mergedInto,
    mergedIntoShortId: dto.mergedInto ? toShortTicketId(dto.mergedInto) : null,
    mergedFrom: dto.mergedFrom,
    messages: dto.messages,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    isMerged,
  };
}

export async function listPartnerTickets(): Promise<readonly PartnerSupportTicket[]> {
  const res = await bffClient.get({
    path: '/api/bff/support/tickets',
    schema: supportTicketListResponseSchema,
  });
  return res.items.map(normalizeTicket);
}

export async function getPartnerTicket(ticketId: string): Promise<PartnerSupportTicket> {
  const res = await bffClient.get({
    path: `/api/bff/support/tickets/${ticketId}`,
    schema: supportTicketDtoSchema,
  });
  return normalizeTicket(res);
}

export async function createPartnerTicket(
  input: CreatePartnerTicketInput,
): Promise<PartnerSupportTicket> {
  const department = findDepartmentByName(input.departmentName) ?? DEFAULT_DEPARTMENT;
  const fullSubject = `[${department.name} · ${input.subcategoryName}] ${input.subject.trim()}`;

  const payload = submitSupportTicketSchema.parse({
    subject: fullSubject,
    description: input.description.trim(),
    category: department.gatewayCategory,
    priority: input.priority,
    organizationId: input.organizationId ?? null,
  });

  const res = await bffClient.post({
    path: '/api/bff/support/tickets',
    body: payload,
    schema: supportTicketDtoSchema,
  });

  return normalizeTicket(res);
}

export async function sendPartnerTicketReply(
  ticketId: string,
  content: string,
): Promise<PartnerSupportTicket> {
  const payload = supportTicketMessageSchema.parse({
    content: content.trim(),
  });

  const res = await bffClient.post({
    path: `/api/bff/support/tickets/${ticketId}/messages`,
    body: payload,
    schema: supportTicketDtoSchema,
  });

  return normalizeTicket(res);
}
