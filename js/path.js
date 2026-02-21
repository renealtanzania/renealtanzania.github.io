// path.js - Handle subdirectories and path resolution
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
}