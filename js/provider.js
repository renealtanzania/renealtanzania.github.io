// provider.js - Manages user data retrieval
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
}