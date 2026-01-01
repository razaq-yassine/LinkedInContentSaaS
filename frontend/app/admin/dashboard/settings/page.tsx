'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Save, RefreshCw, Settings as SettingsIcon, Shield, Palette, 
  ToggleLeft, ToggleRight, AlertTriangle, Users, Zap, Mail, 
  BarChart3, Eye, EyeOff, Check, Plus, Trash2, Bot, Key,
  CheckCircle, XCircle, AlertCircle, Loader2, ChevronDown, ChevronUp,
  Upload, Image as ImageIcon
} from 'lucide-react';

interface GlobalSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  updated_at: string;
}

interface SettingCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  settings: string[];
}

interface EnvVariable {
  key: string;
  label: string;
  type: string;
  options?: string[];
  default: string;
  sensitive: boolean;
  value: string;
  hasValue: boolean;
  isSet: boolean;
}

interface EnvCategory {
  title: string;
  variables: EnvVariable[];
}

interface KeyStatus {
  key: string;
  status: 'valid' | 'invalid' | 'unconfigured' | 'error';
  message: string;
  balance?: string;
  quota?: Record<string, any>;
}

interface AIModel {
  id: string;
  name: string;
  description: string;
}

interface AIProvider {
  name: string;
  models: AIModel[];
  features: string[];
  api_key_env: string;
  model_env: string;
}

interface AIConfig {
  current_provider: string;
  current_model: string;
  current_image_model: string;
  providers: Record<string, AIProvider>;
  image_providers: Record<string, any>;
  provider_statuses: Record<string, { status: string; message: string; models_available?: number }>;
  image_provider_status: { status: string; message: string };
  settings: { temperature: number; max_tokens: number };
}

interface AITestResult {
  success: boolean;
  provider: string;
  model: string;
  response?: string;
  error?: string;
  latency_ms: number;
  token_usage?: { input_tokens: number; output_tokens: number; total_tokens: number };
}

// Public page themes (landing, login, about)
const PUBLIC_THEMES = [
  { id: 'modern-gradient', name: 'Modern Gradient', colors: ['#667eea', '#764ba2'], preview: 'bg-gradient-to-r from-indigo-500 to-purple-600' },
  { id: 'minimal-light', name: 'Minimal Light', colors: ['#ffffff', '#f8fafc'], preview: 'bg-gradient-to-br from-white to-slate-100' },
  { id: 'dark-elegance', name: 'Dark Elegance', colors: ['#1a1a2e', '#16213e'], preview: 'bg-gradient-to-br from-slate-900 to-slate-800' },
  { id: 'vibrant-startup', name: 'Vibrant Startup', colors: ['#ff6b6b', '#feca57'], preview: 'bg-gradient-to-r from-red-400 to-yellow-400' },
  { id: 'corporate-blue', name: 'Corporate Blue', colors: ['#0A66C2', '#004182'], preview: 'bg-gradient-to-br from-blue-600 to-blue-900' },
  { id: 'nature-green', name: 'Nature Green', colors: ['#11998e', '#38ef7d'], preview: 'bg-gradient-to-r from-teal-600 to-green-400' },
];

// App themes (dashboard, generate page)
const APP_THEMES = [
  { id: 'professional-light', name: 'Professional Light', colors: ['#f8fafc', '#0A66C2'], preview: 'bg-slate-50 border-2 border-blue-600' },
  { id: 'modern-dark', name: 'Modern Dark', colors: ['#0f172a', '#3b82f6'], preview: 'bg-slate-900 border-2 border-blue-500' },
  { id: 'ocean-breeze', name: 'Ocean Breeze', colors: ['#ecfeff', '#0891b2'], preview: 'bg-cyan-50 border-2 border-cyan-600' },
  { id: 'sunset-warm', name: 'Sunset Warm', colors: ['#fff7ed', '#ea580c'], preview: 'bg-orange-50 border-2 border-orange-600' },
  { id: 'forest-calm', name: 'Forest Calm', colors: ['#f0fdf4', '#16a34a'], preview: 'bg-green-50 border-2 border-green-600' },
  { id: 'midnight-purple', name: 'Midnight Purple', colors: ['#faf5ff', '#9333ea'], preview: 'bg-purple-50 border-2 border-purple-600' },
  { id: 'rose-gold', name: 'Rose Gold', colors: ['#fff1f2', '#e11d48'], preview: 'bg-rose-50 border-2 border-rose-600' },
  { id: 'slate-minimal', name: 'Slate Minimal', colors: ['#f1f5f9', '#475569'], preview: 'bg-slate-100 border-2 border-slate-600' },
];

// Legacy themes (kept for compatibility)
const THEMES = [
  { id: 'default', name: 'LinkedIn Blue', color: '#0A66C2', preview: 'bg-[#0A66C2]' },
  { id: 'ocean', name: 'Ocean Cyan', color: '#0891b2', preview: 'bg-cyan-600' },
  { id: 'sunset', name: 'Sunset Orange', color: '#ea580c', preview: 'bg-orange-600' },
  { id: 'forest', name: 'Forest Green', color: '#16a34a', preview: 'bg-green-600' },
  { id: 'midnight', name: 'Midnight Indigo', color: '#6366f1', preview: 'bg-indigo-500' },
  { id: 'rose', name: 'Rose Pink', color: '#e11d48', preview: 'bg-rose-600' },
  { id: 'purple', name: 'Royal Purple', color: '#9333ea', preview: 'bg-purple-600' },
];

