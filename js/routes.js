// routes.js - Handles route configuration and management
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
}