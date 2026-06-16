// Comprehensive Car Customization System
class CarCustomizer {
    constructor() {
        this.selectedOptions = {};
        this.prices = {};
        this.totalPrice = 0;
        
        // Get base price from URL IMMEDIATELY
        const urlParams = new URLSearchParams(window.location.search);
        const basePriceFromURL = urlParams.get('basePrice');
        this.basePrice = basePriceFromURL ? parseInt(basePriceFromURL) : 50000;
        
        console.log('🚗 CarCustomizer initialized with base price:', this.basePrice);
        
        this.init();
    }

    init() {
        this.setupPricing();
        this.setupEventListeners();
        
        // Load saved customizations first (updates URL if no car selected)
        this.loadSavedCustomizations();
        
        // Then load model from URL (which now has saved car data if needed)
        this.loadModelFromURL();
        
        // Finally update the summary
        this.updateSummary();
        
        // Apply all 3D customizations after a short delay to ensure 3D viewer is ready
        setTimeout(() => this.applyAll3DCustomizations(), 500);
    }
    
    applyAll3DCustomizations() {
        if (!window.car3DViewer) {
            console.log('3D viewer not ready yet');
            return;
        }

        console.log('Applying all 3D customizations:', this.selectedOptions);

        // Apply each exterior customization to the 3D model
        Object.keys(this.selectedOptions).forEach(optionId => {
            const value = this.selectedOptions[optionId];
            this.update3DModel(optionId, value);
        });
    }

