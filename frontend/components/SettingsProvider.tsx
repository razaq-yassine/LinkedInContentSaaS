'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface GlobalSettings {
  // Site Configuration
  maintenance_mode: boolean;
  maintenance_message: string;
  app_name: string;
  registration_enabled: boolean;
  require_email_verification: boolean;
  
  // Public Theme
  public_theme: string;
  public_hero_style: string;
  public_accent_color: string;
  public_dark_mode: boolean;
  
  // App Theme
  app_theme: string;
  app_sidebar_style: string;
  app_accent_color: string;
  app_dark_mode: boolean;
  app_card_style: string;
  app_animations_enabled: boolean;
  
  // Legacy
  site_theme: string;
  primary_color: string;
  logo_url: string;
  favicon_url: string;
  custom_css: string;
  
  // Feature Toggles - Auth
  linkedin_oauth_enabled: boolean;
  google_oauth_enabled: boolean;
  email_login_enabled: boolean;
  magic_link_enabled: boolean;
  
  // Feature Toggles - Content
  post_generation_enabled: boolean;
  image_generation_enabled: boolean;
  carousel_generation_enabled: boolean;
  comment_generation_enabled: boolean;
  web_search_enabled: boolean;
  trending_topics_enabled: boolean;
  content_rewrite_enabled: boolean;
  hashtag_suggestions_enabled: boolean;
  tone_selection_enabled: boolean;
  multi_language_enabled: boolean;
  
  // Feature Toggles - LinkedIn
  direct_posting_enabled: boolean;
  post_scheduling_enabled: boolean;
  linkedin_analytics_enabled: boolean;
  
  // Feature Toggles - User
  conversation_history_enabled: boolean;
  saved_posts_enabled: boolean;
  templates_enabled: boolean;
  user_preferences_enabled: boolean;
  onboarding_enabled: boolean;
  profile_customization_enabled: boolean;
  creator_personas_enabled: boolean;
  keyboard_shortcuts_enabled: boolean;
  
  // Feature Toggles - Premium
  premium_features_enabled: boolean;
  api_access_enabled: boolean;
  bulk_generation_enabled: boolean;
  export_enabled: boolean;
  
  // Rate Limits
  api_rate_limit_per_minute: number;
  generation_cooldown_seconds: number;
  max_daily_generations_free: number;
  max_daily_generations_premium: number;
  max_images_per_day_free: number;
  max_images_per_day_premium: number;
  max_conversations_stored: number;
  max_post_length: number;
  
  // Moderation
  content_moderation_enabled: boolean;
  profanity_filter_enabled: boolean;
  spam_detection_enabled: boolean;
  
  // Email
  email_notifications_enabled: boolean;
  welcome_email_enabled: boolean;
  weekly_digest_enabled: boolean;
  tips_emails_enabled: boolean;
  
  // Analytics
  analytics_enabled: boolean;
  google_analytics_id: string;
  error_tracking_enabled: boolean;
  performance_monitoring_enabled: boolean;
}

const defaultSettings: GlobalSettings = {
  // Site Configuration
  maintenance_mode: false,
  maintenance_message: '',
  app_name: 'LinkedIn PostInAi',
  registration_enabled: true,
  require_email_verification: true,
  
  // Public Theme
  public_theme: 'modern-gradient',
  public_hero_style: 'gradient',
  public_accent_color: '#6366f1',
  public_dark_mode: true,
  
  // App Theme
  app_theme: 'professional-light',
  app_sidebar_style: 'default',
  app_accent_color: '#0A66C2',
  app_dark_mode: true,
  app_card_style: 'elevated',
  app_animations_enabled: true,
  
  // Legacy
  site_theme: 'default',
  primary_color: '#0A66C2',
  logo_url: '',
  favicon_url: '',
  custom_css: '',
  
  // Feature Toggles - Auth
  linkedin_oauth_enabled: true,
  google_oauth_enabled: true,
  email_login_enabled: true,
  magic_link_enabled: false,
  
  // Feature Toggles - Content
  post_generation_enabled: true,
  image_generation_enabled: true,
  carousel_generation_enabled: true,
  comment_generation_enabled: true,
  web_search_enabled: true,
  trending_topics_enabled: true,
  content_rewrite_enabled: true,
  hashtag_suggestions_enabled: true,
  tone_selection_enabled: true,
  multi_language_enabled: true,
  
  // Feature Toggles - LinkedIn
  direct_posting_enabled: true,
  post_scheduling_enabled: true,
  linkedin_analytics_enabled: false,
  
  // Feature Toggles - User
  conversation_history_enabled: true,
  saved_posts_enabled: true,
  templates_enabled: true,
  user_preferences_enabled: true,
  onboarding_enabled: true,
  profile_customization_enabled: true,
  creator_personas_enabled: true,
  keyboard_shortcuts_enabled: true,
  
  // Feature Toggles - Premium
  premium_features_enabled: true,
  api_access_enabled: false,
  bulk_generation_enabled: false,
  export_enabled: true,
  
  // Rate Limits
  api_rate_limit_per_minute: 60,
  generation_cooldown_seconds: 5,
  max_daily_generations_free: 10,
  max_daily_generations_premium: 100,
  max_images_per_day_free: 5,
  max_images_per_day_premium: 50,
  max_conversations_stored: 50,
  max_post_length: 3000,
  
  // Moderation
  content_moderation_enabled: false,
  profanity_filter_enabled: true,
  spam_detection_enabled: true,
  
  // Email
  email_notifications_enabled: true,
  welcome_email_enabled: true,
  weekly_digest_enabled: false,
  tips_emails_enabled: true,
  
  // Analytics
  analytics_enabled: false,
  google_analytics_id: '',
  error_tracking_enabled: true,
  performance_monitoring_enabled: false,
};

