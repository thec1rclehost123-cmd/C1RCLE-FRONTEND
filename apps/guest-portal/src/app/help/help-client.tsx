'use client';

import { useState } from 'react';

import { createApiClient, isApiClientError } from '@c1rcle/api-client';
import {
  submitSupportTicketSchema,
  supportTicketDtoSchema,
  supportTicketListResponseSchema,
  supportTicketMessageSchema,
} from '@c1rcle/contracts';
import { Button } from '@c1rcle/ui';

import type {
  SubmitSupportTicketInput,
  SupportTicketCategory,
  SupportTicketDto,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@c1rcle/contracts';

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  waiting_on_customer: 'Waiting on customer',
  escalated: 'Escalated',
  resolved: 'Resolved',
  closed: 'Closed',
};

const CATEGORY_LABELS: Record<SupportTicketCategory, string> = {
  account: 'Account',
  billing: 'Billing',
  order: 'Order',
  event: 'Event',
  technical: 'Technical',
  other: 'Other',
};

const PRIORITY_LABELS: Record<SupportTicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

/**
 * The Help BFF lives on this app's origin (NOT the gateway): pointing the
 * client at `window.location.origin` keeps these calls same-origin so the
 * httpOnly session cookie is sent, then the BFF forwards it to the gateway.
 */
const helpClient = createApiClient({
  baseUrl: typeof window === 'undefined' ? '' : window.location.origin,
});

function messageOf(error: unknown, fallback: string): string {
  return isApiClientError(error) && error.message !== '' ? error.message : fallback;
}

const helpDataSource = {
  async list(): Promise<SupportTicketDto[]> {
    const page = await helpClient.get({
      path: '/api/help/tickets',
      schema: supportTicketListResponseSchema,
    });
    return page.items;
  },

  async detail(ticketId: string): Promise<SupportTicketDto> {
    return helpClient.get({
      path: `/api/help/tickets/${ticketId}`,
      schema: supportTicketDtoSchema,
    });
  },

  async submit(input: SubmitSupportTicketInput): Promise<SupportTicketDto> {
    return helpClient.post({
      path: '/api/help/tickets',
      body: submitSupportTicketSchema.parse(input),
      schema: supportTicketDtoSchema,
    });
  },

  async message(ticketId: string, content: string): Promise<SupportTicketDto> {
    return helpClient.post({
      path: `/api/help/tickets/${ticketId}/messages`,
      body: supportTicketMessageSchema.parse({ content }),
      schema: supportTicketDtoSchema,
    });
  },
};

const inputClass =
  'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FF6842] focus:outline-none';

const labelClass = 'text-xs font-bold uppercase tracking-widest text-white/60';

