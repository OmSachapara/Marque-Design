(() => {
  const setActive = () => {
    const path = location.pathname.replace(/\/+/g,'/');
    document.querySelectorAll('nav a').forEach(a => {
      if(path === '/' && a.getAttribute('href') === '/') { a.classList.add('active'); return; }
      if(a.getAttribute('href') && path.startsWith(a.getAttribute('href'))) {
        a.classList.add('active');
      }
    });
  };
  document.addEventListener('DOMContentLoaded', setActive);
})();

window.MNS = window.MNS || {};

// API Functions
MNS.api = {
  async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },

  async getCars() {
    return this.request('/api/cars');
  },

  async getOptions(type) {
    return this.request(`/api/options/${type}`);
  },

  async createUser(name, email, phone = null) {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone })
    });
  },

  async getUserByEmail(email) {
    return this.request(`/api/users/${encodeURIComponent(email)}`);
  },

  async saveFavorite(userId, carId, config) {
    return this.request('/api/favorites', {
      method: 'POST',
      body: JSON.stringify({ userId, carId, config })
    });
  },

  async getFavorites(userId) {
    return this.request(`/api/favorites/${userId}`);
  },

  async deleteFavorite(favoriteId) {
    return this.request(`/api/favorites/${favoriteId}`, {
      method: 'DELETE'
    });
  },

  async createOrder(userId, carId, config) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ userId, carId, config })
    });
  },

  async getOrders(userId) {
    return this.request(`/api/orders/${userId}`);
  }
};

// Enhanced User Session Management
MNS.user = {
  getCurrentUser() {
    const userData = localStorage.getItem('mns_user');
    return userData ? JSON.parse(userData) : null;
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem('mns_user', JSON.stringify(user));
      sessionStorage.setItem('mns_user_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('mns_user');
      sessionStorage.removeItem('mns_user_session');
    }
    
    MNS.updateAuthLink();
    window.dispatchEvent(new CustomEvent('userStateChanged', { detail: user }));
  },

  clearCurrentUser() {
    localStorage.removeItem('mns_user');
    sessionStorage.removeItem('mns_user_session');
    this.clearUserData();
    MNS.updateAuthLink();
    window.dispatchEvent(new CustomEvent('userStateChanged', { detail: null }));
  },

  clearUserData() {
    localStorage.removeItem('customize_data');
    localStorage.removeItem('selected_car');
    localStorage.removeItem('customize_progress');
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('user_') || key.startsWith('draft_')) {
        localStorage.removeItem(key);
      }
    });
  },

  async refreshUserFromServer() {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (data.success && data.user) {
        this.setCurrentUser(data.user);
        return data.user;
      } else {
        this.clearCurrentUser();
        return null;
      }
    } catch (error) {
      console.error('Failed to refresh user from server:', error);
      return this.getCurrentUser();
    }
  }
};

// Legacy data for backward compatibility
MNS.palette = [
  {name:'Black', hex:'#000000'}, {name:'White', hex:'#ffffff'}, {name:'Silver', hex:'#c0c0c0'}, {name:'Gray', hex:'#808080'},
  {name:'Red', hex:'#e63946'}, {name:'Blue', hex:'#1d3557'}, {name:'Navy', hex:'#001f3f'}, {name:'Green', hex:'#2a9d8f'},
  {name:'Yellow', hex:'#f4d35e'}, {name:'Orange', hex:'#e76f51'}, {name:'Purple', hex:'#6a4c93'}, {name:'Teal', hex:'#008080'}
];

