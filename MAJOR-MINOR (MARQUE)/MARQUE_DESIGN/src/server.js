// Load environment variables
require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const passport = require('./config/passport');
const cookieParser = require('cookie-parser');
const Database = require('./database');
const emailService = require('./services/emailService');

// Import authentication routes
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database();

// Using MongoDB Atlas database
console.log('🔄 Connecting to MongoDB Atlas...');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Images directory created');
}

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'marque_design_secret_key_2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Authentication routes
app.use('/api/auth', authRoutes);

// API Routes
// Get all cars
app.get('/api/cars', async (req, res) => {
  try {
    const cars = await db.getAllCars();
    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
});

// Get car options by type
app.get('/api/options/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const options = await db.getOptionsByType(type);
    res.json(options);
  } catch (error) {
    console.error('Error fetching options:', error);
    res.status(500).json({ error: 'Failed to fetch options' });
  }
});

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await db.createUser(name, email, phone);
    console.log('Created user:', user.name);
    res.json(user);
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get user by email
app.get('/api/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(404).json({ error: 'User not found' });
  }
});

// Save favorite
app.post('/api/favorites', async (req, res) => {
  try {
    const { userId, carId, config } = req.body;
    const favorite = await db.saveFavorite(userId, carId, config);
    res.json({ id: favorite._id });
  } catch (error) {
    console.error('Save favorite error:', error);
    res.status(500).json({ error: 'Failed to save favorite' });
  }
});

// Get user favorites
app.get('/api/favorites/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const favorites = await db.getFavoritesByUser(userId);
    res.json(favorites);
  } catch (error) {
    console.error('Fetch favorites error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Delete favorite
app.delete('/api/favorites/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteFavorite(id);
    res.json({ deleted });
  } catch (error) {
    console.error('Delete favorite error:', error);
    res.status(500).json({ error: 'Failed to delete favorite' });
  }
});

// Create order
app.post('/api/orders', async (req, res) => {
  try {
    const { userId, carId, config } = req.body;
    console.log('📦 Creating order for user:', userId);
    const order = await db.createOrder(userId, carId, config);
    console.log('✅ Order created successfully:', order._id);
    
    // Get user details for email
    const user = await db.getUserById(userId);
    
    // Send order confirmation email
    if (user && user.email) {
      const orderDetails = {
        orderId: order._id.toString(),
        carName: config.carName || 'Custom Build',
        totalPrice: config.totalPrice || 0,
        customizations: config.summary || [],
        orderDate: order.createdAt || new Date()
      };
      
      // Send email asynchronously (don't wait for it)
      emailService.sendOrderConfirmation(user.email, user.name, orderDetails)
        .then(result => {
          if (result.success) {
            console.log('📧 Order confirmation email sent to:', user.email);
          } else {
            console.error('📧 Failed to send email:', result.error);
          }
        })
        .catch(err => console.error('📧 Email error:', err));
    }
    
    res.json({ id: order._id });
  } catch (error) {
    console.error('❌ Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// Get user orders
app.get('/api/orders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await db.getOrdersByUser(userId);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Explicit routes for main pages (optional but clear)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'about.html'));
});

app.get('/cars', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'cars.html'));
});

app.get('/customize', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'customize.html'));
});

app.get('/favorites', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'favorites.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'checkout.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'profile.html'));
});

app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'privacy-policy.html'));
});

app.get('/terms-of-service', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'terms-of-service.html'));
});

app.get('/test-email', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'test-email.html'));
});

// Health check endpoint for connection monitoring
app.head('/api/health', (req, res) => {
  res.status(200).end();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    // Test email configuration
    const isConfigured = await emailService.testConnection();
    
    if (!isConfigured) {
      return res.status(500).json({ 
        error: 'Email service not configured',
        message: 'Please set EMAIL_USER and EMAIL_PASSWORD in .env file'
      });
    }

    // Send test email
    const result = await emailService.sendOrderConfirmation(
      email,
      name || 'Test Customer',
      {
        orderId: 'TEST-' + Date.now(),
        carName: 'Test Vehicle',
        totalPrice: 100000,
        customizations: [
          { category: 'Engine', name: 'V8 Twin Turbo', price: 15000 },
          { category: 'Exhaust', name: 'Sport Exhaust', price: 2000 }
        ],
        orderDate: new Date()
      }
    );

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Test email sent successfully! Check your inbox.',
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error,
        message: 'Failed to send test email. Check server logs for details.'
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Email test failed. Check your email configuration in .env file.'
    });
  }
});