export function HelpClient() {
  const [tickets, setTickets] = useState<SupportTicketDto[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicketCategory>('other');
  const [priority, setPriority] = useState<SupportTicketPriority>('medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SupportTicketDto | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  async function loadMyTickets() {
    setLoadingList(true);
    setListError(null);
    try {
      setTickets(await helpDataSource.list());
    } catch (error) {
      setListError(messageOf(error, 'Unable to load tickets.'));
    } finally {
      setLoadingList(false);
    }
  }

  async function openTicket(ticketId: string) {
    setSelectedId(ticketId);
    setDetailError(null);
    try {
      setDetail(await helpDataSource.detail(ticketId));
    } catch (error) {
      setDetailError(messageOf(error, 'Unable to load the ticket.'));
    }
  }

  async function handleSubmit() {
    if (subject.trim().length < 3 || description.trim().length < 10) {
      setSubmitError('Subject (3+ chars) and description (10+ chars) are required.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await helpDataSource.submit({
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
      });
      setSubmittedId(created.id);
      setSubject('');
      setDescription('');
      await loadMyTickets();
      await openTicket(created.id);
    } catch (error) {
      setSubmitError(messageOf(error, 'Unable to submit the request.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply() {
    if (selectedId === null || replyText.trim() === '') {
      return;
    }
    setSending(true);
    setReplyError(null);
    try {
      const updated = await helpDataSource.message(selectedId, replyText.trim());
      setDetail(updated);
      setReplyText('');
      await loadMyTickets();
    } catch (error) {
      setReplyError(messageOf(error, 'Unable to send the message.'));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">Help desk</h1>
        <p className="mt-2 text-sm text-white/60">
          Raise a support ticket and track it to resolution. Replies land here and on the admin
          desk.
        </p>
      </div>

      <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-xl">
        <h2 className="text-sm font-black uppercase tracking-widest text-white">New request</h2>
        <div className="mt-4 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="help-subject">
                Subject
              </label>
              <input
                id="help-subject"
                className={inputClass}
                value={subject}
                onChange={(event) => {
                  setSubject(event.target.value);
                }}
                placeholder="What can we help with?"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="help-category">
                Category
              </label>
              <select
                id="help-category"
                className={inputClass}
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value as SupportTicketCategory);
                }}
              >
                {(Object.keys(CATEGORY_LABELS) as SupportTicketCategory[]).map((value) => (
                  <option key={value} value={value} className="bg-zinc-900 text-white">
                    {CATEGORY_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="help-description">
              Description
            </label>
            <textarea
              id="help-description"
              className={`${inputClass} min-h-28`}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
              }}
              placeholder="Tell us what happened — order IDs or event names help us find it faster."
            />
          </div>
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="help-priority">
                Priority
              </label>
              <select
                id="help-priority"
                className={inputClass}
                value={priority}
                onChange={(event) => {
                  setPriority(event.target.value as SupportTicketPriority);
                }}
              >
                {(Object.keys(PRIORITY_LABELS) as SupportTicketPriority[]).map((value) => (
                  <option key={value} value={value} className="bg-zinc-900 text-white">
                    {PRIORITY_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
            <Button type="button" disabled={submitting} onClick={() => void handleSubmit()}>
              {submitting ? 'Submitting…' : 'Submit request'}
            </Button>
          </div>
          {submitError !== null ? (
            <p role="alert" className="text-sm text-red-300">
              {submitError}
            </p>
          ) : null}
          {submittedId !== null ? <p className="text-sm text-emerald-300">Request received. Track it below.</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-white">My tickets</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadMyTickets()}>
            Refresh
          </Button>
        </div>

        {listError !== null ? (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {listError}
          </p>
        ) : loadingList ? (
          <p className="mt-4 text-sm text-white/50">Loading…</p>
        ) : tickets.length === 0 ? (
          <p className="mt-4 text-sm text-white/50">
            {submittedId === null
              ? 'No tickets yet — raise your first request above.'
              : 'Nothing here yet.'}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <button
                  type="button"
                  onClick={() => void openTicket(ticket.id)}
                  className="flex w-full items-center justify-between gap-4 py-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {ticket.subject}
                    </span>
                    <span className="block text-xs text-white/50">
                      {CATEGORY_LABELS[ticket.category]} · updated{' '}
                      {new Date(ticket.updatedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-xs font-medium text-white/70">
                    {STATUS_LABELS[ticket.status]}
                  </span>
                </button>
                {selectedId === ticket.id && detail?.id === ticket.id ? (
                  <TicketThread
                    ticket={detail}
                    replyText={replyText}
                    onReplyTextChange={setReplyText}
                    onSend={() => void handleReply()}
                    sending={sending}
                    error={replyError}
                    detailError={detailError}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TicketThread({
  ticket,
  replyText,
  onReplyTextChange,
  onSend,
  sending,
  error,
  detailError,
}: {
  readonly ticket: SupportTicketDto;
  readonly replyText: string;
  readonly onReplyTextChange: (value: string) => void;
  readonly onSend: () => void;
  readonly sending: boolean;
  readonly error: string | null;
  readonly detailError: string | null;
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-black/40 p-4">
      {detailError !== null ? (
        <p role="alert" className="text-sm text-red-300">
          {detailError}
        </p>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-white/80">{ticket.description}</p>
          <div className="mt-4 space-y-3">
            {ticket.messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg border border-white/10 px-3 py-2 text-sm ${
                  message.senderRole === 'customer'
                    ? 'bg-white/[0.06] text-white'
                    : 'bg-[#FF6842]/10 text-white'
                }`}
              >
                <p className="text-xs text-white/50">
                  {message.senderRole === 'admin' ? 'C1RCLE support' : 'You'} ·{' '}
                  {new Date(message.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <textarea
              className={`${inputClass} min-h-20 flex-1`}
              value={replyText}
              onChange={(event) => {
                onReplyTextChange(event.target.value);
              }}
              placeholder="Add a reply…"
            />
            <Button
              type="button"
              variant="secondary"
              disabled={sending || replyText.trim() === ''}
              onClick={onSend}
            >
              {sending ? 'Sending…' : 'Send'}
            </Button>
          </div>
          {error !== null ? (
            <p role="alert" className="mt-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}