// Auth link update function
MNS.updateAuthLink = function() {
  const authLink = document.getElementById('auth-link');
  if (!authLink) return;

  const currentUser = MNS.user.getCurrentUser();
  
  if (currentUser) {
    authLink.innerHTML = `
      <span>Welcome, ${currentUser.name || currentUser.firstName || 'User'}</span>
      <div class="auth-dropdown" style="display: none; position: absolute; background: var(--card); border: 1px solid var(--border); border-radius: 8px; box-shadow: var(--shadow); z-index: 1000; min-width: 150px; top: 100%; right: 0;">
        <a href="/profile" style="display: block; padding: 10px 15px; color: var(--text); text-decoration: none; border-bottom: 1px solid var(--border);">👤 My Profile</a>
        <a href="/favorites" style="display: block; padding: 10px 15px; color: var(--text); text-decoration: none; border-bottom: 1px solid var(--border);">❤️ My Favorites</a>
        <a href="/checkout" style="display: block; padding: 10px 15px; color: var(--text); text-decoration: none; border-bottom: 1px solid var(--border);">🛒 Checkout</a>
        <a href="#" onclick="MNS.logout(); return false;" style="display: block; padding: 10px 15px; color: #ff6464; text-decoration: none;">🚪 Logout</a>
      </div>
    `;
    authLink.style.position = 'relative';
    
    authLink.addEventListener('mouseenter', () => {
      const dropdown = authLink.querySelector('.auth-dropdown');
      if (dropdown) dropdown.style.display = 'block';
    });
    
    authLink.addEventListener('mouseleave', () => {
      const dropdown = authLink.querySelector('.auth-dropdown');
      if (dropdown) dropdown.style.display = 'none';
    });
  } else {
    authLink.textContent = 'Sign In';
    authLink.href = '/login';
  }
};

// Logout function
MNS.logout = function() {
  MNS.user.clearCurrentUser();
  
  fetch('/api/auth/logout', { method: 'POST' })
    .then(() => {
      window.location.href = '/';
    })
    .catch(() => {
      window.location.href = '/';
    });
};

// Check session authentication and update auth links
MNS.checkSessionAuth = async function() {
  try {
    const response = await fetch('/api/auth/me');
    const data = await response.json();
    
    if (response.ok && data.success && data.user) {
      MNS.user.setCurrentUser(data.user);
      return data.user;
    } else {
      const userData = localStorage.getItem('mns_user');
      if (userData) {
        const user = JSON.parse(userData);
        const refreshedUser = await MNS.user.refreshUserFromServer();
        return refreshedUser || user;
      }
    }
  } catch (error) {
    console.error('Session auth check failed:', error);
    const userData = localStorage.getItem('mns_user');
    if (userData) {
      const user = JSON.parse(userData);
      MNS.updateAuthLink();
      return user;
    }
  }
  
  MNS.user.clearCurrentUser();
  return null;
};

// Image to car name mapping
MNS.imageToCarName = {
  '1998-Maserati-3200-GT-001-2160.jpg': 'Maserati 3200 GT',
  '2018-Jaguar-F-Type-001-2000.jpg': 'Jaguar F-Type',
  '2022-Dodge-Challenger-SRT-Hellcat-Jailbreak-001-2160.jpg': 'Dodge Challenger SRT Hellcat',
  '2022-GMC-Hummer-EV-001-2160.jpg': 'GMC Hummer EV',
  '2023-BMW-i7-001-2160.jpg': 'BMW i7',
  '2023-Cadillac-Escalade-V-005-2160.jpg': 'Cadillac Escalade V',
  '2024-Bentley-Bentayga-S-Black-Edition-001-2160.jpg': 'Bentley Bentayga S',
  '2025-Audi-RS-Q8-Performance-001-2160 (1).jpg': 'Audi RS Q8 Performance',
  '2025-Audi-RS-Q8-Performance-001-2160.jpg': 'Audi RS Q8 Performance',
  '2025-Skoda-110-R-Concept-001-2160.jpg': 'Skoda 110 R Concept',
  '2025-Skoda-110-R-Concept-002-2160.jpg': 'Skoda 110 R Concept',
  '2026-Bugatti-Tourbillon-001-2160.jpg': 'Bugatti Tourbillon'
};

// Car slideshow component
MNS.CarSlideshow = function(container, carName, images, cardElement) {
  this.container = container;
  this.carName = carName;
  this.images = images || [];
  this.currentIndex = 0;
  this.interval = null;
  this.cardElement = cardElement;
  
  this.init();
};

MNS.CarSlideshow.prototype.init = function() {
  if (this.images.length === 0) {
    this.createFallback();
    return;
  }
  
  this.createSlideshow();
  this.startAutoSlide();
  this.addEventListeners();
  this.updateCarName();
};

