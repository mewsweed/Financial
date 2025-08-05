// Login page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    // Initialize form
    initializeForm();
    
    // Form validation and submission
    loginForm.addEventListener('submit', handleFormSubmit);
    
    // Input validation
    usernameInput.addEventListener('input', validateUsername);
    passwordInput.addEventListener('input', validatePassword);
    
    // Auto-focus first empty field
    if (!usernameInput.value) {
        usernameInput.focus();
    } else if (!passwordInput.value) {
        passwordInput.focus();
    }
});

function initializeForm() {
    // Add loading animation on page load
    const card = document.querySelector('.login-card');
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        card.style.transition = 'all 0.6s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 100);
    
    // Add input focus effects
    const inputs = document.querySelectorAll('input[type="text"], input[type="password"]');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    // Validate form
    if (!validateForm(username, password)) {
        return;
    }
    
    // Show loading state
    showLoadingState();
    
    // Submit form data
    submitLogin(username, password, remember);
}

function validateForm(username, password) {
    let isValid = true;
    
    // Clear previous errors
    clearErrors();
    
    // Validate username
    if (!username) {
        showFieldError('username', 'กรุณากรอกชื่อผู้ใช้');
        isValid = false;
    } else if (username.length < 3) {
        showFieldError('username', 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร');
        isValid = false;
    }
    
    // Validate password
    if (!password) {
        showFieldError('password', 'กรุณากรอกรหัสผ่าน');
        isValid = false;
    } else if (password.length < 6) {
        showFieldError('password', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        isValid = false;
    }
    
    return isValid;
}

function validateUsername() {
    const username = this.value.trim();
    if (username && username.length >= 3) {
        this.style.borderColor = '#48bb78';
        clearFieldError('username');
    }
}

function validatePassword() {
    const password = this.value;
    if (password && password.length >= 6) {
        this.style.borderColor = '#48bb78';
        clearFieldError('password');
    }
}

function showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName);
    field.style.borderColor = '#e53e3e';
    
    // Remove existing error message
    const existingError = field.parentElement.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: #e53e3e;
        font-size: 0.8rem;
        margin-top: 4px;
        display: flex;
        align-items: center;
        gap: 4px;
    `;
    
    field.parentElement.appendChild(errorDiv);
}

function clearFieldError(fieldName) {
    const field = document.getElementById(fieldName);
    const errorDiv = field.parentElement.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
    field.style.borderColor = '#e2e8f0';
}

function clearErrors() {
    const errorDivs = document.querySelectorAll('.field-error');
    errorDivs.forEach(div => div.remove());
    
    const inputs = document.querySelectorAll('input[type="text"], input[type="password"]');
    inputs.forEach(input => {
        input.style.borderColor = '#e2e8f0';
    });
}

function showLoadingState() {
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');
    
    loginBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
}

function hideLoadingState() {
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');
    
    loginBtn.disabled = false;
    btnText.style.display = 'block';
    btnLoading.style.display = 'none';
}

async function submitLogin(username, password, remember) {
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
                remember: remember
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // Success - show success message and redirect
            showNotification('success', result.message || 'เข้าสู่ระบบสำเร็จ!');
            
            setTimeout(() => {
                window.location.href = result.redirectUrl || '/dashboard';
            }, 1500);
            
        } else {
            // Error - show error message
            hideLoadingState();
            showNotification('error', result.message || 'การเข้าสู่ระบบล้มเหลว');
            
            // Focus on username field for retry
            document.getElementById('username').focus();
        }
        
    } catch (error) {
        console.error('Login error:', error);
        hideLoadingState();
        showNotification('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
}

function showNotification(type, message) {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                ${type === 'success' ? '✅' : '❌'}
            </div>
            <div class="notification-message">
                ${message}
            </div>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Add styles if not exist
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                max-width: 400px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                animation: slideInRight 0.3s ease-out;
            }
            
            .notification-success {
                background: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
            }
            
            .notification-error {
                background: #f8d7da;
                border: 1px solid #f5c6cb;
                color: #721c24;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                gap: 8px;
            }
            
            .notification-icon {
                font-size: 1.1rem;
                flex-shrink: 0;
            }
            
            .notification-message {
                flex: 1;
                font-weight: 500;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                opacity: 0.7;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
            }
            
            .notification-close:hover {
                opacity: 1;
                background: rgba(0, 0, 0, 0.1);
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideInRight 0.3s ease-in reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Password toggle functionality
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.innerHTML = `
            <path d="M12 7C9.24 7 7 9.24 7 12S9.24 17 12 17 17 14.76 17 12 14.76 7 12 7ZM12 4.5C16.5 4.5 20.27 7.61 21 12C20.27 16.39 16.5 19.5 12 19.5S3.73 16.39 3 12C3.73 7.61 7.5 4.5 12 4.5Z" fill="currentColor"/>
            <path d="M3 3L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        `;
    } else {
        passwordInput.type = 'password';
        eyeIcon.innerHTML = `
            <path d="M12 4.5C7.5 4.5 3.73 7.61 3 12C3.73 16.39 7.5 19.5 12 19.5S20.27 16.39 21 12C20.27 7.61 16.5 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12S9.24 7 12 7 17 9.24 17 12 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12S10.34 15 12 15 15 13.66 15 12 13.66 9 12 9Z" fill="currentColor"/>
        `;
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Enter key to submit form
    if (e.key === 'Enter' && document.activeElement.tagName !== 'BUTTON') {
        const loginForm = document.getElementById('loginForm');
        loginForm.dispatchEvent(new Event('submit'));
    }
    
    // Escape key to clear form
    if (e.key === 'Escape') {
        clearForm();
    }
});

function clearForm() {
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('remember').checked = false;
    clearErrors();
    document.getElementById('username').focus();
}

// Auto-save username if remember is checked
document.getElementById('remember').addEventListener('change', function() {
    if (this.checked) {
        const username = document.getElementById('username').value;
        if (username) {
            localStorage.setItem('rememberedUsername', username);
        }
    } else {
        localStorage.removeItem('rememberedUsername');
    }
});

// Load remembered username on page load
window.addEventListener('load', function() {
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    if (rememberedUsername) {
        document.getElementById('username').value = rememberedUsername;
        document.getElementById('remember').checked = true;
        document.getElementById('password').focus();
    }
});