// Emergency Profile Fix - Load this FIRST
(function() {
    console.log('=== PROFILE FIX SCRIPT LOADED ===');
    
    // Check localStorage immediately
    const userData = localStorage.getItem('mns_user');
    console.log('User data in localStorage:', userData);
    
    if (userData) {
        console.log('User is logged in! Forcing profile dashboard to show...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', showProfileDashboard);
        } else {
            showProfileDashboard();
        }
    }
    
    function showProfileDashboard() {
        console.log('Attempting to show profile dashboard...');
        
        const authContainer = document.getElementById('auth-container');
        const profileDashboard = document.getElementById('profile-dashboard');
        
        console.log('Auth container found:', !!authContainer);
        console.log('Profile dashboard found:', !!profileDashboard);
        
        if (authContainer && profileDashboard) {
            // Hide auth container
            authContainer.style.display = 'none';
            authContainer.classList.add('hidden');
            
            // Show profile dashboard
            profileDashboard.style.display = 'block';
            profileDashboard.classList.remove('hidden');
            
            console.log('✅ Profile dashboard should now be visible!');
            
            // Populate user data
            try {
                const user = JSON.parse(userData);
                console.log('Parsed user:', user);
                
                // Update profile name and email
                const profileName = document.getElementById('profile-name');
                const profileEmail = document.getElementById('profile-email');
                
                if (profileName) {
                    const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'User';
                    profileName.textContent = fullName;
                    console.log('Set profile name to:', fullName);
                }
                
                if (profileEmail) {
                    profileEmail.textContent = user.email || '';
                    console.log('Set profile email to:', user.email);
                }
                
                // Populate form fields
                populateFormFields(user);
                
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        } else {
            console.error('❌ Could not find required elements!');
            if (!authContainer) console.error('Missing: auth-container');
            if (!profileDashboard) console.error('Missing: profile-dashboard');
        }
    }
    
    function populateFormFields(user) {
        console.log('Populating form fields...');
        
        // Personal info fields
        const fields = {
            'edit-firstname': user.firstName,
            'edit-lastname': user.lastName,
            'edit-email': user.email,
            'edit-phone': user.phone,
            'edit-gender': user.gender
        };
        
        Object.keys(fields).forEach(id => {
            const element = document.getElementById(id);
            if (element && fields[id]) {
                element.value = fields[id];
                console.log(`Set ${id} to:`, fields[id]);
            }
        });
        
        // Date of birth
        if (user.dateOfBirth) {
            const dobField = document.getElementById('edit-dob');
            if (dobField) {
                dobField.value = new Date(user.dateOfBirth).toISOString().split('T')[0];
            }
        }
        
        // Address fields
        if (user.address) {
            const addressFields = {
                'edit-street': user.address.street,
                'edit-city': user.address.city,
                'edit-state': user.address.state,
                'edit-zip': user.address.zipCode,
                'edit-country': user.address.country
            };
            
            Object.keys(addressFields).forEach(id => {
                const element = document.getElementById(id);
                if (element && addressFields[id]) {
                    element.value = addressFields[id];
                }
            });
        }
        
        console.log('✅ Form fields populated');
    }
    
    console.log('=== PROFILE FIX SCRIPT READY ===');
})();
