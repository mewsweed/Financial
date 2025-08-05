// Register page JavaScript
let fullNameInput, emailInput, usernameInput, passwordInput, confirmPasswordInput, termsCheckbox;

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const registerBtn = document.getElementById('registerBtn');
    
    // Form inputs - assign to global variables
    fullNameInput = document.getElementById('fullName');
    emailInput = document.getElementById('email');
    usernameInput = document.getElementById('username');
    passwordInput = document.getElementById('password');
    confirmPasswordInput = document.getElementById('confirmPassword');
    termsCheckbox = document.getElementById('terms');
    
    // Initialize form
    initializeForm();
    
    // Event listeners
    registerForm.addEventListener('submit', handleFormSubmit);
    
    // Real-time validation
    fullNameInput.addEventListener('input', validateFullName);
    emailInput.addEventListener('input', validateEmail);
    usernameInput.addEventListener('input', debounce(validateUsername, 500));
    passwordInput.addEventListener('input', validatePassword);
    confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    termsCheckbox.addEventListener('change', validateTerms);
    
    // Auto-focus first field
    fullNameInput.focus();
});

function initializeForm() {
    // Add loading animation
    const card = document.querySelector('.register-card');
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        card.style.transition = 'all 0.6s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 100);
    
    // Initialize password strength indicator
    createPasswordStrengthIndicator();
    
    // Initialize password match indicator
    createPasswordMatchIndicator();
}

function createPasswordStrengthIndicator() {
    const passwordStrength = document.getElementById('passwordStrength');
    passwordStrength.innerHTML = `
        <div class="strength-bar">
            <div class="strength-fill" id="strengthFill"></div>
        </div>
        <div class="strength-text" id="strengthText">
            <span>ความแข็งแกร่งของรหัสผ่าน</span>
            <span id="strengthLevel"></span>
        </div>
        <div class="strength-requirements">
            <ul id="strengthRequirements">
                <li id="req-length">อย่างน้อย 6 ตัวอักษร</li>
                <li id="req-upper">ตัวพิมพ์ใหญ่</li>
                <li id="req-lower">ตัวพิมพ์เล็ก</li>
                <li id="req-number">ตัวเลข</li>
            </ul>
        </div>
    `;
}

