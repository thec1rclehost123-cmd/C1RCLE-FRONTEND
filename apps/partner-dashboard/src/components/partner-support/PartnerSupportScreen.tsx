'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { AddIcon, CloseIcon, SearchIcon, SendIcon, SupportIcon } from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';
import { SUPPORT_DEPARTMENTS } from '@/lib/support/support-departments';
import {
  createPartnerTicket,
  listPartnerTickets,
  sendPartnerTicketReply,
} from '@/lib/support/support-repository';

import styles from './PartnerSupport.module.css';

import type { PartnerSupportTicket } from '@/lib/support/support-repository';
import type { SupportTicketPriority } from '@c1rcle/contracts';

interface PartnerSupportScreenProps {
  readonly initialTickets?: readonly PartnerSupportTicket[];
}

export function PartnerSupportScreen({ initialTickets }: PartnerSupportScreenProps) {
  const auth = useDashboardAuth();
  const [tickets, setTickets] = useState<readonly PartnerSupportTicket[]>(initialTickets ?? []);
  const [loading, setLoading] = useState(!initialTickets);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [query, setQuery] = useState('');

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Form State
  const defaultDepartment = SUPPORT_DEPARTMENTS[0]!;
  const [departmentName, setDepartmentName] = useState<string>(defaultDepartment.name);
  const [subcategoryName, setSubcategoryName] = useState<string>(
    defaultDepartment.subcategories[0] ?? 'General',
  );
  const [priority, setPriority] = useState<SupportTicketPriority>('medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reply State
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      const items = await listPartnerTickets();
      setTickets(items);
    } catch {
      // Fallback already handled inside repository
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialTickets) {
      void loadTickets();
    }
  }, [initialTickets, loadTickets]);

  const selectedDepartment = useMemo(
    () =>
      SUPPORT_DEPARTMENTS.find((dept) => dept.name === departmentName) ?? defaultDepartment,
    [defaultDepartment, departmentName],
  );

  const handleDepartmentChange = (deptName: string) => {
    setDepartmentName(deptName);
    const targetDept = SUPPORT_DEPARTMENTS.find((d) => d.name === deptName);
    const firstSub = targetDept?.subcategories[0];
    if (firstSub) {
      setSubcategoryName(firstSub);
    }
  };

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId],
  );

  const metrics = useMemo(() => {
    const total = tickets.length;
    const active = tickets.filter(
      (t) => t.status !== 'closed' && t.status !== 'resolved' && !t.isMerged,
    ).length;
    const closed = tickets.filter(
      (t) => t.status === 'closed' || t.status === 'resolved' || t.isMerged,
    ).length;
    return { total, active, closed };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((t) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' &&
          t.status !== 'closed' &&
          t.status !== 'resolved' &&
          !t.isMerged) ||
        (filter === 'closed' &&
          (t.status === 'closed' || t.status === 'resolved' || t.isMerged));

      const matchesQuery =
        q.length === 0 ||
        t.cleanSubject.toLowerCase().includes(q) ||
        t.shortId.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        t.subcategory.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q);

      return matchesFilter && matchesQuery;
    });
  }, [tickets, filter, query]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim().length < 3) {
      setFormError('Subject must be at least 3 characters.');
      return;
    }
    if (description.trim().length < 10) {
      setFormError('Description must be at least 10 characters.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const created = await createPartnerTicket({
        departmentName,
        subcategoryName,
        priority,
        subject: subject.trim(),
        description: description.trim(),
        organizationId: auth.profile?.activeMembership?.partnerId ?? null,
      });

      setTickets((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setSubject('');
      setDescription('');
      setSelectedTicketId(created.id);
    } catch {
      setFormError('Could not submit ticket. Please check your input and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || replyText.trim().length === 0 || selectedTicket.isMerged) return;

    setReplying(true);
    try {
      const updated = await sendPartnerTicketReply(selectedTicket.id, replyText.trim());
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setReplyText('');
    } catch {
      // Gracefully handle or keep text
    } finally {
      setReplying(false);
    }
  };

  const getStatusBadge = (ticket: PartnerSupportTicket) => {
    if (ticket.isMerged) {
      return <span className={`${styles['statusPill']} ${styles['statusMerged']}`}>MERGED</span>;
    }

    switch (ticket.status) {
      case 'open':
        return <span className={`${styles['statusPill']} ${styles['statusOpen']}`}>OPEN</span>;
      case 'in_progress':
        return (
          <span className={`${styles['statusPill']} ${styles['statusInProgress']}`}>IN PROGRESS</span>
        );
      case 'resolved':
        return (
          <span className={`${styles['statusPill']} ${styles['statusResolved']}`}>RESOLVED</span>
        );
      case 'closed':
      default:
        return <span className={`${styles['statusPill']} ${styles['statusClosed']}`}>CLOSED</span>;
    }
  };

  const getPriorityBadge = (p: SupportTicketPriority) => {
    switch (p) {
      case 'urgent':
        return <span className={`${styles['priorityPill']} ${styles['priorityUrgent']}`}>URGENT</span>;
      case 'high':
        return <span className={`${styles['priorityPill']} ${styles['priorityHigh']}`}>HIGH</span>;
      case 'low':
        return <span className={`${styles['priorityPill']} ${styles['priorityLow']}`}>LOW</span>;
      case 'medium':
      default:
        return <span className={`${styles['priorityPill']} ${styles['priorityMedium']}`}>MED</span>;
    }
  };

  const formatShortDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <section className={styles['page']} aria-label="Partner Support Desk">
      <header className={styles['pageHeader']}>
        <div>
          <span className={styles['eyebrow']}>Support Desk</span>
          <h1>Support Desk</h1>
          <p>
            Submit operational requests, get assistance with events, payouts, and dashboard features.
          </p>
        </div>
        <button
          type="button"
          className={styles['primaryButton']}
          onClick={() => setIsCreateModalOpen(true)}
          aria-label="Raise Support Ticket"
        >
          <AddIcon size={16} aria-hidden="true" />
          <span>Raise Ticket</span>
        </button>
      </header>

      {/* Metrics Row */}
      <div className={styles['metricsRow']}>
        <div className={styles['metricCard']}>
          <span>Total Requests</span>
          <strong>{metrics.total}</strong>
        </div>
        <div className={styles['metricCard']}>
          <span>Active Inquiries</span>
          <strong>{metrics.active}</strong>
        </div>
        <div className={styles['metricCard']}>
          <span>Resolved / Merged</span>
          <strong>{metrics.closed}</strong>
        </div>
      </div>

      {/* Main Ticket Panel */}
      <section className={styles['mainPanel']} aria-label="Support Tickets">
        <div className={styles['toolbar']}>
          <div className={styles['filterTabs']} role="tablist" aria-label="Filter tickets by status">
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'all'}
              className={`${styles['filterTab']} ${filter === 'all' ? styles['active'] : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({metrics.total})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'active'}
              className={`${styles['filterTab']} ${filter === 'active' ? styles['active'] : ''}`}
              onClick={() => setFilter('active')}
            >
              Active ({metrics.active})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'closed'}
              className={`${styles['filterTab']} ${filter === 'closed' ? styles['active'] : ''}`}
              onClick={() => setFilter('closed')}
            >
              Closed ({metrics.closed})
            </button>
          </div>

          <div className={styles['searchBox']}>
            <SearchIcon size={16} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by topic, ID, department..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search support tickets"
            />
          </div>
        </div>

        {/* Tickets List */}
        <div className={styles['ticketsList']}>
          {loading ? (
            <div className={styles['emptyState']}>
              <p>Loading support desk...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className={styles['emptyState']}>
              <SupportIcon size={32} aria-hidden="true" />
              <p>
                {tickets.length === 0
                  ? 'No support requests yet. Raise your first ticket to get assistance.'
                  : 'No support tickets match your filter.'}
              </p>
              <button
                type="button"
                className={styles['primaryButton']}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Raise a ticket
              </button>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className={styles['ticketRow']}
                onClick={() => setSelectedTicketId(ticket.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedTicketId(ticket.id);
                  }
                }}
                aria-label={`View ticket #${ticket.shortId}: ${ticket.cleanSubject}`}
              >
                <div className={styles['ticketMain']}>
                  <div className={styles['ticketMetaHeader']}>
                    <span className={styles['shortId']}>#{ticket.shortId}</span>
                    <span className={styles['deptBadge']}>{ticket.department}</span>
                    <span className={styles['subBadge']}>· {ticket.subcategory}</span>
                  </div>
                  <strong className={styles['ticketSubject']}>{ticket.cleanSubject}</strong>
                  <span className={styles['ticketSnippet']}>{ticket.description}</span>
                </div>

                <div className={styles['ticketEnd']}>
                  {getPriorityBadge(ticket.priority)}
                  {getStatusBadge(ticket)}
                  <span className={styles['subBadge']}>{formatShortDate(ticket.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Ticket Details & Conversation Drawer */}
      {selectedTicket && (
        <div
          className={styles['drawerBackdrop']}
          onClick={() => setSelectedTicketId(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-ticket-title"
        >
          <div className={styles['drawer']} onClick={(e) => e.stopPropagation()}>
            <header className={styles['drawerHeader']}>
              <div className={styles['drawerHeaderTitle']}>
                <div className={styles['ticketMetaHeader']}>
                  <span className={styles['shortId']}>#{selectedTicket.shortId}</span>
                  <span className={styles['deptBadge']}>{selectedTicket.department}</span>
                  {getPriorityBadge(selectedTicket.priority)}
                  {getStatusBadge(selectedTicket)}
                </div>
                <h2 id="drawer-ticket-title">{selectedTicket.cleanSubject}</h2>
              </div>
              <button
                type="button"
                className={styles['closeButton']}
                onClick={() => setSelectedTicketId(null)}
                aria-label="Close ticket conversation"
              >
                <CloseIcon size={20} aria-hidden="true" />
              </button>
            </header>

            {/* Merge Notification Banner (per specs in ANIL_SUPPORT_TAB.md) */}
            {selectedTicket.isMerged && (
              <div className={styles['mergeBanner']}>
                <div className={styles['mergeBannerContent']}>
                  <strong>Merged Ticket</strong>
                  <p>
                    This ticket has been consolidated into primary ticket{' '}
                    <b>#{selectedTicket.mergedIntoShortId ?? selectedTicket.mergedInto}</b>.
                  </p>
                </div>
              </div>
            )}

            <div className={styles['threadArea']}>
              {selectedTicket.messages.map((msg) => {
                const isCustomer = msg.senderRole === 'customer';
                const hasMergedPrefix = msg.content.startsWith('[Merged from ticket');
                return (
                  <div
                    key={msg.id}
                    className={`${styles['messageBubble']} ${
                      isCustomer ? styles['messagePartner'] : styles['messageAdmin']
                    }`}
                  >
                    <div className={styles['messageHeader']}>
                      <span className={styles['senderName']}>
                        {isCustomer ? 'Partner Inquiry' : msg.senderName || 'C1RCLE Desk'}
                      </span>
                      <span className={styles['messageTime']}>{formatShortDate(msg.createdAt)}</span>
                    </div>
                    {hasMergedPrefix && (
                      <span className={styles['mergedPrefixTag']}>Consolidated Message</span>
                    )}
                    <div className={styles['messageContent']}>{msg.content}</div>
                  </div>
                );
              })}
            </div>

            <footer className={styles['drawerFooter']}>
              {selectedTicket.isMerged || selectedTicket.status === 'closed' ? (
                <div className={styles['lockedNotice']}>
                  Replies are locked for this {selectedTicket.isMerged ? 'merged' : 'closed'} ticket.
                </div>
              ) : (
                <form className={styles['replyForm']} onSubmit={handleReplySubmit}>
                  <textarea
                    className={styles['textarea']}
                    style={{ minHeight: '80px' }}
                    placeholder="Type your response to the support team..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    aria-label="Reply to ticket"
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      className={styles['primaryButton']}
                      disabled={replying || replyText.trim().length === 0}
                    >
                      <SendIcon size={14} aria-hidden="true" />
                      <span>{replying ? 'Sending...' : 'Send Reply'}</span>
                    </button>
                  </div>
                </form>
              )}
            </footer>
          </div>
        </div>
      )}

      {/* Raise Support Ticket Modal */}
      {isCreateModalOpen && (
        <div
          className={styles['modalBackdrop']}
          onClick={() => setIsCreateModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="raise-ticket-title"
        >
          <div className={styles['modal']} onClick={(e) => e.stopPropagation()}>
            <header className={styles['modalHeader']}>
              <div>
                <h2 id="raise-ticket-title">Raise Support Ticket</h2>
                <p>Route your inquiry directly to the designated department.</p>
              </div>
              <button
                type="button"
                className={styles['closeButton']}
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Close raise ticket modal"
              >
                <CloseIcon size={20} aria-hidden="true" />
              </button>
            </header>

            <form className={styles['modalForm']} onSubmit={handleCreateSubmit}>
              {formError && (
                <div style={{ color: '#f87171', fontSize: '12px', fontWeight: 600 }}>
                  {formError}
                </div>
              )}

              {/* Department Selector */}
              <div className={styles['formGroup']}>
                <label htmlFor="dept-select">Department</label>
                <select
                  id="dept-select"
                  className={styles['select']}
                  value={departmentName}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                >
                  {SUPPORT_DEPARTMENTS.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory Selector */}
              <div className={styles['formGroup']}>
                <label htmlFor="sub-select">Issue Category</label>
                <select
                  id="sub-select"
                  className={styles['select']}
                  value={subcategoryName}
                  onChange={(e) => setSubcategoryName(e.target.value)}
                >
                  {(selectedDepartment?.subcategories ?? []).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Selector */}
              <div className={styles['formGroup']}>
                <label>Priority</label>
                <div className={styles['priorityGroup']}>
                  {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                    <button
                      type="button"
                      key={p}
                      className={`${styles['priorityBtn']} ${
                        priority === p ? styles['active'] : ''
                      }`}
                      onClick={() => setPriority(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className={styles['formGroup']}>
                <label htmlFor="ticket-subject">Subject</label>
                <input
                  id="ticket-subject"
                  type="text"
                  className={styles['input']}
                  placeholder="Brief summary of the issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className={styles['formGroup']}>
                <label htmlFor="ticket-desc">Details & Context</label>
                <textarea
                  id="ticket-desc"
                  className={styles['textarea']}
                  placeholder="Explain what happened, including any relevant event names, payout IDs, or error messages..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className={styles['modalFooter']}>
                <button
                  type="button"
                  className={styles['secondaryButton']}
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles['primaryButton']}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