MNS.CarSlideshow.prototype.createSlideshow = function() {
  this.container.innerHTML = '';
  
  const slideshow = document.createElement('div');
  slideshow.className = 'car-slideshow';
  
  this.images.forEach((image, index) => {
    const slide = document.createElement('div');
    slide.className = `slide ${index === 0 ? 'active' : ''}`;
    
    const img = document.createElement('img');
    img.src = `/images/${image}`;
    img.alt = this.carName;
    img.onerror = () => {
      slide.innerHTML = this.carName;
    };
    
    slide.appendChild(img);
    slideshow.appendChild(slide);
  });
  
  if (this.images.length > 1) {
    const indicators = document.createElement('div');
    indicators.className = 'slideshow-indicators';
    
    this.images.forEach((_, index) => {
      const indicator = document.createElement('div');
      indicator.className = `slideshow-indicator ${index === 0 ? 'active' : ''}`;
      indicator.dataset.index = index;
      indicators.appendChild(indicator);
    });
    
    slideshow.appendChild(indicators);
  }
  
  this.container.appendChild(slideshow);
};

MNS.CarSlideshow.prototype.createFallback = function() {
  this.container.innerHTML = `
    <div class="car-slideshow">
      <div class="slide active">${this.carName}</div>
    </div>
  `;
};

MNS.CarSlideshow.prototype.startAutoSlide = function() {
  if (this.images.length <= 1) return;
  
  this.interval = setInterval(() => {
    this.nextSlide();
  }, 3000);
};

MNS.CarSlideshow.prototype.nextSlide = function() {
  const slides = this.container.querySelectorAll('.slide');
  const indicators = this.container.querySelectorAll('.slideshow-indicator');
  
  slides[this.currentIndex].classList.remove('active');
  if (indicators[this.currentIndex]) {
    indicators[this.currentIndex].classList.remove('active');
  }
  
  this.currentIndex = (this.currentIndex + 1) % this.images.length;
  
  slides[this.currentIndex].classList.add('active');
  if (indicators[this.currentIndex]) {
    indicators[this.currentIndex].classList.add('active');
  }
  
  this.updateCarName();
};

MNS.CarSlideshow.prototype.updateCarName = function() {
  if (!this.cardElement) return;
  
  const currentImage = this.images[this.currentIndex];
  const carName = MNS.imageToCarName[currentImage] || this.carName;
  
  const nameElement = this.cardElement.querySelector('h3');
  if (nameElement && nameElement.textContent !== carName) {
    nameElement.style.opacity = '0.7';
    setTimeout(() => {
      nameElement.textContent = carName;
      nameElement.style.opacity = '1';
    }, 150);
  }
};

MNS.CarSlideshow.prototype.addEventListeners = function() {
  this.container.addEventListener('mouseenter', () => {
    if (this.interval) {
      clearInterval(this.interval);
    }
  });
  
  this.container.addEventListener('mouseleave', () => {
    this.startAutoSlide();
  });
  
  this.container.addEventListener('click', (e) => {
    if (e.target.classList.contains('slideshow-indicator')) {
      const index = parseInt(e.target.dataset.index);
      this.goToSlide(index);
    }
  });
};

MNS.CarSlideshow.prototype.goToSlide = function(index) {
  const slides = this.container.querySelectorAll('.slide');
  const indicators = this.container.querySelectorAll('.slideshow-indicator');
  
  slides[this.currentIndex].classList.remove('active');
  if (indicators[this.currentIndex]) {
    indicators[this.currentIndex].classList.remove('active');
  }
  
  this.currentIndex = index;
  
  slides[this.currentIndex].classList.add('active');
  if (indicators[this.currentIndex]) {
    indicators[this.currentIndex].classList.add('active');
  }
  
  this.updateCarName();
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await MNS.checkSessionAuth();
    MNS.updateAuthLink();
    
    // Ensure page is visible
    document.body.classList.add('page-loaded');
    document.body.classList.remove('page-loading');
  } catch (error) {
    console.error('Initialization error:', error);
    document.body.classList.add('page-loaded');
    document.body.classList.remove('page-loading');
  }
});

// Modern Transparent Navbar Functionality
MNS.navbar = {
  init() {
    this.setupScrollEffect();
    this.setupMobileMenu();
    this.setupActiveLinks();
  },

  setupScrollEffect() {
    const header = document.querySelector('header');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      
      lastScrollY = currentScrollY;
    });
  },

  setupMobileMenu() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileToggle && navMenu) {
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
  },

  setupActiveLinks() {
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
};

// Initialize navbar on page load
document.addEventListener('DOMContentLoaded', () => {
  MNS.navbar.init();
});