const SETTING_CATEGORIES: SettingCategory[] = [
  {
    id: 'site',
    title: 'Site Configuration',
    description: 'General site settings and maintenance mode',
    icon: <Shield className="w-5 h-5" />,
    settings: ['maintenance_mode', 'maintenance_message', 'app_name', 'registration_enabled', 'require_email_verification']
  },
  {
    id: 'theme',
    title: 'Appearance & Theme',
    description: 'Customize public pages and application themes',
    icon: <Palette className="w-5 h-5" />,
    settings: ['public_theme', 'public_hero_style', 'public_accent_color', 'public_dark_mode', 'app_theme', 'app_sidebar_style', 'app_accent_color', 'app_dark_mode', 'app_card_style', 'app_animations_enabled', 'logo_url']
  },
  {
    id: 'features',
    title: 'Feature Toggles',
    description: 'Enable or disable application features',
    icon: <Zap className="w-5 h-5" />,
    settings: [
      'linkedin_oauth_enabled', 'google_oauth_enabled', 'email_login_enabled', 'magic_link_enabled',
      'post_generation_enabled', 'image_generation_enabled', 'carousel_generation_enabled', 'comment_generation_enabled',
      'web_search_enabled', 'trending_topics_enabled', 'content_rewrite_enabled', 'hashtag_suggestions_enabled',
      'tone_selection_enabled', 'multi_language_enabled', 'direct_posting_enabled', 'post_scheduling_enabled',
      'linkedin_analytics_enabled', 'conversation_history_enabled', 'saved_posts_enabled', 'templates_enabled',
      'user_preferences_enabled', 'onboarding_enabled', 'profile_customization_enabled', 'creator_personas_enabled',
      'keyboard_shortcuts_enabled', 'premium_features_enabled', 'api_access_enabled', 'bulk_generation_enabled', 'export_enabled'
    ]
  },
  {
    id: 'limits',
    title: 'Rate Limits & Quotas',
    description: 'Control API usage and generation limits',
    icon: <BarChart3 className="w-5 h-5" />,
    settings: ['api_rate_limit_per_minute', 'generation_cooldown_seconds', 'max_daily_generations_free', 'max_daily_generations_premium', 'max_images_per_day_free', 'max_images_per_day_premium', 'max_conversations_stored']
  },
  {
    id: 'moderation',
    title: 'Content Moderation',
    description: 'Content filtering and moderation settings',
    icon: <Eye className="w-5 h-5" />,
    settings: ['content_moderation_enabled', 'profanity_filter_enabled', 'spam_detection_enabled', 'blocked_keywords', 'max_post_length']
  },
  {
    id: 'email',
    title: 'Email & Notifications',
    description: 'Email notification settings',
    icon: <Mail className="w-5 h-5" />,
    settings: ['email_notifications_enabled', 'welcome_email_enabled', 'weekly_digest_enabled', 'tips_emails_enabled']
  },
  {
    id: 'analytics',
    title: 'Analytics & Tracking',
    description: 'Usage analytics and tracking configuration',
    icon: <BarChart3 className="w-5 h-5" />,
    settings: ['analytics_enabled', 'google_analytics_id', 'error_tracking_enabled', 'performance_monitoring_enabled']
  },
  {
    id: 'ai',
    title: 'AI Configuration',
    description: 'AI system prompts and generation rules',
    icon: <Bot className="w-5 h-5" />,
    settings: ['system_prompt', 'content_format_guidelines', 'comment_worthiness_rubric', 'default_preferences', 'trending_topics']
  },
  {
    id: 'apikeys',
    title: 'API Keys & .env',
    description: 'Manage API keys and environment configuration',
    icon: <Key className="w-5 h-5" />,
    settings: []
  }
];

const BOOLEAN_SETTINGS = [
  'maintenance_mode', 'registration_enabled', 'require_email_verification',
  'public_dark_mode', 'app_dark_mode', 'app_animations_enabled',
  'linkedin_oauth_enabled', 'google_oauth_enabled', 'email_login_enabled', 'magic_link_enabled',
  'post_generation_enabled', 'image_generation_enabled', 'carousel_generation_enabled', 'comment_generation_enabled',
  'web_search_enabled', 'trending_topics_enabled', 'content_rewrite_enabled', 'hashtag_suggestions_enabled',
  'tone_selection_enabled', 'multi_language_enabled', 'direct_posting_enabled', 'post_scheduling_enabled',
  'linkedin_analytics_enabled', 'conversation_history_enabled', 'saved_posts_enabled', 'templates_enabled',
  'user_preferences_enabled', 'onboarding_enabled', 'profile_customization_enabled', 'creator_personas_enabled',
  'keyboard_shortcuts_enabled', 'premium_features_enabled', 'api_access_enabled', 'bulk_generation_enabled', 'export_enabled',
  'content_moderation_enabled', 'profanity_filter_enabled', 'spam_detection_enabled',
  'email_notifications_enabled', 'welcome_email_enabled', 'weekly_digest_enabled', 'tips_emails_enabled',
  'analytics_enabled', 'error_tracking_enabled', 'performance_monitoring_enabled'
];

const NUMBER_SETTINGS = [
  'api_rate_limit_per_minute', 'generation_cooldown_seconds', 'max_daily_generations_free',
  'max_daily_generations_premium', 'max_images_per_day_free', 'max_images_per_day_premium',
  'max_conversations_stored', 'max_post_length'
];

const SELECT_SETTINGS: Record<string, { options: string[], labels: string[] }> = {
  'public_theme': {
    options: ['modern-gradient', 'minimal-light', 'dark-elegance', 'vibrant-startup', 'corporate-blue', 'nature-green'],
    labels: ['Modern Gradient', 'Minimal Light', 'Dark Elegance', 'Vibrant Startup', 'Corporate Blue', 'Nature Green']
  },
  'public_hero_style': {
    options: ['gradient', 'image', 'video', 'animated'],
    labels: ['Gradient Background', 'Image Background', 'Video Background', 'Animated Background']
  },
  'app_theme': {
    options: ['professional-light', 'modern-dark', 'ocean-breeze', 'sunset-warm', 'forest-calm', 'midnight-purple', 'rose-gold', 'slate-minimal'],
    labels: ['Professional Light', 'Modern Dark', 'Ocean Breeze', 'Sunset Warm', 'Forest Calm', 'Midnight Purple', 'Rose Gold', 'Slate Minimal']
  },
  'app_sidebar_style': {
    options: ['default', 'compact', 'floating', 'hidden'],
    labels: ['Default', 'Compact', 'Floating', 'Hidden']
  },
  'app_card_style': {
    options: ['elevated', 'flat', 'bordered', 'glass'],
    labels: ['Elevated Shadow', 'Flat', 'Bordered', 'Glass Effect']
  }
};