    setupPricing() {
        // Pricing for all customization options
        this.prices = {
            // Exterior Customization
            'body-paint': {
                'metallic': 2500,
                'matte': 3000,
                'gloss': 2000,
                'pearl': 3500,
                'chrome': 8000,
                'carbon': 12000
            },
            'license-frame': {
                'carbon-fiber': 300,
                'chrome': 150,
                'black-matte': 100,
                'gold': 500,
                'led-illuminated': 800
            },
            'carbon-parts': {
                'hood': 3500,
                'mirrors': 800,
                'spoiler': 2200,
                'front-lip': 1500,
                'side-skirts': 2800,
                'full-kit': 8500
            },
            'roof-racks': {
                'sport': 600,
                'cargo': 800,
                'bike': 400,
                'ski': 500,
                'kayak': 450
            },
            'sunroof': {
                'panoramic': 2500,
                'tilt-slide': 1500,
                'pop-up': 800,
                't-top': 3500,
                'convertible': 15000
            },
            'widebody': {
                'liberty-walk': 8500,
                'rocket-bunny': 7500,
                'pandem': 9000,
                'custom': 12000,
                'bolt-on': 4500
            },
            'diffusers': {
                'carbon-aggressive': 1800,
                'subtle-oem': 800,
                'race-spec': 2500,
                'led-integrated': 2200,
                'dual-exit': 1500
            },
            'fender-flares': {
                'bolt-on': 1200,
                'molded': 2500,
                'carbon-fiber': 3500,
                'wide-arch': 2800,
                'rally-spec': 2200
            },

            // Interior Customization
            'seat-covers': {
                'premium-leather': 2500,
                'alcantara': 3500,
                'carbon-fiber': 4500,
                'nappa-leather': 3800,
                'racing-fabric': 2200,
                'custom-embroidery': 1500
            },
            'pedal-upgrades': {
                'aluminum-sport': 300,
                'carbon-fiber': 600,
                'racing-style': 400,
                'led-illuminated': 800,
                'custom-engraved': 500
            },
            'ambient-lighting': {
                'rgb-color-changing': 1200,
                'warm-white': 400,
                'cool-blue': 500,
                'multi-zone': 1800,
                'music-sync': 2200,
                'app-controlled': 1500
            },
            'door-panels': {
                'carbon-fiber': 1800,
                'wood-grain': 1200,
                'aluminum-brushed': 800,
                'leather-wrapped': 1500,
                'custom-stitching': 1000
            },
            'floor-mats': {
                'luxury-carpet': 400,
                'all-weather': 200,
                'custom-logo': 600,
                'carbon-look': 500,
                'diamond-plate': 350
            },
            'roof-liner': {
                'black-suede': 800,
                'starlight': 2500,
                'custom-color': 600,
                'alcantara': 1200,
                'carbon-pattern': 1000
            },
            'racing-seats': {
                'bucket-seats': 2500,
                'recaro-sport': 3500,
                'sparco-racing': 3200,
                'bride-seats': 4000,
                'custom-fabricated': 5000
            },
            'sound-system': {
                'premium-speakers': 1500,
                'subwoofer-system': 2200,
                'amplifier-upgrade': 1800,
                'full-audio-kit': 4500,
                'competition-grade': 8000
            },

            // Performance Customization
            'engine-options': {
                'turbo-upgrade': 8500,
                'supercharger': 12000,
                'engine-swap': 25000,
                'hybrid-conversion': 18000,
                'electric-motor': 22000,
                'performance-tune': 2500
            },
            'flywheel': {
                'aluminum': 800,
                'carbon-fiber': 1500,
                'chromoly': 600,
                'single-mass': 700,
                'dual-mass': 1200
            },
            'performance-brakes': {
                'brembo-kit': 4500,
                'ap-racing': 5500,
                'stoptech': 3500,
                'wilwood': 3200,
                'akebono': 2800,
                'custom-caliper': 800
            },
            'injectors': {
                'high-flow': 1200,
                'racing-spec': 2200,
                'e85-compatible': 1800,
                'direct-injection': 2800,
                'port-injection': 1500
            },
            'nitrous': {
                'wet-kit': 2500,
                'dry-kit': 1800,
                'direct-port': 4500,
                'progressive': 3200,
                'purge-kit': 2800
            },

            // Wheels, Tires & Brakes
            'rims': {
                'forged-lightweight': 3500,
                'carbon-fiber': 8500,
                'multi-spoke': 2200,
                'deep-dish': 2800,
                'split-spoke': 2500,
                'custom-machined': 4200
            },
            'rim-finish': {
                'gloss-black': 500,
                'matte-black': 600,
                'bronze': 800,
                'chrome': 1200,
                'gunmetal': 700,
                'custom-color': 1000
            },
            'tires': {
                'low-profile': 1200,
                'track-tires': 2200,
                'all-season': 800,
                'drag-radials': 1800,
                'off-road': 1500,
                'winter-performance': 1000
            },
            'brake-calipers': {
                'red': 400,
                'yellow': 400,
                'blue': 400,
                'green': 400,
                'orange': 400,
                'custom': 600
            },
            'brake-rotors': {
                'slotted': 800,
                'drilled': 900,
                'slotted-drilled': 1200,
                'carbon-ceramic': 4500,
                'floating': 2200
            },

            // Lighting Customization
            'headlights': {
                'led-projector': 1800,
                'hid-xenon': 1200,
                'adaptive-led': 2800,
                'laser-headlights': 4500,
                'angel-eyes': 1500,
                'sequential': 2200
            },
            'fog-lights': {
                'led-fog': 600,
                'halo-fog': 800,
                'projector-fog': 700,
                'color-changing': 1200,
                'off-road': 1500
            },
            'drls': {
                'led-strip': 500,
                'c-shape': 700,
                'sequential-drl': 1200,
                'integrated': 800,
                'custom-shape': 1500
            },
            'tail-lights': {
                'led-sequential': 1500,
                'smoked-lens': 600,
                'clear-lens': 500,
                'fiber-optic': 2200,
                'custom-design': 2800
            },
            'underglow': {
                'rgb-strips': 800,
                'neon-tubes': 600,
                'app-controlled': 1200,
                'music-sync': 1500,
                'chase-effect': 1800
            },

            // Tech & Electronics
            'gps-navigation': {
                'android-auto': 800,
                'apple-carplay': 800,
                'built-in-gps': 1200,
                'heads-up-display': 2500,
                'voice-control': 1500,
                'offline-maps': 600
            },
            'cameras': {
                'reverse-camera': 400,
                '360-view': 1800,
                'blind-spot': 1200,
                'dash-cam': 600,
                'interior-cam': 500,
                'night-vision': 2200
            },
            'parking-sensors': {
                'ultrasonic': 400,
                'electromagnetic': 600,
                'front-rear': 800,
                'side-sensors': 600,
                'visual-display': 500
            },
            'remote-start': {
                'key-fob': 400,
                'smartphone-app': 800,
                'long-range': 600,
                'auto-start': 1000,
                'climate-control': 1200
            },
            'digital-cluster': {
                'full-digital': 2200,
                'hybrid-analog': 1500,
                'customizable': 1800,
                'racing-display': 2800,
                'hud-projection': 3500
            },
            'hud-display': {
                'windshield-hud': 1800,
                'combiner-hud': 1200,
                'ar-hud': 3500,
                'speed-display': 800,
                'navigation-hud': 2200
            }
        };
    }

