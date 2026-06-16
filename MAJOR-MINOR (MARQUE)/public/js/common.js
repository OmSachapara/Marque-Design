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

// User session management
MNS.user = {
  getCurrentUser() {
    const userData = localStorage.getItem('mns_user');
    return userData ? JSON.parse(userData) : null;
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem('mns_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mns_user');
    }
    
    // Update auth link immediately
    MNS.updateAuthLink();
  },

  clearCurrentUser() {
    localStorage.removeItem('mns_user');
    MNS.updateAuthLink();
  },

  async refreshUserFromServer() {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (data.success && data.user) {
        this.setCurrentUser(data.user);
        return data.user;
      } else {
        // Server session expired, clear local data
        this.clearCurrentUser();
        return null;
      }
    } catch (error) {
      console.error('Failed to refresh user from server:', error);
      return this.getCurrentUser(); // Fallback to local storage
    }
  },

  async ensureUser(name, email, phone = null) {
    try {
      // Try to get existing user
      let user = await MNS.api.getUserByEmail(email);
      if (!user) {
        // Create new user
        user = await MNS.api.createUser(name, email, phone);
      }
      this.setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Failed to ensure user:', error);
      throw error;
    }
  }
};

// Legacy data for backward compatibility
MNS.palette = [
  {name:'Black', hex:'#000000'}, {name:'White', hex:'#ffffff'}, {name:'Silver', hex:'#c0c0c0'}, {name:'Gray', hex:'#808080'},
  {name:'Red', hex:'#e63946'}, {name:'Blue', hex:'#1d3557'}, {name:'Navy', hex:'#001f3f'}, {name:'Green', hex:'#2a9d8f'},
  {name:'Yellow', hex:'#f4d35e'}, {name:'Orange', hex:'#e76f51'}, {name:'Purple', hex:'#6a4c93'}, {name:'Teal', hex:'#008080'}
];

MNS.twoToneCombos = [
  ['Black','Red'], ['Black','Blue'], ['Black','White'], ['Black','Silver'],
  ['White','Red'], ['White','Blue'], ['White','Black'], ['White','Purple'],
  ['Gray','Red'], ['Gray','Blue'], ['Gray','Yellow'], ['Gray','Green'],
  ['Silver','Blue'], ['Silver','Teal'], ['Silver','Purple'], ['Silver','Orange'],
  ['Red','Black'], ['Red','White'], ['Red','Gray'], ['Red','Blue'],
  ['Blue','White'], ['Blue','Silver'], ['Blue','Orange'], ['Blue','Yellow']
];

// These will be loaded from the database
MNS.engines = [];
MNS.exhausts = [];
MNS.spoilers = [];
MNS.colors = [];
MNS.fabrics = [];

// Load options from database on page load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    MNS.engines = await MNS.api.getOptions('engine');
    MNS.exhausts = await MNS.api.getOptions('exhaust');
    MNS.spoilers = await MNS.api.getOptions('spoiler');
    MNS.colors = await MNS.api.getOptions('color');
    MNS.fabrics = await MNS.api.getOptions('fabric');
  } catch (error) {
    console.error('Failed to load options from database:', error);
    // Fallback to static data
    MNS.engines = [
      '2.0L Turbo I4','3.0L Twin-Turbo V6','5.0L V8','3.5L Hybrid V6','Electric Single Motor','Electric Dual Motor'
    ];
    MNS.exhausts = [
      'Stock','Sport','Performance','Track','Titanium','Valved'
    ];
    MNS.spoilers = [
      'None','Lip','Ducktail','GT Wing','Adjustable','Carbon Fiber'
    ];
  }
});