const COLOR_SETTINGS = ['public_accent_color', 'app_accent_color', 'primary_color'];

const TEXTAREA_SETTINGS = [
  'system_prompt', 'content_format_guidelines', 'comment_worthiness_rubric', 
  'maintenance_message', 'custom_css', 'default_preferences', 'trending_topics', 'blocked_keywords'
];

export default function GlobalSettingsPage() {
  const [settings, setSettings] = useState<GlobalSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('site');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showNewSettingModal, setShowNewSettingModal] = useState(false);
  const [newSetting, setNewSetting] = useState({ key: '', value: '', description: '' });
  
  // API Keys / .env state
  const [envVariables, setEnvVariables] = useState<Record<string, EnvCategory>>({});
  const [envEdits, setEnvEdits] = useState<Record<string, string>>({});
  const [keyStatuses, setKeyStatuses] = useState<Record<string, KeyStatus>>({});
  const [checkingKeys, setCheckingKeys] = useState(false);
  const [savingEnv, setSavingEnv] = useState(false);
  const [expandedEnvCategory, setExpandedEnvCategory] = useState<string | null>('ai_keys');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  
  // Logo upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // AI Configuration state
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [aiConfigLoading, setAiConfigLoading] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<AITestResult | null>(null);
  const [aiTesting, setAiTesting] = useState(false);
  const [imageTestResult, setImageTestResult] = useState<any>(null);
  const [imageTesting, setImageTesting] = useState(false);
  const [savingAiConfig, setSavingAiConfig] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);
  
  useEffect(() => {
    if (activeCategory === 'apikeys') {
      fetchEnvVariables();
    }
    if (activeCategory === 'ai') {
      fetchAiConfig();
    }
  }, [activeCategory]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnvVariables = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/env/variables`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEnvVariables(response.data);
    } catch (error) {
      console.error('Failed to fetch env variables:', error);
    }
  };

  const fetchAiConfig = async () => {
    setAiConfigLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/ai/config`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAiConfig(response.data);
    } catch (error) {
      console.error('Failed to fetch AI config:', error);
    } finally {
      setAiConfigLoading(false);
    }
  };

  const updateAiConfig = async (updates: { provider?: string; model?: string; image_model?: string }) => {
    setSavingAiConfig(true);
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/ai/config`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage('AI configuration updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchAiConfig();
    } catch (error: any) {
      console.error('Failed to update AI config:', error);
      alert(error.response?.data?.detail || 'Failed to update AI configuration');
    } finally {
      setSavingAiConfig(false);
    }
  };

  const testAiConnection = async () => {
    setAiTesting(true);
    setAiTestResult(null);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/ai/test`,
        { prompt: "Say 'Hello! AI is working correctly.' in exactly 6 words." },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAiTestResult(response.data);
    } catch (error: any) {
      console.error('Failed to test AI:', error);
      setAiTestResult({
        success: false,
        provider: aiConfig?.current_provider || 'unknown',
        model: aiConfig?.current_model || 'unknown',
        error: error.response?.data?.detail || 'Connection test failed',
        latency_ms: 0
      });
    } finally {
      setAiTesting(false);
    }
  };

  const testImageGeneration = async () => {
    setImageTesting(true);
    setImageTestResult(null);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/ai/test-image`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setImageTestResult(response.data);
    } catch (error: any) {
      console.error('Failed to test image generation:', error);
      setImageTestResult({
        success: false,
        error: error.response?.data?.detail || 'Image generation test failed',
        latency_ms: 0
      });
    } finally {
      setImageTesting(false);
    }
  };

  const checkAllKeyStatuses = async () => {
    setCheckingKeys(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/env/all-key-status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setKeyStatuses(response.data);
    } catch (error) {
      console.error('Failed to check key statuses:', error);
    } finally {
      setCheckingKeys(false);
    }
  };

  const saveEnvVariables = async () => {
    setSavingEnv(true);
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/env/variables`,
        { variables: envEdits },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage('Environment variables updated. Restart server for changes to take effect.');
      setTimeout(() => setSuccessMessage(null), 5000);
      setEnvEdits({});
      await fetchEnvVariables();
    } catch (error) {
      console.error('Failed to save env variables:', error);
      alert('Failed to save environment variables');
    } finally {
      setSavingEnv(false);
    }
  };

  const handleEnvChange = (key: string, value: string) => {
    setEnvEdits(prev => ({ ...prev, [key]: value }));
  };

  const getEnvValue = (key: string, originalValue: string): string => {
    return envEdits[key] !== undefined ? envEdits[key] : originalValue;
  };

  const getKeyStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'invalid':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'unconfigured':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getKeyStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'invalid':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'unconfigured':
        return 'bg-gray-50 border-gray-200 text-gray-600';
      case 'error':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const getSettingValue = (key: string): string => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || '';
  };

  const updateSetting = async (key: string, value: string) => {
    setSaving(key);
    try {
      const token = localStorage.getItem('admin_token');
      
      const existingSetting = settings.find(s => s.key === key);
      if (!existingSetting) {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`,
          { key, value, description: getSettingDescription(key) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/${key}`,
          { value },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      await fetchSettings();
      setSuccessMessage(`${getSettingDisplayName(key)} updated successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setEditingKey(null);
    } catch (error) {
      console.error('Failed to update setting:', error);
      alert('Failed to update setting');
    } finally {
      setSaving(null);
    }
  };

  const handleToggle = async (key: string) => {
    const currentValue = getSettingValue(key).toLowerCase() === 'true';
    await updateSetting(key, (!currentValue).toString());
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, WebP, or SVG)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const token = localStorage.getItem('admin_token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/upload/logo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Update the logo_url setting with the full URL
      const fullLogoUrl = `${process.env.NEXT_PUBLIC_API_URL}${response.data.url}`;
      await updateSetting('logo_url', fullLogoUrl);
      setSuccessMessage('Logo uploaded successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Failed to upload logo:', error);
      alert(error.response?.data?.detail || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleThemeChange = async (themeId: string) => {
    await updateSetting('site_theme', themeId);
  };

  const createNewSetting = async () => {
    if (!newSetting.key || !newSetting.value) return;
    
    setSaving('new');
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`,
        newSetting,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchSettings();
      setShowNewSettingModal(false);
      setNewSetting({ key: '', value: '', description: '' });
      setSuccessMessage('New setting created successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create setting');
    } finally {
      setSaving(null);
    }
  };

  const getSettingDisplayName = (key: string): string => {
    const names: Record<string, string> = {
      // Site Configuration
      maintenance_mode: 'Maintenance Mode',
      maintenance_message: 'Maintenance Message',
      app_name: 'Application Name',
      registration_enabled: 'User Registration',
      allow_guest_access: 'Guest Access',
      require_email_verification: 'Email Verification Required',
      
      // Public Theme
      public_theme: 'Public Pages Theme',
      public_hero_style: 'Hero Section Style',
      public_accent_color: 'Public Accent Color',
      public_dark_mode: 'Public Dark Mode',
      
      // App Theme
      app_theme: 'Application Theme',
      app_sidebar_style: 'Sidebar Style',
      app_accent_color: 'App Accent Color',
      app_dark_mode: 'App Dark Mode',
      app_card_style: 'Card Style',
      app_animations_enabled: 'UI Animations',
      
      // Legacy
      site_theme: 'Site Theme (Legacy)',
      primary_color: 'Primary Color',
      logo_url: 'Logo URL',
      favicon_url: 'Favicon URL',
      custom_css: 'Custom CSS',
      
      // Auth Features
      linkedin_oauth_enabled: 'LinkedIn OAuth',
      google_oauth_enabled: 'Google OAuth',
      email_login_enabled: 'Email/Password Login',
      magic_link_enabled: 'Magic Link Login',
      
      // Content Generation
      post_generation_enabled: 'Post Generation',
      image_generation_enabled: 'Image Generation',
      carousel_generation_enabled: 'Carousel Generation',
      comment_generation_enabled: 'Comment Generation',
      web_search_enabled: 'Web Search',
      trending_topics_enabled: 'Trending Topics',
      content_rewrite_enabled: 'Content Rewriting',
      hashtag_suggestions_enabled: 'Hashtag Suggestions',
      tone_selection_enabled: 'Tone Selection',
      multi_language_enabled: 'Multi-Language',
      
      // LinkedIn Features
      direct_posting_enabled: 'Direct Posting',
      post_scheduling_enabled: 'Post Scheduling',
      linkedin_analytics_enabled: 'LinkedIn Analytics',
      
      // User Features
      conversation_history_enabled: 'Conversation History',
      saved_posts_enabled: 'Saved Posts',
      templates_enabled: 'Post Templates',
      user_preferences_enabled: 'User Preferences',
      onboarding_enabled: 'Onboarding Flow',
      profile_customization_enabled: 'Profile Customization',
      creator_personas_enabled: 'Creator Personas',
      keyboard_shortcuts_enabled: 'Keyboard Shortcuts',
      
      // Premium Features
      premium_features_enabled: 'Premium Features',
      api_access_enabled: 'API Access',
      bulk_generation_enabled: 'Bulk Generation',
      export_enabled: 'Export Feature',
      
      // Rate Limits
      api_rate_limit_per_minute: 'API Rate Limit (per min)',
      generation_cooldown_seconds: 'Generation Cooldown (sec)',
      max_daily_generations_free: 'Daily Generations (Free)',
      max_daily_generations_premium: 'Daily Generations (Premium)',
      max_images_per_day_free: 'Daily Images (Free)',
      max_images_per_day_premium: 'Daily Images (Premium)',
      max_conversations_stored: 'Max Conversations Stored',
      max_post_length: 'Max Post Length',
      
      // Moderation
      content_moderation_enabled: 'Content Moderation',
      profanity_filter_enabled: 'Profanity Filter',
      spam_detection_enabled: 'Spam Detection',
      blocked_keywords: 'Blocked Keywords',
      
      // Email
      email_notifications_enabled: 'Email Notifications',
      welcome_email_enabled: 'Welcome Email',
      weekly_digest_enabled: 'Weekly Digest',
      tips_emails_enabled: 'Tips & Best Practices',
      
      // Analytics
      analytics_enabled: 'Analytics Tracking',
      google_analytics_id: 'Google Analytics ID',
      error_tracking_enabled: 'Error Tracking',
      performance_monitoring_enabled: 'Performance Monitoring',
      
      // AI
      system_prompt: 'System Prompt',
      content_format_guidelines: 'Content Format Guidelines',
      comment_worthiness_rubric: 'Comment Worthiness Rubric',
      default_preferences: 'Default Preferences',
      trending_topics: 'Trending Topics',
    };
    return names[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      // Site Configuration
      maintenance_mode: 'Enable to show maintenance page to all users and block logins',
      maintenance_message: 'Message displayed during maintenance',
      app_name: 'Application name shown in the UI',
      registration_enabled: 'Allow new users to register',
      require_email_verification: 'Require email verification for new accounts',
      
      // Public Theme
      public_theme: 'Theme style for public-facing pages',
      public_hero_style: 'Style of the hero section on landing page',
      public_accent_color: 'Accent color for public pages',
      public_dark_mode: 'Enable dark mode on public pages',
      
      // App Theme
      app_theme: 'Theme style for the main application',
      app_sidebar_style: 'Style of the navigation sidebar',
      app_accent_color: 'Accent color for the application',
      app_dark_mode: 'Enable dark mode in the application',
      app_card_style: 'Style of cards throughout the app',
      app_animations_enabled: 'Enable smooth UI animations',
      
      // Legacy
      site_theme: 'Legacy color theme setting',
      primary_color: 'Primary brand color in hex format',
      logo_url: 'URL to custom logo image',
      favicon_url: 'URL to custom favicon',
      custom_css: 'Custom CSS to inject into the site',
      
      // Auth Features
      linkedin_oauth_enabled: 'Enable LinkedIn login and posting',
      google_oauth_enabled: 'Enable Google login',
      email_login_enabled: 'Enable email and password login',
      magic_link_enabled: 'Enable passwordless magic link login',
      
      // Content Generation
      post_generation_enabled: 'Enable AI-powered post generation',
      image_generation_enabled: 'Enable AI image generation',
      carousel_generation_enabled: 'Enable carousel/PDF generation',
      comment_generation_enabled: 'Enable comment generation',
      web_search_enabled: 'Enable web search for content research',
      trending_topics_enabled: 'Show trending topic suggestions',
      content_rewrite_enabled: 'Enable AI content rewriting',
      hashtag_suggestions_enabled: 'Show AI hashtag suggestions',
      tone_selection_enabled: 'Allow users to select content tone',
      multi_language_enabled: 'Enable multi-language generation',
      
      // LinkedIn Features
      direct_posting_enabled: 'Enable direct posting to LinkedIn',
      post_scheduling_enabled: 'Enable post scheduling feature',
      linkedin_analytics_enabled: 'Enable LinkedIn post analytics',
      
      // User Features
      conversation_history_enabled: 'Save conversation history',
      saved_posts_enabled: 'Allow users to save posts',
      templates_enabled: 'Enable post templates',
      user_preferences_enabled: 'Allow user preference customization',
      onboarding_enabled: 'Show onboarding flow for new users',
      profile_customization_enabled: 'Allow profile customization',
      creator_personas_enabled: 'Enable creator persona selection',
      keyboard_shortcuts_enabled: 'Enable keyboard shortcuts',
      
      // Premium Features
      premium_features_enabled: 'Enable premium feature tier',
      api_access_enabled: 'Allow API access for users',
      bulk_generation_enabled: 'Enable bulk content generation',
      export_enabled: 'Enable export functionality',
      
      // Rate Limits
      api_rate_limit_per_minute: 'Maximum API requests per minute',
      generation_cooldown_seconds: 'Seconds between generations',
      max_daily_generations_free: 'Daily limit for free users',
      max_daily_generations_premium: 'Daily limit for premium users',
      max_images_per_day_free: 'Image limit for free users',
      max_images_per_day_premium: 'Image limit for premium users',
      max_conversations_stored: 'Max conversations per user',
      max_post_length: 'Maximum post character length',
      
      // Moderation
      content_moderation_enabled: 'Review content before publishing',
      profanity_filter_enabled: 'Filter profane content',
      spam_detection_enabled: 'Detect and block spam content',
      blocked_keywords: 'JSON array of blocked keywords',
      
      // Email
      email_notifications_enabled: 'Send email notifications',
      welcome_email_enabled: 'Send welcome email on registration',
      weekly_digest_enabled: 'Send weekly usage digest',
      tips_emails_enabled: 'Send tips and best practices',
      
      // Analytics
      analytics_enabled: 'Enable usage analytics',
      google_analytics_id: 'Google Analytics tracking ID',
      error_tracking_enabled: 'Track and report errors',
      performance_monitoring_enabled: 'Monitor app performance',
    };
    return descriptions[key] || '';
  };

  const renderSettingInput = (key: string) => {
    const value = getSettingValue(key);
    const isEditing = editingKey === key;
    const isSaving = saving === key;

    // Public Theme Selector
    if (key === 'public_theme') {
      return (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Theme for landing page, login, and public pages</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PUBLIC_THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => updateSetting(key, theme.id)}
                disabled={isSaving}
                className={`relative p-3 rounded-lg border-2 transition-all ${
                  value === theme.id || (!value && theme.id === 'modern-gradient')
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-full h-10 rounded ${theme.preview} mb-2`} />
                <p className="text-xs font-medium text-gray-700">{theme.name}</p>
                {(value === theme.id || (!value && theme.id === 'modern-gradient')) && (
                  <Check className="absolute top-2 right-2 w-4 h-4 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // App Theme Selector
    if (key === 'app_theme') {
      return (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Theme for dashboard, content generator, and app pages</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {APP_THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => updateSetting(key, theme.id)}
                disabled={isSaving}
                className={`relative p-3 rounded-lg border-2 transition-all ${
                  value === theme.id || (!value && theme.id === 'professional-light')
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-full h-10 rounded ${theme.preview} mb-2`} />
                <p className="text-xs font-medium text-gray-700">{theme.name}</p>
                {(value === theme.id || (!value && theme.id === 'professional-light')) && (
                  <Check className="absolute top-2 right-2 w-4 h-4 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Logo URL with upload
    if (key === 'logo_url') {
      return (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-3">Upload a custom logo for your application</p>
          
          {/* Current Logo Display */}
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                {value ? (
                  <img 
                    src={value} 
                    alt="Current Logo" 
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                    <p className="text-xs">No logo set</p>
                  </div>
                )}
              </div>
              {value && (
                <p className="text-xs text-gray-500 mt-2 text-center">Current Logo</p>
              )}
            </div>
            
            {/* Upload Controls */}
            <div className="flex-1 space-y-3">
              <label className="block">
                <span className="sr-only">Choose logo file</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                    {uploadingLogo ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload New Logo
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                  {value && (
                    <button
                      onClick={() => updateSetting('logo_url', '')}
                      disabled={isSaving}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>
              </label>
              <p className="text-xs text-gray-500">
                Accepted formats: JPEG, PNG, WebP, SVG. Max size: 2MB
              </p>
              
              {/* Manual URL Input */}
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Or enter a URL directly:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={isEditing ? editValue : value}
                    onChange={(e) => setEditValue(e.target.value)}
                    onFocus={() => { setEditingKey(key); setEditValue(value); }}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {isEditing && (
                    <button
                      onClick={() => updateSetting(key, editValue)}
                      disabled={isSaving}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Legacy site theme
    if (key === 'site_theme') {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => updateSetting(key, theme.id)}
              disabled={isSaving}
              className={`relative p-3 rounded-lg border-2 transition-all ${
                value === theme.id || (!value && theme.id === 'default')
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-full h-8 rounded ${theme.preview} mb-2`} />
              <p className="text-xs font-medium text-gray-700">{theme.name}</p>
              {(value === theme.id || (!value && theme.id === 'default')) && (
                <Check className="absolute top-2 right-2 w-4 h-4 text-blue-500" />
              )}
            </button>
          ))}
        </div>
      );
    }

    // Select/Dropdown Settings
    if (SELECT_SETTINGS[key]) {
      const selectConfig = SELECT_SETTINGS[key];
      return (
        <div className="mt-2">
          <select
            value={value || selectConfig.options[0]}
            onChange={(e) => updateSetting(key, e.target.value)}
            disabled={isSaving}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {selectConfig.options.map((opt, idx) => (
              <option key={opt} value={opt}>{selectConfig.labels[idx]}</option>
            ))}
          </select>
          {isSaving && <RefreshCw className="inline-block w-4 h-4 animate-spin ml-2" />}
        </div>
      );
    }

    // Color Picker Settings
    if (COLOR_SETTINGS.includes(key)) {
      return (
        <div className="flex items-center space-x-3 mt-2">
          <input
            type="color"
            value={value || '#0A66C2'}
            onChange={(e) => updateSetting(key, e.target.value)}
            disabled={isSaving}
            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={isEditing ? editValue : value}
            onChange={(e) => setEditValue(e.target.value)}
            onFocus={() => { setEditingKey(key); setEditValue(value); }}
            placeholder="#0A66C2"
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          {isEditing && (
            <button
              onClick={() => updateSetting(key, editValue)}
              disabled={isSaving}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>
          )}
        </div>
      );
    }

    if (BOOLEAN_SETTINGS.includes(key)) {
      const isEnabled = value.toLowerCase() === 'true';
      return (
        <button
          onClick={() => handleToggle(key)}
          disabled={isSaving}
          className={`flex items-center space-x-2 mt-2 px-4 py-2 rounded-lg transition-colors ${
            isEnabled 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {isEnabled ? (
            <ToggleRight className="w-6 h-6" />
          ) : (
            <ToggleLeft className="w-6 h-6" />
          )}
          <span className="font-medium">{isEnabled ? 'Enabled' : 'Disabled'}</span>
          {isSaving && <RefreshCw className="w-4 h-4 animate-spin ml-2" />}
        </button>
      );
    }

    if (NUMBER_SETTINGS.includes(key)) {
      return (
        <div className="flex items-center space-x-3 mt-2">
          <input
            type="number"
            value={isEditing ? editValue : value}
            onChange={(e) => setEditValue(e.target.value)}
            onFocus={() => { setEditingKey(key); setEditValue(value); }}
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isEditing && (
            <button
              onClick={() => updateSetting(key, editValue)}
              disabled={isSaving}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>
          )}
        </div>
      );
    }

    if (TEXTAREA_SETTINGS.includes(key)) {
      return (
        <div className="mt-3">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={10}
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditingKey(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateSetting(key, editValue)}
                  disabled={isSaving}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto mb-2">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {value || 'No value set'}
                </pre>
              </div>
              <button
                onClick={() => { setEditingKey(key); setEditValue(value); }}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-3 mt-2">
        <input
          type="text"
          value={isEditing ? editValue : value}
          onChange={(e) => setEditValue(e.target.value)}
          onFocus={() => { setEditingKey(key); setEditValue(value); }}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={`Enter ${getSettingDisplayName(key).toLowerCase()}...`}
        />
        {isEditing && (
          <button
            onClick={() => updateSetting(key, editValue)}
            disabled={isSaving}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          </button>
        )}
      </div>
    );
  };

  const currentCategory = SETTING_CATEGORIES.find(c => c.id === activeCategory);
  const categorySettings = currentCategory?.settings || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Global Settings</h1>
          <p className="text-gray-600 mt-1">Manage system-wide configuration</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowNewSettingModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Setting
          </button>
          <button
            onClick={fetchSettings}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}

      {/* Maintenance Warning */}
      {getSettingValue('maintenance_mode').toLowerCase() === 'true' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-700 font-medium">
            Maintenance mode is currently ENABLED. Users cannot access the application.
          </span>
        </div>
      )}

      <div className="flex gap-6">
        {/* Category Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Categories</h3>
            <nav className="space-y-1">
              {SETTING_CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeCategory === category.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className={activeCategory === category.id ? 'text-blue-600' : 'text-gray-400'}>
                    {category.icon}
                  </span>
                  <span className="font-medium text-sm">{category.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <span className="text-blue-600">{currentCategory?.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{currentCategory?.title}</h2>
                <p className="text-sm text-gray-500">{currentCategory?.description}</p>
              </div>
            </div>

            {activeCategory !== 'ai' && activeCategory !== 'apikeys' && (
              <div className="divide-y divide-gray-100">
                {categorySettings.map(key => (
                  <div key={key} className="py-5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900">
                          {getSettingDisplayName(key)}
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {getSettingDescription(key)}
                        </p>
                      </div>
                    </div>
                    {renderSettingInput(key)}
                  </div>
                ))}
              </div>
            )}

            {categorySettings.length === 0 && activeCategory !== 'apikeys' && activeCategory !== 'ai' && (
              <div className="text-center py-8">
                <SettingsIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No settings in this category</p>
              </div>
            )}

            {/* AI Configuration Panel */}
            {activeCategory === 'ai' && (
              <div className="space-y-6">
                {/* Loading State */}
                {aiConfigLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                )}

                {/* AI Config Content */}
                {!aiConfigLoading && aiConfig && (
                  <>
                    {/* Current Status Overview */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Current AI Configuration</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Text Generation Provider */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Text Generation</span>
                            {aiConfig.provider_statuses[aiConfig.current_provider]?.status === 'valid' ? (
                              <span className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                <CheckCircle className="w-3 h-3 mr-1" /> Connected
                              </span>
                            ) : (
                              <span className="flex items-center text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                <XCircle className="w-3 h-3 mr-1" /> {aiConfig.provider_statuses[aiConfig.current_provider]?.status || 'Unknown'}
                              </span>
                            )}
                          </div>
                          <p className="text-lg font-bold text-gray-900 capitalize">{aiConfig.providers[aiConfig.current_provider]?.name || aiConfig.current_provider}</p>
                          <p className="text-sm text-gray-500">{aiConfig.current_model}</p>
                        </div>

                        {/* Image Generation Provider */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Image Generation</span>
                            {aiConfig.image_provider_status?.status === 'valid' ? (
                              <span className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                <CheckCircle className="w-3 h-3 mr-1" /> Connected
                              </span>
                            ) : (
                              <span className="flex items-center text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                                <AlertCircle className="w-3 h-3 mr-1" /> {aiConfig.image_provider_status?.status || 'Not configured'}
                              </span>
                            )}
                          </div>
                          <p className="text-lg font-bold text-gray-900">Cloudflare Workers AI</p>
                          <p className="text-sm text-gray-500 truncate">{aiConfig.current_image_model?.split('/').pop()}</p>
                        </div>

                        {/* Quick Test */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <span className="text-sm font-medium text-gray-600 block mb-2">Connection Test</span>
                          <button
                            onClick={testAiConnection}
                            disabled={aiTesting}
                            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {aiTesting ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Testing...
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4 mr-2" />
                                Test AI
                              </>
                            )}
                          </button>
                          {aiTestResult && (
                            <div className={`mt-2 text-xs p-2 rounded ${aiTestResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              {aiTestResult.success ? (
                                <>✓ {aiTestResult.latency_ms}ms</>
                              ) : (
                                <>✗ {aiTestResult.error}</>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Provider Selection */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Text Generation Provider</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(aiConfig.providers).map(([providerId, provider]) => (
                          <div
                            key={providerId}
                            className={`relative rounded-xl border-2 p-5 cursor-pointer transition-all ${
                              aiConfig.current_provider === providerId
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                            onClick={() => {
                              if (aiConfig.current_provider !== providerId) {
                                updateAiConfig({ provider: providerId });
                              }
                            }}
                          >
                            {aiConfig.current_provider === providerId && (
                              <div className="absolute top-3 right-3">
                                <Check className="w-5 h-5 text-blue-600" />
                              </div>
                            )}
                            <div className="flex items-center mb-3">
                              <Bot className="w-6 h-6 text-gray-700 mr-3" />
                              <div>
                                <h4 className="font-bold text-gray-900">{provider.name}</h4>
                                <div className="flex items-center mt-1">
                                  {aiConfig.provider_statuses[providerId]?.status === 'valid' ? (
                                    <span className="text-xs text-green-600 flex items-center">
                                      <CheckCircle className="w-3 h-3 mr-1" /> Ready
                                    </span>
                                  ) : aiConfig.provider_statuses[providerId]?.status === 'unconfigured' ? (
                                    <span className="text-xs text-gray-500 flex items-center">
                                      <AlertCircle className="w-3 h-3 mr-1" /> API key not set
                                    </span>
                                  ) : (
                                    <span className="text-xs text-red-600 flex items-center">
                                      <XCircle className="w-3 h-3 mr-1" /> {aiConfig.provider_statuses[providerId]?.message}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {provider.features?.map(feature => (
                                <span key={feature} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                  {feature.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Model Selection */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Model Selection
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          ({aiConfig.providers[aiConfig.current_provider]?.name})
                        </span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {aiConfig.providers[aiConfig.current_provider]?.models.map(model => (
                          <div
                            key={model.id}
                            className={`rounded-lg border p-4 cursor-pointer transition-all ${
                              aiConfig.current_model === model.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                            onClick={() => {
                              if (aiConfig.current_model !== model.id) {
                                updateAiConfig({ model: model.id });
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">{model.name}</h4>
                                <p className="text-sm text-gray-500">{model.description}</p>
                              </div>
                              {aiConfig.current_model === model.id && (
                                <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Image Model Selection */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Image Generation Model
                        <span className="text-sm font-normal text-gray-500 ml-2">(Cloudflare Workers AI)</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {aiConfig.image_providers?.cloudflare?.models?.map((model: AIModel) => (
                          <div
                            key={model.id}
                            className={`rounded-lg border p-4 cursor-pointer transition-all ${
                              aiConfig.current_image_model === model.id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                            onClick={() => {
                              if (aiConfig.current_image_model !== model.id) {
                                updateAiConfig({ image_model: model.id });
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">{model.name}</h4>
                                <p className="text-xs text-gray-500">{model.description}</p>
                              </div>
                              {aiConfig.current_image_model === model.id && (
                                <Check className="w-5 h-5 text-purple-600 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={testImageGeneration}
                          disabled={imageTesting || aiConfig.image_provider_status?.status !== 'valid'}
                          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                          {imageTesting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Testing Image Generation...
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-4 h-4 mr-2" />
                              Test Image Generation
                            </>
                          )}
                        </button>
                        {imageTestResult && (
                          <div className={`mt-3 p-3 rounded-lg ${imageTestResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            {imageTestResult.success ? (
                              <div className="text-sm text-green-700">
                                ✓ Image generated successfully in {imageTestResult.latency_ms}ms ({imageTestResult.image_size_bytes} bytes)
                              </div>
                            ) : (
                              <div className="text-sm text-red-700">
                                ✗ {imageTestResult.error}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Test Results */}
                    {aiTestResult && aiTestResult.response && (
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Last Test Result</h3>
                        <div className={`rounded-lg p-4 ${aiTestResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              {aiTestResult.success ? (
                                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                              )}
                              <span className={`font-medium ${aiTestResult.success ? 'text-green-700' : 'text-red-700'}`}>
                                {aiTestResult.success ? 'Test Passed' : 'Test Failed'}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {aiTestResult.provider} / {aiTestResult.model} • {aiTestResult.latency_ms}ms
                            </span>
                          </div>
                          {aiTestResult.response && (
                            <div className="bg-white rounded p-3 text-sm text-gray-700 font-mono">
                              {aiTestResult.response}
                            </div>
                          )}
                          {aiTestResult.token_usage && (
                            <div className="mt-2 text-xs text-gray-500">
                              Tokens: {aiTestResult.token_usage.input_tokens} in / {aiTestResult.token_usage.output_tokens} out / {aiTestResult.token_usage.total_tokens} total
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Saving Indicator */}
                    {savingAiConfig && (
                      <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Saving configuration...
                      </div>
                    )}
                  </>
                )}

                {/* Prompts Section */}
                {!aiConfigLoading && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Prompts & Guidelines</h3>
                    <div className="divide-y divide-gray-100">
                      {categorySettings.map(key => (
                        <div key={key} className="py-5 first:pt-0 last:pb-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-base font-semibold text-gray-900">
                                {getSettingDisplayName(key)}
                              </h3>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {getSettingDescription(key)}
                              </p>
                            </div>
                          </div>
                          {renderSettingInput(key)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* API Keys Panel */}
            {activeCategory === 'apikeys' && (
              <div className="space-y-6">
                {/* Key Status Overview */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">API Key Status</h3>
                  <button
                    onClick={checkAllKeyStatuses}
                    disabled={checkingKeys}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {checkingKeys ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Check All Keys
                  </button>
                </div>

                {/* Key Status Cards */}
                {Object.keys(keyStatuses).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(keyStatuses).map(([key, status]) => (
                      <div
                        key={key}
                        className={`p-4 rounded-lg border ${getKeyStatusColor(status.status)}`}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          {getKeyStatusIcon(status.status)}
                          <span className="font-semibold capitalize">{key}</span>
                        </div>
                        <p className="text-sm">{status.message}</p>
                        {status.balance && (
                          <p className="text-sm font-medium mt-2">{status.balance}</p>
                        )}
                        {status.quota && (
                          <div className="mt-2 text-xs space-y-1">
                            {Object.entries(status.quota).map(([qKey, qValue]) => (
                              <div key={qKey} className="flex justify-between">
                                <span className="opacity-75">{qKey.replace(/_/g, ' ')}:</span>
                                <span className="font-medium">{String(qValue)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Environment Variables Editor */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Environment Variables (.env)</h3>
                    {Object.keys(envEdits).length > 0 && (
                      <button
                        onClick={saveEnvVariables}
                        disabled={savingEnv}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {savingEnv ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes ({Object.keys(envEdits).length})
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {Object.entries(envVariables).map(([categoryId, category]) => (
                      <div key={categoryId} className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedEnvCategory(expandedEnvCategory === categoryId ? null : categoryId)}
                          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <span className="font-semibold text-gray-900">{category.title}</span>
                          {expandedEnvCategory === categoryId ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </button>
                        
                        {expandedEnvCategory === categoryId && (
                          <div className="p-4 space-y-4">
                            {category.variables.map((variable) => (
                              <div key={variable.key} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className="text-sm font-medium text-gray-700">
                                    {variable.label}
                                  </label>
                                  {variable.hasValue && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                      Configured
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mb-1">{variable.key}</p>
                                
                                {variable.type === 'select' ? (
                                  <select
                                    value={getEnvValue(variable.key, variable.value)}
                                    onChange={(e) => handleEnvChange(variable.key, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  >
                                    {variable.options?.map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : variable.type === 'boolean' ? (
                                  <select
                                    value={getEnvValue(variable.key, variable.value)}
                                    onChange={(e) => handleEnvChange(variable.key, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="true">True</option>
                                    <option value="false">False</option>
                                  </select>
                                ) : variable.type === 'password' ? (
                                  <div className="relative">
                                    <input
                                      type={showPasswords[variable.key] ? 'text' : 'password'}
                                      value={getEnvValue(variable.key, variable.value)}
                                      onChange={(e) => handleEnvChange(variable.key, e.target.value)}
                                      placeholder={variable.hasValue ? '••••••••' : `Enter ${variable.label}...`}
                                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPasswords(prev => ({ ...prev, [variable.key]: !prev[variable.key] }))}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                      {showPasswords[variable.key] ? (
                                        <EyeOff className="w-5 h-5" />
                                      ) : (
                                        <Eye className="w-5 h-5" />
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <input
                                    type={variable.type === 'number' ? 'number' : 'text'}
                                    value={getEnvValue(variable.key, variable.value)}
                                    onChange={(e) => handleEnvChange(variable.key, e.target.value)}
                                    placeholder={`Enter ${variable.label}...`}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {Object.keys(envVariables).length === 0 && (
                    <div className="text-center py-8">
                      <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Loading environment variables...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Setting Modal */}
      {showNewSettingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Setting</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                <input
                  type="text"
                  value={newSetting.key}
                  onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="setting_key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <textarea
                  value={newSetting.value}
                  onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Setting value..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newSetting.description}
                  onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="What this setting does..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewSettingModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={createNewSetting}
                disabled={saving === 'new' || !newSetting.key || !newSetting.value}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving === 'new' ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Setting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
