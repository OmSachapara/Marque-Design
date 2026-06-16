const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const { 
    generateToken, 
    authenticate, 
    checkLoginRateLimit, 
    validateRegistration, 
    validateLogin 
} = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user
        const user = new User({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            password,
            phone: phone?.trim()
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id);

        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: user.getPublicProfile(),
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

// Login user
router.post('/login', checkLoginRateLimit, validateLogin, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Login failed',
                error: err.message
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: info.message || 'Invalid credentials'
            });
        }

        req.logIn(user, (err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Login failed',
                    error: err.message
                });
            }

            // Generate token
            const token = generateToken(user._id);

            // Set token in cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });

            res.json({
                success: true,
                message: 'Login successful',
                user: user.getPublicProfile(),
                token
            });
        });
    })(req, res, next);
});

// Logout user
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Logout failed'
            });
        }

        // Clear token cookie
        res.clearCookie('token');
        
        res.json({
            success: true,
            message: 'Logout successful'
        });
    });
});

// Get current user
router.get('/me', authenticate, (req, res) => {
    res.json({
        success: true,
        user: req.user.getPublicProfile()
    });
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
    try {
        const allowedUpdates = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'address', 'preferences'];
        const updates = {};

        // Filter allowed updates
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(400).json({
            success: false,
            message: 'Profile update failed',
            error: error.message
        });
    }
});

// Update personal information
router.put('/profile/personal', authenticate, async (req, res) => {
    try {
        const { firstName, lastName, dateOfBirth, age, gender } = req.body;
        
        const updates = {
            firstName: firstName?.trim(),
            lastName: lastName?.trim(),
            dateOfBirth,
            gender
        };

        // Remove undefined values
        Object.keys(updates).forEach(key => {
            if (updates[key] === undefined) {
                delete updates[key];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'Personal information updated successfully',
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Personal info update error:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update personal information',
            error: error.message
        });
    }
});

// Update email
router.put('/profile/email', authenticate, async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if email is already taken
        const existingUser = await User.findOne({ 
            email: email.toLowerCase(),
            _id: { $ne: req.user._id }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email is already in use'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { 
                email: email.toLowerCase().trim(),
                isEmailVerified: false // Reset verification when email changes
            },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'Email updated successfully',
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Email update error:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update email',
            error: error.message
        });
    }
});

// Update phone
router.put('/profile/phone', authenticate, async (req, res) => {
    try {
        const { phone } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { 
                phone: phone?.trim() || null,
                phoneVerified: false // Reset verification when phone changes
            },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'Phone number updated successfully',
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Phone update error:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update phone number',
            error: error.message
        });
    }
});

// Email verification endpoints (placeholder)
router.post('/profile/verify-email', authenticate, async (req, res) => {
    try {
        // In a real implementation, you would send an email with verification link
        res.json({
            success: true,
            message: 'Verification email sent (placeholder - not actually sent)'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send verification email'
        });
    }
});

// Phone verification endpoints (placeholder)
router.post('/profile/verify-phone', authenticate, async (req, res) => {
    try {
        // In a real implementation, you would send SMS with verification code
        res.json({
            success: true,
            message: 'Verification code sent (placeholder - not actually sent)'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send verification code'
        });
    }
});