// Auth link update function
MNS.updateAuthLink = function() {
  const authLink = document.getElementById('auth-link');
  if (!authLink) return;

  const currentUser = MNS.user.getCurrentUser();
  
  if (currentUser) {
    authLink.innerHTML = `
      <span>Welcome, ${currentUser.name}</span>
      <div class="auth-dropdown" style="display: none; position: absolute; background: var(--card); border: 1px solid var(--border); border-radius: 8px; box-shadow: var(--shadow); z-index: 1000; min-width: 150px; top: 100%; right: 0;">
        <a href="/profile" style="display: block; padding: 10px 15px; color: var(--text); text-decoration: none; border-bottom: 1px solid var(--border);">👤 My Profile</a>
        <a href="/favorites" style="display: block; padding: 10px 15px; color: var(--text); text-decoration: none; border-bottom: 1px solid var(--border);">❤️ My Favorites</a>
        <a href="/checkout" style="display: block; padding: 10px 15px; color: var(--text); text-decoration: none; border-bottom: 1px solid var(--border);">🛒 Checkout</a>
        <a href="#" onclick="MNS.logout(); return false;" style="display: block; padding: 10px 15px; color: #ff6464; text-decoration: none;">🚪 Logout</a>
      </div>
    `;
    authLink.style.position = 'relative';
    
    // Add hover functionality
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
  window.location.href = '/';
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
  this.cardElement = cardElement; // Reference to the card element to update name
  
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
  
  // Set initial car name
  this.updateCarName();
};

MNS.CarSlideshow.prototype.createSlideshow = function() {
  this.container.innerHTML = '';
  
  // Create slideshow container
  const slideshow = document.createElement('div');
  slideshow.className = 'car-slideshow';
  
  // Create slides
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
  
  // Create indicators
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
  }, 3000); // Change slide every 3 seconds
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
  
  // Update car name based on current image
  this.updateCarName();
};

MNS.CarSlideshow.prototype.updateCarName = function() {
  if (!this.cardElement) return;
  
  const currentImage = this.images[this.currentIndex];
  const carName = MNS.imageToCarName[currentImage] || this.carName;
  
  // Find and update the h3 element in the card
  const nameElement = this.cardElement.querySelector('h3');
  if (nameElement && nameElement.textContent !== carName) {
    // Add a subtle animation when name changes
    nameElement.style.opacity = '0.7';
    setTimeout(() => {
      nameElement.textContent = carName;
      nameElement.style.opacity = '1';
    }, 150);
  }
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
  
  // Update car name based on current image
  this.updateCarName();
};

MNS.CarSlideshow.prototype.addEventListeners = function() {
  // Pause on hover
  this.container.addEventListener('mouseenter', () => {
    if (this.interval) {
      clearInterval(this.interval);
    }
  });
  
  // Resume on mouse leave
  this.container.addEventListener('mouseleave', () => {
    this.startAutoSlide();
  });
  
  // Indicator clicks
  this.container.addEventListener('click', (e) => {
    if (e.target.classList.contains('slideshow-indicator')) {
      const index = parseInt(e.target.dataset.index);
      this.goToSlide(index);
    }
  });
};

MNS.CarSlideshow.prototype.destroy = function() {
  if (this.interval) {
    clearInterval(this.interval);
  }
};

// Background slideshow functionality
MNS.BackgroundSlideshow = function() {
  this.images = [
    '1998-Maserati-3200-GT-001-2160.jpg',
    '2018-Jaguar-F-Type-001-2000.jpg',
    '2022-Dodge-Challenger-SRT-Hellcat-Jailbreak-001-2160.jpg',
    '2022-GMC-Hummer-EV-001-2160.jpg',
    '2023-BMW-i7-001-2160.jpg',
    '2023-Cadillac-Escalade-V-005-2160.jpg',
    '2024-Bentley-Bentayga-S-Black-Edition-001-2160.jpg',
    '2025-Audi-RS-Q8-Performance-001-2160.jpg',
    '2025-Skoda-110-R-Concept-001-2160.jpg',
    '2025-Skoda-110-R-Concept-002-2160.jpg',
    '2026-Bugatti-Tourbillon-001-2160.jpg'
  ];
  this.currentIndex = 0;
  this.interval = null;
  this.container = null;
  
  this.init();
};

MNS.BackgroundSlideshow.prototype.init = function() {
  this.createSlideshow();
  this.startSlideshow();
};

MNS.BackgroundSlideshow.prototype.createSlideshow = function() {
  // Create slideshow container
  this.container = document.createElement('div');
  this.container.className = 'background-slideshow';
  
  // Create slides
  this.images.forEach((image, index) => {
    const slide = document.createElement('div');
    slide.className = `background-slide ${index === 0 ? 'active' : ''}`;
    slide.style.backgroundImage = `url('/images/${image}')`;
    this.container.appendChild(slide);
  });
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'background-overlay';
  
  // Insert at the beginning of body
  document.body.insertBefore(this.container, document.body.firstChild);
  document.body.insertBefore(overlay, document.body.firstChild);
};

MNS.BackgroundSlideshow.prototype.startSlideshow = function() {
  this.interval = setInterval(() => {
    this.nextSlide();
  }, 5000); // Change slide every 5 seconds
};

