// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    console.log('Node.js แอปพลิเคชันพร้อมใช้งาน!');
    
    // เพิ่ม animation เมื่อโหลดหน้า
    addPageLoadAnimation();
    
    // เพิ่ม event listeners
    addButtonClickEffects();
    
    // ตรวจสอบการเชื่อมต่อฐานข้อมูล (ถ้าอยู่ในหน้าแรก)
    if (window.location.pathname === '/') {
        addDatabaseTestFeature();
    }
});

// เพิ่ม animation เมื่อโหลดหน้า
function addPageLoadAnimation() {
    const containers = document.querySelectorAll('.welcome-box, .info-box, .users-container, .error-container');
    
    containers.forEach((container, index) => {
        container.style.opacity = '0';
        container.style.transform = 'translateY(20px)';
        container.style.transition = 'all 0.6s ease';
        
        setTimeout(() => {
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

// เพิ่มเอฟเฟกต์คลิกปุ่ม
function addButtonClickEffects() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // สร้าง ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.position = 'absolute';
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.background = 'rgba(255, 255, 255, 0.4)';
            ripple.style.borderRadius = '50%';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s linear';
            ripple.style.pointerEvents = 'none';
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            }, 600);
        });
    });
    
    // เพิ่ม CSS animation สำหรับ ripple effect
    if (!document.querySelector('#ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// เพิ่มฟีเจอร์ทดสอบฐานข้อมูล
function addDatabaseTestFeature() {
    const dbTestButton = document.querySelector('a[href="/test-db"]');
    
    if (dbTestButton) {
        dbTestButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // แสดง loading state
            const originalText = this.textContent;
            this.textContent = 'กำลังทดสอบ...';
            this.style.opacity = '0.7';
            this.style.pointerEvents = 'none';
            
            // ทำการทดสอบการเชื่อมต่อ
            fetch('/test-db')
                .then(response => response.json())
                .then(data => {
                    showNotification(
                        data.success ? 'success' : 'error',
                        data.message,
                        data.data ? `เวลาปัจจุบันจากฐานข้อมูล: ${new Date(data.data.CurrentTime).toLocaleString('th-TH')}` : null
                    );
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', error.message);
                })
                .finally(() => {
                    // คืนค่าปุ่มเดิม
                    this.textContent = originalText;
                    this.style.opacity = '1';
                    this.style.pointerEvents = 'auto';
                });
        });
    }
}

// แสดง notification
function showNotification(type, message, details = null) {
    // ลบ notification เก่า (ถ้ามี)
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // สร้าง notification ใหม่
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                ${type === 'success' ? '✅' : '❌'}
            </div>
            <div class="notification-message">
                <strong>${message}</strong>
                ${details ? `<br><small>${details}</small>` : ''}
            </div>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // เพิ่ม styles สำหรับ notification
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
                animation: slideIn 0.3s ease-out;
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
                align-items: flex-start;
                padding: 16px;
                gap: 12px;
            }
            
            .notification-icon {
                font-size: 1.2rem;
                flex-shrink: 0;
            }
            
            .notification-message {
                flex: 1;
                line-height: 1.4;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                opacity: 0.7;
                padding: 0;
                width: 24px;
                height: 24px;
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
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // เพิ่ม notification เข้าไปในหน้า
    document.body.appendChild(notification);
    
    // เพิ่ม event listener สำหรับปิด notification
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
    
    // ปิด notification อัตโนมัติหลัง 5 วินาที
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// เพิ่มฟังก์ชันสำหรับ smooth scroll
function addSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// เพิ่มฟังก์ชันสำหรับ form validation (สำหรับใช้ในอนาคต)
function addFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = '#dc3545';
                    field.style.backgroundColor = '#fff5f5';
                } else {
                    field.style.borderColor = '#28a745';
                    field.style.backgroundColor = '#f8fff8';
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                showNotification('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
            }
        });
    });
}

// เพิ่มฟังก์ชันสำหรับ responsive table
function makeTablesResponsive() {
    const tables = document.querySelectorAll('.users-table');
    
    tables.forEach(table => {
        // เพิ่ม scroll indicator
        const wrapper = document.createElement('div');
        wrapper.className = 'table-scroll-wrapper';
        wrapper.style.position = 'relative';
        
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
        
        // ตรวจสอบว่าตารางมี scroll หรือไม่
        function checkScroll() {
            if (table.scrollWidth > wrapper.clientWidth) {
                wrapper.setAttribute('data-scrollable', 'true');
            } else {
                wrapper.removeAttribute('data-scrollable');
            }
        }
        
        window.addEventListener('resize', checkScroll);
        checkScroll();
    });
}

// เรียกใช้ฟังก์ชันเพิ่มเติม
document.addEventListener('DOMContentLoaded', function() {
    addSmoothScrolling();
    addFormValidation();
    makeTablesResponsive();
});