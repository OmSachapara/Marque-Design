// Authentication JavaScript
class AuthManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkExistingAuth();
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Form submissions
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    document.getElementById('register-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister();
    });

    // Google Sign In
    document.getElementById('google-signin-btn').addEventListener('click', () => {
      this.handleGoogleSignIn();
    });

    // Password confirmation validation
    const confirmPassword = document.getElementById('register-confirmPassword');
    const password = document.getElementById('register-password');
    
    confirmPassword.addEventListener('input', () => {
      if (confirmPassword.value && password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity('Passwords do not match');
      } else {
        confirmPassword.setCustomValidity('');
      }
    });

    password.addEventListener('input', () => {
      if (confirmPassword.value && password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity('Passwords do not match');
      } else {
        confirmPassword.setCustomValidity('');
      }
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => {
      form.classList.remove('active');
    });
    document.getElementById(`${tabName}-form`).classList.add('active');

    // Clear messages
    this.clearMessages();
  }

  async checkExistingAuth() {
    // Check for Google auth success in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('google_auth') === 'success') {
      this.showSuccess('Google Sign In successful! Redirecting...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
      return;
    }

    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (data.success && data.user) {
        // User is already logged in, redirect to home page
        window.location.href = '/';
      }
    } catch (error) {
      // User not logged in, stay on login page
      console.log('User not authenticated');
    }
  }

  async handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const loginBtn = document.getElementById('login-btn');

    if (!email || !password) {
      this.showError('Please fill in all fields');
      return;
    }

    this.setLoading(loginBtn, true);
    this.clearMessages();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        this.showSuccess('Login successful! Redirecting...');
        
        // Store user data
        localStorage.setItem('mns_user', JSON.stringify(data.user));
        
        // Redirect to home page or intended page
        setTimeout(() => {
          const urlParams = new URLSearchParams(window.location.search);
          const redirect = urlParams.get('redirect') || '/';
          window.location.href = redirect;
        }, 1500);
      } else {
        this.showError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Login failed. Please try again.');
    } finally {
      this.setLoading(loginBtn, false);
    }
  }

  async handleRegister() {
    const firstName = document.getElementById('register-firstName').value;
    const lastName = document.getElementById('register-lastName').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirmPassword').value;
    const registerBtn = document.getElementById('register-btn');

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      this.showError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      this.showError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      this.showError('Password must be at least 6 characters long');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showError('Please enter a valid email address');
      return;
    }

    this.setLoading(registerBtn, true);
    this.clearMessages();

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim() || undefined,
          password
        })
      });

      const data = await response.json();

      if (data.success) {
        this.showSuccess('Account created successfully! Redirecting...');
        
        // Store user data
        localStorage.setItem('mns_user', JSON.stringify(data.user));
        
        // Redirect to home page
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        this.showError(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.showError('Registration failed. Please try again.');
    } finally {
      this.setLoading(registerBtn, false);
    }
  }

  handleGoogleSignIn() {
    console.log('Starting Google Sign In...');
    
    // Use direct redirect instead of popup for better reliability
    window.location.href = '/api/auth/google';
  }

  setLoading(button, loading) {
    const btnText = button.querySelector('.btn-text');
    const loadingSpinner = button.querySelector('.loading');
    
    if (loading) {
      button.disabled = true;
      btnText.style.display = 'none';
      loadingSpinner.style.display = 'inline-block';
    } else {
      button.disabled = false;
      btnText.style.display = 'inline';
      loadingSpinner.style.display = 'none';
    }
  }

  showSuccess(message) {
    const successEl = document.getElementById('success-message');
    const errorEl = document.getElementById('error-message');
    
    errorEl.style.display = 'none';
    successEl.textContent = message;
    successEl.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      successEl.style.display = 'none';
    }, 5000);
  }

  showError(message) {
    const successEl = document.getElementById('success-message');
    const errorEl = document.getElementById('error-message');
    
    successEl.style.display = 'none';
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 5000);
  }

  clearMessages() {
    document.getElementById('success-message').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
  }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AuthManager();
});