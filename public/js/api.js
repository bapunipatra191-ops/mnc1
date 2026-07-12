// ==========================================================================
// API Utility & Common Shell Initializer
// ==========================================================================

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '/api'
  : 'https://mnc1-fbck.onrender.com/api';

// Toast Notification Manager
const showToast = (message, type = 'info') => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = message;

  container.appendChild(toast);

  // Auto-remove toast after 4s
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease-out reverse forwards';
    setTimeout(() => {
      if (toast.parentNode) {
        container.removeChild(toast);
      }
    }, 300);
  }, 4000);
};

// Fetch API Wrapper with JWT Authentication
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    
    if (response.status === 401 || response.status === 403) {
      // Session expired or unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      showToast('Session expired. Please log in again.', 'error');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
      throw new Error('Unauthorized');
    }

    return data;
  } catch (err) {
    console.error(`[API Error] endpoint: ${endpoint}`, err);
    throw err;
  }
};

// Authentication Guards
const checkAuth = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
  }
};

const checkAdmin = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    window.location.href = 'index.html';
    return;
  }
  const user = JSON.parse(userStr);
  if (user.role !== 'admin') {
    showToast('Access denied. Admin rights required.', 'error');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
  }
};

// Log Out Handler
const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showToast('Logged out successfully.', 'success');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
};

// Dynamic Sidebar Renderer
const injectSidebar = () => {
  const sidebarEl = document.getElementById('sidebar-placeholder');
  if (!sidebarEl) return;

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const username = user ? user.username : 'User';
  const role = user ? user.role : 'student';

  const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';

  let menuItems = [
    { name: 'Dashboard', icon: '📊', file: 'dashboard.html' },
    { name: 'Aptitude Practice', icon: '🧮', file: 'aptitude.html' },
    { name: 'Technical MCQs', icon: '💻', file: 'mcqs.html' },
    { name: 'Coding Sandbox', icon: '📝', file: 'coding.html' },
    { name: 'HR Interview Prep', icon: '🤝', file: 'hr.html' },
    { name: 'Company Sheets', icon: '🏢', file: 'company.html' },
    { name: 'Mock Tests', icon: '🎯', file: 'mocktests.html' }
  ];

  // If Admin user, display the Admin Panel menu link
  if (role === 'admin') {
    menuItems.push({ name: 'Admin Panel', icon: '🛡️', file: 'admin.html' });
  }

  const linksHtml = menuItems.map(item => {
    const isActive = currentPath === item.file ? 'active' : '';
    return `
      <li>
        <a href="${item.file}" class="sidebar-link ${isActive}">
          <span>${item.icon}</span>
          <span>${item.name}</span>
        </a>
      </li>
    `;
  }).join('');

  sidebarEl.innerHTML = `
    <nav class="sidebar">
      <div class="sidebar-logo">
        <span class="text-gradient">⭐</span>
        <span class="text-gradient">MNC Prep</span>
      </div>
      <ul class="sidebar-menu">
        ${linksHtml}
      </ul>
      <div class="sidebar-footer">
        <div class="user-profile-widget" style="margin-bottom: 15px;">
          <div class="avatar">${username[0].toUpperCase()}</div>
          <div>
            <div style="font-weight: 600; font-size: 0.9rem;">${username}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">${role}</div>
          </div>
        </div>
        <button onclick="handleLogout()" class="btn btn-secondary" style="width: 100%; padding: 10px;">
          <span>🚪</span> Logout
        </button>
      </div>
    </nav>
  `;
};

// Initialize common items
document.addEventListener('DOMContentLoaded', () => {
  injectSidebar();
  initMobileNav();
});

// Mobile hamburger menu toggle
function initMobileNav() {
  const sidebarEl = document.getElementById('sidebar-placeholder');
  if (!sidebarEl) return;

  // Inject overlay
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebar-overlay';
  document.body.appendChild(overlay);

  // Inject hamburger button
  const btn = document.createElement('button');
  btn.className = 'hamburger-btn';
  btn.id = 'hamburger-btn';
  btn.setAttribute('aria-label', 'Toggle navigation');
  btn.innerHTML = '<span></span><span></span><span></span>';
  document.body.appendChild(btn);

  function openSidebar() {
    const sidebar = sidebarEl.querySelector('.sidebar');
    if (sidebar) sidebar.classList.add('mobile-open');
    overlay.classList.add('active');
    btn.classList.add('open');
  }

  function closeSidebar() {
    const sidebar = sidebarEl.querySelector('.sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
    btn.classList.remove('open');
  }

  btn.addEventListener('click', () => {
    const sidebar = sidebarEl.querySelector('.sidebar');
    if (sidebar && sidebar.classList.contains('mobile-open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  // Close on overlay click
  overlay.addEventListener('click', closeSidebar);

  // Close when a nav link is tapped (mobile UX)
  sidebarEl.addEventListener('click', (e) => {
    if (e.target.closest('.sidebar-link')) {
      closeSidebar();
    }
  });
}
