// auth.js - Core authentication logic
const Auth = {
  // Login user
  async login(email, password) {
    try {
      const user = await Provider.validateCredentials(email, password);
      
      if (!user) {
        return {
          success: false,
          message: 'Invalid credentials or inactive account'
        };
      }

      // Store user data
      this.setUser(user);
      this.updateActivity();

      return {
        success: true,
        user: user
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'An error occurred during login'
      };
    }
  },

  // Logout user
  logout() {
    localStorage.removeItem(Config.storage.user);
    localStorage.removeItem(Config.storage.lastActivity);
    localStorage.removeItem(Config.storage.returnUrl);
    Path.navigate(Config.paths.login);
  },

  // Check if user is authenticated
  check() {
    const user = this.user();
    if (!user) return false;

    // Check session timeout
    if (this.isSessionExpired()) {
      this.logout();
      return false;
    }

    // Update activity
    this.updateActivity();
    return true;
  },

  // Get current user
  user() {
    const userData = localStorage.getItem(Config.storage.user);
    return userData ? JSON.parse(userData) : null;
  },

  // Set user data
  setUser(user) {
    localStorage.setItem(Config.storage.user, JSON.stringify(user));
  },

  // Update last activity timestamp
  updateActivity() {
    localStorage.setItem(Config.storage.lastActivity, Date.now().toString());
  },

  // Check if session is expired
  isSessionExpired() {
    const lastActivity = localStorage.getItem(Config.storage.lastActivity);
    if (!lastActivity) return true;

    const elapsed = Date.now() - parseInt(lastActivity);
    return elapsed > Config.session.timeout;
  },

  // Get time until session expires (in seconds)
  getSessionTimeRemaining() {
    const lastActivity = localStorage.getItem(Config.storage.lastActivity);
    if (!lastActivity) return 0;

    const elapsed = Date.now() - parseInt(lastActivity);
    const remaining = Config.session.timeout - elapsed;
    return Math.max(0, Math.floor(remaining / 1000));
  },

  // Check if user has specific role
  hasRole(role) {
    const user = this.user();
    if (!user) return false;
    return user.role === role;
  },

  // Check if user has any of the specified roles
  hasAnyRole(roles) {
    const user = this.user();
    if (!user) return false;
    return roles.includes(user.role);
  },

  // Initialize session monitoring
  initSessionMonitor() {
    // Clear any existing interval
    if (this.sessionInterval) {
      clearInterval(this.sessionInterval);
    }

    // Check session every minute
    this.sessionInterval = setInterval(() => {
      if (this.check() === false) {
        alert('Your session has expired. Please login again.');
      }
    }, Config.session.checkInterval);
  },

  // Store return URL
  setReturnUrl(url) {
    localStorage.setItem(Config.storage.returnUrl, url);
  },

  // Get and clear return URL
  getReturnUrl() {
    const url = localStorage.getItem(Config.storage.returnUrl);
    localStorage.removeItem(Config.storage.returnUrl);
    return url || Config.paths.dashboard;
  }
};

if (typeof window !== 'undefined') {
  window.Auth = Auth;
}