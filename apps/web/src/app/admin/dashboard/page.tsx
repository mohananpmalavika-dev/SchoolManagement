'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge, LoadingSpinner, Alert } from '@/components/ui';

interface PlatformMetrics {
  totalSchools: number;
  activeSchools: number;
  suspendedSchools: number;
  trialSchools: number;
  totalStudents: number;
  totalStaff: number;
  activeSubscriptions: number;
  expiringSubscriptions: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  totalRevenue: number;
  pendingPayments: number;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  apiResponseTime: number;
  databaseStatus: 'healthy' | 'degraded' | 'down';
  storageUsed: number;
  storageTotal: number;
  activeUsers: number;
  errorRate: number;
}

interface RecentActivity {
  id: string;
  type: 'SCHOOL_CREATED' | 'SUBSCRIPTION_RENEWED' | 'PAYMENT_RECEIVED' | 'USER_CREATED' | 'SYSTEM_ALERT';
  title: string;
  description: string;
  timestamp: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}

interface Alert {
  id: string;
  type: 'SUBSCRIPTION_EXPIRING' | 'PAYMENT_FAILED' | 'SYSTEM_ERROR' | 'SUPPORT_TICKET';
  message: string;
  count: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('month');

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      const [metricsRes, healthRes, activitiesRes, alertsRes] = await Promise.all([
        fetch(`http://localhost:3001/api/admin/metrics?range=${timeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('http://localhost:3001/api/admin/system-health', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('http://localhost:3001/api/admin/activities?limit=10', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('http://localhost:3001/api/admin/alerts', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (!metricsRes.ok || !healthRes.ok || !activitiesRes.ok || !alertsRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [metricsData, healthData, activitiesData, alertsData] = await Promise.all([
        metricsRes.json(),
        healthRes.json(),
        activitiesRes.json(),
        alertsRes.json(),
      ]);

      setMetrics(metricsData);
      setSystemHealth(healthData);
      setRecentActivities(activitiesData);
      setAlerts(alertsData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount / 100); // Convert from cents
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'SCHOOL_CREATED':
        return '🏫';
      case 'SUBSCRIPTION_RENEWED':
        return '🔄';
      case 'PAYMENT_RECEIVED':
        return '💰';
      case 'USER_CREATED':
        return '👤';
      case 'SYSTEM_ALERT':
        return '⚠️';
      default:
        return '📌';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityBadge = (priority: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (priority) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading && !metrics) {
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
          <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
          <p className="text-gray-600 mt-1">KryptonLogic School ERP - System Overview</p>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {alerts.map((alert) => (
              <Alert
                key={alert.id}
                variant={alert.priority === 'critical' || alert.priority === 'high' ? 'danger' : 'warning'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant={getPriorityBadge(alert.priority)}>
                      {alert.priority.toUpperCase()}
                    </Badge>
                    <span className="font-medium">{alert.message}</span>
                    {alert.count > 1 && (
                      <span className="text-sm text-gray-600">({alert.count} items)</span>
                    )}
                  </div>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Time Range Filter */}
        <div className="flex justify-end mb-6">
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant={timeRange === 'today' ? 'primary' : 'outline'}
              onClick={() => setTimeRange('today')}
            >
              Today
            </Button>
            <Button
              size="sm"
              variant={timeRange === 'week' ? 'primary' : 'outline'}
              onClick={() => setTimeRange('week')}
            >
              This Week
            </Button>
            <Button
              size="sm"
              variant={timeRange === 'month' ? 'primary' : 'outline'}
              onClick={() => setTimeRange('month')}
            >
              This Month
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        {metrics && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              {/* Schools */}
              <Card className="text-center">
                <div className="text-sm text-gray-600 mb-1">Total Schools</div>
                <div className="text-3xl font-bold text-gray-900">{metrics.totalSchools}</div>
                <div className="text-xs text-green-600 mt-1">
                  {metrics.activeSchools} active
                </div>
              </Card>

              <Card className="text-center">
                <div className="text-sm text-gray-600 mb-1">Trial Schools</div>
                <div className="text-3xl font-bold text-yellow-600">{metrics.trialSchools}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Free trial period
                </div>
              </Card>

              <Card className="text-center">
                <div className="text-sm text-gray-600 mb-1">Students</div>
                <div className="text-3xl font-bold text-blue-600">{metrics.totalStudents.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Across all schools
                </div>
              </Card>

              <Card className="text-center">
                <div className="text-sm text-gray-600 mb-1">Staff</div>
                <div className="text-3xl font-bold text-purple-600">{metrics.totalStaff.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">
                  All school staff
                </div>
              </Card>

              <Card className="text-center">
                <div className="text-sm text-gray-600 mb-1">Subscriptions</div>
                <div className="text-3xl font-bold text-green-600">{metrics.activeSubscriptions}</div>
                <div className="text-xs text-orange-600 mt-1">
                  {metrics.expiringSubscriptions} expiring soon
                </div>
              </Card>

              <Card className="text-center">
                <div className="text-sm text-gray-600 mb-1">Suspended</div>
                <div className="text-3xl font-bold text-red-600">{metrics.suspendedSchools}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Payment overdue
                </div>
              </Card>
            </div>

            {/* Revenue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <div className="text-sm text-gray-600 mb-2">Monthly Recurring Revenue</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.mrr)}</div>
                <div className="text-xs text-green-600 mt-1">
                  ↑ 12% from last month
                </div>
              </Card>

              <Card>
                <div className="text-sm text-gray-600 mb-2">Annual Recurring Revenue</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.arr)}</div>
                <div className="text-xs text-green-600 mt-1">
                  ↑ 8% from last year
                </div>
              </Card>

              <Card>
                <div className="text-sm text-gray-600 mb-2">Total Revenue ({timeRange})</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Collected payments
                </div>
              </Card>

              <Card>
                <div className="text-sm text-gray-600 mb-2">Pending Payments</div>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(metrics.pendingPayments)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Awaiting collection
                </div>
              </Card>
            </div>
          </>
        )}

        {/* System Health & Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* System Health */}
          {systemHealth && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getHealthStatusColor(systemHealth.status)}`}>
                  {systemHealth.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="font-semibold text-gray-900">{systemHealth.uptime}%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">API Response Time</span>
                  <span className="font-semibold text-gray-900">{systemHealth.apiResponseTime}ms</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Database</span>
                  <Badge variant={systemHealth.databaseStatus === 'healthy' ? 'success' : 'warning'}>
                    {systemHealth.databaseStatus}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Storage</span>
                  <span className="font-semibold text-gray-900">
                    {systemHealth.storageUsed}GB / {systemHealth.storageTotal}GB
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(systemHealth.storageUsed / systemHealth.storageTotal) * 100}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Users (Now)</span>
                  <span className="font-semibold text-gray-900">{systemHealth.activeUsers}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Error Rate</span>
                  <span className={`font-semibold ${systemHealth.errorRate > 1 ? 'text-red-600' : 'text-green-600'}`}>
                    {systemHealth.errorRate}%
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button variant="outline" className="w-full">
                  View Detailed Metrics →
                </Button>
              </div>
            </Card>
          )}

          {/* Recent Activities */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
              <Button size="sm" variant="outline">View All</Button>
            </div>

            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No recent activities</p>
              ) : (
                recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">{activity.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{activity.description}</div>
                      <div className="text-xs text-gray-500 mt-1">{formatTimestamp(activity.timestamp)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="primary" className="w-full">
              <span className="mr-2">🏫</span>
              Add School
            </Button>
            <Button variant="outline" className="w-full">
              <span className="mr-2">👥</span>
              Manage Users
            </Button>
            <Button variant="outline" className="w-full">
              <span className="mr-2">💳</span>
              View Billing
            </Button>
            <Button variant="outline" className="w-full">
              <span className="mr-2">📊</span>
              Generate Report
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
