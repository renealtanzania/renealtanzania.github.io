// gate.js - Manages authorizations for user actions
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
}