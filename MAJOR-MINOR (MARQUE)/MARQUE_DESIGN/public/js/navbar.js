// Dynamic Navbar System for MARQUE DESIGN
class DynamicNavbar {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupScrollEffect();
        this.setupMobileMenu();
        this.setActiveLink();
    }

    async checkAuth() {
        // Check if user is logged in
        try {
            const response = await fetch('/api/auth/me', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user) {
                    this.currentUser = data.user;
                }
            }
        } catch (error) {
            console.log('Not authenticated');
        }

        // Fallback to localStorage
        if (!this.currentUser) {
            const userData = localStorage.getItem('mns_user');
            if (userData) {
                try {
                    this.currentUser = JSON.parse(userData);
                } catch (e) {
                    console.error('Error parsing user data:', e);
                }
            }
        }

        this.updateAuthLink();
    }

    updateAuthLink() {
        const authLink = document.getElementById('auth-link');
        if (!authLink) return;

        if (this.currentUser) {
            const userName = this.currentUser.fullName || 
                           `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim() || 
                           this.currentUser.name || 
                           'User';

            authLink.innerHTML = `
                <span class="user-greeting">Welcome, ${userName.split(' ')[0]}</span>
                <div class="auth-dropdown">
                    <a href="/profile" class="dropdown-item">
                        <i class="fas fa-user"></i> My Profile
                    </a>
                    <a href="/favorites" class="dropdown-item">
                        <i class="fas fa-heart"></i> My Favorites
                    </a>
                    <a href="/checkout" class="dropdown-item">
                        <i class="fas fa-shopping-cart"></i> Checkout
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="#" onclick="logout(); return false;" class="dropdown-item logout">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </a>
                </div>
            `;
            authLink.classList.add('has-dropdown');
        } else {
            authLink.innerHTML = 'Sign In';
            authLink.href = '/login';
            authLink.classList.remove('has-dropdown');
        }
    }

    setupScrollEffect() {
        const header = document.querySelector('header');
        if (!header) return;

        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            // Hide navbar on scroll down, show on scroll up
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                header.classList.add('hidden');
            } else {
                header.classList.remove('hidden');
            }

            lastScrollY = currentScrollY;
        });
    }

    setupMobileMenu() {
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const navMenu = document.getElementById('nav-menu');

        if (!mobileToggle || !navMenu) return;

        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('header') && navMenu.classList.contains('active')) {
                mobileToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });

        // Close menu when clicking on a link
        navMenu.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                mobileToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }

    setActiveLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('nav a');

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');

            if (href === currentPath || (currentPath === '/' && href === '/')) {
                link.classList.add('active');
            }
        });
    }
}

// Logout function
function logout() {
    localStorage.removeItem('mns_user');
    sessionStorage.clear();

    fetch('/api/auth/logout', { method: 'POST' })
        .then(() => {
            window.location.href = '/';
        })
        .catch(() => {
            window.location.href = '/';
        });
}

// Initialize navbar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dynamicNavbar = new DynamicNavbar();
});

// Listen for user state changes
window.addEventListener('userStateChanged', (e) => {
    if (window.dynamicNavbar) {
        window.dynamicNavbar.currentUser = e.detail;
        window.dynamicNavbar.updateAuthLink();
    }
});