function createPasswordMatchIndicator() {
    const passwordMatch = document.getElementById('passwordMatch');
    // Initially empty, will be populated when user starts typing
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        fullName: fullNameInput.value.trim(),
        email: emailInput.value.trim(),
        username: usernameInput.value.trim(),
        password: passwordInput.value,
        confirmPassword: confirmPasswordInput.value,
        terms: termsCheckbox.checked
    };
    
    // Validate form
    if (!validateForm(formData)) {
        return;
    }
    
    // Show loading state
    showLoadingState();
    
    // Submit registration
    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showSuccessState(result.message);
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
            
        } else {
            hideLoadingState();
            showNotification('error', result.message || 'การสมัครสมาชิกล้มเหลว');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        hideLoadingState();
        showNotification('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
}

function validateForm(data) {
    let isValid = true;
    
    // Clear previous errors
    clearAllErrors();
    
    // Validate full name
    if (!data.fullName || data.fullName.length < 2) {
        showFieldError('fullName', 'กรุณากรอกชื่อ-นามสกุล (อย่างน้อย 2 ตัวอักษร)');
        isValid = false;
    }
    
    // Validate email
    if (!data.email || !isValidEmail(data.email)) {
        showFieldError('email', 'กรุณากรอกอีเมลที่ถูกต้อง');
        isValid = false;
    }
    
    // Validate username
    if (!data.username || !isValidUsername(data.username)) {
        showFieldError('username', 'ชื่อผู้ใช้ต้องมี 3-20 ตัวอักษร (a-z, 0-9, _)');
        isValid = false;
    }
    
    // Validate password
    const passwordStrength = checkPasswordStrength(data.password);
    if (passwordStrength.score < 2) {
        showFieldError('password', 'รหัสผ่านไม่แข็งแกร่งพอ');
        isValid = false;
    }
    
    // Validate password match
    if (data.password !== data.confirmPassword) {
        showFieldError('confirmPassword', 'รหัสผ่านไม่ตรงกัน');
        isValid = false;
    }
    
    // Validate terms
    if (!data.terms) {
        showNotification('error', 'กรุณายอมรับเงื่อนไขการใช้งาน');
        isValid = false;
    }
    
    return isValid;
}

function validateFullName() {
    const fullName = this.value.trim();
    const inputGroup = this.parentElement;
    
    if (fullName.length >= 2) {
        inputGroup.classList.add('valid');
        inputGroup.classList.remove('invalid');
        clearFieldError('fullName');
    } else if (fullName.length > 0) {
        inputGroup.classList.add('invalid');
        inputGroup.classList.remove('valid');
    } else {
        inputGroup.classList.remove('valid', 'invalid');
    }
}

function validateEmail() {
    const email = this.value.trim();
    const inputGroup = this.parentElement;
    
    if (isValidEmail(email)) {
        inputGroup.classList.add('valid');
        inputGroup.classList.remove('invalid');
        clearFieldError('email');
    } else if (email.length > 0) {
        inputGroup.classList.add('invalid');
        inputGroup.classList.remove('valid');
    } else {
        inputGroup.classList.remove('valid', 'invalid');
    }
}

async function validateUsername() {
    const username = this.value.trim();
    const inputGroup = this.parentElement;
    const usernameStatus = document.getElementById('usernameStatus');
    
    if (username.length === 0) {
        inputGroup.classList.remove('valid', 'invalid');
        usernameStatus.textContent = '';
        usernameStatus.className = 'username-status';
        return;
    }
    
    if (!isValidUsername(username)) {
        inputGroup.classList.add('invalid');
        inputGroup.classList.remove('valid');
        usernameStatus.textContent = 'รูปแบบไม่ถูกต้อง';
        usernameStatus.className = 'username-status taken';
        return;
    }
    
    // Show checking state
    usernameStatus.textContent = 'กำลังตรวจสอบ...';
    usernameStatus.className = 'username-status checking';
    inputGroup.classList.add('checking-username');
    
    try {
        const response = await fetch('/check-username', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username })
        });
        
        const result = await response.json();
        
        if (result.available) {
            inputGroup.classList.add('valid');
            inputGroup.classList.remove('invalid');
            usernameStatus.textContent = 'ใช้ได้';
            usernameStatus.className = 'username-status available';
        } else {
            inputGroup.classList.add('invalid');
            inputGroup.classList.remove('valid');
            usernameStatus.textContent = 'ถูกใช้แล้ว';
            usernameStatus.className = 'username-status taken';
        }
        
    } catch (error) {
        console.error('Username check error:', error);
        usernameStatus.textContent = 'ไม่สามารถตรวจสอบได้';
        usernameStatus.className = 'username-status taken';
    } finally {
        inputGroup.classList.remove('checking-username');
    }
}

function validatePassword() {
    const password = this.value;
    const inputGroup = this.parentElement;
    const strength = checkPasswordStrength(password);
    
    updatePasswordStrengthDisplay(strength);
    
    if (strength.score >= 2) {
        inputGroup.classList.add('valid');
        inputGroup.classList.remove('invalid');
        clearFieldError('password');
    } else if (password.length > 0) {
        inputGroup.classList.add('invalid');
        inputGroup.classList.remove('valid');
    } else {
        inputGroup.classList.remove('valid', 'invalid');
    }
    
    // Also validate password match if confirm password has value
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (confirmPassword) {
        validatePasswordMatch.call(document.getElementById('confirmPassword'));
    }
}

function validatePasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = this.value;
    const inputGroup = this.parentElement;
    const passwordMatch = document.getElementById('passwordMatch');
    
    if (confirmPassword.length === 0) {
        inputGroup.classList.remove('valid', 'invalid');
        passwordMatch.textContent = '';
        passwordMatch.className = 'password-match';
        return;
    }
    
    if (password === confirmPassword) {
        inputGroup.classList.add('valid');
        inputGroup.classList.remove('invalid');
        passwordMatch.textContent = 'รหัสผ่านตรงกัน';
        passwordMatch.className = 'password-match match';
        clearFieldError('confirmPassword');
    } else {
        inputGroup.classList.add('invalid');
        inputGroup.classList.remove('valid');
        passwordMatch.textContent = 'รหัสผ่านไม่ตรงกัน';
        passwordMatch.className = 'password-match no-match';
    }
}

