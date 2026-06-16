const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Local Strategy
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
        }

        if (user.isLocked) {
            return done(null, false, { message: 'Account is temporarily locked due to too many failed login attempts' });
        }

        if (!user.isActive) {
            return done(null, false, { message: 'Account is deactivated' });
        }

        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            await user.incLoginAttempts();
            return done(null, false, { message: 'Invalid email or password' });
        }

        // Reset login attempts on successful login
        if (user.loginAttempts > 0) {
            await user.resetLoginAttempts();
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `http://localhost:${process.env.PORT || 3000}/api/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('🔵 Google OAuth callback received for:', profile.emails[0].value);
        
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
            console.log('✅ Existing Google user found:', user.email);
            // Update last login
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
        }

        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });
        
        if (user) {
            console.log('✅ Linking Google account to existing user:', user.email);
            // Link Google account to existing user
            user.googleId = profile.id;
            user.isEmailVerified = true;
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
        }

        // Create new user
        console.log('✅ Creating new Google user:', profile.emails[0].value);
        const newUser = new User({
            googleId: profile.id,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value.toLowerCase(),
            profileImage: profile.photos[0]?.value,
            isEmailVerified: true,
            lastLogin: new Date()
        });

        await newUser.save();
        console.log('✅ New Google user created successfully');
        return done(null, newUser);
    } catch (error) {
        console.error('❌ Google OAuth error:', error);
        return done(error, null);
    }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id).select('-password');
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;