MNS.BackgroundSlideshow.prototype.nextSlide = function() {
  const slides = this.container.querySelectorAll('.background-slide');
  
  slides[this.currentIndex].classList.remove('active');
  this.currentIndex = (this.currentIndex + 1) % this.images.length;
  slides[this.currentIndex].classList.add('active');
};

MNS.BackgroundSlideshow.prototype.destroy = function() {
  if (this.interval) {
    clearInterval(this.interval);
  }
  if (this.container) {
    this.container.remove();
  }
};

// Check session authentication and update auth links
MNS.checkSessionAuth = async function() {
  try {
    const response = await fetch('/api/auth/me');
    const data = await response.json();
    
    if (response.ok && data.success && data.user) {
      // User is authenticated via session, sync with local storage
      MNS.user.setCurrentUser(data.user);
      return data.user;
    } else {
      // Server session expired or invalid, check local storage
      const userData = localStorage.getItem('mns_user');
      if (userData) {
        const user = JSON.parse(userData);
        // Try to refresh from server one more time
        const refreshedUser = await MNS.user.refreshUserFromServer();
        return refreshedUser || user;
      }
    }
  } catch (error) {
    console.error('Session auth check failed:', error);
    // Fallback to local storage
    const userData = localStorage.getItem('mns_user');
    if (userData) {
      const user = JSON.parse(userData);
      MNS.updateAuthLink();
      return user;
    }
  }
  
  // No authentication found, clear everything
  MNS.user.clearCurrentUser();
  return null;
};

// Enhanced logout function for session-based auth
MNS.logout = function() {
  // Clear local storage
  MNS.user.clearCurrentUser();
  
  // Clear server session
  fetch('/api/auth/logout', { method: 'POST' })
    .then(() => {
      window.location.href = '/';
    })
    .catch(() => {
      // Fallback: just redirect to home
      window.location.href = '/';
    });
};

// Periodic user data sync
MNS.startUserSync = function() {
  // Sync user data every 30 seconds if user is logged in
  setInterval(async () => {
    const currentUser = MNS.user.getCurrentUser();
    if (currentUser) {
      await MNS.user.refreshUserFromServer();
    }
  }, 30000); // 30 seconds
};

// Initialize background slideshow on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Check session authentication first
  await MNS.checkSessionAuth();
  
  // Then update auth links
  MNS.updateAuthLink();
  
  // Start periodic user sync
  MNS.startUserSync();
  
  // Initialize background slideshow
  if (!window.backgroundSlideshow) {
    window.backgroundSlideshow = new MNS.BackgroundSlideshow();
  }
});

// Page transition overlay + link interception
(function(){
  // Toggle page transitions globally (off to avoid blocking clicks)
  const ENABLE_TRANSITIONS = false;

  // If page load is a reload and not on home, redirect to home
  try {
    const nav = performance.getEntriesByType && performance.getEntriesByType('navigation');
    const isReload = nav && nav[0] ? nav[0].type === 'reload' : (performance.navigation && performance.navigation.type === 1);
    if (isReload && location.pathname !== '/') {
      location.replace('/');
      return; // stop further init
    }
  } catch (_) {}
  function ensureOverlay(){
    let overlay = document.querySelector('.page-transition');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.className = 'page-transition';
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  function activateTransition(href){
    const overlay = ensureOverlay();
    overlay.classList.add('active');
    setTimeout(() => { window.location.href = href; }, 200);
  }

  window.addEventListener('load', () => {
    const overlay = ensureOverlay();
    requestAnimationFrame(() => overlay.classList.remove('active'));
  });

  // Intercept only primary navigation and card links to avoid breaking buttons/forms
  document.addEventListener('click', (e) => {
    if (!ENABLE_TRANSITIONS) return; // do not intercept when disabled
    if (e.defaultPrevented) return;
    const a = e.target.closest('a');
    if(!a) return;
    const href = a.getAttribute('href');
    if(!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    if(a.hasAttribute('target') || a.dataset.noTransition === 'true') return;
    // external links bypass
    if(/^https?:\/\//i.test(href) && !href.includes(window.location.host)) return;
    // scope interception to header nav and card links only
    const inHeaderNav = !!a.closest('header');
    const isCardLink = a.closest('.card') !== null;
    if(!inHeaderNav && !isCardLink) return;
    e.preventDefault();
    activateTransition(href);
  });
})();