router.post('/profile/confirm-phone', authenticate, async (req, res) => {
    try {
        const { code } = req.body;
        
        // In a real implementation, you would verify the code
        if (code === '123456') { // Placeholder verification
            const user = await User.findByIdAndUpdate(
                req.user._id,
                { phoneVerified: true },
                { new: true }
            ).select('-password');

            res.json({
                success: true,
                message: 'Phone number verified successfully',
                user: user.getPublicProfile()
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid verification code'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to verify phone number'
        });
    }
});

// Change password
router.put('/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        const user = await User.findById(req.user._id);
        
        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Password change failed',
            error: error.message
        });
    }
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
    (req, res) => {
        // Generate token
        const token = generateToken(req.user._id);

        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Store user data in localStorage via a redirect page
        const userProfile = req.user.getPublicProfile();
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Google Sign In Success</title>
                <style>
                    body {
                        font-family: 'Inter', sans-serif;
                        background: linear-gradient(135deg, #0a0f1f 0%, #111a2e 100%);
                        color: #f5f7fb;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        text-align: center;
                    }
                    .success-container {
                        background: rgba(17,26,46,.55);
                        border: 1px solid rgba(255,255,255,.08);
                        border-radius: 16px;
                        padding: 2rem;
                        backdrop-filter: saturate(140%) blur(8px);
                        box-shadow: 0 10px 30px rgba(0,0,0,.35);
                        max-width: 400px;
                    }
                    .success-icon {
                        font-size: 3rem;
                        color: #d4af37;
                        margin-bottom: 1rem;
                    }
                    h1 {
                        color: #d4af37;
                        margin-bottom: 1rem;
                        font-size: 1.5rem;
                    }
                    p {
                        color: #b7c0cf;
                        margin-bottom: 1.5rem;
                    }
                    .loading {
                        display: inline-block;
                        width: 20px;
                        height: 20px;
                        border: 2px solid #b7c0cf;
                        border-top: 2px solid #d4af37;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </head>
            <body>
                <div class="success-container">
                    <div class="success-icon">✓</div>
                    <h1>Sign In Successful!</h1>
                    <p>Welcome, ${userProfile.firstName}!</p>
                    <div class="loading"></div>
                    <p>Redirecting to home page...</p>
                </div>
                <script>
                    // Store user data in localStorage
                    localStorage.setItem('mns_user', JSON.stringify(${JSON.stringify(userProfile)}));
                    
                    // Redirect to home page
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1500);
                </script>
            </body>
            </html>
        `);
    }
);

// Google OAuth error callback
router.get('/google/callback/error', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Google Sign In Error</title>
            <style>
                body {
                    font-family: 'Inter', sans-serif;
                    background: linear-gradient(135deg, #0a0f1f 0%, #111a2e 100%);
                    color: #f5f7fb;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    text-align: center;
                }
                .error-container {
                    background: rgba(17,26,46,.55);
                    border: 1px solid rgba(255,71,87,.3);
                    border-radius: 16px;
                    padding: 2rem;
                    backdrop-filter: saturate(140%) blur(8px);
                    box-shadow: 0 10px 30px rgba(0,0,0,.35);
                    max-width: 400px;
                }
                .error-icon {
                    font-size: 3rem;
                    color: #ff4757;
                    margin-bottom: 1rem;
                }
                h1 {
                    color: #ff4757;
                    margin-bottom: 1rem;
                    font-size: 1.5rem;
                }
                p {
                    color: #b7c0cf;
                    margin-bottom: 1.5rem;
                }
            </style>
        </head>
        <body>
            <div class="error-container">
                <div class="error-icon">✗</div>
                <h1>Sign In Failed</h1>
                <p>Google authentication was unsuccessful. Please try again.</p>
            </div>
            <script>
                // Send error message to parent window
                if (window.opener) {
                    window.opener.postMessage({
                        type: 'GOOGLE_AUTH_ERROR',
                        message: 'Google authentication failed'
                    }, window.location.origin);
                    window.close();
                } else {
                    // Fallback redirect if not in popup
                    setTimeout(() => {
                        window.location.href = '/profile?error=google_auth_failed';
                    }, 3000);
                }
            </script>
        </body>
        </html>
    `);
});

// Google ID Token verification route
router.post('/google/token', async (req, res) => {
    try {
        const { idToken } = req.body;
        
        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'ID token is required'
            });
        }

        // Here you would verify the Google ID token
        // For now, we'll use the existing popup flow
        res.json({
            success: false,
            message: 'Please use the popup authentication method',
            usePopup: true
        });
    } catch (error) {
        console.error('Google token verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Token verification failed'
        });
    }
});

// Apple OAuth routes (placeholder - requires additional setup)
router.get('/apple', (req, res) => {
    // Apple Sign In requires client-side implementation
    res.json({
        success: false,
        message: 'Apple Sign In should be implemented on the client side',
        redirectUrl: 'https://appleid.apple.com/auth/authorize'
    });
});

// Delete account
router.delete('/account', authenticate, async (req, res) => {
    try {
        const { password } = req.body;

        // Verify password for non-OAuth users
        if (req.user.password) {
            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'Password is required to delete account'
                });
            }

            const isMatch = await req.user.comparePassword(password);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Incorrect password'
                });
            }
        }

        // Soft delete - deactivate account
        await User.findByIdAndUpdate(req.user._id, { isActive: false });

        // Clear token cookie
        res.clearCookie('token');

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Account deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Account deletion failed',
            error: error.message
        });
    }
});

module.exports = router;