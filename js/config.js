// config.js - Central Configuration
const Config = {
  // Session Settings
  session: {
    key: 'reneal_auth_session',
    timeout: 10 * 60 * 1000, // 10 minutes in milliseconds
    checkInterval: 60 * 1000 // Check every minute
  },

  // File Paths
  paths: {
    users: 'data/users.json',
    middleware: 'data/middleware.json',
    login: 'box/login.html',
    unauthorized: 'unauthorized.html',
    dashboard: 'box/dashboard.html'
  },

  // Application Metadata
  app: {
    name: 'Reneal Tanzania',
    version: '2.0.0',
    description: 'Educational Outreach Platform'
  },

  // Storage Keys
  storage: {
    user: 'reneal_current_user',
    lastActivity: 'reneal_last_activity',
    returnUrl: 'reneal_return_url'
  }
};

// Make config available globally
if (typeof window !== 'undefined') {
  window.Config = Config;
}