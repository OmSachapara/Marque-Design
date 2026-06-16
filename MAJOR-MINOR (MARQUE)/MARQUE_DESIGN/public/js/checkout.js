// Comprehensive Checkout System
document.addEventListener('DOMContentLoaded', async () => {
    const summary = document.getElementById('summary');
    const form = document.getElementById('checkout-form');
    
    // Try to get data from localStorage (new comprehensive system)
    let data = JSON.parse(localStorage.getItem('mns_checkout') || 'null');
    
    // Fallback: try URL parameters
    if (!data) {
        const urlParams = new URLSearchParams(window.location.search);
        const model = urlParams.get('model');
        const total = urlParams.get('total');
        const customization = urlParams.get('customization');
        
        if (model && total) {
            data = {
                carName: model,
                totalPrice: parseInt(total),
                selectedOptions: customization ? JSON.parse(customization) : {},
                config: {
                    totalPrice: parseInt(total),
                    customizations: customization ? JSON.parse(customization) : {}
                }
            };
        }
    }
    
    if (!data) {
        summary.innerHTML = `
            <h3>No Build Selected</h3>
            <p class="meta">Go to <a href="/customize" style="color: var(--accent);">Customize</a> to create your dream car.</p>
            <div style="text-align: center; margin: 2rem 0;">
                <a href="/customize" class="btn">Start Customizing</a>
            </div>
        `;
        return;
    }

    // Display comprehensive order summary with car image
    let summaryHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
            ${data.carImage ? `
                <div style="width: 80px; height: 60px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border);">
                    <img src="/images/${data.carImage}" alt="${data.carName}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
            ` : `
                <div style="width: 80px; height: 60px; border-radius: 8px; background: var(--accent); display: flex; align-items: center; justify-content: center; color: #1a1a1a;">
                    <i class="fas fa-car" style="font-size: 1.5rem;"></i>
                </div>
            `}
            <div>
                <h3 style="margin: 0; color: var(--text);">${data.carName || 'Custom Build'}</h3>
                ${data.carCategory ? `<p class="meta" style="margin: 0.25rem 0; color: var(--muted);">${data.carCategory}</p>` : ''}
                <p class="meta" style="color: var(--accent); font-weight: 600; margin: 0;">Base Price: $${(data.basePrice || 50000).toLocaleString()}</p>
            </div>
        </div>
    `;

    // Display customizations by category
    if (data.config && data.config.summary && data.config.summary.length > 0) {
        const categories = {};
        
        // Group by category
        data.config.summary.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = [];
            }
            categories[item.category].push(item);
        });

        // Display each category
        Object.entries(categories).forEach(([categoryName, items]) => {
            summaryHTML += `
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid var(--border);">
                    <h4 style="color: var(--accent); margin-bottom: 0.75rem; font-size: 1rem;">${categoryName}</h4>
            `;
            
            items.forEach(item => {
                summaryHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.25rem 0; font-size: 0.9rem;">
                        <span style="color: var(--text);">${item.name}</span>
                        <span style="color: var(--accent); font-weight: 600;">$${item.price.toLocaleString()}</span>
                    </div>
                `;
            });
            
            summaryHTML += `</div>`;
        });
    } else if (data.selectedOptions && Object.keys(data.selectedOptions).length > 0) {
        // Fallback: display selected options without categorization
        summaryHTML += `
            <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid var(--border);">
                <h4 style="color: var(--accent); margin-bottom: 0.75rem;">Selected Customizations</h4>
        `;
        
        Object.entries(data.selectedOptions).forEach(([key, value]) => {
            const displayName = key.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            const displayValue = value.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            summaryHTML += `
                <div style="padding: 0.25rem 0; font-size: 0.9rem; color: var(--text);">
                    <strong>${displayName}:</strong> ${displayValue}
                </div>
            `;
        });
        
        summaryHTML += `</div>`;
    }

    // Total price section
    summaryHTML += `
        <div style="margin-top: 1.5rem; padding: 1rem; background: linear-gradient(135deg, rgba(212,175,55,.15), rgba(246,226,122,.1)); border: 1px solid rgba(212,175,55,.3); border-radius: 12px; text-align: center;">
            <h3 style="color: var(--accent); margin: 0; font-size: 1.5rem; font-weight: 700;">
                Total Price: $${(data.totalPrice || data.basePrice || 50000).toLocaleString()}
            </h3>
        </div>
    `;

    summary.innerHTML = summaryHTML;

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Check if terms checkbox is checked
        const termsCheckbox = form.querySelector('input[type="checkbox"]');
        if (!termsCheckbox.checked) {
            // Show custom popup
            showCustomAlert('⚠️ Mandatory Field Required', 'The "I agree to the Privacy Policy and Terms of Service" checkbox is mandatory. Please check this box to proceed with your order.');
            return;
        }
        
        const name = document.getElementById('customer-name').value;
        const email = document.getElementById('customer-email').value;
        const phone = document.getElementById('customer-phone').value;
        const address = document.getElementById('customer-address').value;
        
        // Validate all required fields
        if (!name || !email || !phone || !address) {
            showCustomAlert('⚠️ Missing Information', 'Please fill in all required fields including delivery address.');
            return;
        }

        try {
            // First, try to get existing user by email
            let user = null;
            try {
                const getUserResponse = await fetch(`/api/users/${encodeURIComponent(email)}`);
                if (getUserResponse.ok) {
                    user = await getUserResponse.json();
                    console.log('Found existing user:', user);
                }
            } catch (err) {
                console.log('User not found, will create new one');
            }

            // If user doesn't exist, create new user
            if (!user) {
                const userResponse = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, phone })
                });

                if (!userResponse.ok) {
                    const errorData = await userResponse.json();
                    throw new Error(errorData.error || 'Failed to create user');
                }

                user = await userResponse.json();
                console.log('Created new user:', user);
            }

            // Create order in database
            const orderData = {
                userId: user._id || user.id,
                carId: data.carId || 'custom-build',
                config: {
                    carName: data.carName || 'Custom Build',
                    carCategory: data.carCategory || 'Custom',
                    basePrice: data.basePrice || 50000,
                    totalPrice: data.totalPrice || 0,
                    selectedOptions: data.selectedOptions || {},
                    summary: data.config?.summary || [],
                    customizations: data.config?.customizations || {}
                }
            };

            const orderResponse = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (!orderResponse.ok) {
                throw new Error('Failed to create order');
            }

            const order = await orderResponse.json();

            // Also store in localStorage as backup
            let orders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
            orders.push({
                orderId: order.id || 'ORD-' + Date.now(),
                customerName: name,
                customerEmail: email,
                customerPhone: phone,
                carModel: data.carName || 'Custom Build',
                customizations: data.selectedOptions || {},
                totalPrice: data.totalPrice || 0,
                basePrice: data.basePrice || 50000,
                orderDate: new Date().toISOString(),
                status: 'pending'
            });
            localStorage.setItem('customerOrders', JSON.stringify(orders));
            
            alert('Order placed successfully! Thank you for choosing MARQUE DESIGN.');
            localStorage.removeItem('mns_checkout');
            location.href = '/';
        } catch (error) {
            console.error('Failed to place order:', error);
            alert('Failed to place order. Please try again. Error: ' + error.message);
        }
    });
});


