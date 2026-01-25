import axios from 'axios';

// Detect if we're running through Cloudflare tunnel and use backend tunnel URL
const getApiUrl = () => {
  // If we're in the browser, check if we're on a Cloudflare tunnel domain
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('trycloudflare.com')) {
      // We're on a Cloudflare tunnel - extract backend tunnel URL from localStorage or use current pattern
      // Backend tunnel URL is stored when tunnels are started
      const backendTunnelUrl = localStorage.getItem('backend_tunnel_url');
      if (backendTunnelUrl) {
        return backendTunnelUrl;
      }
      // Fallback: current backend tunnel URL (update this when tunnels restart)
      // TODO: This should be updated automatically when tunnels restart
      return `https://minority-delaware-chem-census.trycloudflare.com`;
    }
  }
  // Default to environment variable or localhost
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

// Create axios instance with default config
// Use a function to get the base URL dynamically
export const apiClient = axios.create({
  baseURL: typeof window !== 'undefined' ? getApiUrl() : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Override the baseURL for each request to handle dynamic detection
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    config.baseURL = getApiUrl();
  }
  return config;
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const api = {
  // Auth
  auth: {
    mockLogin: (email: string) => apiClient.post('/api/auth/mock-login', { email }),
    getCurrentUser: () => apiClient.get('/api/auth/me'),
    linkedInLogin: () => apiClient.get('/api/auth/linkedin/login'),
    linkedInStatus: () => apiClient.get('/api/auth/linkedin/status'),
    linkedInConnect: (redirectContext?: string) => 
      apiClient.get('/api/auth/linkedin/connect', { params: { redirect_context: redirectContext } }),
    linkedInDisconnect: () => apiClient.post('/api/auth/linkedin/disconnect'),
    linkedInSyncPosts: () => apiClient.post('/api/auth/linkedin/sync-posts'),
    googleLogin: () => apiClient.get('/api/auth/google/login'),
    googleStatus: () => apiClient.get('/api/auth/google/status'),
    register: (email: string, password: string, name?: string) => 
      apiClient.post('/api/auth/register', { email, password, name }),
    login: (email: string, password: string) => 
      apiClient.post('/api/auth/login', { email, password }),
    verifyEmail: (token: string) => 
      apiClient.post('/api/auth/verify-email', { token }),
    verifyEmailCode: (email: string, code: string) => 
      apiClient.post('/api/auth/verify-email-code', { email, code }),
    resendVerification: (email: string) => 
      apiClient.post('/api/auth/resend-verification', { email }),
    forgotPassword: (email: string) => 
      apiClient.post('/api/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) => 
      apiClient.post('/api/auth/reset-password', { token, password }),
  },
  
  // Onboarding
  onboarding: {
    state: () => apiClient.get('/api/onboarding/state'),
    start: () => apiClient.post('/api/onboarding/start'),
    uploadCV: (file: File | FormData) => {
      const formData = file instanceof FormData ? file : (() => {
        const fd = new FormData();
        fd.append('file', file);
        return fd;
      })();
      return apiClient.post('/api/onboarding/upload-cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    importPosts: (posts: string[], styleChoice: string) => apiClient.post('/api/onboarding/import-posts', { posts, style_choice: styleChoice }),
    process: (styleChoice: string) => apiClient.post('/api/onboarding/process', { style_choice: styleChoice }),
    getPreview: () => apiClient.get('/api/onboarding/preview'),
    updatePreferences: (preferences: any) => apiClient.put('/api/onboarding/preferences', { preferences }),
    updateField: (section: string, field: string, value: any) => 
      apiClient.patch('/api/onboarding/update-field', null, { params: { section, field, value } }),
    complete: () => apiClient.post('/api/onboarding/complete'),
  },
  
  // Generation
  generate: {
    post: (message: string, options: any, attachments?: any[], conversationId?: string) => 
      apiClient.post('/api/generate/post', { message, options, attachments, conversation_id: conversationId }),
    comment: (screenshot: string, context: any) => 
      apiClient.post('/api/generate/comment', { screenshot, context }),
    evaluateComment: (screenshot: string) => 
      apiClient.post('/api/generate/comment/evaluate', { screenshot }),
    getHistory: (type: 'post' | 'comment', limit = 50) => 
      apiClient.get('/api/generate/history', { params: { type, limit } }),
    updateGeneration: (id: string, content: string) => 
      apiClient.put(`/api/generate/${id}`, { content }),
    publish: (postId: string) => 
      apiClient.post(`/api/generate/${postId}/publish`),
    schedulePost: (postId: string, scheduledAt: string, timezone?: string) =>
      apiClient.post(`/api/generate/posts/${postId}/schedule`, { scheduled_at: scheduledAt, timezone }),
    cancelSchedule: (postId: string) =>
      apiClient.delete(`/api/generate/posts/${postId}/schedule`),
    publishNow: (postId: string) =>
      apiClient.post(`/api/generate/posts/${postId}/publish-now`),
    getScheduledPosts: () =>
      apiClient.get('/api/generate/scheduled-posts'),
    togglePublishedStatus: (postId: string, published: boolean) =>
      apiClient.patch(`/api/generate/posts/${postId}/published-status`, null, { params: { published } }),
  },
  
  // Conversations
  conversations: {
    list: () => apiClient.get('/api/conversations'),
    get: (id: string) => apiClient.get(`/api/conversations/${id}`),
    create: (initialMessage: string, options?: any) => 
      apiClient.post('/api/conversations', { initial_message: initialMessage, options }),
    updateTitle: (id: string, title: string) => 
      apiClient.put(`/api/conversations/${id}/title`, { title }),
    delete: (id: string) => apiClient.delete(`/api/conversations/${id}`),
  },
  
  // User settings
  user: {
    getPreferences: () => apiClient.get('/api/user/preferences'),
    updatePreferences: (preferences: any) => apiClient.put('/api/user/preferences', { preferences }),
    getProfile: () => apiClient.get('/api/user/profile'),
    updateCustomInstructions: (instructions: string) => 
      apiClient.put('/api/user/profile/custom-instructions', { instructions }),
    refreshTrendingTopics: () => apiClient.post('/api/user/refresh-trending-topics'),
    generateContentIdeas: () => apiClient.post('/api/user/generate-content-ideas'),
  },
  
  // LinkedIn integration
  linkedin: {
    connect: (redirectContext?: string) => 
      apiClient.get('/api/auth/linkedin/connect', { params: { redirect_context: redirectContext } }),
    disconnect: () => apiClient.post('/api/auth/linkedin/disconnect'),
    status: () => apiClient.get('/api/auth/linkedin/status'),
    syncPosts: () => apiClient.post('/api/auth/linkedin/sync-posts'),
  },
  
  // Google integration
  google: {
    status: () => apiClient.get('/api/auth/google/status'),
  },
  
  // Image generation
  images: {
    generate: (prompt: string, guidance?: number, numSteps?: number, seed?: number, postId?: string, height?: number, width?: number) =>
      apiClient.post('/api/images/generate', { prompt, guidance, num_steps: numSteps, seed, post_id: postId, height, width }),
    generateFromPost: (postId: string, customPrompt?: string) =>
      apiClient.post(`/api/images/generate/${postId}`, customPrompt ? { custom_prompt: customPrompt } : {}),
    regeneratePrompt: (postId: string) =>
      apiClient.post(`/api/images/regenerate-prompt/${postId}`),
    getHistory: (postId: string) =>
      apiClient.get(`/api/images/history/${postId}`),
    getCurrent: (postId: string) =>
      apiClient.get(`/api/images/current/${postId}`),
    setCurrent: (imageId: string) =>
      apiClient.put(`/api/images/set-current/${imageId}`),
    testConnection: () => apiClient.get('/api/images/test-connection'),
  },
  
  // PDF generation (for carousel posts)
  pdfs: {
    generateCarousel: (postId: string, prompts: string[], slideIndices?: number[]) =>
      apiClient.post('/api/pdfs/generate-carousel', { 
        post_id: postId, 
        prompts,
        ...(slideIndices && slideIndices.length > 0 ? { slide_indices: slideIndices } : {})
      }),
    getProgress: (postId: string) =>
      apiClient.get(`/api/pdfs/progress/${postId}`),
    getHistory: (postId: string) =>
      apiClient.get(`/api/pdfs/history/${postId}`),
    getCurrent: (postId: string) =>
      apiClient.get(`/api/pdfs/current/${postId}`),
    setCurrent: (pdfId: string) =>
      apiClient.put(`/api/pdfs/set-current/${pdfId}`),
  },

  // Notifications
  notifications: {
    push: {
      subscribe: (subscription: any) => 
        apiClient.post('/api/notifications/push/subscribe', subscription),
      unsubscribe: (endpoint: string) => 
        apiClient.post('/api/notifications/push/unsubscribe', { endpoint }),
      list: () => apiClient.get('/api/notifications/push/subscriptions'),
    },
  },

  // Admin
  admin: {
    getUsers: () => apiClient.get('/api/admin/users'),
    getStats: () => apiClient.get('/api/admin/stats'),
    getRules: () => apiClient.get('/api/admin/rules'),
    updateRules: (key: string, value: string) => apiClient.put('/api/admin/rules', { key, value }),
    resetUser: (userId: string) => apiClient.post(`/api/admin/users/${userId}/reset`),
    getPosts: (params?: URLSearchParams) => apiClient.get('/api/admin/posts', { params }),
    notifications: {
      getPreferences: () => apiClient.get('/api/admin/notifications/preferences'),
      updatePreference: (actionId: string, data: { email_enabled?: boolean; push_enabled?: boolean }) =>
        apiClient.put(`/api/admin/notifications/preferences/${actionId}`, data),
      getLogs: (filters?: { action_code?: string; user_id?: string; channel?: string; status?: string; limit?: number; offset?: number }) =>
        apiClient.get('/api/admin/notifications/logs', { params: filters }),
    },
  },
};

