'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Badge,
  LoadingSpinner,
  Alert,
} from '@/components/ui';
import { StudentSelector } from '@/components/StudentSelector';
import { format, formatDistanceToNow } from 'date-fns';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  class: { name: string };
  stream: { name: string };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'FEE_REMINDER' | 'ABSENCE_ALERT' | 'EXAM_SCHEDULE' | 'GENERAL' | 'PAYMENT_RECEIPT';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  isRead: boolean;
  createdAt: string;
}

// Mock notifications - In production, these would come from the API
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Payment Received',
    message: 'Your payment of KES 15,000 has been received successfully. Receipt number: RCP-2024-001',
    type: 'PAYMENT_RECEIPT',
    priority: 'MEDIUM',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Fee Reminder',
    message: 'Term 2 fees are due on January 30th, 2024. Outstanding balance: KES 25,000',
    type: 'FEE_REMINDER',
    priority: 'HIGH',
    isRead: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    title: 'Absence Alert',
    message: 'Your child was absent on January 15th, 2024. Please contact the school if this was unplanned.',
    type: 'ABSENCE_ALERT',
    priority: 'HIGH',
    isRead: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '4',
    title: 'Upcoming Exams',
    message: 'End of term examinations will begin on February 5th, 2024. Please ensure your child is well prepared.',
    type: 'EXAM_SCHEDULE',
    priority: 'MEDIUM',
    isRead: true,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: '5',
    title: 'School Closure Notice',
    message: 'The school will be closed on January 20th, 2024 for a public holiday.',
    type: 'GENERAL',
    priority: 'LOW',
    isRead: true,
    createdAt: new Date(Date.now() - 432000000).toISOString(),
  },
];

export default function NotificationsPage() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedStudent) {
      loadNotifications();
    }
  }, [selectedStudent]);

  const loadNotifications = async () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setNotifications(mockNotifications);
      setIsLoading(false);
    }, 500);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!selectedStudent) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudentSelector onSelectStudent={setSelectedStudent} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <StudentSelector
        selectedStudent={selectedStudent}
        onSelectStudent={setSelectedStudent}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" message="Loading notifications..." />
        </div>
      ) : (
        <>
          {/* Header with filters */}
          <Card>
            <div className="p-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {unreadCount > 0 ? (
                    <>
                      You have <span className="font-semibold">{unreadCount}</span> unread
                      notification{unreadCount !== 1 ? 's' : ''}
                    </>
                  ) : (
                    'All caught up!'
                  )}
                </p>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium tap-area"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="px-4 pb-4 flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors tap-area ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors tap-area ${
                  filter === 'unread'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </Card>

          {/* Notifications List */}
          {filteredNotifications.length > 0 ? (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent>
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-medium mb-1">No notifications</p>
                  <p className="text-sm text-gray-500">
                    {filter === 'unread'
                      ? 'You have no unread notifications'
                      : 'You have no notifications yet'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function NotificationCard({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const getIcon = (type: Notification['type']) => {
    const icons = {
      FEE_REMINDER: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
          <path
            fillRule="evenodd"
            d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
      ABSENCE_ALERT: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
      EXAM_SCHEDULE: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
        </svg>
      ),
      PAYMENT_RECEIPT: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      GENERAL: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };

    return icons[type] || icons.GENERAL;
  };

  const getColor = (type: Notification['type']) => {
    const colors = {
      FEE_REMINDER: 'bg-warning-100 text-warning-700',
      ABSENCE_ALERT: 'bg-danger-100 text-danger-700',
      EXAM_SCHEDULE: 'bg-primary-100 text-primary-700',
      PAYMENT_RECEIPT: 'bg-success-100 text-success-700',
      GENERAL: 'bg-gray-100 text-gray-700',
    };

    return colors[type] || colors.GENERAL;
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    const variants: Record<string, 'danger' | 'warning' | 'default'> = {
      HIGH: 'danger',
      MEDIUM: 'warning',
      LOW: 'default',
    };

    return <Badge variant={variants[priority]} size="sm">{priority}</Badge>;
  };

  return (
    <Card
      className={`cursor-pointer transition-all ${
        !notification.isRead ? 'border-l-4 border-l-primary-500 bg-primary-50/30' : ''
      }`}
      onClick={() => {
        setExpanded(!expanded);
        if (!notification.isRead) {
          onMarkAsRead(notification.id);
        }
      }}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getColor(notification.type)}`}>
            {getIcon(notification.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  {notification.title}
                </h3>
                {!notification.isRead && (
                  <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                )}
              </div>
              {getPriorityBadge(notification.priority)}
            </div>

            <p className={`text-sm text-gray-600 ${!expanded ? 'truncate' : ''}`}>
              {notification.message}
            </p>

            <p className="text-xs text-gray-500 mt-2">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })} • {format(new Date(notification.createdAt), 'MMM dd, yyyy h:mm a')}
            </p>
          </div>

          {/* Expand icon */}
          <button className="flex-shrink-0 text-gray-400 hover:text-gray-600 tap-area">
            <svg
              className={`w-5 h-5 transition-transform ${
                expanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>
    </Card>
  );
}
