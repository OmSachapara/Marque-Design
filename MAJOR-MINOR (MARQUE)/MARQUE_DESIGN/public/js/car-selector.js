// Car Selector for Customization Page
class CarSelector {
    constructor() {
        this.cars = [];
        this.selectedCar = null;
        this.init();
    }

    async init() {
        await this.loadCars();
        this.setupEventListeners();
        this.checkURLParams();
    }

    async loadCars() {
        try {
            const response = await fetch('/api/cars');
            this.cars = await response.json();
            console.log('Loaded cars:', this.cars);
            this.populateCarSelector();
        } catch (error) {
            console.error('Error loading cars:', error);
            this.showNotification('Failed to load cars', 'error');
        }
    }

    populateCarSelector() {
        const selector = document.getElementById('car-selector');
        if (!selector) return;

        // Clear existing options except the first one
        selector.innerHTML = '<option value="">-- Select a Car --</option>';

        // Add car options
        this.cars.forEach(car => {
            const option = document.createElement('option');
            option.value = car._id;
            option.textContent = `${car.name} - $${car.base_price.toLocaleString()}`;
            option.dataset.carData = JSON.stringify(car);
            selector.appendChild(option);
        });
    }

    setupEventListeners() {
        const selector = document.getElementById('car-selector');
        if (selector) {
            selector.addEventListener('change', (e) => this.handleCarSelection(e));
        }
    }

    handleCarSelection(event) {
        const selectedOption = event.target.options[event.target.selectedIndex];
        
        if (!selectedOption.value) {
            this.clearCarDisplay();
            return;
        }

        const carData = JSON.parse(selectedOption.dataset.carData);
        this.selectedCar = carData;
        
        console.log('Selected car:', carData);
        
        // Update car display
        this.updateCarDisplay(carData);
        
        // Update URL parameters
        this.updateURL(carData);
        
        // Notify customizer about car change
        if (window.carCustomizer) {
            window.carCustomizer.basePrice = carData.base_price;
            window.carCustomizer.updateSummary();
        }
    }

    updateCarDisplay(car) {
        // Update car image
        const carImage = document.getElementById('car-preview-image');
        const carPlaceholder = document.getElementById('car-placeholder');
        
        if (carImage && car.image) {
            carImage.src = `/images/${car.image}`;
            carImage.alt = car.name;
            carImage.style.display = 'block';
            if (carPlaceholder) {
                carPlaceholder.style.display = 'none';
            }
        }

        // Update car info
        const carNameDisplay = document.getElementById('car-name-display');
        const carCategoryDisplay = document.getElementById('car-category-display');
        const modelLabel = document.getElementById('model-label');
        const categoryLabel = document.getElementById('category-label');
        const basePriceLabel = document.getElementById('base-price-label');

        if (carNameDisplay) {
            carNameDisplay.textContent = car.name;
        }
        
        if (carCategoryDisplay) {
            carCategoryDisplay.textContent = car.category;
        }

        if (modelLabel) {
            modelLabel.textContent = `Model: ${car.name}`;
        }

        if (categoryLabel) {
            categoryLabel.textContent = `Category: ${car.category}`;
        }

        if (basePriceLabel) {
            basePriceLabel.textContent = `Base Price: $${car.base_price.toLocaleString()}`;
        }

        // Update hero background
        const heroBackground = document.getElementById('hero-bg');
        if (heroBackground && car.image) {
            heroBackground.style.backgroundImage = `url('/images/${car.image}')`;
        }
    }

    clearCarDisplay() {
        const carImage = document.getElementById('car-preview-image');
        const carPlaceholder = document.getElementById('car-placeholder');
        
        if (carImage) {
            carImage.style.display = 'none';
        }
        
        if (carPlaceholder) {
            carPlaceholder.style.display = 'flex';
        }

        const carNameDisplay = document.getElementById('car-name-display');
        const carCategoryDisplay = document.getElementById('car-category-display');

        if (carNameDisplay) {
            carNameDisplay.textContent = 'Select Your Car';
        }
        
        if (carCategoryDisplay) {
            carCategoryDisplay.textContent = 'Choose from our luxury collection';
        }
    }

    updateURL(car) {
        const url = new URL(window.location.href);
        url.searchParams.set('carId', car._id);
        url.searchParams.set('model', car.name);
        url.searchParams.set('category', car.category);
        url.searchParams.set('basePrice', car.base_price);
        url.searchParams.set('image', car.image);
        
        window.history.pushState({}, '', url);
    }

    checkURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const carId = urlParams.get('carId');
        const model = urlParams.get('model');

        if (carId) {
            // Find car by ID
            const car = this.cars.find(c => c._id === carId);
            if (car) {
                const selector = document.getElementById('car-selector');
                if (selector) {
                    selector.value = carId;
                    this.selectedCar = car;
                    this.updateCarDisplay(car);
                }
            }
        } else if (model) {
            // Find car by name (fallback)
            const car = this.cars.find(c => c.name === model);
            if (car) {
                const selector = document.getElementById('car-selector');
                if (selector) {
                    selector.value = car._id;
                    this.selectedCar = car;
                    this.updateCarDisplay(car);
                }
            }
        }
    }

    showNotification(message, type = 'info') {
        // Simple notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'error' ? '#ff6b6b' : type === 'success' ? '#00b894' : '#d4af37'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize car selector when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.carSelector = new CarSelector();
});
