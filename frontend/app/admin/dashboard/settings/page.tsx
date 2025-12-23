'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, RefreshCw, Settings as SettingsIcon } from 'lucide-react';

interface GlobalSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  updated_at: string;
}

export default function GlobalSettingsPage() {
  const [settings, setSettings] = useState<GlobalSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (setting: GlobalSetting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value || '');
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/${key}`,
        { value: editValue },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEditingKey(null);
      fetchSettings();
      alert('Setting updated successfully');
    } catch (error) {
      console.error('Failed to update setting:', error);
      alert('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const getSettingDisplayName = (key: string) => {
    const names: Record<string, string> = {
      system_prompt: 'System Prompt',
      content_format_guidelines: 'Content Format Guidelines',
      comment_worthiness_rubric: 'Comment Worthiness Rubric',
      default_preferences: 'Default Preferences',
      trending_topics: 'Trending Topics',
    };
    return names[key] || key;
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Global Settings</h1>
          <p className="text-gray-600 mt-1">Manage system-wide configuration and AI settings</p>
        </div>
        <button
          onClick={fetchSettings}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <SettingsIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getSettingDisplayName(setting.key)}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 mb-1">Key: {setting.key}</p>
                {setting.description && (
                  <p className="text-sm text-gray-600 mb-3">{setting.description}</p>
                )}
                <p className="text-xs text-gray-400">
                  Last updated: {new Date(setting.updated_at).toLocaleString()}
                </p>
              </div>
            </div>

            {editingKey === setting.key ? (
              <div className="space-y-3">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  rows={15}
                  placeholder="Enter setting value..."
                />
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSave(setting.key)}
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-gray-50 rounded-lg p-4 mb-3 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                    {setting.value || 'No value set'}
                  </pre>
                </div>
                <button
                  onClick={() => handleEdit(setting)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Edit Setting
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {settings.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No settings found</p>
        </div>
      )}
    </div>
  );
}
