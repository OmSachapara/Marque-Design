// Admin Panel JavaScript
class AdminPanel {
  constructor() {
    this.isLoggedIn = false;
    this.currentSection = 'dashboard';
    this.data = {
      cars: [],
      users: [],
      orders: [],
      options: [],
      favorites: [],
      profiles: []
    };
    this.init();
  }

  init() {
    // Check if already logged in
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      this.showAdminPanel();
    }

    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Admin logout
    document.getElementById('admin-logout').addEventListener('click', (e) => {
      e.preventDefault();
      this.logout();
    });

    // Enter key for password
    document.getElementById('admin-password').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.login();
      }
    });

    // Form submissions
    document.getElementById('car-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveCar();
    });

    document.getElementById('option-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveOption();
    });
  }

  async login() {
    const password = document.getElementById('admin-password').value;
    const errorDiv = document.getElementById('login-error');

    if (!password) {
      this.showError(errorDiv, 'Please enter the admin password');
      return;
    }

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('admin_token', data.token);
        this.showAdminPanel();
        this.loadDashboardStats();
      } else {
        this.showError(errorDiv, data.error || 'Invalid password');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError(errorDiv, 'Login failed. Please try again.');
    }
  }

  logout() {
    localStorage.removeItem('admin_token');
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('admin-password').value = '';
    this.isLoggedIn = false;
  }

  showAdminPanel() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    this.isLoggedIn = true;
    this.loadDashboardStats();
    this.loadDashboardData();
  }

  showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }

  showSuccess(element, message) {
    element.innerHTML = `<div class="success-message">${message}</div>`;
    setTimeout(() => {
      element.innerHTML = '';
    }, 3000);
  }

  async loadDashboardStats() {
    try {
      // Load all data for statistics
      const [cars, users, orders, favorites, profiles] = await Promise.all([
        fetch('/api/cars').then(r => r.json()).catch(() => []),
        fetch('/api/admin/users').then(r => r.json()).catch(() => []),
        fetch('/api/admin/orders').then(r => r.json()).catch(() => []),
        fetch('/api/admin/favorites').then(r => r.json()).catch(() => []),
        fetch('/api/admin/profiles').then(r => r.json()).catch(() => [])
      ]);

      // Count all options
      const optionTypes = ['engine', 'exhaust', 'spoiler', 'fabric'];
      let totalOptions = 0;
      for (const type of optionTypes) {
        try {
          const options = await fetch(`/api/options/${type}`).then(r => r.json());
          totalOptions += options.length;
        } catch (error) {
          console.error(`Error loading ${type} options:`, error);
        }
      }

      // Update statistics
      document.getElementById('total-cars').textContent = cars.length || 0;
      document.getElementById('total-users').textContent = users.length || 0;
      document.getElementById('total-orders').textContent = orders.length || 0;
      document.getElementById('total-options').textContent = totalOptions || 0;
      document.getElementById('total-favorites').textContent = favorites.length || 0;
      document.getElementById('total-profiles').textContent = profiles.length || 0;

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  }

  showSection(sectionName, clickedElement = null) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
      section.classList.remove('active');
    });

    // Remove active class from all tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.classList.remove('active');
    });

    // Show selected section
    document.getElementById(`${sectionName}-section`).classList.add('active');
    
    // Add active class to clicked tab
    if (clickedElement) {
      clickedElement.classList.add('active');
    } else {
      // Find the tab by section name and add active class
      const tabs = document.querySelectorAll('.admin-tab');
      tabs.forEach(tab => {
        if (tab.textContent.toLowerCase().includes(sectionName)) {
          tab.classList.add('active');
        }
      });
    }

    this.currentSection = sectionName;

    // Load data for the section
    switch (sectionName) {
      case 'cars':
        this.loadCars();
        break;
      case 'users':
        this.loadUsers();
        break;
      case 'orders':
        this.loadOrders();
        break;
      case 'options':
        this.loadOptions();
        break;
      case 'favorites':
        this.loadFavorites();
        break;
      case 'profiles':
        this.loadProfiles();
        break;
      case 'dashboard':
        this.loadDashboardStats();
        this.loadDashboardData();
        break;
    }
  }

  async loadCars() {
    const contentDiv = document.getElementById('cars-content');
    contentDiv.innerHTML = '<div class="loading">Loading cars...</div>';

    try {
      const response = await fetch('/api/cars');
      const cars = await response.json();
      this.data.cars = cars;

      if (cars.length === 0) {
        contentDiv.innerHTML = '<p style="text-align: center; color: var(--muted); padding: 40px;">No cars found.</p>';
        return;
      }

      const tableHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${cars.map(car => `
              <tr>
                <td><img src="/images/${car.image}" alt="${car.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA2MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjBmMGYwIi8+CjxwYXRoIGQ9Ik0yMCAyMEwzMCAyNUwyMCAzMFYyMFoiIGZpbGw9IiNjY2MiLz4KPC9zdmc+'"></td>
                <td><strong>${car.name}</strong></td>
                <td><span style="background: var(--accent); color: var(--brand); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${car.category}</span></td>
                <td><strong>$${car.base_price?.toLocaleString() || 'N/A'}</strong></td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${car.description}</td>
                <td>
                  <button class="btn-edit" onclick="admin.editCar('${car._id}')">✏️ Edit</button>
                  <button class="btn-danger" onclick="admin.deleteCar('${car._id}', '${car.name}')">🗑️ Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      contentDiv.innerHTML = tableHTML;
    } catch (error) {
      console.error('Error loading cars:', error);
      contentDiv.innerHTML = '<div class="error-message">Failed to load cars. Please try again.</div>';
    }
  }

  async loadUsers() {
    const contentDiv = document.getElementById('users-content');
    contentDiv.innerHTML = '<div class="loading">Loading users...</div>';

    try {
      const response = await fetch('/api/admin/users');
      const users = await response.json();
      this.data.users = users;

      if (users.length === 0) {
        contentDiv.innerHTML = '<p style="text-align: center; color: var(--muted); padding: 40px;">No users found.</p>';
        return;
      }

      const tableHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Verified</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr>
                <td><strong>${user.name}</strong></td>
                <td>${user.email}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>
                  <span class="status-badge ${user.emailVerified ? 'status-confirmed' : 'status-pending'}">
                    ${user.emailVerified ? '✅ Verified' : '⏳ Pending'}
                  </span>
                </td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <button class="btn-edit" onclick="admin.viewUser('${user._id}')">👁️ View</button>
                  <button class="btn-danger" onclick="admin.deleteUser('${user._id}', '${user.name}')">🗑️ Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      contentDiv.innerHTML = tableHTML;
    } catch (error) {
      console.error('Error loading users:', error);
      contentDiv.innerHTML = '<div class="error-message">Failed to load users. Please try again.</div>';
    }
  }

  async loadOrders() {
    const contentDiv = document.getElementById('orders-content');
    contentDiv.innerHTML = '<div class="loading">Loading orders...</div>';

    try {
      const response = await fetch('/api/admin/orders');
      const orders = await response.json();
      this.data.orders = orders;

      if (orders.length === 0) {
        contentDiv.innerHTML = '<p style="text-align: center; color: var(--muted); padding: 40px;">No orders found.</p>';
        return;
      }

      const tableHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Car</th>
              <th>Total Price</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(order => `
              <tr>
                <td><strong>#${order._id.slice(-6).toUpperCase()}</strong></td>
                <td>
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <strong>${order.user_id ? `${order.user_id.firstName || ''} ${order.user_id.lastName || ''}`.trim() || order.user_id.name || 'Unknown User' : 'Unknown User'}</strong>
                    <small style="color: var(--muted);">${order.user_id?.email || 'N/A'}</small>
                    <small style="color: var(--accent); font-weight: 600;">ID: ${order.user_id?._id ? `#${order.user_id._id.slice(-6).toUpperCase()}` : 'N/A'}</small>
                  </div>
                </td>
                <td>${order.car_id?.name || order.configuration?.carName || 'Unknown Car'}</td>
                <td><strong>$${order.configuration?.totalPrice?.toLocaleString() || 'N/A'}</strong></td>
                <td>
                  <select onchange="admin.updateOrderStatus('${order._id}', this.value)" class="status-badge status-${order.status}">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                  </select>
                </td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                  <button class="btn-edit" onclick="admin.viewOrder('${order._id}')">👁️ View</button>
                  <button class="btn-danger" onclick="admin.deleteOrder('${order._id}')">🗑️ Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      contentDiv.innerHTML = tableHTML;
    } catch (error) {
      console.error('Error loading orders:', error);
      contentDiv.innerHTML = '<div class="error-message">Failed to load orders. Please try again.</div>';
    }
  }

  async loadOptions() {
    const contentDiv = document.getElementById('options-content');
    contentDiv.innerHTML = '<div class="loading">Loading car options...</div>';

    try {
      // Load all option types
      const optionTypes = ['engine', 'exhaust', 'spoiler', 'fabric'];
      const allOptions = [];

      for (const type of optionTypes) {
        const response = await fetch(`/api/options/${type}`);
        const options = await response.json();
        allOptions.push(...options.map(opt => ({ ...opt, option_type: type })));
      }

      this.data.options = allOptions;

      if (allOptions.length === 0) {
        contentDiv.innerHTML = '<p style="text-align: center; color: var(--muted); padding: 40px;">No car options found.</p>';
        return;
      }

      const tableHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>Price</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${allOptions.map(option => `
              <tr>
                <td><span style="background: var(--accent); color: var(--brand); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; text-transform: uppercase;">${option.option_type}</span></td>
                <td><strong>${option.name}</strong></td>
                <td><strong>$${option.price?.toLocaleString() || 'N/A'}</strong></td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${option.description || 'No description'}</td>
                <td>
                  <button class="btn-edit" onclick="admin.editOption('${option._id}')">✏️ Edit</button>
                  <button class="btn-danger" onclick="admin.deleteOption('${option._id}', '${option.name}')">🗑️ Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      contentDiv.innerHTML = tableHTML;
    } catch (error) {
      console.error('Error loading options:', error);
      contentDiv.innerHTML = '<div class="error-message">Failed to load car options. Please try again.</div>';
    }
  }

  async loadFavorites() {
    const contentDiv = document.getElementById('favorites-content');
    contentDiv.innerHTML = '<div class="loading">Loading favorites...</div>';

    try {
      const response = await fetch('/api/admin/favorites');
      const favorites = await response.json();
      this.data.favorites = favorites;

      if (favorites.length === 0) {
        contentDiv.innerHTML = '<p style="text-align: center; color: var(--muted); padding: 40px;">No favorites found.</p>';
        return;
      }

      const tableHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Car</th>
              <th>Configuration</th>
              <th>Total Price</th>
              <th>Date Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${favorites.map(fav => `
              <tr>
                <td>
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <strong>${fav.user_id?.firstName || ''} ${fav.user_id?.lastName || ''} ${fav.user_id?.name || 'Unknown User'}</strong>
                    <small style="color: var(--muted);">${fav.user_id?.email || 'N/A'}</small>
                  </div>
                </td>
                <td><strong>${fav.car_id?.name || 'Unknown Car'}</strong></td>
                <td style="max-width: 200px;">
                  ${fav.configuration?.engine ? `Engine: ${fav.configuration.engine}<br>` : ''}
                  ${fav.configuration?.exhaust ? `Exhaust: ${fav.configuration.exhaust}<br>` : ''}
                  ${fav.configuration?.spoiler ? `Spoiler: ${fav.configuration.spoiler}<br>` : ''}
                  ${fav.configuration?.fabric ? `Fabric: ${fav.configuration.fabric}` : ''}
                </td>
                <td><strong>$${fav.configuration?.totalPrice?.toLocaleString() || 'N/A'}</strong></td>
                <td>${new Date(fav.createdAt).toLocaleDateString()}</td>
                <td>
                  <button class="btn-danger" onclick="admin.deleteFavorite('${fav._id}')">🗑️ Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      contentDiv.innerHTML = tableHTML;
    } catch (error) {
      console.error('Error loading favorites:', error);
      contentDiv.innerHTML = '<div class="error-message">Failed to load favorites. Please try again.</div>';
    }
  }

  async deleteFavorite(favoriteId) {
    if (!confirm('Are you sure you want to delete this favorite?')) return;

    try {
      const response = await fetch(`/api/favorites/${favoriteId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Favorite deleted successfully!');
        this.loadFavorites();
        this.loadDashboardStats();
      } else {
        alert('Failed to delete favorite');
      }
    } catch (error) {
      console.error('Error deleting favorite:', error);
      alert('Failed to delete favorite');
    }
  }

  async loadProfiles() {
    const contentDiv = document.getElementById('profiles-content');
    contentDiv.innerHTML = '<div class="loading">Loading user profiles...</div>';

    try {
      const response = await fetch('/api/admin/profiles');
      const profiles = await response.json();
      this.data.profiles = profiles;

      if (profiles.length === 0) {
        contentDiv.innerHTML = '<p style="text-align: center; color: var(--muted); padding: 40px;">No user profiles found.</p>';
        return;
      }

      const tableHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Date of Birth</th>
              <th>Gender</th>
              <th>Location</th>
              <th>Preferences</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            ${profiles.map(profile => `
              <tr>
                <td><strong>${profile.userId?.firstName || ''} ${profile.userId?.lastName || ''} ${profile.userId?.name || 'Unknown User'}</strong></td>
                <td>${profile.userId?.email || 'N/A'}</td>
                <td>${profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
                <td>${profile.gender || 'N/A'}</td>
                <td>${profile.address?.city ? `${profile.address.city}, ${profile.address.state || ''}` : 'N/A'}</td>
                <td style="max-width: 200px;">
                  ${profile.preferences?.favoriteCarTypes?.length > 0 ? `Favorites: ${profile.preferences.favoriteCarTypes.join(', ')}` : 'No preferences set'}
                </td>
                <td>${new Date(profile.createdAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      contentDiv.innerHTML = tableHTML;
    } catch (error) {
      console.error('Error loading profiles:', error);
      contentDiv.innerHTML = '<div class="error-message">Failed to load user profiles. Please try again.</div>';
    }
  }

  // Car Management
  showAddCarModal() {
    document.getElementById('car-modal-title').textContent = 'Add New Car';
    document.getElementById('car-form').reset();
    document.getElementById('car-id').value = '';
    this.resetImagePreview();
    document.getElementById('car-modal').style.display = 'block';
  }

  async editCar(carId) {
    const car = this.data.cars.find(c => c._id === carId);
    if (!car) return;

    document.getElementById('car-modal-title').textContent = 'Edit Car';
    document.getElementById('car-id').value = car._id;
    document.getElementById('car-name').value = car.name;
    document.getElementById('car-category').value = car.category;
    document.getElementById('car-description').value = car.description;
    document.getElementById('car-price').value = car.base_price;
    document.getElementById('car-image').value = car.image;
    
    // Show existing image preview
    if (car.image) {
      this.showImagePreview(`/images/${car.image}`, car.image, 'Existing image');
    } else {
      this.resetImagePreview();
    }
    
    document.getElementById('car-modal').style.display = 'block';
  }

  async saveCar() {
    const carId = document.getElementById('car-id').value;
    const carData = {
      name: document.getElementById('car-name').value,
      category: document.getElementById('car-category').value,
      description: document.getElementById('car-description').value,
      base_price: parseInt(document.getElementById('car-price').value),
      image: document.getElementById('car-image').value
    };

    // Validation
    if (!carData.name || !carData.category || !carData.description || !carData.base_price) {
      alert('Please fill in all required fields');
      return;
    }

    if (!carData.image) {
      alert('Please upload an image for the car');
      return;
    }

    try {
      const url = carId ? `/api/admin/cars/${carId}` : '/api/admin/cars';
      const method = carId ? 'PUT' : 'POST';

      console.log('Saving car:', carData);
      console.log('URL:', url, 'Method:', method);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carData)
      });

      const result = await response.json();
      console.log('Response:', result);

      if (response.ok) {
        alert(carId ? 'Car updated successfully!' : 'Car added successfully!');
        this.closeModal('car-modal');
        this.loadCars();
        this.loadDashboardStats();
      } else {
        alert(`Failed to save car: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving car:', error);
      alert(`Failed to save car: ${error.message}`);
    }
  }

  async deleteCar(carId, carName) {
    if (!confirm(`Are you sure you want to delete "${carName}"?`)) return;

    try {
      const response = await fetch(`/api/admin/cars/${carId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        this.loadCars();
        this.loadDashboardStats();
      } else {
        alert('Failed to delete car');
      }
    } catch (error) {
      console.error('Error deleting car:', error);
      alert('Failed to delete car');
    }
  }

  // Option Management
  showAddOptionModal() {
    document.getElementById('option-modal-title').textContent = 'Add New Car Option';
    document.getElementById('option-form').reset();
    document.getElementById('option-id').value = '';
    
    // Populate car dropdown
    const carSelect = document.getElementById('option-car');
    carSelect.innerHTML = '<option value="">All Cars</option>';
    this.data.cars.forEach(car => {
      carSelect.innerHTML += `<option value="${car._id}">${car.name}</option>`;
    });
    
    document.getElementById('option-modal').style.display = 'block';
  }

  async editOption(optionId) {
    const option = this.data.options.find(o => o._id === optionId);
    if (!option) return;

    document.getElementById('option-modal-title').textContent = 'Edit Car Option';
    document.getElementById('option-id').value = option._id;
    document.getElementById('option-type').value = option.option_type;
    document.getElementById('option-name').value = option.name;
    document.getElementById('option-price').value = option.price;
    document.getElementById('option-description').value = option.description || '';
    
    // Populate car dropdown
    const carSelect = document.getElementById('option-car');
    carSelect.innerHTML = '<option value="">All Cars</option>';
    this.data.cars.forEach(car => {
      carSelect.innerHTML += `<option value="${car._id}" ${option.car_id === car._id ? 'selected' : ''}>${car.name}</option>`;
    });
    
    document.getElementById('option-modal').style.display = 'block';
  }

  async saveOption() {
    const optionId = document.getElementById('option-id').value;
    const optionData = {
      option_type: document.getElementById('option-type').value,
      name: document.getElementById('option-name').value,
      price: parseInt(document.getElementById('option-price').value),
      description: document.getElementById('option-description').value,
      car_id: document.getElementById('option-car').value || null
    };

    // Validation
    if (!optionData.option_type || !optionData.name || !optionData.price) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const url = optionId ? `/api/admin/options/${optionId}` : '/api/admin/options';
      const method = optionId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optionData)
      });

      if (response.ok) {
        alert(optionId ? 'Option updated successfully!' : 'Option added successfully!');
        this.closeModal('option-modal');
        this.loadOptions();
        this.loadDashboardStats();
      } else {
        const result = await response.json();
        alert(`Failed to save option: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving option:', error);
      alert('Failed to save option');
    }
  }

  async deleteOption(optionId, optionName) {
    if (!confirm(`Are you sure you want to delete "${optionName}"?`)) return;

    try {
      const response = await fetch(`/api/admin/options/${optionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Option deleted successfully!');
        this.loadOptions();
        this.loadDashboardStats();
      } else {
        alert('Failed to delete option');
      }
    } catch (error) {
      console.error('Error deleting option:', error);
      alert('Failed to delete option');
    }
  }

  // Order Management
  async updateOrderStatus(orderId, newStatus) {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert('Order status updated successfully!');
      } else {
        alert('Failed to update order status');
        this.loadOrders(); // Reload to reset the dropdown
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  }

  async viewOrder(orderId) {
    const order = this.data.orders.find(o => o._id === orderId);
    if (!order) return;

    const user = order.user_id || {};
    const car = order.car_id || {};
    const config = order.configuration || {};

    const orderDetails = `
      <div style="color: var(--text);">
        <h3 style="color: var(--accent); margin-bottom: 20px;">Order Details</h3>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text); margin-bottom: 10px;">Order Information</h4>
          <p><strong>Order ID:</strong> #${order._id.slice(-6).toUpperCase()}</p>
          <p><strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status.toUpperCase()}</span></p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Total Price:</strong> $${config.totalPrice?.toLocaleString() || 'N/A'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text); margin-bottom: 10px;">Customer Information</h4>
          <p><strong>Name:</strong> ${user.firstName || ''} ${user.lastName || ''} ${user.name || 'Unknown User'}</p>
          <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
          <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text); margin-bottom: 10px;">Car Configuration</h4>
          <p><strong>Car:</strong> ${config.carName || car.name || 'Custom Build'}</p>
          <p><strong>Category:</strong> ${config.carCategory || car.category || 'N/A'}</p>
          <p><strong>Base Price:</strong> $${config.basePrice?.toLocaleString() || car.base_price?.toLocaleString() || 'N/A'}</p>
        </div>

        ${config.summary && config.summary.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h4 style="color: var(--text); margin-bottom: 10px;">Customizations</h4>
            <ul style="list-style: none; padding: 0;">
              ${config.summary.map(item => `
                <li style="padding: 8px; background: var(--bg); margin-bottom: 5px; border-radius: 6px;">
                  <strong>${item.category}:</strong> ${item.name} - $${item.price?.toLocaleString() || '0'}
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;

    // Create a temporary modal for viewing order details
    const existingModal = document.getElementById('view-order-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modalHTML = `
      <div id="view-order-modal" class="modal" style="display: block;">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Order Details</h3>
            <span class="close" onclick="document.getElementById('view-order-modal').remove()">&times;</span>
          </div>
          ${orderDetails}
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 30px;">
            <button class="btn-secondary" onclick="document.getElementById('view-order-modal').remove()">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  async deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Order deleted successfully!');
        this.loadOrders();
        this.loadDashboardStats();
      } else {
        alert('Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    }
  }

  // User Management
  async viewUser(userId) {
    const user = this.data.users.find(u => u._id === userId);
    if (!user) return;

    const userDetails = `
      <div style="color: var(--text);">
        <h3 style="color: var(--accent); margin-bottom: 20px;">User Details</h3>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text); margin-bottom: 10px;">Personal Information</h4>
          <p><strong>User ID:</strong> #${user._id.slice(-6).toUpperCase()}</p>
          <p><strong>Name:</strong> ${user.firstName || ''} ${user.lastName || ''} ${user.name || 'N/A'}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
          <p><strong>Email Verified:</strong> ${user.emailVerified || user.isEmailVerified ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Phone Verified:</strong> ${user.phoneVerified ? '✅ Yes' : '❌ No'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text); margin-bottom: 10px;">Account Information</h4>
          <p><strong>Account Status:</strong> ${user.isActive ? '✅ Active' : '❌ Inactive'}</p>
          <p><strong>Registration Date:</strong> ${new Date(user.createdAt).toLocaleString()}</p>
          <p><strong>Last Updated:</strong> ${user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A'}</p>
          ${user.googleId ? '<p><strong>Google Account:</strong> ✅ Connected</p>' : ''}
          ${user.appleId ? '<p><strong>Apple Account:</strong> ✅ Connected</p>' : ''}
        </div>

        ${user.dateOfBirth || user.gender ? `
          <div style="margin-bottom: 20px;">
            <h4 style="color: var(--text); margin-bottom: 10px;">Additional Information</h4>
            ${user.dateOfBirth ? `<p><strong>Date of Birth:</strong> ${new Date(user.dateOfBirth).toLocaleDateString()}</p>` : ''}
            ${user.gender ? `<p><strong>Gender:</strong> ${user.gender}</p>` : ''}
          </div>
        ` : ''}
      </div>
    `;

    // Create a temporary modal for viewing user details
    const existingModal = document.getElementById('view-user-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modalHTML = `
      <div id="view-user-modal" class="modal" style="display: block;">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">User Details</h3>
            <span class="close" onclick="document.getElementById('view-user-modal').remove()">&times;</span>
          </div>
          ${userDetails}
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 30px;">
            <button class="btn-secondary" onclick="document.getElementById('view-user-modal').remove()">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  async deleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This will also delete all their orders, favorites, and profile data. This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('User deleted successfully!');
        this.loadUsers();
        this.loadDashboardStats();
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  }

  // Search Functions
  searchCars() {
    const searchTerm = document.getElementById('cars-search').value.toLowerCase();
    const rows = document.querySelectorAll('#cars-content table tbody tr');
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  }

  searchUsers() {
    const searchTerm = document.getElementById('users-search').value.toLowerCase();
    const rows = document.querySelectorAll('#users-content table tbody tr');
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  }

  searchOrders() {
    const searchTerm = document.getElementById('orders-search').value.toLowerCase();
    const rows = document.querySelectorAll('#orders-content table tbody tr');
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  }

  searchOptions() {
    const searchTerm = document.getElementById('options-search').value.toLowerCase();
    const rows = document.querySelectorAll('#options-content table tbody tr');
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  }

  searchFavorites() {
    const searchTerm = document.getElementById('favorites-search').value.toLowerCase();
    const rows = document.querySelectorAll('#favorites-content table tbody tr');
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  }

  searchProfiles() {
    const searchTerm = document.getElementById('profiles-search').value.toLowerCase();
    const rows = document.querySelectorAll('#profiles-content table tbody tr');
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  }

  // Image Upload Functions
  async handleImageUpload(fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or WebP)');
      fileInput.value = '';
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Image file is too large. Please select an image smaller than 5MB.');
      fileInput.value = '';
      return;
    }

    // Show loading state
    const previewDiv = document.getElementById('image-preview');
    previewDiv.style.display = 'block';
    previewDiv.innerHTML = '<p style="color: var(--muted);">📤 Uploading image...</p>';

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        // Set the hidden input value to the uploaded filename
        document.getElementById('car-image').value = result.filename;
        
        // Show preview
        this.showImagePreview(result.url, result.filename, `${result.originalName} (${this.formatFileSize(result.size)})`);
      } else {
        alert(`Upload failed: ${result.error}`);
        this.resetImagePreview();
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
      this.resetImagePreview();
      fileInput.value = '';
    }
  }

  showImagePreview(imageUrl, filename, info) {
    const previewDiv = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const imageInfo = document.getElementById('image-info');

    previewImg.src = imageUrl;
    previewImg.alt = filename;
    imageInfo.textContent = info;
    previewDiv.style.display = 'block';
  }

  resetImagePreview() {
    const previewDiv = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const imageInfo = document.getElementById('image-info');
    const fileInput = document.getElementById('car-image-file');

    previewDiv.style.display = 'none';
    previewImg.src = '';
    imageInfo.textContent = '';
    fileInput.value = '';
    document.getElementById('car-image').value = '';
  }

  async removeImage() {
    const filename = document.getElementById('car-image').value;
    
    if (filename && confirm('Are you sure you want to remove this image?')) {
      try {
        // Only delete if it's a newly uploaded image (not an existing one being edited)
        const carId = document.getElementById('car-id').value;
        if (!carId) {
          // This is a new car, so we can delete the uploaded image
          await fetch(`/api/admin/delete-image/${filename}`, {
            method: 'DELETE'
          });
        }
        
        this.resetImagePreview();
      } catch (error) {
        console.error('Error removing image:', error);
      }
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Utility Functions
  closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    
    // Reset image preview when closing car modal
    if (modalId === 'car-modal') {
      this.resetImagePreview();
    }
  }

  refreshDashboard() {
    this.loadDashboardStats();
    this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      // Load all data
      const [cars, users, orders] = await Promise.all([
        fetch('/api/cars').then(r => r.json()).catch(() => []),
        fetch('/api/admin/users').then(r => r.json()).catch(() => []),
        fetch('/api/admin/orders').then(r => r.json()).catch(() => [])
      ]);

      // Calculate today's sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });
      const todaySales = todayOrders.reduce((sum, order) => sum + (order.configuration?.totalPrice || 0), 0);

      // Calculate monthly revenue
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      });
      const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + (order.configuration?.totalPrice || 0), 0);

      // Count orders by status
      const newOrders = orders.filter(o => o.status === 'pending').length;
      const pendingOrders = orders.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.status)).length;
      const completedOrders = orders.filter(o => o.status === 'delivered').length;

      // Count new registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newRegistrations = users.filter(user => new Date(user.createdAt) >= thirtyDaysAgo).length;

      // Update dashboard stats
      document.getElementById('today-sales').textContent = `$${todaySales.toLocaleString()}`;
      document.getElementById('total-orders-dash').textContent = orders.length;
      document.getElementById('monthly-revenue').textContent = `$${monthlyRevenue.toLocaleString()}`;
      document.getElementById('new-orders').textContent = newOrders;
      document.getElementById('pending-orders').textContent = pendingOrders;
      document.getElementById('completed-orders').textContent = completedOrders;
      document.getElementById('total-products').textContent = cars.length;
      document.getElementById('total-users-dash').textContent = users.length;
      document.getElementById('new-registrations').textContent = newRegistrations;

      // Low stock and best selling (placeholder for now)
      document.getElementById('low-stock').textContent = '0';
      document.getElementById('best-selling').textContent = cars.length > 0 ? '1' : '0';

      // Load notifications
      this.loadNotifications(orders, users);

      // Load recent activity
      this.loadRecentActivity(orders, users, cars);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  loadNotifications(orders, users) {
    const notificationsContainer = document.getElementById('notifications-container');
    const notifications = [];

    // Check for new orders
    const newOrders = orders.filter(o => o.status === 'pending');
    if (newOrders.length > 0) {
      notifications.push({
        icon: '🆕',
        type: 'info',
        title: 'New Orders',
        message: `You have ${newOrders.length} new order${newOrders.length > 1 ? 's' : ''} waiting for confirmation.`,
        color: '#ffa502'
      });
    }

    // Check for pending orders
    const pendingOrders = orders.filter(o => ['confirmed', 'processing'].includes(o.status));
    if (pendingOrders.length > 0) {
      notifications.push({
        icon: '⏳',
        type: 'warning',
        title: 'Pending Orders',
        message: `${pendingOrders.length} order${pendingOrders.length > 1 ? 's are' : ' is'} currently being processed.`,
        color: '#3742fa'
      });
    }

    // Check for new users (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const newUsers = users.filter(user => new Date(user.createdAt) >= yesterday);
    if (newUsers.length > 0) {
      notifications.push({
        icon: '🎉',
        type: 'success',
        title: 'New Users',
        message: `${newUsers.length} new user${newUsers.length > 1 ? 's' : ''} registered in the last 24 hours.`,
        color: '#2ed573'
      });
    }

    // Low stock alert (placeholder)
    notifications.push({
      icon: '✅',
      type: 'success',
      title: 'Stock Status',
      message: 'All products are in stock.',
      color: '#2ed573'
    });

    if (notifications.length === 0) {
      notificationsContainer.innerHTML = `
        <div style="text-align: center; color: var(--muted); padding: 20px;">
          <div style="font-size: 3rem; margin-bottom: 10px;">🔕</div>
          <p>No new notifications</p>
        </div>
      `;
    } else {
      notificationsContainer.innerHTML = notifications.map(notif => `
        <div style="
          padding: 15px;
          margin-bottom: 10px;
          background: var(--card);
          border-left: 4px solid ${notif.color};
          border-radius: 8px;
          display: flex;
          align-items: start;
          gap: 15px;
        ">
          <div style="font-size: 2rem;">${notif.icon}</div>
          <div style="flex: 1;">
            <h4 style="color: var(--text); margin: 0 0 5px 0; font-size: 1rem;">${notif.title}</h4>
            <p style="color: var(--muted); margin: 0; font-size: 0.9rem;">${notif.message}</p>
          </div>
        </div>
      `).join('');
    }
  }

  loadRecentActivity(orders, users, cars) {
    const recentActivityContainer = document.getElementById('recent-activity');
    const activities = [];

    // Get recent orders (last 10)
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    recentOrders.forEach(order => {
      const user = order.user_id || {};
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Unknown User';
      activities.push({
        icon: '📦',
        type: 'order',
        title: 'New Order',
        description: `${userName} placed an order for ${order.configuration?.carName || 'a car'}`,
        time: this.getTimeAgo(order.createdAt),
        color: '#3742fa'
      });
    });

    // Get recent users (last 5)
    const recentUsers = users
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);

    recentUsers.forEach(user => {
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'New User';
      activities.push({
        icon: '👤',
        type: 'user',
        title: 'New Registration',
        description: `${userName} joined the platform`,
        time: this.getTimeAgo(user.createdAt),
        color: '#2ed573'
      });
    });

    // Sort all activities by time
    activities.sort((a, b) => {
      // This is a simple sort, in production you'd want to sort by actual timestamp
      return 0;
    });

    if (activities.length === 0) {
      recentActivityContainer.innerHTML = `
        <div style="text-align: center; color: var(--muted); padding: 20px;">
          <div style="font-size: 3rem; margin-bottom: 10px;">📭</div>
          <p>No recent activity</p>
        </div>
      `;
    } else {
      recentActivityContainer.innerHTML = activities.slice(0, 10).map(activity => `
        <div style="
          padding: 15px;
          margin-bottom: 10px;
          background: var(--card);
          border-left: 4px solid ${activity.color};
          border-radius: 8px;
          display: flex;
          align-items: start;
          gap: 15px;
        ">
          <div style="font-size: 2rem;">${activity.icon}</div>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 5px;">
              <h4 style="color: var(--text); margin: 0; font-size: 1rem;">${activity.title}</h4>
              <span style="color: var(--muted); font-size: 0.8rem;">${activity.time}</span>
            </div>
            <p style="color: var(--muted); margin: 0; font-size: 0.9rem;">${activity.description}</p>
          </div>
        </div>
      `).join('');
    }
  }

  getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }
}

// Global admin instance
let admin;

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  admin = new AdminPanel();
});

// Global functions for HTML onclick events
function adminLogin() {
  admin.login();
}

// Close modals when clicking outside
window.onclick = function(event) {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}