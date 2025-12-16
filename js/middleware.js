// middleware.js - HTTP Request Inspection and Filtering
const Middleware = {
  initialized: false,
  currentPage: null,
  allowedToLoad: false,

  // Initialize middleware - MUST be called before any other scripts
  async init() {
    if (this.initialized) return;
    this.initialized = true;
    this.currentPage = this.getCurrentPageUrl();
    
    // Immediately check if this page should be accessible
    const canAccess = await this.inspect();
    
    if (!canAccess) {
      // Stop page execution immediately
      this.blockPage();
    } else {
      this.allowedToLoad = true;
    }
    
    return canAccess;
  },

  // Get current page URL for inspection
  getCurrentPageUrl() {
    const path = window.location.pathname;
    
    // Remove leading/trailing slashes and split
    let segments = path.replace(/^\/+|\/+$/g, '').split('/').filter(s => s);
    
    // If no segments, we're at root index.html
    if (segments.length === 0) {
      return 'index.html';
    }
    
    // Get the last segment
    const lastSegment = segments[segments.length - 1];
    
    // If last segment has .html, return full path
    if (lastSegment.includes('.html')) {
      const fullPath = segments.join('/');
      console.log('[Middleware] Current page detected:', fullPath);
      return fullPath;
    }
    
    // Last segment is a directory, append index.html
    const fullPath = segments.join('/') + '/index.html';
    console.log('[Middleware] Directory detected, using:', fullPath);
    return fullPath;
  },

  // Core inspection logic
  async inspect() {
    try {
      // Load routes configuration
      const routes = await this.loadMiddlewareConfig();
      const currentRoute = this.findCurrentRoute(routes);
      
      // If route not found in middleware, it's a public route by default
      // (URLs not in config are assumed to be valid public pages in the project)
      if (!currentRoute) {
        console.log('[Middleware] Route not in config - allowing access (public)');
        return true;
      }

      // Check if route is protected
      if (currentRoute.type === 'protected') {
        // Check authentication FIRST
        if (!this.isAuthenticated()) {
          console.log('[Middleware] BLOCKED - Not authenticated');
          this.redirectToLogin();
          return true; // Return true to skip blockPage() and redirect directly
        }

        // ONLY check role-based access if user IS authenticated
        if (currentRoute.viewer) {
          const hasAccess = await this.checkRoleAccess(currentRoute.viewer);
          if (!hasAccess) {
            console.log('[Middleware] BLOCKED - Insufficient permissions (wrong role)');
            this.redirectToUnauthorized();
            return true; // Return true to skip blockPage() and redirect directly
          }
        }

        console.log('[Middleware] ALLOWED - Authentication and permissions verified');
        return true;
      }

      // Public route or no type specified
      console.log('[Middleware] ALLOWED - Public route');
      return true;

    } catch (error) {
      console.error('[Middleware] Error during inspection:', error);
      // On error, allow access to prevent blocking legitimate users
      return true;
    }
  },

  // Load middleware configuration
  async loadMiddlewareConfig() {
    try {
      // Calculate path to data directory based on current location
      const depth = window.location.pathname.split('/').filter(s => s && !s.includes('.html')).length;
      const prefix = '../'.repeat(depth);
      const path = prefix + 'data/middleware.json';
      
      const response = await fetch(path);
      if (!response.ok) throw new Error('Failed to load middleware config');
      return await response.json();
    } catch (error) {
      console.error('[Middleware] Failed to load config:', error);
      return [];
    }
  },

  // Find current route in middleware config
  findCurrentRoute(routes) {
    const currentPath = window.location.pathname;
    
    // Normalize current path - remove leading/trailing slashes
    let normalizedCurrent = currentPath.replace(/^\/+|\/+$/g, '');
    
    // If empty or just a slash, it's index.html at root
    if (!normalizedCurrent) {
      normalizedCurrent = 'index.html';
    }
    
    // If doesn't end with .html, it's a directory - add index.html
    if (!normalizedCurrent.endsWith('.html')) {
      normalizedCurrent = normalizedCurrent + '/index.html';
    }
    
    console.log('[Middleware] Looking for route:', normalizedCurrent);
    
    // Try exact match first
    let route = routes.find(r => {
      const routeUrl = r.url.replace(/^\/+|\/+$/g, '');
      return routeUrl === normalizedCurrent;
    });
    
    // If not found, try matching just the filename for root pages
    if (!route && !normalizedCurrent.includes('/')) {
      route = routes.find(r => {
        const routeFile = r.url.split('/').pop();
        return routeFile === normalizedCurrent;
      });
    }
    
    if (route) {
      console.log('[Middleware] ✅ Route matched:', route.url, '- Type:', route.type || 'public');
    } else {
      console.log('[Middleware] ⚠️ No route found for:', normalizedCurrent);
    }
    
    return route;
  },

  // Check if user is authenticated
  isAuthenticated() {
    const userData = localStorage.getItem('reneal_current_user');
    const lastActivity = localStorage.getItem('reneal_last_activity');
    
    if (!userData || !lastActivity) return false;
    
    // Check session timeout (10 minutes)
    const elapsed = Date.now() - parseInt(lastActivity);
    const timeout = 10 * 60 * 1000;
    
    if (elapsed > timeout) {
      // Session expired
      this.clearSession();
      return false;
    }
    
    // Update activity
    localStorage.setItem('reneal_last_activity', Date.now().toString());
    return true;
  },

  // Check role-based access
  async checkRoleAccess(allowedRoles) {
    const userData = localStorage.getItem('reneal_current_user');
    if (!userData) return false;
    
    const user = JSON.parse(userData);
    const roles = allowedRoles.split(',').map(r => r.trim());
    
    return roles.includes(user.role);
  },

  // Block page from loading
  blockPage() {
    // Clear page content immediately
    document.open();
    document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Access Denied</title>
        <script src="/public/css/script/tailwindcss3417.js"></script>
      </head>
      <body class="bg-gray-100 flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="mb-4">
            <svg class="w-24 h-24 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h1 class="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p class="text-gray-600 mb-6">Unable to verify access. Redirecting...</p>
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </body>
      </html>
    `);
    document.close();
    
    // Stop all script execution
    throw new Error('Access denied by middleware');
  },

  // Redirect to login
  redirectToLogin() {
    const depth = window.location.pathname.split('/').filter(s => s && !s.includes('.html')).length;
    const prefix = '../'.repeat(depth);
    
    // Store return URL
    localStorage.setItem('reneal_return_url', window.location.pathname);
    
    // Redirect
    window.location.replace(prefix + 'box/login.html');
  },

  // Redirect to unauthorized page
  redirectToUnauthorized() {
    const depth = window.location.pathname.split('/').filter(s => s && !s.includes('.html')).length;
    const prefix = '../'.repeat(depth);
    
    window.location.replace(prefix + 'unauthorized.html');
  },

  // Clear session
  clearSession() {
    localStorage.removeItem('reneal_current_user');
    localStorage.removeItem('reneal_last_activity');
  },

  // Manual inspection for links (called before navigation)
  async canNavigateTo(url) {
    try {
      const routes = await this.loadMiddlewareConfig();
      const route = routes.find(r => r.url === url);
      
      if (!route || route.type !== 'protected') return true;
      
      if (!this.isAuthenticated()) return false;
      
      if (route.viewer) {
        return await this.checkRoleAccess(route.viewer);
      }
      
      return true;
    } catch (error) {
      console.error('[Middleware] Navigation check failed:', error);
      return true;
    }
  },

  // Intercept link clicks
  interceptLinks() {
    document.addEventListener('click', async (e) => {
      const link = e.target.closest('a');
      if (!link || !link.href) return;
      
      // Only intercept local links
      if (link.host !== window.location.host) return;
      
      const url = link.pathname.split('/').pop();
      const canNavigate = await this.canNavigateTo(url);
      
      if (!canNavigate) {
        e.preventDefault();
        console.log('[Middleware] Navigation blocked:', url);
        
        if (!this.isAuthenticated()) {
          this.redirectToLogin();
        } else {
          this.redirectToUnauthorized();
        }
      }
    });
  },

  // Global page visibility handler
  setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.allowedToLoad) {
        // Re-check authentication when page becomes visible
        if (!this.isAuthenticated()) {
          console.log('[Middleware] Session expired - redirecting to login');
          this.redirectToLogin();
        }
      }
    });
  }
};

// Critical: Execute immediately when script loads
(async function() {
  // Block page rendering until middleware check completes
  const canLoad = await Middleware.init();
  
  if (canLoad) {
    // Setup additional protections
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        Middleware.interceptLinks();
        Middleware.setupVisibilityHandler();
      });
    } else {
      Middleware.interceptLinks();
      Middleware.setupVisibilityHandler();
    }
  }
})();

// Make middleware available globally
if (typeof window !== 'undefined') {
  window.Middleware = Middleware;
}

// Log middleware status
console.log('[Middleware] Request inspection system initialized');