    setupEventListeners() {
        // Get all select elements
        const selects = document.querySelectorAll('.customization-section select');
        
        selects.forEach(select => {
            select.addEventListener('change', (e) => {
                this.handleOptionChange(e.target.id, e.target.value);
            });
        });

        // Action buttons
        document.getElementById('save-configuration')?.addEventListener('click', () => this.saveConfiguration());
        document.getElementById('save-fav')?.addEventListener('click', () => this.saveToFavorites());
        document.getElementById('reset-all')?.addEventListener('click', () => this.resetAll());
        
        // Update checkout link
        this.updateCheckoutLink();
    }

    handleOptionChange(optionId, value) {
        if (value) {
            this.selectedOptions[optionId] = value;
        } else {
            delete this.selectedOptions[optionId];
        }
        
        // Update 3D model based on exterior customization changes
        if (window.car3DViewer) {
            this.update3DModel(optionId, value);
        }
        
        this.updateSummary();
        this.updateCheckoutLink();
        
        // Auto-save customizations
        this.autoSaveCustomizations();
    }
    
    update3DModel(optionId, value) {
        if (!window.car3DViewer) return;

        console.log('Updating 3D model:', optionId, '=', value);

        switch(optionId) {
            case 'body-paint':
                window.car3DViewer.updateBodyPaint(value);
                break;
            
            case 'carbon-parts':
                window.car3DViewer.updateCarbonParts(value);
                break;
            
            case 'sunroof':
                window.car3DViewer.updateSunroof(value);
                break;
            
            case 'widebody':
                window.car3DViewer.updateWidebody(value);
                break;
            
            case 'diffusers':
                window.car3DViewer.updateDiffuser(value);
                break;
            
            case 'fender-flares':
                window.car3DViewer.updateFenderFlares(value);
                break;
            
            case 'roof-racks':
                window.car3DViewer.updateRoofRack(value);
                break;
            
            case 'license-frame':
                window.car3DViewer.updateLicenseFrame(value);
                break;
        }
    }
    
