'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Eye, Trash2, RefreshCw, Mail, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  account_type: string;
  email_verified: boolean;
  linkedin_connected: boolean;
  created_at: string;
  profile: {
    onboarding_completed: boolean;
    onboarding_step: number;
    cv_filename: string | null;
    has_writing_samples: boolean;
    has_custom_instructions: boolean;
    updated_at: string;
  } | null;
  subscription: {
    plan: string;
    posts_this_month: number;
    posts_limit: number;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    period_end: string | null;
  } | null;
  stats: {
    total_posts: number;
    total_comments: number;
    total_conversations: number;
    avg_post_rating: number | null;
    last_post_date: string | null;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSelectedUser(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchUsers();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  const handleResetOnboarding = async (userId: string) => {
    if (!confirm('Reset onboarding for this user?')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/reset-onboarding`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert('Onboarding reset successfully');
      handleViewUser(userId);
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
      alert('Failed to reset onboarding');
    }
  };

  const handleUpdateSubscription = async (userId: string, plan: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/subscription?plan=${plan}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert('Subscription updated successfully');
      handleViewUser(userId);
    } catch (error) {
      console.error('Failed to update subscription:', error);
      alert('Failed to update subscription');
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage all platform users</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.subscription?.plan === 'agency'
                        ? 'bg-purple-100 text-purple-800'
                        : user.subscription?.plan === 'pro'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.subscription?.plan || 'free'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.subscription?.posts_this_month || 0} / {user.subscription?.posts_limit || 5}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div title="Email verified">
                        {user.email_verified ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div title="LinkedIn connected">
                        {user.linkedin_connected ? (
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewUser(user.id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-900">{selectedUser.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Type</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{selectedUser.account_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Joined</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subscription */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Subscription</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Current Plan</p>
                      <p className="text-lg font-bold text-gray-900 capitalize">
                        {selectedUser.subscription?.plan || 'free'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Usage This Month</p>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedUser.subscription?.posts_this_month || 0} / {selectedUser.subscription?.posts_limit || 5}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateSubscription(selectedUser.id, 'free')}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Set Free
                    </button>
                    <button
                      onClick={() => handleUpdateSubscription(selectedUser.id, 'pro')}
                      className="px-3 py-1 text-sm bg-blue-200 text-blue-700 rounded hover:bg-blue-300"
                    >
                      Set Pro
                    </button>
                    <button
                      onClick={() => handleUpdateSubscription(selectedUser.id, 'agency')}
                      className="px-3 py-1 text-sm bg-purple-200 text-purple-700 rounded hover:bg-purple-300"
                    >
                      Set Agency
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600">Total Posts</p>
                    <p className="text-2xl font-bold text-blue-900">{selectedUser.stats.total_posts}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600">Total Comments</p>
                    <p className="text-2xl font-bold text-green-900">{selectedUser.stats.total_comments}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-600">Conversations</p>
                    <p className="text-2xl font-bold text-purple-900">{selectedUser.stats.total_conversations}</p>
                  </div>
                </div>
              </div>

              {/* Profile */}
              {selectedUser.profile && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Profile</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Onboarding Status</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedUser.profile.onboarding_completed ? 'Completed' : `Step ${selectedUser.profile.onboarding_step}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">CV Uploaded</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedUser.profile.cv_filename ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                  {!selectedUser.profile.onboarding_completed && (
                    <button
                      onClick={() => handleResetOnboarding(selectedUser.id)}
                      className="mt-4 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                    >
                      Reset Onboarding
                    </button>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
