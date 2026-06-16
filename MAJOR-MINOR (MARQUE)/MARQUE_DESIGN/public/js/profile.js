// Profile Page JavaScript

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        console.log('ProfileManager init called');
        console.log('MNS available:', typeof MNS !== 'undefined');

        // Wait for common.js to load
        if (typeof MNS === 'undefined') {
            console.log('Waiting for MNS to load...');
            setTimeout(() => this.init(), 100);
            return;
        }

        console.log('MNS loaded, setting up profile manager');
        this.setupEventListeners();

        // Small delay to ensure DOM is fully ready
        setTimeout(() => {
            console.log('Checking auth status...');
            this.checkAuthStatus();
        }, 100);

        this.setupGoogleAuth();
        this.setupAppleAuth();
    }

    setupEventListeners() {
        // Auth tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchAuthTab(e.target.dataset.tab));
        });

        // Form submissions
        document.getElementById('login-form-element').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form-element').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('personal-info-form').addEventListener('submit', (e) => this.handleProfileUpdate(e));
        document.getElementById('change-password-form').addEventListener('submit', (e) => this.handlePasswordChange(e));
        document.getElementById('preferences-form').addEventListener('submit', (e) => this.handlePreferencesUpdate(e));
        document.getElementById('delete-account-form').addEventListener('submit', (e) => this.handleAccountDeletion(e));

        // Profile navigation
        document.querySelectorAll('.profile-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchProfileSection(e.target.closest('.profile-nav-item').dataset.section);
            });
        });

        // Password visibility toggles
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.togglePasswordVisibility(e.target.closest('.password-toggle'));
            });
        });

        // Password strength checker
        document.getElementById('register-password').addEventListener('input', (e) => {
            this.checkPasswordStrength(e.target.value);
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });

        // Delete account modal
        document.getElementById('delete-account-btn').addEventListener('click', () => {
            document.getElementById('delete-account-modal').classList.add('show');
        });

        document.getElementById('cancel-delete').addEventListener('click', () => {
            document.getElementById('delete-account-modal').classList.remove('show');
        });

        // Avatar edit
        document.getElementById('avatar-edit').addEventListener('click', () => {
            this.handleAvatarEdit();
        });

        // Social auth buttons
        document.getElementById('google-signin').addEventListener('click', () => this.handleGoogleAuth());
        document.getElementById('google-signup').addEventListener('click', () => this.handleGoogleAuth());
        document.getElementById('apple-signin').addEventListener('click', () => this.handleAppleAuth());
        document.getElementById('apple-signup').addEventListener('click', () => this.handleAppleAuth());
    }

    async loadUserStats() {
        try {
            const userId = this.currentUser._id || this.currentUser.id;

            // Load orders count
            const orders = await fetch(`/api/orders/${userId}`).then(r => r.json()).catch(() => []);
            document.getElementById('total-orders').textContent = orders.length || 0;

            // Load favorites count
            const favorites = await fetch(`/api/favorites/${userId}`).then(r => r.json()).catch(() => []);
            document.getElementById('total-favorites').textContent = favorites.length || 0;

            // Load recent activity
            await this.loadRecentActivity(orders, favorites);

        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    }

    async loadRecentActivity(orders, favorites) {
        const activityList = document.getElementById('activity-list');
        const activities = [];

        // Add order activities
        if (orders && orders.length > 0) {
            orders.slice(0, 5).forEach(order => {
                activities.push({
                    type: 'order',
                    icon: 'fa-shopping-bag',
                    title: `Order placed for ${order.configuration?.carName || 'Custom Build'}`,
                    description: `Total: $${order.configuration?.totalPrice?.toLocaleString() || '0'}`,
                    date: new Date(order.createdAt),
                    status: order.status
                });
            });
        }

        // Add favorite activities
        if (favorites && favorites.length > 0) {
            favorites.slice(0, 3).forEach(fav => {
                activities.push({
                    type: 'favorite',
                    icon: 'fa-heart',
                    title: `Added ${fav.car_id?.name || 'a car'} to favorites`,
                    description: `Configuration saved`,
                    date: new Date(fav.createdAt)
                });
            });
        }

        // Sort by date
        activities.sort((a, b) => b.date - a.date);

        // Display activities
        if (activities.length === 0) {
            activityList.innerHTML = '<p class="no-activity">No recent activity</p>';
        } else {
            activityList.innerHTML = activities.slice(0, 10).map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas ${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <h4>${activity.title}</h4>
                        <p>${activity.description}</p>
                        ${activity.status ? `<span class="activity-status status-${activity.status}">${activity.status}</span>` : ''}
                        <span class="activity-date">${this.formatDate(activity.date)}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 7) {
            return date.toLocaleDateString();
        } else if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    }

    async checkAuthStatus() {
        try {
            console.log('Checking auth status...');

            // First check localStorage for user data
            const localUser = localStorage.getItem('mns_user');
            if (localUser) {
                console.log('Found user in localStorage:', localUser);
            }

            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });

            console.log('Auth response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Auth data received:', data);

                if (data.success && data.user) {
                    this.currentUser = data.user;
                    this.isAuthenticated = true;
                    console.log('User authenticated:', this.currentUser);

                    // Store user in localStorage
                    localStorage.setItem('mns_user', JSON.stringify(data.user));

                    // Update global MNS user state
                    if (window.MNS && window.MNS.user) {
                        window.MNS.user.setCurrentUser(data.user);
                    }

                    // Update navbar auth link
                    if (window.MNS && window.MNS.updateAuthLink) {
                        window.MNS.updateAuthLink();
                    }

                    this.showProfileDashboard();
                    this.populateUserData();
                    return;
                } else {
                    console.log('No user in response');
                }
            } else {
                console.log('Response not OK, status:', response.status);
            }

            // Fallback: Check localStorage if API fails
            if (localUser) {
                console.log('Using localStorage user data as fallback');
                try {
                    this.currentUser = JSON.parse(localUser);
                    this.isAuthenticated = true;

                    // Update global MNS user state
                    if (window.MNS && window.MNS.user) {
                        window.MNS.user.setCurrentUser(this.currentUser);
                    }

                    // Update navbar auth link
                    if (window.MNS && window.MNS.updateAuthLink) {
                        window.MNS.updateAuthLink();
                    }

                    this.showProfileDashboard();
                    this.populateUserData();
                    return;
                } catch (parseError) {
                    console.error('Failed to parse localStorage user:', parseError);
                }
            }

            // No user found, show auth container
            console.log('No authenticated user found, showing auth container');
            this.showAuthContainer();

        } catch (error) {
            console.error('Auth check failed:', error);

            // Try localStorage as last resort
            const localUser = localStorage.getItem('mns_user');
            if (localUser) {
                try {
                    this.currentUser = JSON.parse(localUser);
                    this.isAuthenticated = true;
                    console.log('Using localStorage after error');

                    if (window.MNS && window.MNS.user) {
                        window.MNS.user.setCurrentUser(this.currentUser);
                    }

                    if (window.MNS && window.MNS.updateAuthLink) {
                        window.MNS.updateAuthLink();
                    }

                    this.showProfileDashboard();
                    this.populateUserData();
                    return;
                } catch (parseError) {
                    console.error('Failed to parse localStorage user:', parseError);
                }
            }

            this.showAuthContainer();
        }
    }

    switchAuthTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Show/hide forms
        document.querySelectorAll('.auth-form').forEach(form => form.classList.add('hidden'));
        document.getElementById(`${tab}-form`).classList.remove('hidden');
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        this.showLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.currentUser = result.user;
                this.isAuthenticated = true;

                // Store user in localStorage
                localStorage.setItem('mns_user', JSON.stringify(result.user));

                // Update global MNS user state
                if (window.MNS && window.MNS.user) {
                    window.MNS.user.setCurrentUser(result.user);
                }

                // Update navbar auth link
                if (window.MNS && window.MNS.updateAuthLink) {
                    window.MNS.updateAuthLink();
                }

                this.showToast('Login successful!', 'success');
                this.showProfileDashboard();
                this.populateUserData();
            } else {
                this.showToast(result.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Login failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        // Validate password confirmation
        if (data.password !== data.confirmPassword) {
            this.showToast('Passwords do not match', 'error');
            return;
        }

        // Remove confirmPassword from data
        delete data.confirmPassword;

        this.showLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.currentUser = result.user;
                this.isAuthenticated = true;

                // Store user in localStorage
                localStorage.setItem('mns_user', JSON.stringify(result.user));

                // Update global MNS user state
                if (window.MNS && window.MNS.user) {
                    window.MNS.user.setCurrentUser(result.user);
                }

                // Update navbar auth link
                if (window.MNS && window.MNS.updateAuthLink) {
                    window.MNS.updateAuthLink();
                }

                this.showToast('Account created successfully!', 'success');
                this.showProfileDashboard();
                this.populateUserData();
            } else {
                this.showToast(result.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showToast('Registration failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleLogout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                this.currentUser = null;
                this.isAuthenticated = false;
                this.showToast('Logged out successfully', 'success');
                this.showAuthContainer();
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.showToast('Logout failed', 'error');
        }
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {};

        // Handle nested address object
        for (let [key, value] of formData.entries()) {
            if (key.startsWith('address.')) {
                if (!data.address) data.address = {};
                data.address[key.split('.')[1]] = value;
            } else {
                data[key] = value;
            }
        }

        this.showLoading(true);

        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.currentUser = result.user;
                this.showToast('Profile updated successfully!', 'success');
                this.populateUserData();
            } else {
                this.showToast(result.message || 'Profile update failed', 'error');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            this.showToast('Profile update failed', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handlePasswordChange(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        if (data.newPassword !== data.confirmNewPassword) {
            this.showToast('New passwords do not match', 'error');
            return;
        }

        delete data.confirmNewPassword;

        this.showLoading(true);

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('Password changed successfully!', 'success');
                e.target.reset();
            } else {
                this.showToast(result.message || 'Password change failed', 'error');
            }
        } catch (error) {
            console.error('Password change error:', error);
            this.showToast('Password change failed', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handlePreferencesUpdate(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = { preferences: {} };

        // Handle nested preferences object
        for (let [key, value] of formData.entries()) {
            if (key.startsWith('preferences.')) {
                const prefKey = key.split('.')[1];
                data.preferences[prefKey] = value === 'on' ? true : value;
            }
        }

        this.showLoading(true);

        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.currentUser = result.user;
                this.showToast('Preferences updated successfully!', 'success');
            } else {
                this.showToast(result.message || 'Preferences update failed', 'error');
            }
        } catch (error) {
            console.error('Preferences update error:', error);
            this.showToast('Preferences update failed', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleAccountDeletion(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        this.showLoading(true);

        try {
            const response = await fetch('/api/auth/account', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('Account deleted successfully', 'success');
                document.getElementById('delete-account-modal').classList.remove('show');
                setTimeout(() => {
                    this.currentUser = null;
                    this.isAuthenticated = false;
                    this.showAuthContainer();
                }, 2000);
            } else {
                this.showToast(result.message || 'Account deletion failed', 'error');
            }
        } catch (error) {
            console.error('Account deletion error:', error);
            this.showToast('Account deletion failed', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    handleGoogleAuth() {
        // Check if Google OAuth is properly configured
        if (!this.isGoogleOAuthConfigured()) {
            this.showToast('Google Sign In is not configured yet. Please use email/password registration.', 'warning');
            return;
        }

        // Use popup window for Google Sign In
        this.openGoogleSignInPopup();
    }

    isGoogleOAuthConfigured() {
        // Google OAuth is now properly configured with real credentials
        return true;
    }

    openGoogleSignInPopup() {
        const popup = window.open(
            '/api/auth/google',
            'googleSignIn',
            'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
        );

        // Check if popup was blocked
        if (!popup || popup.closed || typeof popup.closed == 'undefined') {
            this.showToast('Popup blocked! Please allow popups for this site and try again.', 'error');
            return;
        }

        // Monitor popup for completion
        const checkClosed = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkClosed);
                // Check if authentication was successful
                this.checkAuthAfterPopup();
            }
        }, 1000);

        // Handle popup communication
        window.addEventListener('message', (event) => {
            if (event.origin !== window.location.origin) return;

            if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
                clearInterval(checkClosed);
                popup.close();
                this.handleGoogleAuthSuccess(event.data.user);
            } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
                clearInterval(checkClosed);
                popup.close();
                this.showToast(event.data.message || 'Google authentication failed', 'error');
            }
        });
    }

    async checkAuthAfterPopup() {
        // Wait a moment for the server to process
        setTimeout(async () => {
            try {
                const response = await fetch('/api/auth/me', {
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json();
                    this.currentUser = data.user;
                    this.isAuthenticated = true;
                    this.showToast('Google Sign In successful!', 'success');
                    this.showProfileDashboard();
                    this.populateUserData();
                }
            } catch (error) {
                console.error('Auth check after popup failed:', error);
            }
        }, 1000);
    }

    handleGoogleAuthSuccess(user) {
        this.currentUser = user;
        this.isAuthenticated = true;
        this.showToast('Google Sign In successful!', 'success');
        this.showProfileDashboard();
        this.populateUserData();
    }

    handleAppleAuth() {
        // Apple Sign In implementation would go here
        // For now, show a message
        this.showToast('Apple Sign In coming soon!', 'warning');
    }

    setupGoogleAuth() {
        // Initialize Google Identity Services when available
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.initialize({
                client_id: '824535366521-elagm7h7rtrkv7hgo6jsc9cssfmgslvi.apps.googleusercontent.com',
                callback: this.handleGoogleCredentialResponse.bind(this),
                auto_select: false,
                cancel_on_tap_outside: true
            });
        }
    }

    handleGoogleCredentialResponse(response) {
        // Handle the Google ID token
        this.sendGoogleTokenToServer(response.credential);
    }

    async sendGoogleTokenToServer(idToken) {
        try {
            this.showLoading(true);

            const response = await fetch('/api/auth/google/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ idToken })
            });

            const result = await response.json();

            if (result.success) {
                this.currentUser = result.user;
                this.isAuthenticated = true;
                this.showToast('Google Sign In successful!', 'success');
                this.showProfileDashboard();
                this.populateUserData();
            } else {
                this.showToast(result.message || 'Google authentication failed', 'error');
            }
        } catch (error) {
            console.error('Google token verification failed:', error);
            this.showToast('Google authentication failed', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Enhanced Google Auth with popup preference
    handleGoogleAuth() {
        // Try modern Google Identity Services first
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    // Fallback to popup method
                    this.openGoogleSignInPopup();
                }
            });
        } else {
            // Fallback to popup method
            this.openGoogleSignInPopup();
        }
    }

    setupAppleAuth() {
        // Apple Sign In setup would go here
        // This requires Apple ID configuration
    }

    switchProfileSection(section) {
        // Update navigation
        document.querySelectorAll('.profile-nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Show/hide sections
        document.querySelectorAll('.profile-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(`${section}-section`).classList.add('active');
    }

    showAuthContainer() {
        console.log('Showing auth container...');
        const authContainer = document.getElementById('auth-container');
        const profileDashboard = document.getElementById('profile-dashboard');

        console.log('Auth container element:', authContainer);
        console.log('Profile dashboard element:', profileDashboard);

        if (authContainer) {
            authContainer.classList.remove('hidden');
            authContainer.style.display = 'block';
            console.log('Auth container shown');
        }
        if (profileDashboard) {
            profileDashboard.classList.add('hidden');
            profileDashboard.style.display = 'none';
            console.log('Profile dashboard hidden');
        }
    }

    showProfileDashboard() {
        console.log('Showing profile dashboard...');
        const authContainer = document.getElementById('auth-container');
        const profileDashboard = document.getElementById('profile-dashboard');

        console.log('Auth container element:', authContainer);
        console.log('Profile dashboard element:', profileDashboard);

        if (authContainer) {
            authContainer.classList.add('hidden');
            authContainer.style.display = 'none';
            console.log('Auth container hidden');
        }
        if (profileDashboard) {
            profileDashboard.classList.remove('hidden');
            profileDashboard.style.display = 'block';
            console.log('Profile dashboard shown');
        }
    }

    populateUserData() {
        if (!this.currentUser) return;

        console.log('Populating user data:', this.currentUser);

        // Update profile header in sidebar
        const profileNameEl = document.getElementById('profile-name');
        const profileEmailEl = document.getElementById('profile-email');

        if (profileNameEl) {
            const fullName = this.currentUser.fullName ||
                `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim() ||
                this.currentUser.name ||
                'User';
            profileNameEl.textContent = fullName;
        }

        if (profileEmailEl) {
            profileEmailEl.textContent = this.currentUser.email || '';
        }

        // Update profile image
        if (this.currentUser.profileImage) {
            document.getElementById('profile-image').src = this.currentUser.profileImage;
        }

        // Populate personal info form
        const personalForm = document.getElementById('personal-info-form');
        if (personalForm) {
            // Use getElementById to access form fields
            const firstNameField = document.getElementById('edit-firstname');
            const lastNameField = document.getElementById('edit-lastname');
            const emailField = document.getElementById('edit-email');
            const phoneField = document.getElementById('edit-phone');
            const dobField = document.getElementById('edit-dob');
            const genderField = document.getElementById('edit-gender');

            if (firstNameField) firstNameField.value = this.currentUser.firstName || '';
            if (lastNameField) lastNameField.value = this.currentUser.lastName || '';
            if (emailField) emailField.value = this.currentUser.email || '';
            if (phoneField) phoneField.value = this.currentUser.phone || '';

            if (dobField && this.currentUser.dateOfBirth) {
                dobField.value = new Date(this.currentUser.dateOfBirth).toISOString().split('T')[0];
            }

            if (genderField && this.currentUser.gender) {
                genderField.value = this.currentUser.gender;
            }

            // Address fields
            if (this.currentUser.address) {
                const address = this.currentUser.address;
                const streetField = document.getElementById('edit-street');
                const cityField = document.getElementById('edit-city');
                const stateField = document.getElementById('edit-state');
                const zipField = document.getElementById('edit-zip');
                const countryField = document.getElementById('edit-country');

                if (streetField) streetField.value = address.street || '';
                if (cityField) cityField.value = address.city || '';
                if (stateField) stateField.value = address.state || '';
                if (zipField) zipField.value = address.zipCode || '';
                if (countryField) countryField.value = address.country || '';
            }
        }

        // Populate preferences
        if (this.currentUser.preferences) {
            const prefs = this.currentUser.preferences;

            if (document.getElementById('email-notifications')) {
                document.getElementById('email-notifications').checked = prefs.notifications || false;
            }

            if (document.getElementById('newsletter')) {
                document.getElementById('newsletter').checked = prefs.newsletter || false;
            }

            if (prefs.theme) {
                const themeRadio = document.querySelector(`input[name="preferences.theme"][value="${prefs.theme}"]`);
                if (themeRadio) themeRadio.checked = true;
            }
        }

        // Update overview cards
        document.getElementById('total-orders').textContent = this.currentUser.orders?.length || 0;
        document.getElementById('total-favorites').textContent = this.currentUser.favorites?.length || 0;

        if (this.currentUser.createdAt) {
            const memberSince = new Date(this.currentUser.createdAt).getFullYear();
            document.getElementById('member-since').textContent = memberSince;
        }
    }

    togglePasswordVisibility(button) {
        const input = button.parentElement.querySelector('input');
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    checkPasswordStrength(password) {
        const strengthIndicator = document.getElementById('password-strength');
        let strength = 0;

        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;

        strengthIndicator.className = 'password-strength';

        if (strength <= 2) {
            strengthIndicator.classList.add('weak');
        } else if (strength <= 3) {
            strengthIndicator.classList.add('fair');
        } else if (strength <= 4) {
            strengthIndicator.classList.add('good');
        } else {
            strengthIndicator.classList.add('strong');
        }
    }

    handleAvatarEdit() {
        // Create file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => this.handleAvatarUpload(e.target.files[0]);
        input.click();
    }

    async handleAvatarUpload(file) {
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        this.showLoading(true);

        try {
            const response = await fetch('/api/admin/upload-image', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Update profile image
                document.getElementById('profile-image').src = `/images/${result.filename}`;
                this.showToast('Profile image updated!', 'success');
            } else {
                this.showToast(result.message || 'Image upload failed', 'error');
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            this.showToast('Image upload failed', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);

        // Remove on click
        toast.addEventListener('click', () => toast.remove());
    }
}

// Initialize profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ProfileManager...');
    console.log('Auth container:', document.getElementById('auth-container'));
    console.log('Profile dashboard:', document.getElementById('profile-dashboard'));
    console.log('localStorage user:', localStorage.getItem('mns_user'));

    new ProfileManager();
});

// Handle URL parameters for OAuth callbacks
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('success') === 'google_auth_success') {
        // Show success message and reload to check auth status
        setTimeout(() => {
            window.location.href = '/profile';
        }, 1000);
    }

    if (urlParams.get('error') === 'google_auth_failed') {
        // Show error message
        const profileManager = new ProfileManager();
        profileManager.showToast('Google authentication failed', 'error');
    }
});


// Profile Picture Upload Functionality
function setupProfilePictureUpload() {
    const avatarEdit = document.getElementById('avatar-edit');
    if (avatarEdit) {
        avatarEdit.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    await uploadProfilePicture(file);
                }
            };
            input.click();
        });
    }
}

async function uploadProfilePicture(file) {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    try {
        // Get current user
        const user = JSON.parse(localStorage.getItem('mns_user') || '{}');
        if (!user._id && !user.id) {
            alert('Please log in to update your profile picture');
            return;
        }

        // Show loading state
        const avatarImg = document.querySelector('.profile-avatar img');
        if (avatarImg) {
            avatarImg.style.opacity = '0.5';
        }

        // Create FormData
        const formData = new FormData();
        formData.append('image', file);

        // Upload image
        const uploadResponse = await fetch('/api/admin/upload-image', {
            method: 'POST',
            body: formData
        });

        if (!uploadResponse.ok) {
            throw new Error('Upload failed');
        }

        const uploadResult = await uploadResponse.json();

        // Update user profile picture in database
        const userId = user._id || user.id;
        const updateResponse = await fetch(`/api/users/${userId}/profile-picture`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profilePicture: uploadResult.filename })
        });

        if (!updateResponse.ok) {
            throw new Error('Failed to update profile');
        }

        // Update avatar image
        if (avatarImg) {
            avatarImg.src = uploadResult.url;
            avatarImg.style.opacity = '1';
        }

        // Update localStorage
        user.profilePicture = uploadResult.filename;
        localStorage.setItem('mns_user', JSON.stringify(user));

        alert('Profile picture updated successfully!');
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        alert('Failed to upload profile picture. Please try again.');

        // Restore opacity
        const avatarImg = document.querySelector('.profile-avatar img');
        if (avatarImg) {
            avatarImg.style.opacity = '1';
        }
    }
}

// Load user stats and activity on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Profile page loaded, setting up...');
    setupProfilePictureUpload();

    // Load profile picture if exists
    loadProfilePicture();

    // Wait for user to be loaded
    let attempts = 0;
    const maxAttempts = 20;

    const checkUserLoaded = setInterval(() => {
        attempts++;
        const user = JSON.parse(localStorage.getItem('mns_user') || 'null');

        if (user && (user._id || user.id)) {
            console.log('User found, loading stats...', user);
            clearInterval(checkUserLoaded);
            loadUserStatsAndActivity(user);
        } else if (attempts >= maxAttempts) {
            console.log('No user found after', maxAttempts, 'attempts');
            clearInterval(checkUserLoaded);
        }
    }, 500);
});

function loadProfilePicture() {
    try {
        const user = JSON.parse(localStorage.getItem('mns_user') || 'null');
        if (user && user.profilePicture) {
            const avatarImg = document.querySelector('.profile-avatar img');
            if (avatarImg) {
                avatarImg.src = `/images/${user.profilePicture}`;
            }
        }
    } catch (error) {
        console.error('Error loading profile picture:', error);
    }
}

async function loadUserStatsAndActivity(user) {
    try {
        const userId = user._id || user.id;
        console.log('Loading stats for user:', userId);

        // Update profile name and email
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');

        if (profileName) {
            profileName.textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'User';
        }
        if (profileEmail) {
            profileEmail.textContent = user.email || '';
        }

        // Load orders
        console.log('Fetching orders...');
        const orders = await fetch(`/api/orders/${userId}`)
            .then(r => {
                console.log('Orders response status:', r.status);
                return r.ok ? r.json() : [];
            })
            .catch(err => {
                console.error('Error fetching orders:', err);
                return [];
            });

        console.log('Orders loaded:', orders.length);

        // Load favorites
        console.log('Fetching favorites...');
        const favorites = await fetch(`/api/favorites/${userId}`)
            .then(r => {
                console.log('Favorites response status:', r.status);
                return r.ok ? r.json() : [];
            })
            .catch(err => {
                console.error('Error fetching favorites:', err);
                return [];
            });

        console.log('Favorites loaded:', favorites.length);

        // Update stats with animation
        const totalOrdersEl = document.getElementById('total-orders');
        const totalFavoritesEl = document.getElementById('total-favorites');

        if (totalOrdersEl) {
            animateCounter(totalOrdersEl, orders.length || 0);
        }
        if (totalFavoritesEl) {
            animateCounter(totalFavoritesEl, favorites.length || 0);
        }

        // Update member since
        const memberSinceEl = document.getElementById('member-since');
        if (memberSinceEl && user.createdAt) {
            const memberDate = new Date(user.createdAt);
            memberSinceEl.textContent = memberDate.toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
            });
        }

        // Load recent activity
        loadRecentActivityDisplay(orders, favorites);

        console.log('Stats loaded successfully');

    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

function animateCounter(element, target) {
    let current = 0;
    const increment = Math.ceil(target / 20);
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = current;
        }
    }, 50);
}

function loadRecentActivityDisplay(orders, favorites) {
    const activityList = document.getElementById('activity-list');
    const activities = [];

    // Add order activities
    if (orders && orders.length > 0) {
        orders.forEach(order => {
            activities.push({
                type: 'order',
                icon: 'fa-shopping-bag',
                title: `Order placed for ${order.configuration?.carName || 'Custom Build'}`,
                description: `Total: $${order.configuration?.totalPrice?.toLocaleString() || '0'}`,
                date: new Date(order.createdAt),
                status: order.status
            });
        });
    }

    // Add favorite activities
    if (favorites && favorites.length > 0) {
        favorites.forEach(fav => {
            activities.push({
                type: 'favorite',
                icon: 'fa-heart',
                title: `Added ${fav.car_id?.name || 'a car'} to favorites`,
                description: `Configuration saved`,
                date: new Date(fav.createdAt)
            });
        });
    }

    // Sort by date (newest first)
    activities.sort((a, b) => b.date - a.date);

    // Display activities
    if (activities.length === 0) {
        activityList.innerHTML = '<p class="no-activity" style="text-align: center; color: var(--muted); padding: 20px;">No recent activity</p>';
    } else {
        activityList.innerHTML = activities.slice(0, 10).map(activity => `
            <div class="activity-item" style="display: flex; gap: 15px; padding: 15px; background: var(--card); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 10px;">
                <div class="activity-icon" style="width: 40px; height: 40px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; color: var(--brand); flex-shrink: 0;">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-content" style="flex: 1;">
                    <h4 style="color: var(--text); margin: 0 0 5px 0; font-size: 1rem;">${activity.title}</h4>
                    <p style="color: var(--muted); margin: 0 0 5px 0; font-size: 0.9rem;">${activity.description}</p>
                    ${activity.status ? `<span class="activity-status" style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; background: var(--accent); color: var(--brand); text-transform: uppercase; margin-right: 10px;">${activity.status}</span>` : ''}
                    <span class="activity-date" style="color: var(--muted); font-size: 0.85rem;">${formatActivityDate(activity.date)}</span>
                </div>
            </div>
        `).join('');
    }
}

function formatActivityDate(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
        return date.toLocaleDateString();
    } else if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
}
