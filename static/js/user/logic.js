function openForm() {
    document.getElementById("modal").style.display = "flex";
    document.body.style.overflow = "hidden"; // prevent scroll
}

function closeForm() {
    document.getElementById("modal").style.display = "none";
    document.body.style.overflow = "auto";
}

// Vendor Registration Handler
document.addEventListener('DOMContentLoaded', function() {
    const registerBtn = document.querySelector('.submit-btn');

    if(registerBtn) {
        registerBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // Get form data
            const form = document.querySelector('.form-box');
            const inputs = form.querySelectorAll('input, select');
            const emailInput = form.querySelector('input[type="email"]');
            let isValid = true;

            // Basic validation
            inputs.forEach(input => {
                if(input.type !== 'submit' && !input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = '#ff6b6b';
                } else {
                    input.style.borderColor = '#ddd';
                }
            });

            if(!isValid) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }

            // Show success popup with email notification
            showVendorPopup(emailInput.value);

            // Close modal and submit form after popup
            setTimeout(() => {
                closeForm();
                form.submit();
            }, 3000);
        });
    }
});

function showVendorPopup(email) {
    // Create popup overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;

    // Create popup content
    const popup = document.createElement('div');
    popup.style.cssText = `
        background: linear-gradient(135deg, #89c3ea, #18aef3);
        color: white;
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        max-width: 500px;
        margin: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        animation: slideUp 0.4s ease;
        position: relative;
    `;

    popup.innerHTML = `
        <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
        <h2 style="margin-bottom: 15px; font-size: 28px; font-weight: 700;">Welcome to Event Nest!</h2>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            OK, we will add you to our website as a vendor. We will update you soon!
        </p>
        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <i class="fas fa-envelope" style="margin-right: 10px;"></i>
            <span style="font-weight: 600;">Email Notification Sent!</span><br>
            <small>Check your email (${email}) for vendor registration details</small>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
            background: white;
            color: #18aef3;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Got it!</button>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Simulate email notification
    simulateEmailNotification(email);
}

function simulateEmailNotification(email) {
    // This would normally send an actual email
    // For demo purposes, we'll show a console message
    console.log('📧 Email notification sent to vendor:');
    console.log('To:', email);
    console.log('Subject: Welcome to Event Nest - Vendor Registration');
    console.log('Body: Thank you for registering as a vendor. We will review your application and get back to you within 24-48 hours.');
    console.log('From: Event Nest Team <noreply@eventnest.com>');

    // You could integrate with an email service here like:
    // - EmailJS
    // - SendGrid
    // - Firebase Functions
    // - Your backend API
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ff6b6b' : '#4ecdc4'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: 600;
        z-index: 10001;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add required CSS animations
if(!document.querySelector('style[data-vendor-styles]')) {
    const style = document.createElement('style');
    style.setAttribute('data-vendor-styles', 'true');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
    `;
    document.head.appendChild(style);
}