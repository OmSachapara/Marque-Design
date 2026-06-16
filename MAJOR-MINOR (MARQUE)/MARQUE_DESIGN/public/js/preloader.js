// Preloader JavaScript
class PreloaderManager {
    constructor(options = {}) {
        this.options = {
            minLoadTime: 1500, // Minimum time to show preloader (ms) - exactly 1.5 seconds
            maxLoadTime: 1500, // Maximum time before force hide (ms) - exactly 1.5 seconds
            logoPath: '/images/MD_T_LOGO_DOJ_CO.png',
            fallbackLogo: '/images/default-avatar.svg',
            showProgress: false, // Hide progress bar
            showPercentage: false, // Hide percentage display
            style: 'minimal', // Simple and minimalistic
            ...options
        };
        
        this.startTime = Date.now();
        this.progress = 0;
        this.isComplete = false;
        this.resourcesLoaded = 0;
        this.totalResources = 0;
        
        this.init();
    }
    
    init() {
        this.createPreloader();
        this.setupEventListeners();
        this.startProgressSimulation();
        this.preloadResources();
    }
    
    createPreloader() {
        // Create preloader HTML
        const preloaderHTML = `
            <div class="preloader ${this.options.style}" id="preloader">
                <div class="preloader-logo">
                    <img src="${this.options.logoPath}" alt="MARQUE DESIGN Logo" 
                         onerror="this.src='${this.options.fallbackLogo}'">
                </div>
                
                <!-- Minimalistic: Only logo -->
            </div>
        `;
        
        // Insert preloader at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', preloaderHTML);
        
        // Get references
        this.preloader = document.getElementById('preloader');
        this.progressBar = document.getElementById('progress-bar');
        this.progressPercentage = document.getElementById('progress-percentage');
    }
    
    setupEventListeners() {
        // Window load event
        window.addEventListener('load', () => {
            this.onWindowLoad();
        });
        
        // Document ready state change
        document.addEventListener('readystatechange', () => {
            if (document.readyState === 'complete') {
                this.onDocumentReady();
            }
        });
        
        // Force hide after max time
        setTimeout(() => {
            if (!this.isComplete) {
                console.warn('Preloader force hidden after max time');
                this.hidePreloader();
            }
        }, this.options.maxLoadTime);
    }
    
    preloadResources() {
        // Get all images, stylesheets, and scripts
        const images = document.querySelectorAll('img[src]');
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        const scripts = document.querySelectorAll('script[src]');
        
        this.totalResources = images.length + stylesheets.length + scripts.length;
        
        // Preload images
        images.forEach(img => {
            if (img.complete) {
                this.onResourceLoad();
            } else {
                img.addEventListener('load', () => this.onResourceLoad());
                img.addEventListener('error', () => this.onResourceLoad());
            }
        });
        
        // Check stylesheets
        stylesheets.forEach(link => {
            if (link.sheet) {
                this.onResourceLoad();
            } else {
                link.addEventListener('load', () => this.onResourceLoad());
                link.addEventListener('error', () => this.onResourceLoad());
            }
        });
        
        // Check scripts
        scripts.forEach(script => {
            if (script.readyState === 'loaded' || script.readyState === 'complete') {
                this.onResourceLoad();
            } else {
                script.addEventListener('load', () => this.onResourceLoad());
                script.addEventListener('error', () => this.onResourceLoad());
            }
        });
        
        // If no resources to load, complete immediately
        if (this.totalResources === 0) {
            this.progress = 100;
            this.updateProgress();
        }
    }
    
    onResourceLoad() {
        this.resourcesLoaded++;
        const resourceProgress = (this.resourcesLoaded / this.totalResources) * 70; // 70% for resources
        this.progress = Math.min(resourceProgress, 70);
        this.updateProgress();
    }
    
