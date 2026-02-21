// Helper function to wait for Supabase client to be initialized
function waitForSupabase() {
    return new Promise((resolve, reject) => {
        const maxAttempts = 50;
        let attempts = 0;
        
        const checkSupabase = setInterval(() => {
            attempts++;
            
            if (window.supabaseClient) {
                clearInterval(checkSupabase);
                resolve(window.supabaseClient);
            } else if (attempts >= maxAttempts) {
                clearInterval(checkSupabase);
                reject(new Error('Supabase client initialization timeout'));
            }
        }, 100);
    });
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    
    // If no alert container exists, use native alert as fallback
    if (!alertContainer) {
        console.log(`Alert (${type}):`, message);
        alert(message);
        return;
    }
    
    const alertDiv = document.createElement('div');
    
    const colors = {
        success: 'bg-green-100 border-green-400 text-green-700',
        error: 'bg-red-100 border-red-400 text-red-700',
        warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
        info: 'bg-blue-100 border-blue-400 text-blue-700'
    };
    
    alertDiv.className = `alert border-l-4 p-4 mb-4 rounded ${colors[type]}`;
    alertDiv.innerHTML = `
        <div class="flex items-center justify-between">
            <p class="font-medium">${message}</p>
            <button onclick="this.parentElement.parentElement.remove()" class="text-xl leading-none">&times;</button>
        </div>
    `;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// Show/hide loading state
function setLoading(isLoading) {
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginBtnLoader = document.getElementById('loginBtnLoader');
    
    if (loginBtn) {
        loginBtn.disabled = isLoading;
        if (loginBtnText) loginBtnText.classList.toggle('hidden', isLoading);
        if (loginBtnLoader) loginBtnLoader.classList.toggle('hidden', !isLoading);
    }
}

// Handle user login
async function handleLogin(email, password, remember = false) {
    try {
        setLoading(true);
        
        // Wait for Supabase to be ready
        const supabase = await waitForSupabase();
        
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        // Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        if (!data.user) {
            throw new Error('Login failed - no user data returned');
        }
        
        // Get user profile from database (if table exists)
        let userData = null;
        try {
            const { data, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();
            
            if (userError) {
                console.warn('Could not fetch user profile (table may not exist):', userError.message);
            } else {
                userData = data;
            }
        } catch (err) {
            console.warn('Users table may not exist yet:', err.message);
        }
        
        // Store session data
        const sessionData = {
            user: data.user,
            profile: userData || {},
            loggedIn: true,
            loginTime: new Date().toISOString()
        };
        
        if (remember) {
            localStorage.setItem('userSession', JSON.stringify(sessionData));
        } else {
            sessionStorage.setItem('userSession', JSON.stringify(sessionData));
        }
        
        showAlert('Login successful! Redirecting...', 'success');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showAlert(error.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
        setLoading(false);
    }
}

// Handle user registration
async function handleRegister(name, email, password, position = 'team-member', role = 'team-member') {
    try {
        setLoading(true);
        
        // Wait for Supabase to be ready
        const supabase = await waitForSupabase();
        
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        // Create user account
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name,
                    position: position,
                    role: role
                }
            }
        });
        
        if (authError) {
            throw authError;
        }
        
        // Insert user profile into database (if table exists)
        try {
            const { error: profileError } = await supabase
                .from('users')
                .insert([
                    {
                        email: email,
                        name: name,
                        position: position,
                        role: role,
                        status: 'Active',
                        created_at: new Date().toISOString()
                    }
                ]);
            
            if (profileError) {
                console.warn('Could not create user profile (table may not exist):', profileError.message);
            }
        } catch (err) {
            console.warn('Users table may not exist yet:', err.message);
        }
        
        showAlert('Registration successful! Please check your email to verify your account.', 'success');
        
        // Redirect to login after short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showAlert(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
        setLoading(false);
    }
}

// Check if user is logged in
async function checkAuth() {
    try {
        const supabase = await waitForSupabase();
        
        if (!supabase) {
            return false;
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            return true;
        }
        
        // Check local/session storage as fallback
        const localSession = localStorage.getItem('userSession');
        const sessionSession = sessionStorage.getItem('userSession');
        
        return !!(localSession || sessionSession);
        
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

// Handle user logout
async function handleLogout() {
    try {
        const supabase = await waitForSupabase();
        
        if (supabase) {
            await supabase.auth.signOut();
        }
        
        // Clear session data
        localStorage.removeItem('userSession');
        sessionStorage.removeItem('userSession');
        
        showAlert('Logged out successfully', 'success');
        
        // Redirect to login
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Logout error:', error);
        showAlert('Error logging out', 'error');
    }
}

// Get current user data
async function getCurrentUser() {
    try {
        const supabase = await waitForSupabase();
        
        if (!supabase) {
            return null;
        }
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            // Get full profile from database
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('email', user.email)
                .single();
            
            return {
                ...user,
                profile: profile || {}
            };
        }
        
        return null;
        
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Password reset request
async function handlePasswordReset(email) {
    try {
        setLoading(true);
        
        const supabase = await waitForSupabase();
        
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`,
        });
        
        if (error) {
            throw error;
        }
        
        showAlert('Password reset email sent! Please check your inbox.', 'success');
        
    } catch (error) {
        console.error('Password reset error:', error);
        showAlert(error.message || 'Failed to send reset email', 'error');
    } finally {
        setLoading(false);
    }
}

// Update password
async function handlePasswordUpdate(newPassword) {
    try {
        const supabase = await waitForSupabase();
        
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        
        if (error) {
            throw error;
        }
        
        showAlert('Password updated successfully!', 'success');
        
        // Don't redirect immediately - let user see the message
        // They can manually logout and login with new password
        
    } catch (error) {
        console.error('Password update error:', error);
        throw error; // Re-throw so caller can handle it
    }
}

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check if we're on a protected page (not login/register)
    const publicPages = ['index.html', 'login.html', 'login1.html', 'register.html', 'forgot-password.html', 'change-password.html', 'dashboard.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Also check if the page starts with 'login' (for login variations like login1.html, login2.html, etc.)
    const isLoginPage = currentPage.startsWith('login');
    
    if (!publicPages.includes(currentPage) && !isLoginPage) {
        const isAuthenticated = await checkAuth();
        
        if (!isAuthenticated) {
            window.location.href = 'index.html';
        }
    }
});