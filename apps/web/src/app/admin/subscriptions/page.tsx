'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, LoadingSpinner, Alert } from '@/components/ui';

interface Subscription {
  id: string;
  schoolId: string;
  schoolName: string;
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'ACTIVE' | 'EXPIRED' | 'TRIAL' | 'CANCELLED';
  startDate: string;
  expiryDate: string;
  autoRenew: boolean;
  amount: number;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  nextBillingDate?: string;
  studentLimit: number;
  currentStudentCount: number;
  features: string[];
}

interface Payment {
  id: string;
  subscriptionId: string;
  schoolName: string;
  amount: number;
  paymentMethod: 'M_PESA' | 'BANK_TRANSFER' | 'CREDIT_CARD';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  transactionRef: string;
  paymentDate: string;
  plan: string;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'payments'>('subscriptions');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      const [subsRes, paymentsRes] = await Promise.all([
        fetch('http://localhost:3001/api/admin/subscriptions', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('http://localhost:3001/api/admin/payments?limit=50', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (!subsRes.ok || !paymentsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [subsData, paymentsData] = await Promise.all([
        subsRes.json(),
        paymentsRes.json(),
      ]);

      setSubscriptions(subsData);
      setPayments(paymentsData);
    } catch (err) {
      setError('Failed to load subscription data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSubscriptions = () => {
    let filtered = subscriptions;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.schoolName.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(sub => sub.status === filterStatus);
    }

    if (filterPlan !== 'all') {
      filtered = filtered.filter(sub => sub.plan === filterPlan);
    }

    return filtered;
  };

  const getFilteredPayments = () => {
    if (!searchQuery) return payments;
    
    const query = searchQuery.toLowerCase();
    return payments.filter(payment =>
      payment.schoolName.toLowerCase().includes(query) ||
      payment.transactionRef.toLowerCase().includes(query)
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'TRIAL': return 'warning';
      case 'EXPIRED': return 'danger';
      case 'CANCELLED': return 'default';
      case 'SUCCESS': return 'success';
      case 'PENDING': return 'warning';
      case 'FAILED': return 'danger';
      default: return 'default';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'ENTERPRISE': return 'text-purple-600 bg-purple-100';
      case 'PROFESSIONAL': return 'text-blue-600 bg-blue-100';
      case 'STARTER': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleRenewSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to renew this subscription?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3001/api/admin/subscriptions/${subscriptionId}/renew`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to renew subscription');

      alert('Subscription renewed successfully');
      fetchData();
    } catch (err) {
      alert('Failed to renew subscription');
      console.error(err);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription? The school will lose access at the end of the current period.')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3001/api/admin/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to cancel subscription');

      alert('Subscription cancelled successfully');
      fetchData();
    } catch (err) {
      alert('Failed to cancel subscription');
      console.error(err);
    }
  };

  // Calculate metrics
  const totalRevenue = payments
    .filter(p => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const pendingPayments = payments
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0);

  const expiringCount = subscriptions.filter(s => {
    const days = getDaysUntilExpiry(s.expiryDate);
    return days > 0 && days <= 30 && s.status === 'ACTIVE';
  }).length;

  const filteredSubscriptions = getFilteredSubscriptions();
  const filteredPayments = getFilteredPayments();

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
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600 mt-1">Manage subscriptions and billing</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="text-center">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {subscriptions.filter(s => s.status === 'ACTIVE').length}
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-sm text-gray-600 mb-1">Trial</div>
            <div className="text-2xl font-bold text-yellow-600">
              {subscriptions.filter(s => s.status === 'TRIAL').length}
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-sm text-gray-600 mb-1">Expiring Soon</div>
            <div className="text-2xl font-bold text-orange-600">{expiringCount}</div>
          </Card>
          <Card className="text-center">
            <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(totalRevenue)}
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-sm text-gray-600 mb-1">Pending</div>
            <div className="text-lg font-bold text-orange-600">
              {formatCurrency(pendingPayments)}
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          <Button
            variant={activeTab === 'subscriptions' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('subscriptions')}
          >
            Subscriptions ({subscriptions.length})
          </Button>
          <Button
            variant={activeTab === 'payments' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('payments')}
          >
            Payments ({payments.length})
          </Button>
        </div>

        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <>
            {/* Filters */}
            <Card className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Input
                    type="text"
                    placeholder="Search by school name..."
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
                    <option value="ACTIVE">Active</option>
                    <option value="TRIAL">Trial</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <select
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Plans</option>
                    <option value="STARTER">Starter</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Subscriptions List - Desktop */}
            <div className="hidden md:block">
              <Card className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        School
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Plan
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Expiry
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Usage
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSubscriptions.map((sub) => {
                      const daysUntilExpiry = getDaysUntilExpiry(sub.expiryDate);
                      const usagePercent = (sub.currentStudentCount / sub.studentLimit) * 100;

                      return (
                        <tr key={sub.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="font-semibold text-gray-900">{sub.schoolName}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getPlanColor(sub.plan)}`}>
                              {sub.plan}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant={getStatusBadgeVariant(sub.status)}>
                              {sub.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-gray-900">
                              {formatCurrency(sub.amount)}
                            </div>
                            <div className="text-xs text-gray-500">/{sub.billingCycle.toLowerCase()}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className={`text-sm font-semibold ${daysUntilExpiry < 7 && daysUntilExpiry > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatDate(sub.expiryDate)}
                            </div>
                            {daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
                              <div className="text-xs text-orange-600">{daysUntilExpiry} days left</div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm">
                              <div className="font-semibold text-gray-900">
                                {sub.currentStudentCount} / {sub.studentLimit}
                              </div>
                              <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                                <div
                                  className={`h-1.5 rounded-full ${usagePercent > 90 ? 'bg-red-600' : 'bg-blue-600'}`}
                                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex space-x-2">
                              {sub.status === 'EXPIRED' || sub.status === 'CANCELLED' ? (
                                <button
                                  onClick={() => handleRenewSubscription(sub.id)}
                                  className="text-green-600 hover:text-green-900 text-sm"
                                >
                                  Renew
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleCancelSubscription(sub.id)}
                                  className="text-red-600 hover:text-red-900 text-sm"
                                >
                                  Cancel
                                </button>
                              )}
                              <button className="text-blue-600 hover:text-blue-900 text-sm">
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </div>

            {/* Subscriptions List - Mobile */}
            <div className="md:hidden space-y-4">
              {filteredSubscriptions.map((sub) => {
                const daysUntilExpiry = getDaysUntilExpiry(sub.expiryDate);
                const usagePercent = (sub.currentStudentCount / sub.studentLimit) * 100;

                return (
                  <Card key={sub.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{sub.schoolName}</h3>
                        <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${getPlanColor(sub.plan)}`}>
                          {sub.plan}
                        </span>
                      </div>
                      <Badge variant={getStatusBadgeVariant(sub.status)}>
                        {sub.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-semibold">{formatCurrency(sub.amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Expires:</span>
                        <span className={`font-semibold ${daysUntilExpiry < 7 && daysUntilExpiry > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {daysUntilExpiry}d
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Students:</span>
                        <span className="font-semibold">{sub.currentStudentCount} / {sub.studentLimit}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {sub.status === 'EXPIRED' || sub.status === 'CANCELLED' ? (
                        <Button
                          size="sm"
                          variant="primary"
                          className="flex-1"
                          onClick={() => handleRenewSubscription(sub.id)}
                        >
                          Renew
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-red-600"
                          onClick={() => handleCancelSubscription(sub.id)}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="flex-1">
                        View Details
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <>
            {/* Search */}
            <Card className="mb-6">
              <Input
                type="text"
                placeholder="Search by school name or transaction reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Card>

            {/* Payments List - Desktop */}
            <div className="hidden md:block">
              <Card className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        School
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Plan
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Method
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Transaction Ref
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                          {payment.schoolName}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {payment.plan}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {payment.paymentMethod.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 font-mono">
                          {payment.transactionRef}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={getStatusBadgeVariant(payment.status)}>
                            {payment.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>

            {/* Payments List - Mobile */}
            <div className="md:hidden space-y-4">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{payment.schoolName}</h3>
                      <p className="text-sm text-gray-600">{payment.plan}</p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Date:</span>
                      <span>{formatDate(payment.paymentDate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Method:</span>
                      <span>{payment.paymentMethod.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ref:</span>
                      <span className="font-mono text-xs">{payment.transactionRef}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
