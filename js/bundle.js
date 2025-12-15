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
    version: '1.0.0',
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
}// path.js - Handle subdirectories and path resolution
const Path = {
  // Get the root path based on current location
  getRoot() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(s => s);
    
    // Remove the current file from segments
    if (segments.length > 0 && segments[segments.length - 1].includes('.html')) {
      segments.pop();
    }
    
    // Return appropriate number of ../ based on depth
    return '../'.repeat(segments.length);
  },

  // Resolve a path relative to root
  resolve(relativePath) {
    const root = this.getRoot();
    return root + relativePath;
  },

  // Get current page name
  getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    return page;
  },

  // Check if we're at root
  isRoot() {
    return this.getRoot() === '';
  },

  // Navigate to a path
  navigate(path) {
    window.location.href = this.resolve(path);
  }
};

if (typeof window !== 'undefined') {
  window.Path = Path;
}// provider.js - Manages user data retrieval
const Provider = {
  users: null,
  loading: false,

  // Load users from JSON
  async loadUsers() {
    if (this.users) return this.users;
    if (this.loading) {
      await new Promise(resolve => {
        const check = setInterval(() => {
          if (!this.loading) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      });
      return this.users;
    }

    this.loading = true;
    try {
      const path = Path.resolve(Config.paths.users);
      const response = await fetch(path);
      if (!response.ok) throw new Error('Failed to load users');
      this.users = await response.json();
      return this.users;
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    } finally {
      this.loading = false;
    }
  },

  // Find user by email
  async findByEmail(email) {
    const users = await this.loadUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  // Validate credentials
  async validateCredentials(email, password) {
    const user = await this.findByEmail(email);
    if (!user) return null;
    if (user.password !== password) return null;
    if (user.status !== 'Active') return null;
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  // Check if user exists
  async userExists(email) {
    const user = await this.findByEmail(email);
    return !!user;
  },

  // Get all users (without passwords)
  async getAllUsers() {
    const users = await this.loadUsers();
    return users.map(({ password, ...user }) => user);
  },

  // Clear cache
  clearCache() {
    this.users = null;
  }
};

if (typeof window !== 'undefined') {
  window.Provider = Provider;
}// routes.js - Handles route configuration and management
const Routes = {
  routes: null,
  loading: false,

  // Load middleware configuration
  async loadRoutes() {
    if (this.routes) return this.routes;
    if (this.loading) {
      await new Promise(resolve => {
        const check = setInterval(() => {
          if (!this.loading) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      });
      return this.routes;
    }

    this.loading = true;
    try {
      const path = Path.resolve(Config.paths.middleware);
      const response = await fetch(path);
      if (!response.ok) throw new Error('Failed to load middleware');
      this.routes = await response.json();
      return this.routes;
    } catch (error) {
      console.error('Error loading routes:', error);
      return [];
    } finally {
      this.loading = false;
    }
  },

  // Find route by URL
  async findByUrl(url) {
    const routes = await this.loadRoutes();
    // Normalize URL for comparison
    const normalizedUrl = url.replace(/^\/+|\/+$/g, '');
    return routes.find(r => {
      const routeUrl = r.url.replace(/^\/+|\/+$/g, '');
      return routeUrl === normalizedUrl;
    });
  },

  // Find route by current page
  async getCurrentRoute() {
    const currentPage = Path.getCurrentPage();
    const routes = await this.loadRoutes();
    
    return routes.find(r => {
      const routeFile = r.url.split('/').pop();
      return routeFile === currentPage;
    });
  },

  // Check if route is protected
  async isProtected(url) {
    const route = await this.findByUrl(url);
    return route && route.type === 'protected';
  },

  // Get allowed roles for route
  async getAllowedRoles(url) {
    const route = await this.findByUrl(url);
    if (!route || !route.viewer) return [];
    
    return route.viewer.split(',').map(r => r.trim());
  },

  // Get all protected routes
  async getProtectedRoutes() {
    const routes = await this.loadRoutes();
    return routes.filter(r => r.type === 'protected');
  },

  // Get public routes
  async getPublicRoutes() {
    const routes = await this.loadRoutes();
    return routes.filter(r => r.type !== 'protected');
  },

  // Clear cache
  clearCache() {
    this.routes = null;
  }
};

if (typeof window !== 'undefined') {
  window.Routes = Routes;
}// auth.js - Core authentication logic
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
}// gate.js - Manages authorizations for user actions
const Gate = {
  // Check if user can access a specific route
  async canAccessRoute(url) {
    if (!Auth.check()) return false;

    const route = await Routes.findByUrl(url);
    if (!route) return true; // Route not found, allow access
    if (route.type !== 'protected') return true; // Public route

    // Protected route without viewer restriction - any authenticated user
    if (!route.viewer) return true;

    // Check role-based access
    const allowedRoles = await Routes.getAllowedRoles(url);
    return Auth.hasAnyRole(allowedRoles);
  },

  // Check if user can access current page
  async canAccessCurrentPage() {
    const currentRoute = await Routes.getCurrentRoute();
    if (!currentRoute) return true;
    if (currentRoute.type !== 'protected') return true;

    if (!Auth.check()) return false;

    if (!currentRoute.viewer) return true;

    const allowedRoles = currentRoute.viewer.split(',').map(r => r.trim());
    return Auth.hasAnyRole(allowedRoles);
  },

  // Apply "can" directive to elements
  applyDirectives() {
    // Find all elements with data-can attribute
    const elements = document.querySelectorAll('[data-can]');
    
    elements.forEach(async (element) => {
      const permission = element.getAttribute('data-can');
      const canAccess = await this.can(permission);
      
      if (!canAccess) {
        element.style.display = 'none';
      }
    });
  },

  // Check custom permissions
  async can(permission) {
    const user = Auth.user();
    if (!user) return false;

    // Define permission checks
    const permissions = {
      'view-settings': () => ['admin', 'super-admin'].includes(user.role),
      'view-team': () => ['admin', 'super-admin', 'team-member'].includes(user.role),
      'view-projects': () => ['admin', 'super-admin'].includes(user.role),
      'view-users': () => ['admin', 'super-admin', 'team-member'].includes(user.role),
      'view-auth-structure': () => user.role === 'super-admin',
      'manage-users': () => ['admin', 'super-admin'].includes(user.role),
      'delete-users': () => user.role === 'super-admin',
      'edit-settings': () => ['admin', 'super-admin'].includes(user.role)
    };

    const checkFunction = permissions[permission];
    return checkFunction ? checkFunction() : false;
  },

  // Initialize gate on page load
  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.applyDirectives();
      });
    } else {
      this.applyDirectives();
    }
  }
};

if (typeof window !== 'undefined') {
  window.Gate = Gate;
  // Auto-initialize
  Gate.init();
}// guard.js - Automatically protects pages on load (works with middleware.js)
const Guard = {
  // Check and protect current page
  async protect() {
    try {
      // Check if middleware already handled this
      if (window.Middleware && window.Middleware.initialized) {
        if (!window.Middleware.allowedToLoad) {
          return false;
        }
      }

      const currentRoute = await Routes.getCurrentRoute();
      
      // If route not found in middleware, allow access (public page)
      if (!currentRoute) {
        return true;
      }

      // Check if route is protected
      if (currentRoute.type !== 'protected') {
        return true;
      }

      // Check authentication
      if (!Auth.check()) {
        // Store current URL for return after login
        Auth.setReturnUrl(window.location.pathname);
        // Redirect to login
        Path.navigate(Config.paths.login);
        return false;
      }

      // Check authorization if viewer is specified
      if (currentRoute.viewer) {
        const canAccess = await Gate.canAccessCurrentPage();
        if (!canAccess) {
          Path.navigate(Config.paths.unauthorized);
          return false;
        }
      }

      // Initialize session monitor for protected pages
      Auth.initSessionMonitor();
      
      return true;
    } catch (error) {
      console.error('[Guard] Error:', error);
      return true; // Allow access on error to prevent blocking
    }
  },

  // Redirect to login if not authenticated
  requireAuth() {
    if (!Auth.check()) {
      Auth.setReturnUrl(window.location.pathname);
      Path.navigate(Config.paths.login);
      return false;
    }
    return true;
  },

  // Redirect to dashboard if already authenticated (for login page)
  requireGuest() {
    if (Auth.check()) {
      Path.navigate(Config.paths.dashboard);
      return false;
    }
    return true;
  },

  // Initialize guard
  init() {
    // Run protection check when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.protect();
      });
    } else {
      this.protect();
    }
  }
};

if (typeof window !== 'undefined') {
  window.Guard = Guard;
  // Auto-initialize guard
  Guard.init();
}