interface SettingsContextType {
  settings: GlobalSettings;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  isFeatureEnabled: (feature: keyof GlobalSettings) => boolean;
  getThemeClasses: () => string;
  getPublicThemeClasses: () => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/public/settings`
      );
      
      const data = response.data;
      
      // Parse settings from API response
      const parsedSettings: GlobalSettings = {
        ...defaultSettings,
        // Site Configuration
        maintenance_mode: data.maintenance_mode === 'true' || data.maintenance_mode === true,
        maintenance_message: data.maintenance_message || '',
        app_name: data.app_name || 'LinkedIn PostInAi',
        registration_enabled: data.registration_enabled !== 'false' && data.registration_enabled !== false,
        require_email_verification: data.require_email_verification !== 'false',
        
        // Public Theme
        public_theme: data.public_theme || 'modern-gradient',
        public_hero_style: data.public_hero_style || 'gradient',
        public_accent_color: data.public_accent_color || '#6366f1',
        public_dark_mode: data.public_dark_mode === 'true' || data.public_dark_mode === true,
        
        // App Theme
        app_theme: data.app_theme || 'professional-light',
        app_sidebar_style: data.app_sidebar_style || 'default',
        app_accent_color: data.app_accent_color || '#0A66C2',
        app_dark_mode: data.app_dark_mode === 'true' || data.app_dark_mode === true,
        app_card_style: data.app_card_style || 'elevated',
        app_animations_enabled: data.app_animations_enabled !== 'false',
        
        // Legacy
        site_theme: data.site_theme || 'default',
        primary_color: data.primary_color || '#0A66C2',
        logo_url: data.logo_url || '',
        favicon_url: data.favicon_url || '',
        custom_css: data.custom_css || '',
        
        // Feature Toggles
        linkedin_oauth_enabled: data.linkedin_oauth_enabled !== 'false',
        google_oauth_enabled: data.google_oauth_enabled !== 'false',
        email_login_enabled: data.email_login_enabled !== 'false',
        magic_link_enabled: data.magic_link_enabled === 'true',
        post_generation_enabled: data.post_generation_enabled !== 'false',
        image_generation_enabled: data.image_generation_enabled !== 'false',
        carousel_generation_enabled: data.carousel_generation_enabled !== 'false',
        comment_generation_enabled: data.comment_generation_enabled !== 'false',
        web_search_enabled: data.web_search_enabled !== 'false',
        trending_topics_enabled: data.trending_topics_enabled !== 'false',
        content_rewrite_enabled: data.content_rewrite_enabled !== 'false',
        hashtag_suggestions_enabled: data.hashtag_suggestions_enabled !== 'false',
        tone_selection_enabled: data.tone_selection_enabled !== 'false',
        multi_language_enabled: data.multi_language_enabled !== 'false',
        direct_posting_enabled: data.direct_posting_enabled !== 'false',
        post_scheduling_enabled: data.post_scheduling_enabled !== 'false',
        linkedin_analytics_enabled: data.linkedin_analytics_enabled === 'true',
        conversation_history_enabled: data.conversation_history_enabled !== 'false',
        saved_posts_enabled: data.saved_posts_enabled !== 'false',
        templates_enabled: data.templates_enabled !== 'false',
        user_preferences_enabled: data.user_preferences_enabled !== 'false',
        onboarding_enabled: data.onboarding_enabled !== 'false',
        profile_customization_enabled: data.profile_customization_enabled !== 'false',
        creator_personas_enabled: data.creator_personas_enabled !== 'false',
        keyboard_shortcuts_enabled: data.keyboard_shortcuts_enabled !== 'false',
        premium_features_enabled: data.premium_features_enabled !== 'false',
        api_access_enabled: data.api_access_enabled === 'true',
        bulk_generation_enabled: data.bulk_generation_enabled === 'true',
        export_enabled: data.export_enabled !== 'false',
        
        // Rate Limits
        api_rate_limit_per_minute: parseInt(data.api_rate_limit_per_minute) || 60,
        generation_cooldown_seconds: parseInt(data.generation_cooldown_seconds) || 5,
        max_daily_generations_free: parseInt(data.max_daily_generations_free) || 10,
        max_daily_generations_premium: parseInt(data.max_daily_generations_premium) || 100,
        max_images_per_day_free: parseInt(data.max_images_per_day_free) || 5,
        max_images_per_day_premium: parseInt(data.max_images_per_day_premium) || 50,
        max_conversations_stored: parseInt(data.max_conversations_stored) || 50,
        max_post_length: parseInt(data.max_post_length) || 3000,
        
        // Moderation
        content_moderation_enabled: data.content_moderation_enabled === 'true',
        profanity_filter_enabled: data.profanity_filter_enabled !== 'false',
        spam_detection_enabled: data.spam_detection_enabled !== 'false',
        
        // Email
        email_notifications_enabled: data.email_notifications_enabled !== 'false',
        welcome_email_enabled: data.welcome_email_enabled !== 'false',
        weekly_digest_enabled: data.weekly_digest_enabled === 'true',
        tips_emails_enabled: data.tips_emails_enabled !== 'false',
        
        // Analytics
        analytics_enabled: data.analytics_enabled === 'true',
        google_analytics_id: data.google_analytics_id || '',
        error_tracking_enabled: data.error_tracking_enabled !== 'false',
        performance_monitoring_enabled: data.performance_monitoring_enabled === 'true',
      };
      
      setSettings(parsedSettings);
      
      // Apply theme classes to document
      applyTheme(parsedSettings);
      
    } catch (err: any) {
      console.error('Failed to fetch settings:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (s: GlobalSettings) => {
    const root = document.documentElement;
    
    // Apply app theme
    root.setAttribute('data-app-theme', s.app_theme || 'professional-light');
    root.setAttribute('data-public-theme', s.public_theme || 'modern-gradient');
    
    // Apply sidebar style
    root.setAttribute('data-sidebar-style', s.app_sidebar_style || 'default');
    
    // Apply card style
    root.setAttribute('data-card-style', s.app_card_style || 'elevated');
    
    // Apply dark mode
    if (s.app_dark_mode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Apply accent color as CSS variable
    root.style.setProperty('--app-accent-color', s.app_accent_color || '#0A66C2');
    root.style.setProperty('--public-accent-color', s.public_accent_color || '#6366f1');
    root.style.setProperty('--primary-color', s.primary_color || '#0A66C2');
    
    // Apply animations
    if (!s.app_animations_enabled) {
      root.classList.add('no-animations');
    } else {
      root.classList.remove('no-animations');
    }
  };

  const isFeatureEnabled = (feature: keyof GlobalSettings): boolean => {
    const value = settings[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return Boolean(value);
  };

  const getThemeClasses = (): string => {
    const classes: string[] = [];
    
    // App theme classes
    switch (settings.app_theme) {
      case 'modern-dark':
        classes.push('bg-slate-900 text-white');
        break;
      case 'ocean-breeze':
        classes.push('bg-cyan-50');
        break;
      case 'sunset-warm':
        classes.push('bg-orange-50');
        break;
      case 'forest-calm':
        classes.push('bg-green-50');
        break;
      case 'midnight-purple':
        classes.push('bg-purple-50');
        break;
      case 'rose-gold':
        classes.push('bg-rose-50');
        break;
      case 'slate-minimal':
        classes.push('bg-slate-100');
        break;
      default:
        classes.push('bg-slate-50');
    }
    
    // Card style classes
    switch (settings.app_card_style) {
      case 'flat':
        classes.push('[&_.card]:shadow-none');
        break;
      case 'bordered':
        classes.push('[&_.card]:shadow-none [&_.card]:border-2');
        break;
      case 'glass':
        classes.push('[&_.card]:bg-white/70 [&_.card]:backdrop-blur-sm');
        break;
      default:
        classes.push('[&_.card]:shadow-lg');
    }
    
    // Animation classes
    if (!settings.app_animations_enabled) {
      classes.push('[&_*]:!transition-none');
    }
    
    return classes.join(' ');
  };

  const getPublicThemeClasses = (): string => {
    switch (settings.public_theme) {
      case 'minimal-light':
        return 'bg-gradient-to-br from-white to-slate-100';
      case 'dark-elegance':
        return 'bg-gradient-to-br from-slate-900 to-slate-800 text-white';
      case 'vibrant-startup':
        return 'bg-gradient-to-r from-red-400 to-yellow-400';
      case 'corporate-blue':
        return 'bg-gradient-to-br from-blue-600 to-blue-900 text-white';
      case 'nature-green':
        return 'bg-gradient-to-r from-teal-600 to-green-400 text-white';
      default:
        return 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white';
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        refreshSettings: fetchSettings,
        isFeatureEnabled,
        getThemeClasses,
        getPublicThemeClasses,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export { defaultSettings };
export type { GlobalSettings };
