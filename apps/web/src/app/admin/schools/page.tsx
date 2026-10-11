'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, LoadingSpinner, Alert } from '@/components/ui';

interface School {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TRIAL' | 'SUSPENDED';
  subscriptionPlan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  subscriptionStatus: 'ACTIVE' | 'EXPIRED' | 'TRIAL';
  subscriptionExpiry: string;
  studentCount: number;
  staffCount: number;
  createdAt: string;
  lastPayment?: string;
  adminName?: string;
  adminEmail?: string;
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3001/api/admin/schools', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch schools');
      const data = await response.json();
      setSchools(data);
    } catch (err) {
      setError('Failed to load schools');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSchools = () => {
    let filtered = schools;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(school =>
        school.name.toLowerCase().includes(query) ||
        school.email.toLowerCase().includes(query) ||
        school.phone.includes(query)
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(school => school.status === filterStatus);
    }

    return filtered;
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'TRIAL': return 'warning';
      case 'SUSPENDED': return 'danger';
      case 'INACTIVE': return 'default';
      default: return 'default';
    }
  };

  const getPlanBadgeVariant = (plan: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (plan) {
      case 'ENTERPRISE': return 'success';
      case 'PROFESSIONAL': return 'warning';
      case 'STARTER': return 'default';
      default: return 'default';
    }
  };

  const handleSuspendSchool = async (schoolId: string) => {
    if (!confirm('Are you sure you want to suspend this school? They will lose access immediately.')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3001/api/admin/schools/${schoolId}/suspend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to suspend school');
      
      alert('School suspended successfully');
      fetchSchools();
    } catch (err) {
      alert('Failed to suspend school');
      console.error(err);
    }
  };

  const handleActivateSchool = async (schoolId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3001/api/admin/schools/${schoolId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to activate school');
      
      alert('School activated successfully');
      fetchSchools();
    } catch (err) {
      alert('Failed to activate school');
      console.error(err);
    }
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

  const filteredSchools = getFilteredSchools();

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">School Management</h1>
            <p className="text-gray-600 mt-1">Manage all schools on the platform</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <span className="mr-2">+</span>
            Add New School
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="text-center">
            <div className="text-sm text-gray-600 mb-1">Total Schools</div>
            <div className="text-2xl font-bold text-gray-900">{schools.length}</div>
          </Card>
          <Card className="text-center">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {schools.filter(s => s.status === 'ACTIVE').length}
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-sm text-gray-600 mb-1">Trial</div>
            <div className="text-2xl font-bold text-yellow-600">
              {schools.filter(s => s.status === 'TRIAL').length}
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-sm text-gray-600 mb-1">Suspended</div>
            <div className="text-2xl font-bold text-red-600">
              {schools.filter(s => s.status === 'SUSPENDED').length}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                type="text"
                placeholder="Search by name, email, or phone..."
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
                <option value="SUSPENDED">Suspended</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </Card>

        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

        {/* Schools List */}
        {filteredSchools.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500">No schools found</p>
          </Card>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Card className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        School Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Plan
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Students
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Expiry
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSchools.map((school) => {
                      const daysUntilExpiry = getDaysUntilExpiry(school.subscriptionExpiry);
                      
                      return (
                        <tr key={school.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div>
                              <div className="font-semibold text-gray-900">{school.name}</div>
                              <div className="text-sm text-gray-500">{school.address}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm">
                              <div className="text-gray-900">{school.email}</div>
                              <div className="text-gray-500">{school.phone}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant={getStatusBadgeVariant(school.status)}>
                              {school.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant={getPlanBadgeVariant(school.subscriptionPlan)}>
                              {school.subscriptionPlan}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm">
                              <div className="font-semibold text-gray-900">{school.studentCount}</div>
                              <div className="text-gray-500">{school.staffCount} staff</div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm">
                              <div className={`font-semibold ${daysUntilExpiry < 7 ? 'text-red-600' : 'text-gray-900'}`}>
                                {formatDate(school.subscriptionExpiry)}
                              </div>
                              {daysUntilExpiry < 30 && (
                                <div className="text-xs text-orange-600">
                                  {daysUntilExpiry} days left
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedSchool(school)}
                                className="text-blue-600 hover:text-blue-900 text-sm"
                              >
                                View
                              </button>
                              {school.status === 'SUSPENDED' ? (
                                <button
                                  onClick={() => handleActivateSchool(school.id)}
                                  className="text-green-600 hover:text-green-900 text-sm"
                                >
                                  Activate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSuspendSchool(school.id)}
                                  className="text-red-600 hover:text-red-900 text-sm"
                                >
                                  Suspend
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredSchools.map((school) => {
                const daysUntilExpiry = getDaysUntilExpiry(school.subscriptionExpiry);
                
                return (
                  <Card key={school.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{school.name}</h3>
                        <p className="text-sm text-gray-500">{school.email}</p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(school.status)}>
                        {school.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-gray-500">Plan</div>
                        <Badge variant={getPlanBadgeVariant(school.subscriptionPlan)}>
                          {school.subscriptionPlan}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Students</div>
                        <div className="font-semibold text-gray-900">{school.studentCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Staff</div>
                        <div className="font-semibold text-gray-900">{school.staffCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Expires</div>
                        <div className={`text-sm font-semibold ${daysUntilExpiry < 7 ? 'text-red-600' : 'text-gray-900'}`}>
                          {daysUntilExpiry}d
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedSchool(school)}
                      >
                        View Details
                      </Button>
                      {school.status === 'SUSPENDED' ? (
                        <Button
                          size="sm"
                          variant="primary"
                          className="flex-1"
                          onClick={() => handleActivateSchool(school.id)}
                        >
                          Activate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-red-600"
                          onClick={() => handleSuspendSchool(school.id)}
                        >
                          Suspend
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* School Details Modal */}
        {selectedSchool && (
          <SchoolDetailsModal
            school={selectedSchool}
            onClose={() => setSelectedSchool(null)}
            onUpdate={fetchSchools}
          />
        )}

        {/* Create School Modal */}
        {showCreateModal && (
          <CreateSchoolModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={fetchSchools}
          />
        )}
      </div>
    </div>
  );
}

// School Details Modal Component
function SchoolDetailsModal({
  school,
  onClose,
  onUpdate,
}: {
  school: School;
  onClose: () => void;
  onUpdate: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{school.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <Badge variant={school.status === 'ACTIVE' ? 'success' : 'danger'}>
                  {school.status}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-gray-600">Subscription Plan</div>
                <div className="font-semibold text-gray-900">{school.subscriptionPlan}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Email</div>
              <div className="font-semibold text-gray-900">{school.email}</div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Phone</div>
              <div className="font-semibold text-gray-900">{school.phone}</div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Address</div>
              <div className="font-semibold text-gray-900">{school.address}</div>
            </div>

            {school.website && (
              <div>
                <div className="text-sm text-gray-600">Website</div>
                <a href={school.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
                  {school.website}
                </a>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Students</div>
                <div className="text-2xl font-bold text-gray-900">{school.studentCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Staff</div>
                <div className="text-2xl font-bold text-gray-900">{school.staffCount}</div>
              </div>
            </div>

            {school.adminName && (
              <div>
                <div className="text-sm text-gray-600">School Administrator</div>
                <div className="font-semibold text-gray-900">{school.adminName}</div>
                <div className="text-sm text-gray-500">{school.adminEmail}</div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <Button variant="primary" className="flex-1">
                  Edit School
                </Button>
                <Button variant="outline" className="flex-1">
                  View Subscription
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

// Create School Modal Component (Placeholder)
function CreateSchoolModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    plan: 'STARTER',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3001/api/admin/schools', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create school');

      alert('School created successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      alert('Failed to create school');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New School</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Name *
              </label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone *
              </label>
              <Input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <Input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subscription Plan *
              </label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="STARTER">Starter - KES 15,000/year</option>
                <option value="PROFESSIONAL">Professional - KES 40,000/year</option>
                <option value="ENTERPRISE">Enterprise - KES 80,000/year</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
                {loading ? 'Creating...' : 'Create School'}
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