function validateTerms() {
    const termsGroup = this.closest('.form-options');
    
    if (this.checked) {
        termsGroup.classList.add('valid');
        termsGroup.classList.remove('invalid');
    } else {
        termsGroup.classList.add('invalid');
        termsGroup.classList.remove('valid');
    }
}

function checkPasswordStrength(password) {
    let score = 0;
    const requirements = {
        length: password.length >= 6,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    // Calculate score
    if (requirements.length) score++;
    if (requirements.upper) score++;
    if (requirements.lower) score++;
    if (requirements.number) score++;
    if (requirements.special) score++;
    
    let level = 'weak';
    if (score >= 4) level = 'strong';
    else if (score >= 3) level = 'good';
    else if (score >= 2) level = 'fair';
    
    return {
        score,
        level,
        requirements
    };
}

function updatePasswordStrengthDisplay(strength) {
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    const strengthLevel = document.getElementById('strengthLevel');
    
    // Update bar
    strengthFill.className = `strength-fill ${strength.level}`;
    
    // Update text
    strengthText.className = `strength-text ${strength.level}`;
    
    const levelTexts = {
        weak: 'อ่อน',
        fair: 'ปานกลาง',
        good: 'ดี',
        strong: 'แข็งแกร่ง'
    };
    
    strengthLevel.textContent = levelTexts[strength.level];
    
    // Update requirements
    const requirements = ['length', 'upper', 'lower', 'number'];
    requirements.forEach(req => {
        const element = document.getElementById(`req-${req}`);
        if (element) {
            if (strength.requirements[req]) {
                element.classList.add('met');
            } else {
                element.classList.remove('met');
            }
        }
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
}

function showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName);
    const inputGroup = field.parentElement;
    
    inputGroup.classList.add('invalid');
    inputGroup.classList.remove('valid');
    
    // Remove existing error
    const existingError = inputGroup.parentElement.querySelector('.field-error');
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
        animation: fadeInUp 0.3s ease;
    `;
    
    inputGroup.parentElement.appendChild(errorDiv);
}

function clearFieldError(fieldName) {
    const field = document.getElementById(fieldName);
    const inputGroup = field.parentElement;
    const errorDiv = inputGroup.parentElement.querySelector('.field-error');
    
    if (errorDiv) {
        errorDiv.remove();
    }
    
    inputGroup.classList.remove('invalid');
}

function clearAllErrors() {
    const errorDivs = document.querySelectorAll('.field-error');
    errorDivs.forEach(div => div.remove());
    
    const inputGroups = document.querySelectorAll('.input-group');
    inputGroups.forEach(group => {
        group.classList.remove('invalid');
    });
}

function showLoadingState() {
    const registerBtn = document.getElementById('registerBtn');
    const btnText = registerBtn.querySelector('.btn-text');
    const btnLoading = registerBtn.querySelector('.btn-loading');
    
    registerBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
}

function hideLoadingState() {
    const registerBtn = document.getElementById('registerBtn');
    const btnText = registerBtn.querySelector('.btn-text');
    const btnLoading = registerBtn.querySelector('.btn-loading');
    
    registerBtn.disabled = false;
    btnText.style.display = 'block';
    btnLoading.style.display = 'none';
}

function showSuccessState(message) {
    const registerCard = document.querySelector('.register-card');
    
    registerCard.innerHTML = `
        <div class="register-success">
            <div class="success-icon">✓</div>
            <h2>สมัครสมาชิกสำเร็จ!</h2>
            <p>${message}</p>
            <p>กำลังเปลี่ยนเส้นทางไปยังหน้าเข้าสู่ระบบ...</p>
            <div style="margin-top: 20px;">
                <div class="spinner" style="margin: 0 auto;"></div>
            </div>
        </div>
    `;
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
            <div class="notification-message">${message}</div>
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
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
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
function togglePassword(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    const eyeIcon = passwordInput.parentElement.querySelector('svg');
    
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

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}