    startProgressSimulation() {
        // Simulate loading progress - optimized for 1.5 seconds
        const totalTime = 1500; // 1.5 seconds
        const updateInterval = 50; // Update every 50ms for smooth animation
        const totalUpdates = totalTime / updateInterval; // 30 updates
        const progressPerUpdate = 90 / totalUpdates; // Progress increment per update
        
        const interval = setInterval(() => {
            if (this.progress < 90 && !this.isComplete) {
                this.progress += progressPerUpdate + (Math.random() * 0.5); // Small randomization
                this.updateProgress();
            } else {
                clearInterval(interval);
            }
        }, updateInterval);
    }
    
    updateProgress() {
        if (this.progressBar) {
            this.progressBar.style.width = `${this.progress}%`;
        }
        
        if (this.progressPercentage) {
            this.progressPercentage.textContent = `${Math.round(this.progress)}%`;
        }
        
        // Complete when progress reaches 100%
        if (this.progress >= 100 && !this.isComplete) {
            setTimeout(() => {
                this.completeLoading();
            }, 200); // Reduced delay for faster completion
        }
    }
    
    onWindowLoad() {
        // Window fully loaded
        this.progress = Math.max(this.progress, 90);
        this.updateProgress();
        this.checkCompletion();
    }
    
    onDocumentReady() {
        // Document ready
        this.progress = Math.max(this.progress, 80);
        this.updateProgress();
        this.checkCompletion();
    }
    
    checkCompletion() {
        const elapsedTime = Date.now() - this.startTime;
        
        if (elapsedTime >= this.options.minLoadTime && this.progress >= 90) {
            this.completeLoading();
        }
    }
    
    completeLoading() {
        if (this.isComplete) return;
        
        this.isComplete = true;
        this.progress = 100;
        this.updateProgress();
        
        // Wait a moment then hide - reduced for 2.3 second total
        setTimeout(() => {
            this.hidePreloader();
        }, 300);
    }
    
    hidePreloader() {
        if (!this.preloader) return;
        
        // Add fade out class
        this.preloader.classList.add('fade-out');
        
        // Remove from DOM after transition
        setTimeout(() => {
            if (this.preloader && this.preloader.parentNode) {
                this.preloader.parentNode.removeChild(this.preloader);
            }
            
            // Trigger custom event
            document.dispatchEvent(new CustomEvent('preloaderComplete'));
            
            // Enable scrolling
            document.body.style.overflow = '';
        }, 500);
        
        // Disable scrolling during preloader
        document.body.style.overflow = 'hidden';
    }
    
    // Public methods
    setProgress(percentage) {
        this.progress = Math.max(this.progress, percentage);
        this.updateProgress();
    }
    
    addProgress(amount) {
        this.progress = Math.min(this.progress + amount, 100);
        this.updateProgress();
    }
    
    forceComplete() {
        this.completeLoading();
    }
    
    // Static method to initialize
    static init(options = {}) {
        return new PreloaderManager(options);
    }
}

// Auto-initialize preloader when script loads - SHOWS ON EVERY RELOAD
document.addEventListener('DOMContentLoaded', () => {
    // Always show preloader on every page load/reload
    const showPreloader = true; // Always show preloader
    
    if (showPreloader) {
        // Initialize preloader - exactly 1.5 seconds
        window.preloader = PreloaderManager.init({
            minLoadTime: 1500,
            maxLoadTime: 1500,
            logoPath: '/images/MD_T_LOGO_DOJ_CO.png',
            fallbackLogo: '/images/default-avatar.svg',
            showProgress: false, // Hide progress bar
            showPercentage: false, // Hide percentage display
            style: 'minimal' // Use minimal style for clean design
        });
        
        // Listen for preloader completion
        document.addEventListener('preloaderComplete', () => {
            console.log('🎉 Preloader completed successfully!');
            
            // Initialize any other scripts that should wait for preloader
            if (typeof initializeApp === 'function') {
                initializeApp();
            }
        });
    }
});

// Export for manual initialization
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PreloaderManager;
} else {
    window.PreloaderManager = PreloaderManager;
}