    autoSaveCustomizations() {
        const carData = this.getCarDataFromURL();
        const config = {
            selectedOptions: this.selectedOptions,
            totalPrice: this.totalPrice,
            carData: carData,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('carCustomization', JSON.stringify(config));
        console.log('Auto-saved customizations for car:', carData.model || carData.carId);
    }

    updateSummary() {
        const summaryDiv = document.getElementById('customization-summary');
        const totalPriceSpan = document.getElementById('total-price');
        
        if (!summaryDiv || !totalPriceSpan) return;

        let summaryHTML = '';
        
        // Start with base price (ensure it's a number)
        this.totalPrice = parseInt(this.basePrice) || 50000;

        if (Object.keys(this.selectedOptions).length === 0) {
            summaryHTML = '<p style="color: var(--muted); text-align: center; padding: 2rem;">Select customization options to see your build summary here.</p>';
        } else {
            summaryHTML += `<div class="summary-item">
                <span class="item-name">Base Car Price</span>
                <span class="item-price">$${this.basePrice.toLocaleString()}</span>
            </div>`;

            // Group options by category
            const categories = {
                'Exterior': ['body-paint', 'license-frame', 'carbon-parts', 'roof-racks', 'sunroof', 'widebody', 'diffusers', 'fender-flares'],
                'Interior': ['seat-covers', 'pedal-upgrades', 'ambient-lighting', 'door-panels', 'floor-mats', 'roof-liner', 'racing-seats', 'sound-system'],
                'Performance': ['engine-options', 'flywheel', 'performance-brakes', 'injectors', 'nitrous'],
                'Wheels & Brakes': ['rims', 'rim-finish', 'tires', 'brake-calipers', 'brake-rotors'],
                'Lighting': ['headlights', 'fog-lights', 'drls', 'tail-lights', 'underglow'],
                'Tech & Electronics': ['gps-navigation', 'cameras', 'parking-sensors', 'remote-start', 'digital-cluster', 'hud-display']
            };

            Object.entries(categories).forEach(([categoryName, optionIds]) => {
                const categoryOptions = optionIds.filter(id => this.selectedOptions[id]);
                
                if (categoryOptions.length > 0) {
                    summaryHTML += `<div style="margin: 1rem 0; padding: 0.5rem 0; border-top: 1px solid rgba(255,255,255,0.1);">
                        <strong style="color: var(--accent); font-size: 0.9rem;">${categoryName}</strong>
                    </div>`;
                    
                    categoryOptions.forEach(optionId => {
                        const value = this.selectedOptions[optionId];
                        const price = this.prices[optionId]?.[value] || 0;
                        const displayName = this.getDisplayName(optionId, value);
                        
                        this.totalPrice += price;
                        
                        summaryHTML += `<div class="summary-item">
                            <span class="item-name">${displayName}</span>
                            <span class="item-price">$${price.toLocaleString()}</span>
                        </div>`;
                    });
                }
            });
        }

        summaryDiv.innerHTML = summaryHTML;
        totalPriceSpan.textContent = this.totalPrice.toLocaleString();
        
        console.log('Summary updated - Base Price:', this.basePrice, 'Total Price:', this.totalPrice);
    }

    getDisplayName(optionId, value) {
        // Convert option ID and value to readable names
        const optionNames = {
            'body-paint': 'Body Paint/Wrap',
            'license-frame': 'License Plate Frame',
            'carbon-parts': 'Carbon Fiber Parts',
            'roof-racks': 'Roof Racks',
            'sunroof': 'Sunroof',
            'widebody': 'Wide-body Kit',
            'diffusers': 'Rear Diffuser',
            'fender-flares': 'Fender Flares',
            'seat-covers': 'Seat Covers',
            'pedal-upgrades': 'Pedal Upgrade',
            'ambient-lighting': 'Ambient Lighting',
            'door-panels': 'Door Panels',
            'floor-mats': 'Floor Mats',
            'roof-liner': 'Roof Liner',
            'racing-seats': 'Racing Seats',
            'sound-system': 'Sound System',
            'engine-options': 'Engine Upgrade',
            'flywheel': 'Flywheel',
            'performance-brakes': 'Performance Brakes',
            'injectors': 'Fuel Injectors',
            'nitrous': 'Nitrous System',
            'rims': 'Wheels',
            'rim-finish': 'Wheel Finish',
            'tires': 'Tires',
            'brake-calipers': 'Brake Calipers',
            'brake-rotors': 'Brake Rotors',
            'headlights': 'Headlights',
            'fog-lights': 'Fog Lights',
            'drls': 'DRLs',
            'tail-lights': 'Tail Lights',
            'underglow': 'Underglow',
            'gps-navigation': 'GPS Navigation',
            'cameras': 'Camera System',
            'parking-sensors': 'Parking Sensors',
            'remote-start': 'Remote Start',
            'digital-cluster': 'Digital Cluster',
            'hud-display': 'HUD Display'
        };

        const valueNames = {
            'metallic': 'Metallic Paint',
            'matte': 'Matte Finish',
            'gloss': 'High Gloss',
            'pearl': 'Pearl Effect',
            'chrome': 'Chrome Wrap',
            'carbon': 'Carbon Fiber Wrap',
            'carbon-fiber': 'Carbon Fiber',
            'led-illuminated': 'LED Illuminated',
            'panoramic': 'Panoramic',
            'convertible': 'Full Convertible',
            'liberty-walk': 'Liberty Walk Style',
            'rocket-bunny': 'Rocket Bunny Kit',
            'premium-leather': 'Premium Leather',
            'alcantara': 'Alcantara Suede',
            'rgb-color-changing': 'RGB Color Changing',
            'turbo-upgrade': 'Turbocharger Upgrade',
            'supercharger': 'Supercharger Kit',
            'brembo-kit': 'Brembo Big Brake Kit',
            'forged-lightweight': 'Forged Lightweight',
            'led-projector': 'LED Projector',
            'android-auto': 'Android Auto',
            'apple-carplay': 'Apple CarPlay'
        };

        const optionName = optionNames[optionId] || optionId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        const valueName = valueNames[value] || value.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        return `${optionName}: ${valueName}`;
    }

    saveConfiguration() {
        const carData = this.getCarDataFromURL();
        const config = {
            selectedOptions: this.selectedOptions,
            totalPrice: this.totalPrice,
            carData: carData, // Save car information
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('carCustomization', JSON.stringify(config));
        this.showNotification('Configuration saved successfully!', 'success');
    }
    
    loadSavedCustomizations() {
        try {
            const savedConfig = localStorage.getItem('carCustomization');
            if (!savedConfig) {
                console.log('No saved customizations found');
                return;
            }
            
            const config = JSON.parse(savedConfig);
            console.log('Loading saved customizations:', config);
            
            // Get current car data from URL
            const urlParams = new URLSearchParams(window.location.search);
            const currentCarId = urlParams.get('carId');
            const currentModel = urlParams.get('model');
            const hasCarInURL = urlParams.has('model') || urlParams.has('carId');
            
            // Check if this is a different car than the saved one
            const isDifferentCar = (currentCarId && config.carData?.carId && currentCarId !== config.carData.carId) ||
                                 (currentModel && config.carData?.model && currentModel !== config.carData.model);
            
            if (isDifferentCar) {
                console.log('🚗 Different car selected - clearing previous customizations');
                console.log('Current car:', { carId: currentCarId, model: currentModel });
                console.log('Saved car:', config.carData);
                
                // Clear saved customizations for different car
                localStorage.removeItem('carCustomization');
                this.selectedOptions = {};
                
                // Reset all select elements
                const selects = document.querySelectorAll('.customization-section select');
                selects.forEach(select => {
                    select.value = '';
                });
                
                this.showNotification('Starting fresh customization for new car!', 'info');
                return;
            }
            
            // If no car in URL, use saved car data (continuing previous session)
            if (!hasCarInURL && config.carData) {
                console.log('No car in URL, loading saved car:', config.carData);
                
                // Update URL with saved car data
                const newURL = new URL(window.location.href);
                if (config.carData.model) newURL.searchParams.set('model', config.carData.model);
                if (config.carData.image) newURL.searchParams.set('image', config.carData.image);
                if (config.carData.category) newURL.searchParams.set('category', config.carData.category);
                if (config.carData.basePrice) newURL.searchParams.set('basePrice', config.carData.basePrice);
                if (config.carData.carId) newURL.searchParams.set('carId', config.carData.carId);
                
                // Update URL without reloading
                window.history.replaceState({}, '', newURL);
                
                console.log('Updated URL with saved car data');
            }
            
            // Restore selected options only if it's the same car
            if (config.selectedOptions && !isDifferentCar) {
                this.selectedOptions = config.selectedOptions;
                
                // Update all select elements to match saved options
                Object.keys(config.selectedOptions).forEach(optionId => {
                    const selectElement = document.getElementById(optionId);
                    if (selectElement) {
                        selectElement.value = config.selectedOptions[optionId];
                    }
                });
                
                console.log('Restored customizations for same car:', this.selectedOptions);
                this.showNotification('Restored your previous customizations!', 'success');
            }
            
        } catch (error) {
            console.error('Error loading saved customizations:', error);
        }
    }

    async saveToFavorites() {
        // Check if user is logged in
        const currentUser = MNS.user.getCurrentUser();
        console.log('Current user:', currentUser);
        
        if (!currentUser) {
            this.showNotification('Please log in to save favorites', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
            return;
        }

        // Get car data from URL
        const carData = this.getCarDataFromURL();
        console.log('Car data:', carData);
        
        if (!carData.carId) {
            this.showNotification('Please select a car from the Cars page first', 'error');
            setTimeout(() => {
                window.location.href = '/cars';
            }, 2000);
            return;
        }

        // Prepare configuration data for database
        const configuration = {
            engine: this.selectedOptions['engine-options'] || 'Standard',
            exhaust: this.selectedOptions['exhaust-system'] || 'Standard',
            spoiler: this.selectedOptions['carbon-parts'] || 'None',
            fabric: this.selectedOptions['seat-covers'] || 'Standard',
            color: this.selectedOptions['body-paint'] || 'Black',
            totalPrice: this.totalPrice,
            customizations: this.selectedOptions,
            summary: this.generateDetailedSummary()
        };

        // Get user ID - try both id and _id fields
        const userId = currentUser.id || currentUser._id;
        
        console.log('Saving favorite with config:', {
            userId: userId,
            carId: carData.carId,
            configuration
        });

        try {
            // Save to database via API
            const result = await MNS.api.saveFavorite(userId, carData.carId, configuration);
            console.log('Favorite saved successfully:', result);
            
            // Also save to localStorage as backup
            const localConfig = {
                selectedOptions: this.selectedOptions,
                totalPrice: this.totalPrice,
                model: carData.model,
                carId: carData.carId,
                timestamp: new Date().toISOString()
            };
            
            let favorites = JSON.parse(localStorage.getItem('customizationFavorites') || '[]');
            favorites.push(localConfig);
            localStorage.setItem('customizationFavorites', JSON.stringify(favorites));
            
            this.showNotification('Added to favorites!', 'success');
        } catch (error) {
            console.error('Failed to save favorite:', error);
            this.showNotification('Failed to save favorite. Please try again.', 'error');
        }
    }

    resetAll() {
        if (confirm('Are you sure you want to reset all customizations?')) {
            this.selectedOptions = {};
            
            // Reset all select elements
            const selects = document.querySelectorAll('.customization-section select');
            selects.forEach(select => {
                select.value = '';
            });
            
            // Clear saved customizations from localStorage
            localStorage.removeItem('carCustomization');
            
            this.updateSummary();
            this.updateCheckoutLink();
            this.showNotification('All customizations reset', 'info');
        }
    }

    updateCheckoutLink() {
        const checkoutLink = document.getElementById('go-checkout');
        if (checkoutLink) {
            const carData = this.getCarDataFromURL();
            
            // Prepare comprehensive checkout data
            const checkoutData = {
                carName: carData.model,
                carId: carData.carId || 'custom-build',
                carImage: carData.image,
                carCategory: carData.category,
                selectedOptions: this.selectedOptions,
                totalPrice: this.totalPrice,
                basePrice: this.basePrice,
                timestamp: new Date().toISOString(),
                config: {
                    // Convert our new format to match checkout expectations
                    totalPrice: this.totalPrice,
                    customizations: this.selectedOptions,
                    summary: this.generateDetailedSummary(),
                    carImage: carData.image,
                    carCategory: carData.category
                }
            };
            
            // Store in localStorage for checkout page
            localStorage.setItem('mns_checkout', JSON.stringify(checkoutData));
            
            // Also add URL parameters as backup
            const params = new URLSearchParams();
            params.set('model', carData.model);
            params.set('total', this.totalPrice);
            params.set('image', carData.image || '');
            params.set('category', carData.category || '');
            
            checkoutLink.href = `/checkout?${params.toString()}`;
        }
    }

    generateDetailedSummary() {
        const summary = [];
        
        // Group options by category for better display
        const categories = {
            'Exterior': ['body-paint', 'license-frame', 'carbon-parts', 'roof-racks', 'sunroof', 'widebody', 'diffusers', 'fender-flares'],
            'Interior': ['seat-covers', 'pedal-upgrades', 'ambient-lighting', 'door-panels', 'floor-mats', 'roof-liner', 'racing-seats', 'sound-system'],
            'Performance': ['engine-options', 'flywheel', 'performance-brakes', 'injectors', 'nitrous'],
            'Wheels & Brakes': ['rims', 'rim-finish', 'tires', 'brake-calipers', 'brake-rotors'],
            'Lighting': ['headlights', 'fog-lights', 'drls', 'tail-lights', 'underglow'],
            'Tech & Electronics': ['gps-navigation', 'cameras', 'parking-sensors', 'remote-start', 'digital-cluster', 'hud-display']
        };

        Object.entries(categories).forEach(([categoryName, optionIds]) => {
            const categoryOptions = optionIds.filter(id => this.selectedOptions[id]);
            
            if (categoryOptions.length > 0) {
                categoryOptions.forEach(optionId => {
                    const value = this.selectedOptions[optionId];
                    const price = this.prices[optionId]?.[value] || 0;
                    const displayName = this.getDisplayName(optionId, value);
                    
                    summary.push({
                        category: categoryName,
                        name: displayName,
                        price: price,
                        optionId: optionId,
                        value: value
                    });
                });
            }
        });

        return summary;
    }

    loadModelFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const model = urlParams.get('model') || 'Custom Build';
        const image = urlParams.get('image');
        const category = urlParams.get('category');
        const basePrice = urlParams.get('basePrice');
        const carId = urlParams.get('carId');
        
        // Update hero section
        const modelLabel = document.getElementById('model-label');
        const categoryLabel = document.getElementById('category-label');
        const basePriceLabel = document.getElementById('base-price-label');
        
        if (modelLabel) {
            modelLabel.textContent = `Model: ${model}`;
        }
        
        if (categoryLabel && category) {
            categoryLabel.textContent = `Category: ${category}`;
        }
        
        // Update base price if provided in URL
        if (basePrice) {
            this.basePrice = parseInt(basePrice);
            console.log(' Base price set from URL:', this.basePrice);
        } else {
            console.log(' No base price in URL, using default:', this.basePrice);
        }
        
        // Update base price label
        if (basePriceLabel) {
            basePriceLabel.textContent = `Base Price: $${this.basePrice.toLocaleString()}`;
        }
        
        // Update car preview section
        this.updateCarPreview(model, image, category, basePrice);
        
        // Update hero background if image is available
        if (image) {
            this.updateHeroBackground(image);
        }
        
        // Update summary with correct base price
        this.updateSummary();
    }

    updateCarPreview(model, image, category, basePrice) {
        const carImageContainer = document.getElementById('car-image-container');
        const carPreviewImage = document.getElementById('car-preview-image');
        const carPlaceholder = document.getElementById('car-placeholder');
        const carNameDisplay = document.getElementById('car-name-display');
        const carCategoryDisplay = document.getElementById('car-category-display');
        
        // Update car name and category
        if (carNameDisplay) {
            carNameDisplay.textContent = model || 'Custom Build';
        }
        
        if (carCategoryDisplay) {
            if (category && basePrice) {
                carCategoryDisplay.innerHTML = `
                    <span class="meta">${category}</span>
                    <div class="price-highlight">Starting at $${parseInt(basePrice).toLocaleString()}</div>
                `;
            } else if (category) {
                carCategoryDisplay.textContent = category;
            } else {
                carCategoryDisplay.textContent = 'Luxury Vehicle';
            }
        }
        
        // Update car image
        if (image && image !== '' && carPreviewImage && carPlaceholder) {
            carPreviewImage.src = `/images/${image}`;
            carPreviewImage.alt = model;
            
            carPreviewImage.onload = () => {
                carPreviewImage.style.display = 'block';
                carPlaceholder.style.display = 'none';
            };
            
            carPreviewImage.onerror = () => {
                carPreviewImage.style.display = 'none';
                carPlaceholder.style.display = 'flex';
                carPlaceholder.innerHTML = `
                    <i class="fas fa-car"></i>
                    <p>${model}</p>
                `;
            };
        } else if (carPlaceholder) {
            carPlaceholder.style.display = 'flex';
            carPlaceholder.innerHTML = `
                <i class="fas fa-car"></i>
                <p>${model || 'Custom Build'}</p>
            `;
        }
    }

    updateHeroBackground(image) {
        const heroBg = document.getElementById('hero-bg');
        if (heroBg && image) {
            heroBg.style.backgroundImage = `url('/images/${image}')`;
            heroBg.style.backgroundSize = 'cover';
            heroBg.style.backgroundPosition = 'center';
            heroBg.style.opacity = '0.3';
        }
    }

    getModelFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('model') || 'Custom Build';
    }

    getCarDataFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            model: urlParams.get('model') || 'Custom Build',
            image: urlParams.get('image'),
            category: urlParams.get('category'),
            basePrice: urlParams.get('basePrice'),
            carId: urlParams.get('carId')
        };
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--card);
            color: var(--text);
            padding: 1rem 1.5rem;
            border-radius: 10px;
            border-left: 4px solid var(--accent);
            box-shadow: var(--shadow);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        if (type === 'success') {
            notification.style.borderLeftColor = '#2ed573';
        } else if (type === 'error') {
            notification.style.borderLeftColor = '#ff4757';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the customizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.carCustomizer = new CarCustomizer();
});

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