// Custom Alert Popup Function
function showCustomAlert(title, message) {
    // Remove existing alert if any
    const existingAlert = document.getElementById('custom-alert-modal');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Create custom alert modal
    const alertHTML = `
        <div id="custom-alert-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease-out;
        ">
            <div style="
                background: var(--card);
                border: 2px solid var(--accent);
                border-radius: 16px;
                padding: 40px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: slideInDown 0.4s ease-out;
                position: relative;
            ">
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="
                        width: 80px;
                        height: 80px;
                        margin: 0 auto 20px;
                        background: linear-gradient(135deg, var(--accent), var(--accent-2));
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 2.5rem;
                        animation: bounce 0.6s ease-out;
                    ">⚠️</div>
                    <h2 style="color: var(--accent); margin: 0 0 15px 0; font-size: 1.8rem;">${title}</h2>
                    <p style="color: var(--text); font-size: 1.1rem; line-height: 1.6; margin: 0;">${message}</p>
                </div>
                <button onclick="closeCustomAlert()" style="
                    width: 100%;
                    padding: 15px;
                    background: linear-gradient(135deg, var(--accent), var(--accent-2));
                    color: var(--brand);
                    border: none;
                    border-radius: 8px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 30px rgba(120, 93, 50, 0.4)';" onmouseout="this.style.transform=''; this.style.boxShadow='';">
                    Got It!
                </button>
            </div>
        </div>
    `;

    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideInDown {
            from {
                opacity: 0;
                transform: translateY(-50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

    // Add to body
    document.body.insertAdjacentHTML('beforeend', alertHTML);
}

function closeCustomAlert() {
    const modal = document.getElementById('custom-alert-modal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => modal.remove(), 300);
    }
}

// Add fadeOut animation
const fadeOutStyle = document.createElement('style');
fadeOutStyle.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(fadeOutStyle);
