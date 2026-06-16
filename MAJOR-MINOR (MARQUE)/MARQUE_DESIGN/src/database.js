require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB Atlas connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://23se02ml171_db_user:Om_Sachapara%401503@marquedesigncluster.ig2f3h9.mongodb.net/marquedesign?retryWrites=true&w=majority';

// Car Schema
const carSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  base_price: { type: Number, required: true },
  image: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Import the User model from the models directory
const User = require('./models/User');

// User Profile Schema
const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateOfBirth: { type: Date },
  age: { type: Number },
  gender: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String }
  },
  preferences: {
    favoriteCarTypes: [{ type: String }],
    budgetRange: {
      min: { type: Number },
      max: { type: Number }
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Car Options Schema
const carOptionSchema = new mongoose.Schema({
  car_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  option_type: { type: String, required: true }, // engine, exhaust, spoiler, fabric, etc.
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Favorites Schema
const favoriteSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  car_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  configuration: {
    engine: { type: String },
    exhaust: { type: String },
    spoiler: { type: String },
    fabric: { type: String },
    color: { type: String },
    totalPrice: { type: Number }
  },
  createdAt: { type: Date, default: Date.now }
});

// Orders Schema
const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  car_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: false }, // Made optional for custom builds
  configuration: {
    carName: { type: String },
    carCategory: { type: String },
    basePrice: { type: Number },
    engine: { type: String },
    exhaust: { type: String },
    spoiler: { type: String },
    fabric: { type: String },
    color: { type: String },
    totalPrice: { type: Number },
    selectedOptions: { type: mongoose.Schema.Types.Mixed },
    summary: { type: Array },
    customizations: { type: mongoose.Schema.Types.Mixed }
  },
  status: { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  orderDate: { type: Date, default: Date.now },
  deliveryDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create Models
const Car = mongoose.model('Car', carSchema);
// User model is imported from models/User.js
const UserProfile = mongoose.model('UserProfile', userProfileSchema);
const CarOption = mongoose.model('CarOption', carOptionSchema);
const Favorite = mongoose.model('Favorite', favoriteSchema);
const Order = mongoose.model('Order', orderSchema);

class Database {
  constructor() {
    this.isConnected = false;
    this.connect();
  }

  async connect() {
    try {
      await mongoose.connect(MONGODB_URI);
      this.isConnected = true;
      console.log('✅ Connected to MongoDB Atlas successfully');
      
      // Initialize with sample data if collections are empty
      await this.initializeSampleData();
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      this.isConnected = false;
    }
  }

  async initializeSampleData() {
    try {
      // Check if cars collection is empty
      const carCount = await Car.countDocuments();
      if (carCount === 0) {
        console.log('🔄 Initializing sample car data...');
        const sampleCars = [
          { name: 'Maserati 3200 GT', category: 'Luxury Coupe', description: 'Classic Italian luxury coupe', base_price: 85000, image: '1998-Maserati-3200-GT-001-2160.jpg' },
          { name: 'Dodge Challenger SRT Hellcat', category: 'Muscle Car', description: 'American muscle with supercharged power', base_price: 75000, image: '2022-Dodge-Challenger-SRT-Hellcat-Jailbreak-001-2160.jpg' },
          { name: 'GMC Hummer EV', category: 'Electric SUV', description: 'Electric off-road powerhouse', base_price: 120000, image: '2022-GMC-Hummer-EV-001-2160.jpg' },
          { name: 'Jaguar F-Type', category: 'Sports Car', description: 'British sports car elegance', base_price: 65000, image: '2018-Jaguar-F-Type-001-2000.jpg' },
          { name: 'BMW i7', category: 'Electric Luxury', description: 'Luxury electric sedan', base_price: 110000, image: '2023-BMW-i7-001-2160.jpg' },
          { name: 'Bentley Bentayga S', category: 'Luxury SUV', description: 'Ultimate luxury performance SUV', base_price: 200000, image: '2024-Bentley-Bentayga-S-Black-Edition-001-2160.jpg' },
          { name: 'Audi RS Q8 Performance', category: 'Performance SUV', description: 'High-performance luxury SUV', base_price: 130000, image: '2025-Audi-RS-Q8-Performance-001-2160.jpg' },
          { name: 'Cadillac Escalade V', category: 'Luxury SUV', description: 'American luxury with V8 power', base_price: 150000, image: '2023-Cadillac-Escalade-V-005-2160.jpg' },
          { name: 'Skoda 110 R Concept', category: 'Concept Car', description: 'Futuristic concept design', base_price: 95000, image: '2025-Skoda-110-R-Concept-001-2160.jpg' },
          { name: 'Bugatti Tourbillon', category: 'Hypercar', description: 'Ultimate hypercar performance', base_price: 500000, image: '2026-Bugatti-Tourbillon-001-2160.jpg' }
        ];
        await Car.insertMany(sampleCars);
        console.log('✅ Sample cars inserted successfully');
      }

      // Check if car options collection is empty
      const optionCount = await CarOption.countDocuments();
      if (optionCount === 0) {
        console.log('🔄 Initializing sample car options...');
        const sampleOptions = [
          // Engines
          { option_type: 'engine', name: 'V6 Turbo', price: 5000, description: 'Turbocharged V6 engine' },
          { option_type: 'engine', name: 'V8 Naturally Aspirated', price: 8000, description: 'Classic V8 engine' },
          { option_type: 'engine', name: 'V12 Twin Turbo', price: 15000, description: 'High-performance V12' },
          { option_type: 'engine', name: 'Electric Single Motor', price: 6000, description: 'Single motor electric' },
          { option_type: 'engine', name: 'Electric Dual Motor', price: 12000, description: 'Dual motor electric powertrain' },
          
          // Exhausts
          { option_type: 'exhaust', name: 'Sport Exhaust', price: 2000, description: 'Performance exhaust system' },
          { option_type: 'exhaust', name: 'Racing Exhaust', price: 3500, description: 'Track-focused exhaust' },
          { option_type: 'exhaust', name: 'Titanium Exhaust', price: 5000, description: 'Lightweight titanium system' },
          
          // Spoilers
          { option_type: 'spoiler', name: 'Carbon Fiber Spoiler', price: 1500, description: 'Lightweight carbon fiber' },
          { option_type: 'spoiler', name: 'Adjustable Wing', price: 2500, description: 'Adjustable rear wing' },
          { option_type: 'spoiler', name: 'GT Wing', price: 3000, description: 'High-downforce GT wing' },
          
          // Fabrics
          { option_type: 'fabric', name: 'Premium Leather', price: 3000, description: 'Luxury leather interior' },
          { option_type: 'fabric', name: 'Alcantara', price: 4000, description: 'High-end Alcantara fabric' },
          { option_type: 'fabric', name: 'Carbon Fiber Trim', price: 2500, description: 'Carbon fiber interior trim' }
        ];
        await CarOption.insertMany(sampleOptions);
        console.log('✅ Sample car options inserted successfully');
      }

      console.log('✅ Database initialization completed');
    } catch (error) {
      console.error('❌ Error initializing sample data:', error);
    }
  }

  // Car Methods
  async getAllCars() {
    return await Car.find().sort({ createdAt: -1 });
  }

  async getCarById(id) {
    return await Car.findById(id);
  }

  async addCar(carData) {
    const car = new Car(carData);
    return await car.save();
  }

  async updateCar(id, carData) {
    return await Car.findByIdAndUpdate(id, { ...carData, updatedAt: new Date() }, { new: true });
  }

  async deleteCar(id) {
    const result = await Car.findByIdAndDelete(id);
    return result !== null;
  }

  // Car Options Methods
  async getOptionsByType(type) {
    return await CarOption.find({ option_type: type });
  }

  async getAllOptions() {
    return await CarOption.find();
  }

  // User Methods
  async createUser(name, email, phone = null) {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return existingUser;
    }

    const nameParts = name ? name.split(' ') : ['User'];
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || 'Guest';
    
    const user = new User({
      email,
      phone,
      firstName,
      lastName,
      isEmailVerified: false,
      isActive: true
    });
    
    const savedUser = await user.save();
    
    // Create default user profile
    const userProfile = new UserProfile({
      userId: savedUser._id,
      preferences: {
        notifications: {
          email: true,
          sms: false
        }
      }
    });
    await userProfile.save();
    
    return savedUser;
  }

  async getUserByEmail(email) {
    return await User.findOne({ email });
  }

  async getUserById(id) {
    return await User.findById(id);
  }

  async getAllUsers() {
    return await User.find().sort({ createdAt: -1 });
  }

  async updateUser(id, userData) {
    return await User.findByIdAndUpdate(id, { ...userData, updatedAt: new Date() }, { new: true });
  }

  // User Profile Methods
  async getUserProfile(userId) {
    return await UserProfile.findOne({ userId }).populate('userId');
  }

  async updateUserProfile(userId, profileData) {
    return await UserProfile.findOneAndUpdate(
      { userId },
      { ...profileData, updatedAt: new Date() },
      { new: true, upsert: true }
    );
  }

  // Favorites Methods
  async saveFavorite(userId, carId, config) {
    const favorite = new Favorite({
      user_id: userId,
      car_id: carId,
      configuration: config
    });
    return await favorite.save();
  }

  async getFavoritesByUser(userId) {
    return await Favorite.find({ user_id: userId }).populate('car_id');
  }

  async deleteFavorite(id) {
    const result = await Favorite.findByIdAndDelete(id);
    return result !== null;
  }

  // Orders Methods
  async createOrder(userId, carId, config) {
    try {
      // Validate carId - if it's 'custom-build' or invalid, set to null
      let validCarId = null;
      if (carId && carId !== 'custom-build' && mongoose.Types.ObjectId.isValid(carId)) {
        validCarId = carId;
      }
      
      const order = new Order({
        user_id: userId,
        car_id: validCarId,
        configuration: config,
        status: 'pending'
      });
      return await order.save();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async getOrdersByUser(userId) {
    return await Order.find({ user_id: userId }).populate('car_id').sort({ createdAt: -1 });
  }

  async getAllOrders() {
    return await Order.find().populate('user_id').populate('car_id').sort({ createdAt: -1 });
  }

  async updateOrderStatus(id, status) {
    return await Order.findByIdAndUpdate(id, { status, updatedAt: new Date() }, { new: true });
  }

  // Additional Admin Methods
  async addOption(optionData) {
    const option = new CarOption(optionData);
    return await option.save();
  }

  async updateOption(id, optionData) {
    return await CarOption.findByIdAndUpdate(id, { ...optionData, updatedAt: new Date() }, { new: true });
  }

  async deleteOption(id) {
    const result = await CarOption.findByIdAndDelete(id);
    return result !== null;
  }

  async deleteUser(id) {
    // Also delete related data
    await UserProfile.deleteMany({ userId: id });
    await Favorite.deleteMany({ user_id: id });
    await Order.deleteMany({ user_id: id });
    
    const result = await User.findByIdAndDelete(id);
    return result !== null;
  }

  async deleteOrder(id) {
    const result = await Order.findByIdAndDelete(id);
    return result !== null;
  }

  async getAllFavorites() {
    return await Favorite.find().populate('user_id').populate('car_id').sort({ createdAt: -1 });
  }

  async getAllUserProfiles() {
    return await UserProfile.find().populate('userId').sort({ createdAt: -1 });
  }
}

module.exports = Database;