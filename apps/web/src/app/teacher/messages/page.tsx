'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, LoadingSpinner, Alert } from '@/components/ui';

interface Message {
  id: string;
  subject: string;
  preview: string;
  recipientType: 'PARENT' | 'STUDENT' | 'CLASS' | 'ADMIN';
  recipientName: string;
  recipientCount?: number;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  timestamp: string;
  hasReply: boolean;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
}

interface Recipient {
  id: string;
  name: string;
  type: 'PARENT' | 'STUDENT';
  phone: string;
  email: string;
  className?: string;
}

interface ClassOption {
  id: string;
  name: string;
  stream: string;
  studentCount: number;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'sent' | 'replies'>('all');

  // Compose form state
  const [recipientType, setRecipientType] = useState<'individual' | 'class' | 'bulk'>('individual');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [sendViaSMS, setSendViaSMS] = useState(true);
  const [sendViaEmail, setSendViaEmail] = useState(false);
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [sending, setSending] = useState(false);

  // Available recipients and classes
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMessages();
    fetchRecipients();
    fetchClasses();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/messages/teacher', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      setError('Failed to load messages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/messages/recipients', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch recipients');
      const data = await response.json();
      setRecipients(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/classes/teacher', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch classes');
      const data = await response.json();
      setClasses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async () => {
    if (!messageSubject.trim() || !messageBody.trim()) {
      alert('Please fill in subject and message');
      return;
    }

    if (recipientType === 'individual' && selectedRecipients.length === 0) {
      alert('Please select at least one recipient');
      return;
    }

    if (recipientType === 'class' && !selectedClass) {
      alert('Please select a class');
      return;
    }

    try {
      setSending(true);
      const token = localStorage.getItem('token');
      
      const payload = {
        subject: messageSubject,
        body: messageBody,
        recipientType,
        recipientIds: recipientType === 'individual' ? selectedRecipients : undefined,
        classId: recipientType === 'class' ? selectedClass : undefined,
        sendViaSMS,
        sendViaEmail,
        priority,
      };

      const response = await fetch('http://localhost:3001/api/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to send message');

      // Reset form
      setMessageSubject('');
      setMessageBody('');
      setSelectedRecipients([]);
      setSelectedClass('');
      setPriority('NORMAL');
      setShowCompose(false);

      // Refresh messages
      fetchMessages();
      
      alert('Message sent successfully!');
    } catch (err) {
      alert('Failed to send message');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case 'SENT': return 'default';
      case 'DELIVERED': return 'success';
      case 'READ': return 'success';
      case 'FAILED': return 'danger';
      default: return 'default';
    }
  };

  const getPriorityBadgeVariant = (priority: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (priority) {
      case 'URGENT': return 'danger';
      case 'HIGH': return 'warning';
      default: return 'default';
    }
  };

  const getFilteredMessages = () => {
    if (filterType === 'all') return messages;
    if (filterType === 'sent') return messages.filter(m => !m.hasReply);
    if (filterType === 'replies') return messages.filter(m => m.hasReply);
    return messages;
  };

  const getFilteredRecipients = () => {
    if (!searchQuery) return recipients;
    const query = searchQuery.toLowerCase();
    return recipients.filter(r =>
      r.name.toLowerCase().includes(query) ||
      r.phone.includes(query) ||
      r.email.toLowerCase().includes(query)
    );
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev =>
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredMessages = getFilteredMessages();
  const filteredRecipients = getFilteredRecipients();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-1">Communicate with parents and students</p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCompose(!showCompose)}
          >
            {showCompose ? 'Cancel' : '✉️ New Message'}
          </Button>
        </div>

        {/* Compose Message */}
        {showCompose && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compose Message</h3>

            {/* Recipient Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send To
              </label>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={recipientType === 'individual' ? 'primary' : 'outline'}
                  onClick={() => setRecipientType('individual')}
                >
                  Individual
                </Button>
                <Button
                  size="sm"
                  variant={recipientType === 'class' ? 'primary' : 'outline'}
                  onClick={() => setRecipientType('class')}
                >
                  Entire Class
                </Button>
                <Button
                  size="sm"
                  variant={recipientType === 'bulk' ? 'primary' : 'outline'}
                  onClick={() => setRecipientType('bulk')}
                >
                  All Parents
                </Button>
              </div>
            </div>

            {/* Individual Recipients Selection */}
            {recipientType === 'individual' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Recipients ({selectedRecipients.length} selected)
                </label>
                <Input
                  type="text"
                  placeholder="Search by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-3"
                />
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2">
                  {filteredRecipients.map((recipient) => (
                    <div
                      key={recipient.id}
                      className={`p-2 rounded cursor-pointer transition-colors ${
                        selectedRecipients.includes(recipient.id)
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => toggleRecipient(recipient.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-gray-900">{recipient.name}</div>
                          <div className="text-xs text-gray-600">
                            {recipient.type} • {recipient.phone}
                            {recipient.className && ` • ${recipient.className}`}
                          </div>
                        </div>
                        {selectedRecipients.includes(recipient.id) && (
                          <span className="text-blue-600">✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Class Selection */}
            {recipientType === 'class' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a class...</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name} {classItem.stream} ({classItem.studentCount} students)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={priority === 'NORMAL' ? 'primary' : 'outline'}
                  onClick={() => setPriority('NORMAL')}
                >
                  Normal
                </Button>
                <Button
                  size="sm"
                  variant={priority === 'HIGH' ? 'primary' : 'outline'}
                  onClick={() => setPriority('HIGH')}
                >
                  High
                </Button>
                <Button
                  size="sm"
                  variant={priority === 'URGENT' ? 'primary' : 'outline'}
                  onClick={() => setPriority('URGENT')}
                >
                  Urgent
                </Button>
              </div>
            </div>

            {/* Subject */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <Input
                type="text"
                placeholder="Enter message subject..."
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
              />
            </div>

            {/* Message Body */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                placeholder="Type your message here..."
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
              />
              <div className="text-sm text-gray-500 mt-1">
                {messageBody.length} characters
                {sendViaSMS && messageBody.length > 160 && (
                  <span className="text-yellow-600 ml-2">
                    (Will be sent as {Math.ceil(messageBody.length / 160)} SMS messages)
                  </span>
                )}
              </div>
            </div>

            {/* Delivery Method */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Method
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sendViaSMS}
                    onChange={(e) => setSendViaSMS(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">SMS</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sendViaEmail}
                    onChange={(e) => setSendViaEmail(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Email</span>
                </label>
              </div>
            </div>

            {/* Send Button */}
            <div className="flex space-x-3">
              <Button
                variant="primary"
                onClick={handleSendMessage}
                disabled={sending}
              >
                {sending ? 'Sending...' : '📤 Send Message'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCompose(false)}
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Message Filters */}
        <div className="flex space-x-2 mb-6">
          <Button
            size="sm"
            variant={filterType === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilterType('all')}
          >
            All Messages ({messages.length})
          </Button>
          <Button
            size="sm"
            variant={filterType === 'sent' ? 'primary' : 'outline'}
            onClick={() => setFilterType('sent')}
          >
            Sent ({messages.filter(m => !m.hasReply).length})
          </Button>
          <Button
            size="sm"
            variant={filterType === 'replies' ? 'primary' : 'outline'}
            onClick={() => setFilterType('replies')}
          >
            Replies ({messages.filter(m => m.hasReply).length})
          </Button>
        </div>

        {/* Messages List */}
        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

        {filteredMessages.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Click "New Message" to start communicating with parents
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((message) => (
              <Card
                key={message.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  message.hasReply ? 'border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{message.subject}</h3>
                      {message.priority !== 'NORMAL' && (
                        <Badge variant={getPriorityBadgeVariant(message.priority)}>
                          {message.priority}
                        </Badge>
                      )}
                      {message.hasReply && (
                        <Badge variant="default">Reply Received</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{message.preview}</p>
                    <div className="flex items-center text-xs text-gray-500 space-x-3">
                      <span>To: {message.recipientName}</span>
                      {message.recipientCount && (
                        <span>• {message.recipientCount} recipients</span>
                      )}
                      <span>• {formatTimestamp(message.timestamp)}</span>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(message.status)}>
                    {message.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Message Templates */}
        <Card className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Message Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => {
                setShowCompose(true);
                setMessageSubject('Attendance Concern');
                setMessageBody('Dear Parent/Guardian,\n\nI am writing to inform you about your child\'s recent attendance...');
              }}
            >
              <div className="font-medium text-gray-900 text-sm">Attendance Alert</div>
              <div className="text-xs text-gray-600 mt-1">Notify parent about absences</div>
            </button>

            <button
              className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => {
                setShowCompose(true);
                setMessageSubject('Academic Progress Update');
                setMessageBody('Dear Parent/Guardian,\n\nI would like to update you on your child\'s academic progress...');
              }}
            >
              <div className="font-medium text-gray-900 text-sm">Progress Update</div>
              <div className="text-xs text-gray-600 mt-1">Share student progress</div>
            </button>

            <button
              className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => {
                setShowCompose(true);
                setRecipientType('class');
                setMessageSubject('Class Announcement');
                setMessageBody('Dear Parents/Guardians,\n\n');
              }}
            >
              <div className="font-medium text-gray-900 text-sm">Class Announcement</div>
              <div className="text-xs text-gray-600 mt-1">Send to entire class</div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
