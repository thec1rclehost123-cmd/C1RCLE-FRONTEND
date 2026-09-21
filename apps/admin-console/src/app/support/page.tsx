'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState, TextField } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { StatusFilter } from '@/components/admin/status-filter';
import {
  addSupportInternalNote,
  assignSupportTicket,
  changeSupportTicketPriority,
  closeSupportTicket,
  deleteSupportTicket,
  escalateSupportTicket,
  getSupportTicket,
  linkSupportTicket,
  listSupportTickets,
  listAdmins,
  mergeSupportTicket,
  reopenSupportTicket,
  resolveSupportTicket,
  restoreSupportTicket,
  sendAdminSupportReply,
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_PRIORITIES,
  SUPPORT_TICKET_STATUSES,
} from '@/lib/admin/admin-api';
import {
  formatDateTime,
  shortId,
  StatusBadge,
  SUPPORT_TICKET_CATEGORY_LABELS,
  SUPPORT_TICKET_PRIORITY_LABELS,
  SUPPORT_TICKET_STATUS_LABELS,
  supportTicketPriorityTone,
  supportTicketStatusTone,
} from '@/lib/admin/format';

import type { AdminSupportTicket, SupportTicketLinkInput } from '@/lib/admin/admin-api';
import type {
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@/lib/admin/contract-types';

type StatusFilterValue = SupportTicketStatus | 'all';
type PriorityFilterValue = SupportTicketPriority | 'all';
type CategoryFilterValue = SupportTicketCategory | 'all';

/** Human labels for the closed set of timeline event types on the wire. */
const TIMELINE_TYPE_LABELS: Record<string, string> = {
  created: 'Created',
  reply: 'Reply',
  internal_note: 'Internal note',
  assignment: 'Assigned',
  priority_change: 'Priority changed',
  link: 'Linked',
  escalation: 'Escalated',
  merge: 'Merged',
  status_change: 'Status changed',
  deleted: 'Deleted',
};

const selectClass =
  'rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground';

function LabeledTextarea({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <textarea
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

function overdueLabel(dueAt: string, breachedAt: string | null): string {
  const firstDue = new Date(dueAt).getTime();
  const now = Date.now();
  if (breachedAt !== null) {
    return `Breached ${formatDateTime(breachedAt)}`;
  }
  if (now > firstDue) {
    return `Overdue (was due ${formatDateTime(dueAt)})`;
  }
  return `Due ${formatDateTime(dueAt)}`;
}

export default function SupportDesk() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilterValue>('all');
  const [priority, setPriority] = useState<PriorityFilterValue>('all');
  const [category, setCategory] = useState<CategoryFilterValue>('all');
  const [search, setSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const invalidateTickets = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'support'] });
  }, [queryClient]);

  const list = useQuery({
    queryKey: ['admin', 'support', 'queue', { status, priority, category, search, includeDeleted }],
    queryFn: () =>
      listSupportTickets(
        {
          ...(status === 'all' ? {} : { status }),
          ...(priority === 'all' ? {} : { priority }),
          ...(category === 'all' ? {} : { category }),
          ...(search === '' ? {} : { search }),
          ...(includeDeleted ? { includeDeleted: true } : {}),
        },
        100,
      ),
  });

  const detail = useQuery({
    queryKey: ['admin', 'support', 'ticket', selectedId],
    queryFn: () => {
      if (selectedId === null) {
        throw new Error('No ticket selected');
      }
      return getSupportTicket(selectedId);
    },
    enabled: selectedId !== null,
  });

  const admins = useQuery({
    queryKey: ['admin', 'admins', 'assignee-picker'],
    queryFn: () => listAdmins(100),
  });

  const assigneeOptions =
    admins.data?.items.map((admin) => ({ id: admin.id, name: admin.email })) ?? [];
  const [assigneeId, setAssigneeId] = useState('');

  const replyMutation = useMutation({
    mutationFn: (content: string) => {
      if (selectedId === null) {
        throw new Error('No ticket selected');
      }
      return sendAdminSupportReply(selectedId, content);
    },
    onSuccess: invalidateTickets,
  });
  const [replyText, setReplyText] = useState('');

  const noteMutation = useMutation({
    mutationFn: (content: string) => {
      if (selectedId === null) {
        throw new Error('No ticket selected');
      }
      return addSupportInternalNote(selectedId, content);
    },
    onSuccess: invalidateTickets,
  });
  const [noteText, setNoteText] = useState('');

  const assignMutation = useMutation({
    mutationFn: () => {
      if (selectedId === null || assigneeId === '') {
        throw new Error('Choose an admin to assign to');
      }
      const admin = assigneeOptions.find((option) => option.id === assigneeId);
      if (admin === undefined) {
        throw new Error('Unknown assignee');
      }
      return assignSupportTicket(selectedId, admin.id, admin.name);
    },
    onSuccess: invalidateTickets,
  });

  const priorityMutation = useMutation({
    mutationFn: (priorityValue: SupportTicketPriority) => {
      if (selectedId === null) {
        throw new Error('No ticket selected');
      }
      return changeSupportTicketPriority(selectedId, priorityValue);
    },
    onSuccess: invalidateTickets,
  });
  const [priorityDraft, setPriorityDraft] = useState<SupportTicketPriority>('medium');

  const resolveMutation = useMutation({
    mutationFn: (reason: string) => {
      if (selectedId === null) {
        throw new Error('No ticket selected');
      }
      return resolveSupportTicket(selectedId, reason);
    },
    onSuccess: invalidateTickets,
  });
  const [resolveReason, setResolveReason] = useState('');

  const mergeMutation = useMutation({
    mutationFn: (duplicateTicketId: string) => {
      if (selectedId === null) {
        throw new Error('No ticket selected');
      }
      return mergeSupportTicket(selectedId, duplicateTicketId);
    },
    onSuccess: invalidateTickets,
  });
  const [mergeTargetId, setMergeTargetId] = useState('');

  const linkMutation = useMutation({
    mutationFn: (links: SupportTicketLinkInput) => {
      if (selectedId === null) {
        throw new Error('No ticket selected');
      }
      return linkSupportTicket(selectedId, links);
    },
    onSuccess: invalidateTickets,
  });
  const [linkOrderId, setLinkOrderId] = useState('');
  const [linkEventId, setLinkEventId] = useState('');
  const [linkVenueId, setLinkVenueId] = useState('');
  const [linkUserId, setLinkUserId] = useState('');

  const transitionMutation = useMutation({
    mutationFn: (action: 'escalate' | 'close' | 'reopen' | 'restore' | 'delete') => {
      if (selectedId === null) {
        throw new Error('No ticket selected');
      }
      switch (action) {
        case 'escalate':
          return escalateSupportTicket(selectedId);
        case 'close':
          return closeSupportTicket(selectedId);
        case 'reopen':
          return reopenSupportTicket(selectedId);
        case 'restore':
          return restoreSupportTicket(selectedId);
        case 'delete':
          return deleteSupportTicket(selectedId);
      }
    },
    onSuccess: (_ticket, action) => {
      invalidateTickets();
      if (action === 'delete') {
        setSelectedId(null);
      }
    },
  });

  const mutationError =
    replyMutation.isError ||
    noteMutation.isError ||
    assignMutation.isError ||
    priorityMutation.isError ||
    resolveMutation.isError ||
    mergeMutation.isError ||
    linkMutation.isError ||
    transitionMutation.isError;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Support"
          description="Guest and partner tickets flow into this desk from the intake routes. SLAs are set at creation from priority — the desk shows what is due, breached, or overdue."
        />
        <div className="flex flex-wrap items-end gap-3">
          <StatusFilter
            id="support-status"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All' },
              ...SUPPORT_TICKET_STATUSES.map((value) => ({
                value,
                label: SUPPORT_TICKET_STATUS_LABELS[value],
              })),
            ]}
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Priority
            <select
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value as PriorityFilterValue);
              }}
              className={selectClass}
            >
              <option value="all">All</option>
              {SUPPORT_TICKET_PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {SUPPORT_TICKET_PRIORITY_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Category
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value as CategoryFilterValue);
              }}
              className={selectClass}
            >
              <option value="all">All</option>
              {SUPPORT_TICKET_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {SUPPORT_TICKET_CATEGORY_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <TextField
            label="Search"
            labelHidden
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            placeholder="Search subject / requester…"
            className="w-56"
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(event) => {
                setIncludeDeleted(event.target.checked);
              }}
              className="h-4 w-4 rounded border-input"
            />
            Include deleted
          </label>
        </div>
      </div>

      {list.isPending ? (
        <LoadingState label="Loading tickets…" />
      ) : list.isError ? (
        <ErrorState
          description="The support queue could not be loaded. Please retry."
          onRetry={() => void list.refetch()}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No tickets" description="Nothing matches this filter combination." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Subject
                </th>
                <th scope="col" className="px-4 py-3">
                  Category
                </th>
                <th scope="col" className="px-4 py-3">
                  Priority
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Assignee
                </th>
                <th scope="col" className="px-4 py-3">
                  SLA
                </th>
                <th scope="col" className="px-4 py-3">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data.items.map((ticket) => {
                const isSelected = ticket.id === selectedId;
                const responseBreached = ticket.sla.responseBreachedAt !== null;
                return (
                  <tr
                    key={ticket.id}
                    onClick={() => {
                      setSelectedId(ticket.id);
                    }}
                    className={`cursor-pointer ${isSelected ? 'bg-muted/60' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {ticket.subject}
                        {ticket.deletedAt !== null ? (
                          <span className="ml-2 text-xs text-muted-foreground">(deleted)</span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {shortId(ticket.id)} · {ticket.requester.email ?? shortId(ticket.requester.userId)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {SUPPORT_TICKET_CATEGORY_LABELS[ticket.category]}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={SUPPORT_TICKET_PRIORITY_LABELS[ticket.priority]}
                        tone={supportTicketPriorityTone(ticket.priority)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={SUPPORT_TICKET_STATUS_LABELS[ticket.status]}
                        tone={supportTicketStatusTone(ticket.status)}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {ticket.assignee === null ? 'Unassigned' : ticket.assignee.name}
                    </td>
                    <td
                      className={`px-4 py-3 text-xs ${responseBreached ? 'text-urgent' : 'text-muted-foreground'}`}
                    >
                      {overdueLabel(ticket.sla.responseDueAt, ticket.sla.responseBreachedAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(ticket.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedId !== null && detail.data !== undefined ? (
        <TicketDetail
          ticket={detail.data}
          assigneeOptions={assigneeOptions}
          assigneeId={assigneeId}
          onAssigneeChange={setAssigneeId}
          onAssign={() => {
            assignMutation.mutate();
          }}
          assignPending={assignMutation.isPending}
          priorityDraft={priorityDraft}
          onPriorityDraftChange={setPriorityDraft}
          onApplyPriority={() => {
            priorityMutation.mutate(priorityDraft);
          }}
          priorityPending={priorityMutation.isPending}
          replyText={replyText}
          onReplyTextChange={setReplyText}
          onSendReply={() => {
            replyMutation.mutate(replyText.trim());
            setReplyText('');
          }}
          replyPending={replyMutation.isPending}
          noteText={noteText}
          onNoteTextChange={setNoteText}
          onAddNote={() => {
            noteMutation.mutate(noteText.trim());
            setNoteText('');
          }}
          notePending={noteMutation.isPending}
          resolveReason={resolveReason}
          onResolveReasonChange={setResolveReason}
          onResolve={() => {
            resolveMutation.mutate(resolveReason.trim());
            setResolveReason('');
          }}
          resolvePending={resolveMutation.isPending}
          mergeTargetId={mergeTargetId}
          onMergeTargetChange={setMergeTargetId}
          onMerge={() => {
            mergeMutation.mutate(mergeTargetId.trim());
            setMergeTargetId('');
          }}
          mergePending={mergeMutation.isPending}
          linkOrderId={linkOrderId}
          onLinkOrderIdChange={setLinkOrderId}
          linkEventId={linkEventId}
          onLinkEventIdChange={setLinkEventId}
          linkVenueId={linkVenueId}
          onLinkVenueIdChange={setLinkVenueId}
          linkUserId={linkUserId}
          onLinkUserIdChange={setLinkUserId}
          onLink={() => {
            const links: SupportTicketLinkInput = {
              ...(linkOrderId.trim() === '' ? {} : { orderId: linkOrderId.trim() }),
              ...(linkEventId.trim() === '' ? {} : { eventId: linkEventId.trim() }),
              ...(linkVenueId.trim() === '' ? {} : { venueId: linkVenueId.trim() }),
              ...(linkUserId.trim() === '' ? {} : { userId: linkUserId.trim() }),
            };
            linkMutation.mutate(links);
            setLinkOrderId('');
            setLinkEventId('');
            setLinkVenueId('');
            setLinkUserId('');
          }}
          linkPending={linkMutation.isPending}
          onTransition={tupleTransition}
          transitionPending={transitionMutation.isPending}
          onClose={closePanel}
        />
      ) : null}

      {mutationError ? (
        <p role="alert" className="text-sm text-destructive">
          The action could not be saved. It is safe to retry — every command is idempotency-keyed.
        </p>
      ) : null}
    </div>
  );

  /** Dispatch a body-free transition (escalate / close / reopen / restore / delete). */
  function tupleTransition(action: TransitionAction): void {
    transitionMutation.mutate(action);
  }

  function closePanel(): void {
    setSelectedId(null);
  }
}

type TransitionAction = 'escalate' | 'close' | 'reopen' | 'restore' | 'delete';

function TicketDetail({
  ticket,
  assigneeOptions,
  assigneeId,
  onAssigneeChange,
  onAssign,
  assignPending,
  priorityDraft,
  onPriorityDraftChange,
  onApplyPriority,
  priorityPending,
  replyText,
  onReplyTextChange,
  onSendReply,
  replyPending,
  noteText,
  onNoteTextChange,
  onAddNote,
  notePending,
  resolveReason,
  onResolveReasonChange,
  onResolve,
  resolvePending,
  mergeTargetId,
  onMergeTargetChange,
  onMerge,
  mergePending,
  linkOrderId,
  onLinkOrderIdChange,
  linkEventId,
  onLinkEventIdChange,
  linkVenueId,
  onLinkVenueIdChange,
  linkUserId,
  onLinkUserIdChange,
  onLink,
  linkPending,
  onTransition,
  transitionPending,
  onClose,
}: {
  readonly ticket: AdminSupportTicket;
  readonly assigneeOptions: readonly { id: string; name: string }[];
  readonly assigneeId: string;
  readonly onAssigneeChange: (value: string) => void;
  readonly onAssign: () => void;
  readonly assignPending: boolean;
  readonly priorityDraft: SupportTicketPriority;
  readonly onPriorityDraftChange: (value: SupportTicketPriority) => void;
  readonly onApplyPriority: () => void;
  readonly priorityPending: boolean;
  readonly replyText: string;
  readonly onReplyTextChange: (value: string) => void;
  readonly onSendReply: () => void;
  readonly replyPending: boolean;
  readonly noteText: string;
  readonly onNoteTextChange: (value: string) => void;
  readonly onAddNote: () => void;
  readonly notePending: boolean;
  readonly resolveReason: string;
  readonly onResolveReasonChange: (value: string) => void;
  readonly onResolve: () => void;
  readonly resolvePending: boolean;
  readonly mergeTargetId: string;
  readonly onMergeTargetChange: (value: string) => void;
  readonly onMerge: () => void;
  readonly mergePending: boolean;
  readonly linkOrderId: string;
  readonly onLinkOrderIdChange: (value: string) => void;
  readonly linkEventId: string;
  readonly onLinkEventIdChange: (value: string) => void;
  readonly linkVenueId: string;
  readonly onLinkVenueIdChange: (value: string) => void;
  readonly linkUserId: string;
  readonly onLinkUserIdChange: (value: string) => void;
  readonly onLink: () => void;
  readonly linkPending: boolean;
  readonly onTransition: (action: TransitionAction) => void;
  readonly transitionPending: boolean;
  readonly onClose: () => void;
}) {
  const isDeleted = ticket.deletedAt !== null;
  const isClosed = ticket.status === 'closed';
  const isResolved = ticket.status === 'resolved';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-border">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <h2 className="text-base font-semibold">{ticket.subject}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {ticket.category} · raised {formatDateTime(ticket.createdAt)} by{' '}
                {ticket.requester.email ?? ticket.requester.userId}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge
                label={SUPPORT_TICKET_PRIORITY_LABELS[ticket.priority]}
                tone={supportTicketPriorityTone(ticket.priority)}
              />
              <StatusBadge
                label={SUPPORT_TICKET_STATUS_LABELS[ticket.status]}
                tone={supportTicketStatusTone(ticket.status)}
              />
              <Button size="sm" variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>

          <div className="space-y-4 px-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground">{ticket.description}</p>
            </div>

            {ticket.messages.length > 0 || ticket.internalNotes.length > 0 ? (
              <div className="space-y-3">
                {ticket.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-lg border border-border px-3 py-2 text-sm ${
                      message.senderRole === 'admin'
                        ? 'ml-8 bg-muted/50'
                        : 'mr-8 bg-background'
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">
                      {message.senderName} · {formatDateTime(message.createdAt)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))}
                {ticket.internalNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg border border-dashed border-border bg-amber-50 px-3 py-2 text-sm dark:bg-amber-950/30"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      Internal note — {note.authorName} · {formatDateTime(note.createdAt)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}

                {ticket.timeline.length > 0 ? (
                  <details className="rounded-lg border border-border px-3 py-2">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                      Timeline ({ticket.timeline.length})
                    </summary>
                    <ul className="mt-2 space-y-1.5">
                      {ticket.timeline.map((event, index) => (
                        <li key={`${event.at}-${String(index)}`} className="flex gap-2 text-xs text-muted-foreground">
                          <span className="shrink-0 font-mono">
                            {formatDateTime(event.at)}
                          </span>
                          <span>
                            <span className="font-medium text-foreground">
                              {TIMELINE_TYPE_LABELS[event.type] ?? event.type}
                            </span>
                            {event.message !== '' ? ` — ${event.message}` : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold">Reply to customer</h3>
            <div className="mt-3 space-y-2">
              <LabeledTextarea
                label="Message"
                value={replyText}
                onChange={onReplyTextChange}
                placeholder="Visible to the guest on their ticket."
              />
              <Button
                size="sm"
                disabled={replyPending || replyText.trim() === ''}
                onClick={onSendReply}
              >
                {replyPending ? 'Sending…' : 'Send reply'}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold">Internal note</h3>
            <div className="mt-3 space-y-2">
              <LabeledTextarea
                label="Note"
                value={noteText}
                onChange={onNoteTextChange}
                placeholder="Only the desk sees this."
              />
              <Button
                size="sm"
                variant="outline"
                disabled={notePending || noteText.trim() === ''}
                onClick={onAddNote}
              >
                {notePending ? 'Adding…' : 'Add note'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold">Details</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Requester</dt>
              <dd className="text-right">{shortId(ticket.requester.userId)}</dd>
            </div>
            {ticket.requester.email !== null ? (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="text-right">{ticket.requester.email}</dd>
              </div>
            ) : null}
            {ticket.requester.organizationId !== null ? (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Organization</dt>
                <dd className="text-right">{shortId(ticket.requester.organizationId)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Assignee</dt>
              <dd className="text-right">
                {ticket.assignee === null ? 'Unassigned' : ticket.assignee.name}
              </dd>
            </div>
            <div className="flex justify-between gap-2 border-t border-border pt-2">
              <dt className="text-muted-foreground">Response SLA</dt>
              <dd
                className={`text-right text-xs ${
                  ticket.sla.responseBreachedAt !== null ? 'text-urgent' : ''
                }`}
              >
                {overdueLabel(ticket.sla.responseDueAt, ticket.sla.responseBreachedAt)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Resolution SLA</dt>
              <dd
                className={`text-right text-xs ${
                  ticket.sla.resolutionBreachedAt !== null ? 'text-urgent' : ''
                }`}
              >
                {overdueLabel(ticket.sla.resolutionDueAt, ticket.sla.resolutionBreachedAt)}
              </dd>
            </div>
            <div className="flex justify-between gap-2 border-t border-border pt-2">
              <dt className="text-muted-foreground">Links</dt>
              <dd className="text-right text-xs">
                {[
                  ticket.links.orderId !== null ? `order ${shortId(ticket.links.orderId)}` : null,
                  ticket.links.eventId !== null ? `event ${shortId(ticket.links.eventId)}` : null,
                  ticket.links.venueId !== null ? `venue ${shortId(ticket.links.venueId)}` : null,
                  ticket.links.userId !== null ? `user ${shortId(ticket.links.userId)}` : null,
                ]
                  .filter((link): link is string => link !== null)
                  .join(', ') || 'None'}
              </dd>
            </div>
            {ticket.mergedInto !== null ? (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Merged into</dt>
                <dd className="text-right">{shortId(ticket.mergedInto)}</dd>
              </div>
            ) : null}
            {ticket.mergedFrom.length > 0 ? (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Merged from</dt>
                <dd className="text-right">{ticket.mergedFrom.map(shortId).join(', ')}</dd>
              </div>
            ) : null}
            {ticket.resolvedAt !== null ? (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Resolved</dt>
                <dd className="text-right text-xs">{formatDateTime(ticket.resolvedAt)}</dd>
              </div>
            ) : null}
            {ticket.closedAt !== null ? (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Closed</dt>
                <dd className="text-right text-xs">{formatDateTime(ticket.closedAt)}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold">Desk actions</h3>
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor={`assign-${ticket.id}`}>
                Assign to
              </label>
              <div className="mt-1 flex gap-2">
                <select
                  id={`assign-${ticket.id}`}
                  value={assigneeId}
                  onChange={(event) => {
                    onAssigneeChange(event.target.value);
                  }}
                  className={selectClass}
                >
                  <option value="">Choose…</option>
                  {assigneeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <Button size="sm" variant="outline" disabled={assignPending || assigneeId === ''} onClick={onAssign}>
                  {assignPending ? 'Assigning…' : 'Assign'}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground" htmlFor={`priority-${ticket.id}`}>
                Priority
              </label>
              <div className="mt-1 flex gap-2">
                <select
                  id={`priority-${ticket.id}`}
                  value={priorityDraft}
                  onChange={(event) => {
                    onPriorityDraftChange(event.target.value as SupportTicketPriority);
                  }}
                  className={selectClass}
                >
                  {SUPPORT_TICKET_PRIORITIES.map((value) => (
                    <option key={value} value={value}>
                      {SUPPORT_TICKET_PRIORITY_LABELS[value]}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={priorityPending || priorityDraft === ticket.priority}
                  onClick={onApplyPriority}
                >
                  {priorityPending ? 'Saving…' : 'Apply'}
                </Button>
              </div>
            </div>

            {!isClosed && !isResolved ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={transitionPending}
                  onClick={() => {
                    onTransition('escalate');
                  }}
                >
                  Escalate
                </Button>
              </div>
            ) : null}

            {!isResolved && !isClosed ? (
              <div>
                <label className="text-sm font-medium text-foreground" htmlFor={`resolve-${ticket.id}`}>
                  Resolve
                </label>
                <div className="mt-1 flex gap-2">
                  <TextField
                    label="Reason"
                    labelHidden
                    value={resolveReason}
                    onChange={(event) => {
                      onResolveReasonChange(event.target.value);
                    }}
                    placeholder="Resolution reason (audited)"
                    className="w-full"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={resolvePending || resolveReason.trim() === ''}
                    onClick={onResolve}
                  >
                    {resolvePending ? 'Resolving…' : 'Resolve'}
                  </Button>
                </div>
              </div>
            ) : null}

            {isClosed ? (
              <Button
                size="sm"
                variant="outline"
                disabled={transitionPending}
                onClick={() => {
                  onTransition('reopen');
                }}
              >
                Reopen
              </Button>
            ) : !isResolved ? (
              <Button
                size="sm"
                variant="outline"
                disabled={transitionPending}
                onClick={() => {
                  onTransition('close');
                }}
              >
                Close
              </Button>
            ) : null}

            <div>
              <label className="text-sm font-medium text-foreground" htmlFor={`merge-${ticket.id}`}>
                Merge duplicate
              </label>
              <div className="mt-1 flex gap-2">
                <TextField
                  label="Duplicate ticket id"
                  labelHidden
                  value={mergeTargetId}
                  onChange={(event) => {
                    onMergeTargetChange(event.target.value);
                  }}
                  placeholder="ticket id to fold in"
                  className="w-full"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={mergePending || mergeTargetId.trim() === ''}
                  onClick={onMerge}
                >
                  {mergePending ? 'Merging…' : 'Merge'}
                </Button>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <span className="text-sm font-medium text-foreground">Link to</span>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <TextField
                  label="Order id"
                  labelHidden
                  value={linkOrderId}
                  onChange={(event) => {
                    onLinkOrderIdChange(event.target.value);
                  }}
                  placeholder="Order id"
                />
                <TextField
                  label="Event id"
                  labelHidden
                  value={linkEventId}
                  onChange={(event) => {
                    onLinkEventIdChange(event.target.value);
                  }}
                  placeholder="Event id"
                />
                <TextField
                  label="Venue id"
                  labelHidden
                  value={linkVenueId}
                  onChange={(event) => {
                    onLinkVenueIdChange(event.target.value);
                  }}
                  placeholder="Venue id"
                />
                <TextField
                  label="User id"
                  labelHidden
                  value={linkUserId}
                  onChange={(event) => {
                    onLinkUserIdChange(event.target.value);
                  }}
                  placeholder="User id"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                disabled={
                  linkPending ||
                  (linkOrderId.trim() === '' &&
                    linkEventId.trim() === '' &&
                    linkVenueId.trim() === '' &&
                    linkUserId.trim() === '')
                }
                onClick={onLink}
              >
                {linkPending ? 'Linking…' : 'Link'}
              </Button>
            </div>

            <div className="border-t border-border pt-3">
              {isDeleted ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={transitionPending}
                  onClick={() => {
                    onTransition('restore');
                  }}
                >
                  Restore ticket
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={transitionPending}
                  onClick={() => {
                    onTransition('delete');
                  }}
                >
                  Delete (soft)
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}