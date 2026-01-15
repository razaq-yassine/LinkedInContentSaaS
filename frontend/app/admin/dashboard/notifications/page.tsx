'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AppLoader } from '@/components/AppLoader';
import { Save, RefreshCw, Mail, Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationPreference {
  id: string;
  action_id: string;
  action_code: string;
  action_name: string;
  description: string | null;
  category: string;
  email_enabled: boolean;
  push_enabled: boolean;
  updated_at: string;
  updated_by_admin_id: string | null;
}

export default function NotificationsPage() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setError('Not authenticated. Please log in as admin.');
        return;
      }
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/notifications/preferences`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setPreferences(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (actionId: string, field: 'email_enabled' | 'push_enabled', value: boolean) => {
    try {
      setError(null);
      setSuccess(false);
      
      const preference = preferences.find(p => p.action_id === actionId);
      if (!preference) return;

      const token = localStorage.getItem('admin_token');
      if (!token) {
        setError('Not authenticated. Please log in as admin.');
        return;
      }

      const updateData: { email_enabled?: boolean; push_enabled?: boolean } = {};
      updateData[field] = value;

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/notifications/preferences/${actionId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setPreferences(prev =>
        prev.map(p =>
          p.action_id === actionId ? { ...p, [field]: value } : p
        )
      );

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update preference');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'post':
        return '📝';
      case 'subscription':
        return '💳';
      case 'account':
        return '👤';
      case 'error':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const groupedPreferences = preferences.reduce((acc, pref) => {
    if (!acc[pref.category]) {
      acc[pref.category] = [];
    }
    acc[pref.category].push(pref);
    return acc;
  }, {} as Record<string, NotificationPreference[]>);

  if (loading) {
    return <AppLoader />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Settings</h1>
        <p className="text-gray-600">
          Configure which notifications are sent via email and push notifications. These settings apply to all users.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Preferences updated successfully!
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 w-32">
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 w-32">
                  <div className="flex items-center justify-center gap-2">
                    <Bell className="w-4 h-4" />
                    Push
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(groupedPreferences).map(([category, prefs]) => (
                <React.Fragment key={category}>
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-6 py-3 text-sm font-semibold text-gray-700 uppercase">
                      {getCategoryIcon(category)} {category}
                    </td>
                  </tr>
                  {prefs.map((pref) => (
                    <tr key={pref.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{pref.action_name}</div>
                          {pref.description && (
                            <div className="text-sm text-gray-500 mt-1">{pref.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pref.email_enabled}
                            onChange={(e) =>
                              updatePreference(pref.action_id, 'email_enabled', e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pref.push_enabled}
                            onChange={(e) =>
                              updatePreference(pref.action_id, 'push_enabled', e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={loadPreferences}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
}
