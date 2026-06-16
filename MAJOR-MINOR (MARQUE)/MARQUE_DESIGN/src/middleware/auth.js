const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
};

// Verify JWT token
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

// Middleware to authenticate user
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                     req.cookies?.token || 
                     req.session?.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

// Middleware to check if user is authenticated (optional)
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                     req.cookies?.token || 
                     req.session?.token;

        if (token) {
            const decoded = verifyToken(token);
            const user = await User.findById(decoded.userId).select('-password');
            
            if (user && user.isActive) {
                req.user = user;
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication if token is invalid
        next();
    }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

// Rate limiting for login attempts
const loginRateLimit = {};

const checkLoginRateLimit = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 10;

    if (!loginRateLimit[ip]) {
        loginRateLimit[ip] = { attempts: 0, resetTime: now + windowMs };
    }

    const userLimit = loginRateLimit[ip];

    if (now > userLimit.resetTime) {
        userLimit.attempts = 0;
        userLimit.resetTime = now + windowMs;
    }

    if (userLimit.attempts >= maxAttempts) {
        return res.status(429).json({
            success: false,
            message: 'Too many login attempts. Please try again later.',
            retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
        });
    }

    userLimit.attempts++;
    next();
};

// Validation middleware
const validateRegistration = (req, res, next) => {
    const { firstName, lastName, email, password } = req.body;
    const errors = [];

    if (!firstName || firstName.trim().length < 2) {
        errors.push('First name must be at least 2 characters long');
    }

    if (!lastName || lastName.trim().length < 2) {
        errors.push('Last name must be at least 2 characters long');
    }

    if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        errors.push('Please provide a valid email address');
    }

    if (!password || password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email) {
        errors.push('Email is required');
    }

    if (!password) {
        errors.push('Password is required');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    next();
};

module.exports = {
    generateToken,
    verifyToken,
    authenticate,
    optionalAuth,
    requireAdmin,
    checkLoginRateLimit,
    validateRegistration,
    validateLogin
};