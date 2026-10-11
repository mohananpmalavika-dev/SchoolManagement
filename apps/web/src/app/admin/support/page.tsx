'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, LoadingSpinner, Alert } from '@/components/ui';

interface SupportTicket {
  id: string;
  schoolName: string;
  schoolId: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  category: 'TECHNICAL' | 'BILLING' | 'FEATURE_REQUEST' | 'BUG' | 'OTHER';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  responseTime?: number;
  assignedTo?: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'MAINTENANCE' | 'UPDATE';
  targetAudience: 'ALL' | 'ACTIVE_SCHOOLS' | 'TRIAL_SCHOOLS';
  publishedAt: string;
  expiresAt?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'EXPIRED';
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'tickets' | 'announcements'>('tickets');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      const [ticketsRes, announcementsRes] = await Promise.all([
        fetch('http://localhost:3001/api/admin/support/tickets', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('http://localhost:3001/api/admin/announcements', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (!ticketsRes.ok || !announcementsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [ticketsData, announcementsData] = await Promise.all([
        ticketsRes.json(),
        announcementsRes.json(),
      ]);

      setTickets(ticketsData);
      setAnnouncements(announcementsData);
    } catch (err) {
      setError('Failed to load support data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTickets = () => {
    let filtered = tickets;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.schoolName.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === filterPriority);
    }

    return filtered;
  };

  const getPriorityBadgeVariant = (priority: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (priority) {
      case 'CRITICAL': return 'danger';
      case 'HIGH': return 'danger';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case 'RESOLVED': return 'success';
      case 'CLOSED': return 'default';
      case 'IN_PROGRESS': return 'warning';
      case 'OPEN': return 'danger';
      default: return 'default';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'MAINTENANCE': return 'bg-red-100 text-red-700';
      case 'WARNING': return 'bg-yellow-100 text-yellow-700';
      case 'UPDATE': return 'bg-blue-100 text-blue-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3001/api/admin/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update ticket');

      alert('Ticket status updated');
      fetchData();
    } catch (err) {
      alert('Failed to update ticket');
      console.error(err);
    }
  };

  const handlePublishAnnouncement = async (announcementId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3001/api/admin/announcements/${announcementId}/publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to publish announcement');

      alert('Announcement published successfully');
      fetchData();
    } catch (err) {
      alert('Failed to publish announcement');
      console.error(err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const filteredTickets = getFilteredTickets();
  const openTickets = tickets.filter(t => t.status === 'OPEN').length;
  const criticalTickets = tickets.filter(t => t.priority === 'CRITICAL' && t.status !== 'RESOLVED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-8">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Support & Communication</h1>
          <p className="text-gray-600 mt-1">Manage support tickets and announcements</p>
        </div>

        {/* Critical Alert */}
        {criticalTickets > 0 && (
          <Alert variant="danger" className="mb-6">
            <strong>⚠️ {criticalTickets} Critical Ticket{criticalTickets > 1 ? 's' : ''} Pending</strong>
            <p className="text-sm mt-1">Immediate attention required</p>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="text-center">
            <div className="text-sm text-gray-600 mb-1">Open Tickets</div>
            <div className="text-2xl font-bold text-red-600">{openTickets}</div>
          </Card>
          <Card className="text-center">
            <div className="text-sm text-gray-600 mb-1">In Progress</div>
            <div className="text-2xl font-bold text-yellow-600">
              {tickets.filter(t => t.status === 'IN_PROGRESS').length}
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-sm text-gray-600 mb-1">Resolved Today</div>
            <div className="text-2xl font-bold text-green-600">
              {tickets.filter(t => {
                const today = new Date().toDateString();
                return t.status === 'RESOLVED' && new Date(t.updatedAt).toDateString() === today;
              }).length}
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-sm text-gray-600 mb-1">Active Announcements</div>
            <div className="text-2xl font-bold text-blue-600">
              {announcements.filter(a => a.status === 'PUBLISHED').length}
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          <Button
            variant={activeTab === 'tickets' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('tickets')}
          >
            Support Tickets ({tickets.length})
          </Button>
          <Button
            variant={activeTab === 'announcements' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('announcements')}
          >
            Announcements ({announcements.length})
          </Button>
        </div>

        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

        {/* Support Tickets Tab */}
        {activeTab === 'tickets' && (
          <>
            {/* Filters */}
            <Card className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Input
                    type="text"
                    placeholder="Search by school or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Status</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
                <div>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Priority</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Tickets List */}
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <Card key={ticket.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(ticket.status)}>
                          {ticket.status}
                        </Badge>
                        <span className="text-xs text-gray-500">{ticket.category}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{ticket.subject}</h3>
                      <p className="text-sm text-gray-600 mb-2">{ticket.description.substring(0, 100)}...</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>🏫 {ticket.schoolName}</span>
                        <span>👤 {ticket.createdBy}</span>
                        <span>🕐 {formatTimestamp(ticket.createdAt)}</span>
                        {ticket.responseTime && (
                          <span className={ticket.responseTime > 24 ? 'text-red-600' : ''}>
                            Response: {formatDuration(ticket.responseTime)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-3 border-t border-gray-200">
                    {ticket.status === 'OPEN' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUpdateTicketStatus(ticket.id, 'IN_PROGRESS')}
                      >
                        Start Working
                      </Button>
                    )}
                    {ticket.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUpdateTicketStatus(ticket.id, 'RESOLVED')}
                      >
                        Mark Resolved
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      Contact School
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <>
            <div className="flex justify-end mb-6">
              <Button variant="primary" onClick={() => setShowAnnouncementModal(true)}>
                + Create Announcement
              </Button>
            </div>

            <div className="space-y-4">
              {announcements.map((announcement) => (
                <Card key={announcement.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeBadgeColor(announcement.type)}`}>
                          {announcement.type}
                        </span>
                        <Badge variant={announcement.status === 'PUBLISHED' ? 'success' : 'default'}>
                          {announcement.status}
                        </Badge>
                        <span className="text-xs text-gray-500">Target: {announcement.targetAudience}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{announcement.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{announcement.message}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Published: {formatTimestamp(announcement.publishedAt)}</span>
                        {announcement.expiresAt && (
                          <span>Expires: {formatTimestamp(announcement.expiresAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {announcement.status === 'DRAFT' && (
                    <div className="flex space-x-2 pt-3 border-t border-gray-200">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handlePublishAnnouncement(announcement.id)}
                      >
                        Publish Now
                      </Button>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
