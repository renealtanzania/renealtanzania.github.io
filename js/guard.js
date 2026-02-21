// guard.js - Automatically protects pages on load (works with middleware.js)
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