// Admin API Routes
// Admin login (simple password check)
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (password === adminPassword) {
    res.json({ success: true, token: 'admin-token' });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Get all users (admin only)
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all orders (admin only)
app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await db.getAllOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status (admin only)
app.put('/api/admin/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Get original order before update to check if status changed
    const originalOrder = await db.getAllOrders().then(orders => orders.find(o => o._id.toString() === id));
    
    const updated = await db.updateOrderStatus(id, status);
    
    // Send email for ALL status changes
    if (updated) {
      try {
        // Get full order details with user populated
        const orderWithDetails = await db.getAllOrders().then(orders => orders.find(o => o._id.toString() === id));
        
        if (orderWithDetails && orderWithDetails.user_id && orderWithDetails.user_id.email) {
          const statusDetails = {
            orderId: orderWithDetails._id.toString().slice(-6).toUpperCase(),
            carName: orderWithDetails.configuration?.carName || orderWithDetails.car_id?.name || 'Custom Build',
            status: status,
            orderDate: orderWithDetails.createdAt || new Date()
          };
          
          const customerName = orderWithDetails.user_id.firstName || 
                              orderWithDetails.user_id.name || 
                              'Customer';
          
          console.log(`📧 Sending ${status} status update email for order ${id} to ${orderWithDetails.user_id.email}`);
          
          // Send status update email asynchronously
          emailService.sendOrderStatusUpdate(
            orderWithDetails.user_id.email, 
            customerName, 
            statusDetails
          ).then(result => {
             if (result.success) {
               console.log(`✅ ${status} status email sent successfully`);
             } else {
               console.error(`❌ Failed to send ${status} status email:`, result.error);
             }
          }).catch(err => {
            console.error('❌ Email sending error:', err);
          });
        } else {
          console.log('⚠️ Order or user email not found, skipping email notification');
        }
      } catch (emailErr) {
        console.error('Error sending status update email:', emailErr);
        // Don't fail the request just because email failed
      }
    }
    
    res.json({ updated: updated !== null });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Image upload endpoint (admin only)
app.post('/api/admin/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Return the filename for use in car creation
    res.json({ 
      success: true, 
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: `/images/${req.file.filename}`
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Add new car (admin only)
app.post('/api/admin/cars', async (req, res) => {
  try {
    const { name, category, description, base_price, image } = req.body;
    const car = await db.addCar({ name, category, description, base_price, image });
    res.json({ id: car._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add car' });
  }
});

// Update car (admin only)
app.put('/api/admin/cars/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, base_price, image } = req.body;
    const updated = await db.updateCar(id, { name, category, description, base_price, image });
    res.json({ updated: updated !== null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update car' });
  }
});

// Delete car (admin only)
app.delete('/api/admin/cars/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get car details before deletion to remove image file
    const car = await db.getCarById(id);
    
    const deleted = await db.deleteCar(id);
    
    // Delete associated image file if it exists
    if (deleted && car && car.image) {
      const imagePath = path.join(__dirname, '..', 'public', 'images', car.image);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log(`🗑️ Deleted image file: ${car.image}`);
        } catch (err) {
          console.error('Error deleting image file:', err);
        }
      }
    }
    
    res.json({ deleted });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete car' });
  }
});

// Delete uploaded image (admin only)
app.delete('/api/admin/delete-image/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(__dirname, '..', 'public', 'images', filename);
    
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      res.json({ success: true, message: 'Image deleted successfully' });
    } else {
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Add new car option (admin only)
app.post('/api/admin/options', async (req, res) => {
  try {
    const { option_type, name, price, description, car_id } = req.body;
    const option = await db.addOption({ option_type, name, price, description, car_id });
    res.json({ id: option._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add option' });
  }
});

// Update car option (admin only)
app.put('/api/admin/options/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { option_type, name, price, description, car_id } = req.body;
    const updated = await db.updateOption(id, { option_type, name, price, description, car_id });
    res.json({ updated: updated !== null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update option' });
  }
});

// Delete car option (admin only)
app.delete('/api/admin/options/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteOption(id);
    res.json({ deleted });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete option' });
  }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteUser(id);
    res.json({ deleted });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Delete order (admin only)
app.delete('/api/admin/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteOrder(id);
    res.json({ deleted });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Get all favorites (admin only)
app.get('/api/admin/favorites', async (req, res) => {
  try {
    const favorites = await db.getAllFavorites();
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Get all user profiles (admin only)
app.get('/api/admin/profiles', async (req, res) => {
  try {
    const profiles = await db.getAllUserProfiles();
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profiles' });
  }
});

// User Profile API Routes
// Get user profile
app.get('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await db.getUserProfile(userId);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
app.put('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;
    const updated = await db.updateUserProfile(userId, profileData);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Update user profile picture
app.put('/api/users/:userId/profile-picture', async (req, res) => {
  try {
    const { userId } = req.params;
    const { profilePicture } = req.body;
    
    const updated = await db.updateUser(userId, { profilePicture });
    
    if (updated) {
      res.json({ success: true, profilePicture });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ error: 'Failed to update profile picture' });
  }
});

// API to get available images
app.get('/api/images', (req, res) => {
  const imagesPath = path.join(__dirname, '..', 'public', 'images');
  
  try {
    const files = fs.readdirSync(imagesPath);
    const imageFiles = files.filter(file => 
      file.toLowerCase().endsWith('.jpg') || 
      file.toLowerCase().endsWith('.jpeg') || 
      file.toLowerCase().endsWith('.png') || 
      file.toLowerCase().endsWith('.webp')
    );
    
    const imageData = imageFiles.map(filename => {
      const filePath = path.join(imagesPath, filename);
      const stats = fs.statSync(filePath);
      
      // Extract car name from filename
      let carName = filename
        .replace(/\.(jpg|jpeg|png|webp)$/i, '')
        .replace(/^\d{4}-/, '')
        .replace(/-\d{3}-\d{4}$/, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      
      return {
        filename,
        carName,
        url: `/images/${filename}`,
        size: stats.size,
        uploadDate: stats.mtime
      };
    });
    
    res.json(imageData);
  } catch (error) {
    console.error('Error reading images directory:', error);
    res.status(500).json({ error: 'Failed to load images' });
  }
});

// 404 fallback for unknown routes
app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, () => {
  console.log(`MARQUE DESIGN server running on http://localhost:${PORT}`);
});



