'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, LoadingSpinner, Alert } from '@/components/ui';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  schoolName?: string;
  schoolId?: string;
  lastLogin?: string;
  createdAt: string;
  mfaEnabled: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3001/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUsers = () => {
    let filtered = users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.includes(query)
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    return filtered;
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'warning';
      case 'SUSPENDED': return 'danger';
      default: return 'default';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    if (role === 'SUPER_ADMIN') return 'bg-purple-100 text-purple-700';
    if (role === 'SCHOOL_OWNER' || role === 'PRINCIPAL') return 'bg-blue-100 text-blue-700';
    if (role === 'TEACHER') return 'bg-green-100 text-green-700';
    if (role === 'PARENT') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const handleSuspendUser = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to suspend user');
      
      alert('User suspended successfully');
      fetchUsers();
    } catch (err) {
      alert('Failed to suspend user');
      console.error(err);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}/activate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to activate user');
      
      alert('User activated successfully');
      fetchUsers();
    } catch (err) {
      alert('Failed to activate user');
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

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
    return formatDate(dateString);
  };

  const filteredUsers = getFilteredUsers();
  const roleCount = (role: string) => users.filter(u => u.role === role).length;

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
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage platform users and permissions</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <span className="mr-2">+</span>
            Add User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card className="text-center">
            <div className="text-sm text-gray-600 mb-1">Total Users</div>
            <div className="text-2xl font-bold text-gray-900">{users.length}</div>
          </Card>
          <Card className="text-center">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.status === 'ACTIVE').length}
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-sm text-gray-600 mb-1">Super Admins</div>
            <div className="text-2xl font-bold text-purple-600">
              {roleCount('SUPER_ADMIN')}
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-sm text-gray-600 mb-1">School Admins</div>
            <div className="text-2xl font-bold text-blue-600">
              {roleCount('SCHOOL_OWNER') + roleCount('PRINCIPAL')}
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-sm text-gray-600 mb-1">Teachers</div>
            <div className="text-2xl font-bold text-green-600">
              {roleCount('TEACHER')}
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-sm text-gray-600 mb-1">Parents</div>
            <div className="text-2xl font-bold text-yellow-600">
              {roleCount('PARENT')}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="SCHOOL_OWNER">School Owner</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="TEACHER">Teacher</option>
                <option value="PARENT">Parent</option>
              </select>
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
        </Card>

        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

        {/* Users List - Desktop */}
        <div className="hidden md:block">
          <Card className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    School
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Login
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Security
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-500">{user.phone}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {user.schoolName || '-'}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={getStatusBadgeVariant(user.status)}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {formatLastLogin(user.lastLogin)}
                    </td>
                    <td className="px-4 py-4">
                      {user.mfaEnabled ? (
                        <Badge variant="success">MFA ✓</Badge>
                      ) : (
                        <Badge variant="warning">No MFA</Badge>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          View
                        </button>
                        {user.status === 'SUSPENDED' ? (
                          <button
                            onClick={() => handleActivateUser(user.id)}
                            className="text-green-600 hover:text-green-900 text-sm"
                          >
                            Activate
                          </button>
                        ) : user.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => handleSuspendUser(user.id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Users List - Mobile */}
        <div className="md:hidden space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
                <Badge variant={getStatusBadgeVariant(user.status)}>
                  {user.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-3 text-sm">
                {user.schoolName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">School:</span>
                    <span className="font-semibold">{user.schoolName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Login:</span>
                  <span>{formatLastLogin(user.lastLogin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">MFA:</span>
                  <span>{user.mfaEnabled ? '✓ Enabled' : '✗ Disabled'}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedUser(user)}
                >
                  View Details
                </Button>
                {user.status === 'SUSPENDED' ? (
                  <Button
                    size="sm"
                    variant="primary"
                    className="flex-1"
                    onClick={() => handleActivateUser(user.id)}
                  >
                    Activate
                  </Button>
                ) : user.role !== 'SUPER_ADMIN' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-red-600"
                    onClick={() => handleSuspendUser(user.id)}
                  >
                    Suspend
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* User Details Modal */}
        {selectedUser && (
          <UserDetailsModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onUpdate={fetchUsers}
          />
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={fetchUsers}
          />
        )}
      </div>
    </div>
  );
}

// User Details Modal
function UserDetailsModal({ user, onClose, onUpdate }: { user: User; onClose: () => void; onUpdate: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">First Name</div>
                <div className="font-semibold text-gray-900">{user.firstName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Last Name</div>
                <div className="font-semibold text-gray-900">{user.lastName}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Email</div>
              <div className="font-semibold text-gray-900">{user.email}</div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Phone</div>
              <div className="font-semibold text-gray-900">{user.phone}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Role</div>
                <div className="font-semibold text-gray-900">{user.role.replace('_', ' ')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <Badge variant={user.status === 'ACTIVE' ? 'success' : 'danger'}>
                  {user.status}
                </Badge>
              </div>
            </div>

            {user.schoolName && (
              <div>
                <div className="text-sm text-gray-600">School</div>
                <div className="font-semibold text-gray-900">{user.schoolName}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">MFA Status</div>
                <Badge variant={user.mfaEnabled ? 'success' : 'warning'}>
                  {user.mfaEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-gray-600">Last Login</div>
                <div className="text-sm text-gray-900">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <Button variant="primary" className="flex-1">Edit User</Button>
                <Button variant="outline" className="flex-1">Reset Password</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

// Create User Modal
function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'TEACHER',
    schoolId: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3001/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create user');

      alert('User created successfully! Temporary password sent to email.');
      onSuccess();
      onClose();
    } catch (err) {
      alert('Failed to create user');
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New User</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <Input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <Input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
              <Input
                type="tel"
                required
                placeholder="254XXXXXXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="SCHOOL_OWNER">School Owner</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="TEACHER">Teacher</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
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
