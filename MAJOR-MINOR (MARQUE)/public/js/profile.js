// Profile Page JavaScript
class ProfileManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  async init() {
    await this.checkAuthentication();
    
    if (!this.currentUser) {
      this.redirectToLogin();
      return;
    }
    
    this.showProfileContent();
    this.setupEventListeners();
    this.loadProfileData();
    this.loadUserStats();
  }

  async checkAuthentication() {
    try {
      // Always try to get fresh data from server first
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (data.success && data.user) {
        this.currentUser = data.user;
        localStorage.setItem('mns_user', JSON.stringify(data.user));
        
        // Update global user state
        if (window.MNS && window.MNS.user) {
          window.MNS.user.setCurrentUser(data.user);
        }
        return;
      }
      
      // Fallback to local storage
      const userData = localStorage.getItem('mns_user');
      if (userData) {
        this.currentUser = JSON.parse(userData);
        
        // Try to verify with server one more time
        try {
          const verifyResponse = await fetch('/api/auth/me');
          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            if (verifyData.success && verifyData.user) {
              // Server has newer data, use it
              this.currentUser = verifyData.user;
              localStorage.setItem('mns_user', JSON.stringify(verifyData.user));
              
              if (window.MNS && window.MNS.user) {
                window.MNS.user.setCurrentUser(verifyData.user);
              }
            }
          } else {
            // Token expired, clear local storage
            localStorage.removeItem('mns_user');
            this.currentUser = null;
          }
        } catch (verifyError) {
          console.warn('Server verification failed, using local data:', verifyError);
          // Continue with local data if server is unreachable
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      
      // Fallback to local storage if server is unreachable
      const userData = localStorage.getItem('mns_user');
      if (userData) {
        this.currentUser = JSON.parse(userData);
      } else {
        this.currentUser = null;
      }
    }
  }

  redirectToLogin() {
    const currentPath = window.location.pathname;
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
  }

  showProfileContent() {
    document.getElementById('profile-content').style.display = 'block';
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.profile-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Form submissions
    document.getElementById('personal-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.updatePersonalInfo();
    });

    document.getElementById('email-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.updateEmail();
    });

    document.getElementById('phone-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.updatePhone();
    });

    // Verification buttons
    document.getElementById('verify-email-btn').addEventListener('click', () => {
      this.verifyEmail();
    });

    document.getElementById('verify-phone-btn').addEventListener('click', () => {
      this.verifyPhone();
    });

    // Date of birth change to calculate age
    document.getElementById('dateOfBirth').addEventListener('change', (e) => {
      this.calculateAge(e.target.value);
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.profile-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update panels
    document.querySelectorAll('.profile-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    document.getElementById(`${tabName}-panel`).classList.add('active');
  }

  loadProfileData() {
    // Load profile header
    const avatarContainer = document.getElementById('profile-avatar-container');
    if (this.currentUser.avatar) {
      avatarContainer.innerHTML = `<img src="${this.currentUser.avatar}" class="profile-avatar" alt="Profile Picture">`;
    } else {
      const initial = this.currentUser.name ? this.currentUser.name.charAt(0).toUpperCase() : 'U';
      avatarContainer.innerHTML = `<div class="profile-avatar-placeholder">${initial}</div>`;
    }

    document.getElementById('profile-name').textContent = this.currentUser.name || 'User';
    document.getElementById('profile-email').textContent = this.currentUser.email || '';
    
    // Authentication provider removed

    // Load form data
    this.loadPersonalInfo();
    this.loadContactInfo();
    this.loadSecurityInfo();
  }

  loadPersonalInfo() {
    // Split name into first and last name if available
    const nameParts = (this.currentUser.name || '').split(' ');
    document.getElementById('firstName').value = this.currentUser.firstName || nameParts[0] || '';
    document.getElementById('lastName').value = this.currentUser.lastName || nameParts.slice(1).join(' ') || '';
    
    if (this.currentUser.dateOfBirth) {
      const date = new Date(this.currentUser.dateOfBirth);
      document.getElementById('dateOfBirth').value = date.toISOString().split('T')[0];
      this.calculateAge(document.getElementById('dateOfBirth').value);
    }
    
    document.getElementById('age').value = this.currentUser.age || '';
    document.getElementById('gender').value = this.currentUser.gender || 'prefer-not-to-say';
  }

  loadContactInfo() {
    document.getElementById('email').value = this.currentUser.email || '';
    document.getElementById('phone').value = this.currentUser.phone || '';
    
    // Update verification status
    const emailStatus = document.getElementById('email-status');
    const phoneStatus = document.getElementById('phone-status');
    
    if (this.currentUser.emailVerified) {
      emailStatus.className = 'verification-status verified';
      emailStatus.innerHTML = '✅ Verified';
    } else {
      emailStatus.className = 'verification-status unverified';
      emailStatus.innerHTML = '❌ Unverified';
    }
    
    if (this.currentUser.phoneVerified) {
      phoneStatus.className = 'verification-status verified';
      phoneStatus.innerHTML = '✅ Verified';
    } else {
      phoneStatus.className = 'verification-status unverified';
      phoneStatus.innerHTML = '❌ Unverified';
    }
  }

  loadSecurityInfo() {
    const authMethod = document.getElementById('auth-method');
    const authBadge = document.getElementById('auth-badge');
    
    authMethod.textContent = 'Email & Password';
    authBadge.innerHTML = '🔐 Secure';
  }

  async loadUserStats() {
    try {
      // Load favorites count
      if (this.currentUser.id) {
        const favorites = await fetch(`/api/favorites/${this.currentUser.id}`).then(r => r.json()).catch(() => []);
        document.getElementById('total-favorites').textContent = Array.isArray(favorites) ? favorites.length : 0;
        
        const orders = await fetch(`/api/orders/${this.currentUser.id}`).then(r => r.json()).catch(() => []);
        document.getElementById('total-orders').textContent = Array.isArray(orders) ? orders.length : 0;
      }
      
      // Member since
      if (this.currentUser.createdAt) {
        const memberSince = new Date(this.currentUser.createdAt).getFullYear();
        document.getElementById('member-since').textContent = memberSince;
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  }

  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    document.getElementById('age').value = age;
  }

  async updatePersonalInfo() {
    const formData = {
      firstName: document.getElementById('firstName').value,
      lastName: document.getElementById('lastName').value,
      dateOfBirth: document.getElementById('dateOfBirth').value,
      age: parseInt(document.getElementById('age').value),
      gender: document.getElementById('gender').value
    };

    try {
      const response = await fetch('/api/auth/profile/personal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        this.showSuccess('personal-success', 'Personal information updated successfully!');
        
        // Update current user data with server response
        this.currentUser = { ...this.currentUser, ...data.user };
        this.currentUser.fullName = `${data.user.firstName} ${data.user.lastName}`;
        
        // Persist to localStorage
        localStorage.setItem('mns_user', JSON.stringify(this.currentUser));
        
        // Update UI
        document.getElementById('profile-name').textContent = this.currentUser.fullName;
        
        // Update global user state
        if (window.MNS && window.MNS.user) {
          window.MNS.user.setCurrentUser(this.currentUser);
        }
      } else {
        this.showError('personal-error', data.message || 'Failed to update personal information');
      }
    } catch (error) {
      console.error('Update error:', error);
      this.showError('personal-error', 'Failed to update personal information');
    }
  }

  async updateEmail() {
    const newEmail = document.getElementById('email').value;
    
    try {
      const response = await fetch('/api/auth/profile/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail })
      });

      const data = await response.json();

      if (data.success) {
        this.showSuccess('email-success', 'Email updated successfully! Please verify your new email.');
        
        // Update current user data with server response
        this.currentUser = { ...this.currentUser, ...data.user };
        
        // Persist to localStorage
        localStorage.setItem('mns_user', JSON.stringify(this.currentUser));
        
        // Update UI
        this.loadContactInfo();
        
        // Update global user state
        if (window.MNS && window.MNS.user) {
          window.MNS.user.setCurrentUser(this.currentUser);
        }
      } else {
        this.showError('email-error', data.message || 'Failed to update email');
      }
    } catch (error) {
      console.error('Email update error:', error);
      this.showError('email-error', 'Failed to update email');
    }
  }

  async updatePhone() {
    const newPhone = document.getElementById('phone').value;
    
    try {
      const response = await fetch('/api/auth/profile/phone', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: newPhone })
      });

      const data = await response.json();

      if (data.success) {
        this.showSuccess('phone-success', 'Mobile number updated successfully! Please verify your new number.');
        
        // Update current user data with server response
        this.currentUser = { ...this.currentUser, ...data.user };
        
        // Persist to localStorage
        localStorage.setItem('mns_user', JSON.stringify(this.currentUser));
        
        // Update UI
        this.loadContactInfo();
        
        // Update global user state
        if (window.MNS && window.MNS.user) {
          window.MNS.user.setCurrentUser(this.currentUser);
        }
      } else {
        this.showError('phone-error', data.message || 'Failed to update mobile number');
      }
    } catch (error) {
      console.error('Phone update error:', error);
      this.showError('phone-error', 'Failed to update mobile number');
    }
  }

  async verifyEmail() {
    try {
      const response = await fetch('/api/auth/profile/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (response.ok) {
        this.showSuccess('email-success', 'Verification email sent! Check your inbox.');
      } else {
        console.error('Email verification failed:', data);
        const errorMessage = data.message || 'Failed to send verification email';
        this.showError('email-error', errorMessage);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      this.showError('email-error', 'Failed to send verification email');
    }
  }

  async verifyPhone() {
    try {
      const response = await fetch('/api/auth/profile/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (response.ok) {
        const code = prompt('Enter the verification code sent to your phone (use 123456 for demo):');
        if (code) {
          const verifyResponse = await fetch('/api/auth/profile/confirm-phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });

          const verifyData = await verifyResponse.json();
          
          if (verifyData.success) {
            this.showSuccess('phone-success', 'Phone number verified successfully!');
            
            // Update current user data with server response
            this.currentUser = { ...this.currentUser, ...verifyData.user };
            
            // Persist to localStorage
            localStorage.setItem('mns_user', JSON.stringify(this.currentUser));
            
            // Update UI
            this.loadContactInfo();
            
            // Update global user state
            if (window.MNS && window.MNS.user) {
              window.MNS.user.setCurrentUser(this.currentUser);
            }
          } else {
            const errorMessage = verifyData.message || 'Invalid verification code';
            this.showError('phone-error', errorMessage);
          }
        }
      } else {
        console.error('Phone verification failed:', data);
        const errorMessage = data.message || 'Failed to send verification code';
        this.showError('phone-error', errorMessage);
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      this.showError('phone-error', 'Failed to verify phone number');
    }
  }

  showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }

  showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }
}

// Global functions for security actions
window.exportData = function() {
  const data = {
    profile: window.profileManager.currentUser,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-profile-data.json';
  a.click();
  URL.revokeObjectURL(url);
};

window.deleteAccount = function() {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    if (confirm('This will permanently delete all your data including favorites and orders. Continue?')) {
      alert('Account deletion feature will be implemented soon. Please contact support for now.');
    }
  }
};

// Initialize profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Show loading state
  if (window.MNS && window.MNS.utils) {
    MNS.utils.showLoading('.container', 'Loading your profile...');
  }
  
  window.profileManager = new ProfileManager();
  
  // Listen for user state changes
  window.addEventListener('userStateChanged', (event) => {
    if (event.detail && window.profileManager) {
      window.profileManager.currentUser = event.detail;
      window.profileManager.loadProfileData();
    }
  });
});