'use client';

import { useState, useEffect, useCallback, useMemo, useRef, type FormEvent } from 'react';
import { 
  LifeBuoy, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  RotateCcw, 
  AlertTriangle, 
  School, 
  User, 
  Mail, 
  Check, 
  X,
  MessageSquare,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui';
import { PageHeading, EmptyState, StatusPill, StatCard } from '@/components/WorkspaceUI';
import { apiClient } from '@/lib/api-client';
import { messageFor, dateLabel } from '@/lib/workspace';

interface Ticket {
  id: string;
  tenantId: string;
  schoolName?: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  createdBy: string;
  creatorName?: string;
  creatorEmail?: string;
  creatorRole?: string;
  createdAt: string;
  updatedAt: string;
}

export function AdminSupportWorkspace() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [schoolFilter, setSchoolFilter] = useState<string>('ALL');

  // Solve Dialog State
  const [resolvingTicket, setResolvingTicket] = useState<Ticket | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [submittingSolve, setSubmittingSolve] = useState(false);
  const solveDialog = useRef<HTMLDialogElement>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get<Ticket[]>('/admin/tickets');
      setTickets(response.data || []);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (resolvingTicket) {
      solveDialog.current?.showModal();
    } else {
      solveDialog.current?.close();
    }
  }, [resolvingTicket]);

  // Unique schools for filter dropdown
  const schools = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach(t => {
      if (t.schoolName) set.add(t.schoolName);
    });
    return Array.from(set).sort();
  }, [tickets]);

  // Metrics
  const metrics = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'OPEN').length,
      inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
      resolved: tickets.filter(t => t.status === 'RESOLVED').length,
      urgent: tickets.filter(t => t.priority === 'URGENT' && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length
    };
  }, [tickets]);

  // Filtered tickets
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter(t => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (schoolFilter !== 'ALL' && t.schoolName !== schoolFilter) return false;
      if (!q) return true;
      return (
        t.subject.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.schoolName && t.schoolName.toLowerCase().includes(q)) ||
        (t.creatorName && t.creatorName.toLowerCase().includes(q)) ||
        (t.creatorEmail && t.creatorEmail.toLowerCase().includes(q))
      );
    });
  }, [tickets, search, statusFilter, priorityFilter, schoolFilter]);

  // Direct status update
  const handleStatusUpdate = async (ticket: Ticket, newStatus: Ticket['status']) => {
    if (busyId) return;
    setBusyId(ticket.id);
    setError('');
    try {
      await apiClient.patch('/admin/tickets/' + ticket.id, {
        data: { status: newStatus }
      });
      setNotice(`Ticket "${ticket.subject}" marked as ${newStatus.replace('_', ' ')}.`);
      await loadTickets();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusyId(null);
    }
  };

  // Direct priority update
  const handlePriorityUpdate = async (ticket: Ticket, newPriority: Ticket['priority']) => {
    if (busyId) return;
    setBusyId(ticket.id);
    setError('');
    try {
      await apiClient.patch('/admin/tickets/' + ticket.id, {
        data: { priority: newPriority }
      });
      setNotice(`Priority updated to ${newPriority} for "${ticket.subject}".`);
      await loadTickets();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusyId(null);
    }
  };

  // Submit Solve Dialog
  const handleSolveSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!resolvingTicket || submittingSolve) return;
    setSubmittingSolve(true);
    setError('');

    try {
      let updatedDescription = resolvingTicket.description;
      if (resolutionNote.trim()) {
        const timeStr = new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        updatedDescription += `\n\n--- [Platform Admin Resolution - ${timeStr}] ---\n${resolutionNote.trim()}`;
      }

      await apiClient.patch('/admin/tickets/' + resolvingTicket.id, {
        data: {
          status: 'RESOLVED',
          description: updatedDescription
        }
      });

      setNotice(`Ticket "${resolvingTicket.subject}" solved and marked as RESOLVED.`);
      setResolvingTicket(null);
      setResolutionNote('');
      await loadTickets();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setSubmittingSolve(false);
    }
  };

  const priorityBadgeClass = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="resource-workspace">
      <PageHeading
        eyebrow="PLATFORM SUPPORT & HELPDESK"
        title="Support tickets"
        description="Review, manage, and solve support requests submitted by all connected school communities."
        actions={
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
            disabled={loading}
            onClick={() => void loadTickets()}
          >
            Refresh
          </Button>
        }
      />

      {notice && (
        <div role="status" className="state-box success flex items-center justify-between gap-4 mb-5">
          <span>{notice}</span>
          <button className="icon-button" aria-label="Dismiss notice" onClick={() => setNotice('')}>
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="state-box mb-5">
          {error}
          <button disabled={loading} onClick={() => void loadTickets()} className="underline ml-3">
            Retry
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Tickets"
          value={metrics.total}
          note="Across all schools"
          icon={LifeBuoy}
        />
        <StatCard
          label="Open / Pending"
          value={metrics.open}
          note={metrics.open > 0 ? "Needs platform resolution" : "All caught up"}
          icon={AlertTriangle}
        />
        <StatCard
          label="In Progress"
          value={metrics.inProgress}
          note="Currently being worked on"
          icon={Clock}
        />
        <StatCard
          label="Resolved"
          value={metrics.resolved}
          note="Successfully solved"
          icon={CheckCircle2}
        />
      </div>

      {/* Filter and Search Surface */}
      <section className="records-surface mb-6 p-4 rounded-xl border border-gray-200 bg-white" aria-label="Ticket filters">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4">
          <div className="search-field w-full md:w-96">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search by subject, message, school or user..."
              aria-label="Search tickets"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Priority Filter */}
            <div className="flex items-center gap-1 text-sm">
              <span className="text-gray-500 text-xs font-semibold uppercase">Priority:</span>
              <select
                className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-800"
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                aria-label="Filter by priority"
              >
                <option value="ALL">All priorities</option>
                <option value="URGENT">Urgent only</option>
                <option value="HIGH">High</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* School Filter */}
            {schools.length > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-500 text-xs font-semibold uppercase">School:</span>
                <select
                  className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-800 max-w-xs"
                  value={schoolFilter}
                  onChange={e => setSchoolFilter(e.target.value)}
                  aria-label="Filter by school"
                >
                  <option value="ALL">All schools</option>
                  {schools.map(name => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || schoolFilter !== 'ALL') && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setPriorityFilter('ALL');
                  setSchoolFilter('ALL');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Status Tabs */}
        <div className="record-status-tabs" role="group" aria-label="Status shortcuts">
          <button
            aria-pressed={statusFilter === 'ALL'}
            onClick={() => setStatusFilter('ALL')}
          >
            All tickets
            <span>{tickets.length}</span>
          </button>
          <button
            aria-pressed={statusFilter === 'OPEN'}
            onClick={() => setStatusFilter('OPEN')}
          >
            Open
            <span>{metrics.open}</span>
          </button>
          <button
            aria-pressed={statusFilter === 'IN_PROGRESS'}
            onClick={() => setStatusFilter('IN_PROGRESS')}
          >
            In progress
            <span>{metrics.inProgress}</span>
          </button>
          <button
            aria-pressed={statusFilter === 'RESOLVED'}
            onClick={() => setStatusFilter('RESOLVED')}
          >
            Resolved
            <span>{metrics.resolved}</span>
          </button>
          <button
            aria-pressed={statusFilter === 'CLOSED'}
            onClick={() => setStatusFilter('CLOSED')}
          >
            Closed
            <span>{tickets.filter(t => t.status === 'CLOSED').length}</span>
          </button>
        </div>
      </section>

      {/* Ticket List */}
      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading tickets">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-44 rounded-xl" />
          ))}
        </div>
      ) : !filtered.length ? (
        <EmptyState
          title={search || statusFilter !== 'ALL' ? 'No matching tickets found' : 'No support tickets recorded yet'}
          description={
            search || statusFilter !== 'ALL'
              ? 'Try modifying your search or changing the filter options.'
              : 'Support requests opened by schools across the platform will appear here.'
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(ticket => {
            const isBusy = busyId === ticket.id;
            const isResolved = ticket.status === 'RESOLVED';
            const isClosed = ticket.status === 'CLOSED';

            return (
              <article
                key={ticket.id}
                className={`panel p-6 border transition-all ${
                  ticket.priority === 'URGENT' && !isResolved && !isClosed
                    ? 'border-red-300 bg-red-50/20'
                    : isResolved
                    ? 'border-emerald-200 bg-white'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      <School size={13} />
                      {ticket.schoolName || 'Platform School'}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border uppercase tracking-wider ${priorityBadgeClass(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority === 'URGENT' && <AlertTriangle size={12} />}
                      {ticket.priority} PRIORITY
                    </span>

                    <StatusPill value={ticket.status} />
                  </div>

                  <span className="text-xs text-gray-500">
                    Opened {dateLabel(ticket.createdAt)}
                  </span>
                </div>

                {/* Content */}
                <div className="py-4">
                  <h2 className="text-base font-bold text-gray-900 mb-2">
                    {ticket.subject}
                  </h2>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {ticket.description}
                  </p>
                </div>

                {/* Submitter Info */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <User size={14} className="text-gray-400" />
                      {ticket.creatorName || 'Staff Member'}
                      {ticket.creatorRole && (
                        <span className="text-gray-400">({ticket.creatorRole.replace('_', ' ')})</span>
                      )}
                    </span>
                    {ticket.creatorEmail && (
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <Mail size={13} className="text-gray-400" />
                        {ticket.creatorEmail}
                      </span>
                    )}
                  </div>

                  {/* Priority Switcher */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Change priority:</span>
                    <select
                      className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 disabled:opacity-50"
                      disabled={isBusy}
                      value={ticket.priority}
                      onChange={e => handlePriorityUpdate(ticket, e.target.value as Ticket['priority'])}
                      aria-label="Change ticket priority"
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons: Solve and status controls */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 mt-2 border-t border-gray-100">
                  {/* Solve / Resolve Ticket Button */}
                  {!isResolved && (
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<CheckCircle2 size={16} />}
                      disabled={isBusy}
                      onClick={() => {
                        setResolvingTicket(ticket);
                        setResolutionNote('');
                      }}
                    >
                      Solve / Resolve Ticket
                    </Button>
                  )}

                  {/* Mark In Progress Button */}
                  {ticket.status === 'OPEN' && (
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Clock size={15} />}
                      disabled={isBusy}
                      onClick={() => handleStatusUpdate(ticket, 'IN_PROGRESS')}
                    >
                      Mark In Progress
                    </Button>
                  )}

                  {/* Close Ticket Button */}
                  {ticket.status !== 'CLOSED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<XCircle size={15} />}
                      disabled={isBusy}
                      onClick={() => handleStatusUpdate(ticket, 'CLOSED')}
                    >
                      Close Ticket
                    </Button>
                  )}

                  {/* Reopen Ticket Button */}
                  {(isResolved || isClosed) && (
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<RotateCcw size={15} />}
                      disabled={isBusy}
                      onClick={() => handleStatusUpdate(ticket, 'OPEN')}
                    >
                      Reopen Ticket
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Solve Ticket Modal */}
      <dialog
        ref={solveDialog}
        className="modal record-drawer"
        aria-labelledby="solve-dialog-title"
        onCancel={e => {
          if (submittingSolve) e.preventDefault();
          else setResolvingTicket(null);
        }}
      >
        {resolvingTicket && (
          <div className="p-6 space-y-5">
            <div className="modal-header pb-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <span className="eyebrow text-emerald-700">TICKET RESOLUTION</span>
                <h2 id="solve-dialog-title" className="text-lg font-bold text-gray-900 mt-1">
                  Solve Support Ticket
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  {resolvingTicket.schoolName ? `${resolvingTicket.schoolName} · ` : ''}
                  {resolvingTicket.subject}
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                disabled={submittingSolve}
                onClick={() => setResolvingTicket(null)}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSolveSubmit} className="space-y-4">
              <div className="field">
                <label htmlFor="solve-resolution-note" className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Resolution notes / instructions for the school (Optional)
                </label>
                <textarea
                  id="solve-resolution-note"
                  rows={4}
                  maxLength={5000}
                  className="w-full text-sm border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Issue verified and solved. The school subscription configuration has been updated and access is restored."
                  value={resolutionNote}
                  disabled={submittingSolve}
                  onChange={e => setResolutionNote(e.target.value)}
                />
                <span className="text-xs text-gray-500 mt-1 block">
                  This resolution note will be recorded and visible to the school staff when checking their support ticket.
                </span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>
                  Confirming will update this ticket status to <strong>RESOLVED</strong> across the platform.
                </span>
              </div>

              <div className="modal-actions pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={submittingSolve}
                  onClick={() => setResolvingTicket(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={submittingSolve}
                  leftIcon={<Check size={16} />}
                >
                  Solve & Mark as Resolved
                </Button>
              </div>
            </form>
          </div>
        )}
      </dialog>
    </div>
  );
}
