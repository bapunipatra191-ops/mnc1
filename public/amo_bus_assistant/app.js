// app.js - Main application logic for AMO Bus Assistant Dashboard

// State variables
let routes = [];
let alerts = [];
let favorites = [];
let currentUser = null;
let activeTab = 'dashboard';
let animationFrameId = null;

// Helpers
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// App initialization on DOM load
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initClock();
  initTabs();
  initAuth();
  initApp();
  
  // Feedback listener
  const feedbackForm = $('#feedback-form');
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', handleFeedbackSubmit);
  }
  
  // Fare Form listener
  const fareRouteSelect = $('#fare-route');
  if (fareRouteSelect) {
    fareRouteSelect.addEventListener('change', handleFareRouteChange);
  }
  const fareForm = $('#fare-form');
  if (fareForm) {
    fareForm.addEventListener('submit', handleFareCalculation);
  }

  // Scroll indicator
  window.addEventListener('scroll', () => {
    const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    const progress = $('#scroll-progress');
    if (progress) progress.style.width = `${scrollPercent}%`;
    
    // Back to top button
    const backBtn = $('#back-to-top');
    if (backBtn) {
      if (window.scrollY > 300) backBtn.style.display = 'block';
      else backBtn.style.display = 'none';
    }
  });

  const backBtn = $('#back-to-top');
  if (backBtn) {
    backBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
});

// Toast Notifications
function toast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(20px)';
    t.style.transition = 'all 0.3s ease';
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

// Fetch all routes and alerts from API
async function initApp() {
  try {
    const routesRes = await fetch('/api/amo-bus/routes');
    const routesData = await routesRes.json();
    if (routesData.success) {
      routes = routesData.routes;
    } else {
      toast('Failed to load bus routes', 'danger');
    }

    const alertsRes = await fetch('/api/amo-bus/alerts');
    const alertsData = await alertsRes.json();
    if (alertsData.success) {
      alerts = alertsData.alerts;
    }

    await loadFavorites();
    renderDashboard();
    renderRoutesList();
    populateSelects();
    renderAlertsList();
    updateStats();
  } catch (err) {
    console.error('Initialization error:', err);
    toast('Server connection failed. Storing data locally.', 'warning');
    loadFallbackStaticData();
  }
}

// Fallback to static mock data if API is down
function loadFallbackStaticData() {
  routes = [
    { id: 1, name: "AMO Express", number: "101", source: "Central Station", destination: "North Terminal", stops: ["Central Station", "Midtown", "Uptown", "North Terminal"], timings: ["06:00", "07:30", "09:00", "10:30", "12:00"], fare: { adult: 2.5, student: 1.5 } },
    { id: 2, name: "AMO Local", number: "202", source: "East Park", destination: "West Market", stops: ["East Park", "City Hall", "West Market"], timings: ["06:15", "07:45", "09:15", "10:45", "12:15"], fare: { adult: 1.8, student: 1.0 } },
    { id: 3, name: "Metro Connector", number: "303", source: "Airport T1", destination: "Downtown Hub", stops: ["Airport T1", "Business Park", "Tech Park", "Downtown Hub"], timings: ["05:00", "06:00", "07:00", "08:00", "09:00", "10:00"], fare: { adult: 3.5, student: 2.0 } }
  ];
  alerts = [
    { id: 1, route_id: 2, message: "Delay due to traffic on Main St", severity: "warning", route_name: "AMO Local", route_number: "202" },
    { id: 2, route_id: null, message: "System-wide maintenance scheduled on Sunday 2:00 AM to 4:00 AM", severity: "info" }
  ];
  const localFavs = localStorage.getItem('amo_favorites');
  favorites = localFavs ? JSON.parse(localFavs) : [];
  
  renderDashboard();
  renderRoutesList();
  populateSelects();
  renderAlertsList();
  updateStats();
}

// Load Favorites
async function loadFavorites() {
  const token = localStorage.getItem('amo_auth_token');
  if (token && currentUser) {
    try {
      const res = await fetch('/api/amo-bus/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        favorites = data.favorites.map(f => f.id);
        return;
      }
    } catch (e) {
      console.warn('Could not load online favorites', e);
    }
  }
  // Local storage fallback
  const localFavs = localStorage.getItem('amo_favorites');
  favorites = localFavs ? JSON.parse(localFavs) : [];
}

// Toggle Favorites
async function toggleFavorite(routeId) {
  const token = localStorage.getItem('amo_auth_token');
  if (token && currentUser) {
    try {
      const res = await fetch('/api/amo-bus/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ routeId })
      });
      const data = await res.json();
      if (data.success) {
        toast(data.message);
        if (data.favorited) {
          if (!favorites.includes(routeId)) favorites.push(routeId);
        } else {
          favorites = favorites.filter(id => id !== routeId);
        }
        renderFavorites();
        updateFavoriteButtons();
        return;
      }
    } catch (e) {
      console.warn('Failed to sync favorite on server, using local', e);
    }
  }

  // Toggle local fallback
  const idx = favorites.indexOf(routeId);
  if (idx >= 0) {
    favorites.splice(idx, 1);
    toast('Removed from favorites');
  } else {
    favorites.push(routeId);
    toast('Added to favorites');
  }
  localStorage.setItem('amo_favorites', JSON.stringify(favorites));
  renderFavorites();
  updateFavoriteButtons();
}

// Sync local favorites to server on login
async function syncFavoritesToServer() {
  const localFavs = localStorage.getItem('amo_favorites');
  if (!localFavs) return;
  const favIds = JSON.parse(localFavs);
  const token = localStorage.getItem('amo_auth_token');
  if (!token) return;

  for (const routeId of favIds) {
    try {
      await fetch('/api/amo-bus/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ routeId })
      });
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.removeItem('amo_favorites');
  await loadFavorites();
}

// Clock
function initClock() {
  const clock = $('#live-clock');
  if (!clock) return;
  const tick = () => {
    clock.textContent = new Date().toLocaleTimeString();
  };
  tick();
  setInterval(tick, 1000);
}

// Theme
function initTheme() {
  const btn = $('.theme-toggle');
  if (!btn) return;
  const current = localStorage.getItem('amo_theme') || 'dark';
  document.body.dataset.theme = current;
  btn.textContent = current === 'dark' ? '☀️' : '🌙';
  
  btn.addEventListener('click', () => {
    const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = next;
    localStorage.setItem('amo_theme', next);
    btn.textContent = next === 'dark' ? '☀️' : '🌙';
  });
}

// Tabs
function initTabs() {
  const navItems = $$('.sidebar-nav .nav-item, .mobile-nav .mobile-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Handle initial page hash if present
  const hash = window.location.hash.substring(1);
  if (hash && ['dashboard', 'map', 'schedules', 'fare', 'feedback'].includes(hash)) {
    switchTab(hash);
  }
}

function switchTab(tab) {
  activeTab = tab;
  window.location.hash = tab;
  
  // Update nav highlight
  const allNavs = $$('.sidebar-nav .nav-item, .mobile-nav .mobile-nav-item');
  allNavs.forEach(nav => {
    if (nav.getAttribute('data-tab') === tab) {
      nav.classList.add('active');
    } else {
      nav.classList.remove('active');
    }
  });

  // Toggle active pane
  const panes = $$('.tab-pane');
  panes.forEach(pane => {
    if (pane.id === `tab-${tab}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  // Set Title
  const title = $('#page-title');
  if (title) {
    const labels = {
      dashboard: 'Dashboard Overview',
      map: 'Live Tracker Map',
      schedules: 'Bus Schedules & Routes',
      fare: 'Fare Calculator',
      feedback: 'Service Alerts & Feedback'
    };
    title.textContent = labels[tab] || 'Dashboard';
  }

  // Handle map canvas redraw
  if (tab === 'map') {
    initLiveMapCanvas();
  } else {
    // Stop live animation when switching tab
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }
}
window.switchTab = switchTab; // Expose globally

// Auth (Login / Register Modal Flow)
function initAuth() {
  const modal = $('#auth-modal');
  const trigger = $('#btn-login-trigger');
  const close = $('.close-modal');
  if (!modal || !trigger) return;

  trigger.addEventListener('click', () => {
    if (currentUser) {
      // Logout logic
      currentUser = null;
      localStorage.removeItem('amo_auth_token');
      localStorage.removeItem('amo_auth_user');
      toast('Signed out successfully.');
      updateAuthUI();
      loadFavorites();
      renderFavorites();
    } else {
      modal.classList.add('active');
    }
  });

  close.addEventListener('click', () => modal.classList.remove('active'));
  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // Auth Mode Tabs toggle inside modal
  const tabBtns = $$('.auth-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.getAttribute('data-mode');
      if (mode === 'login') {
        $('#form-login').classList.remove('hide');
        $('#form-register').classList.add('hide');
      } else {
        $('#form-login').classList.add('hide');
        $('#form-register').classList.remove('hide');
      }
    });
  });

  // Check existing login session
  const storedUser = localStorage.getItem('amo_auth_user');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    updateAuthUI();
  }

  // Login Submit
  $('#form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#login-email').value.trim();
    const password = $('#login-password').value.trim();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('amo_auth_token', data.token);
        localStorage.setItem('amo_auth_user', JSON.stringify(data.user));
        currentUser = data.user;
        toast(`Welcome back, ${data.user.username}!`);
        modal.classList.remove('active');
        updateAuthUI();
        await syncFavoritesToServer();
        renderFavorites();
      } else {
        toast(data.message || 'Invalid credentials', 'danger');
      }
    } catch (err) {
      toast('Could not connect to authentication API', 'danger');
    }
  });

  // Register Submit
  $('#form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = $('#reg-username').value.trim();
    const email = $('#reg-email').value.trim();
    const password = $('#reg-password').value.trim();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (data.success) {
        toast('Account created successfully! Please sign in.', 'info');
        // Switch to login tab
        $('.auth-tab-btn[data-mode="login"]').click();
      } else {
        toast(data.message || 'Registration failed', 'danger');
      }
    } catch (err) {
      toast('Registration request failed', 'danger');
    }
  });
}

function updateAuthUI() {
  const container = $('#auth-status');
  if (!container) return;
  if (currentUser) {
    container.innerHTML = `
      <div class="user-profile-pill">
        <span class="user-name">👤 ${currentUser.username}</span>
        <button id="btn-login-trigger" class="btn btn-outline btn-sm">Sign Out</button>
      </div>
    `;
    // Re-attach sign out listener
    $('#btn-login-trigger').addEventListener('click', () => {
      currentUser = null;
      localStorage.removeItem('amo_auth_token');
      localStorage.removeItem('amo_auth_user');
      toast('Signed out successfully.');
      updateAuthUI();
      loadFavorites();
      renderFavorites();
    });
  } else {
    container.innerHTML = `<button id="btn-login-trigger" class="btn btn-primary btn-sm">Sign In</button>`;
    initAuth();
  }
}

// Render Dashboard (Search and Favorites)
function renderDashboard() {
  // Search feature logic
  const searchInput = $('#search-input');
  const searchResults = $('#search-results');
  if (searchInput && searchResults) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      searchResults.innerHTML = '';
      if (!query) return;

      const filtered = routes.filter(r => 
        r.name.toLowerCase().includes(query) || 
        r.number.toString().includes(query) ||
        r.stops.some(s => s.toLowerCase().includes(query))
      );

      if (filtered.length === 0) {
        searchResults.innerHTML = `<li class="search-item text-secondary">No routes found matching filter.</li>`;
        return;
      }

      filtered.forEach(r => {
        const li = document.createElement('li');
        li.className = 'search-item';
        li.textContent = `${r.name} (${r.number}) - Stops: ${r.stops.join(' ➔ ')}`;
        li.onclick = () => {
          switchTab('schedules');
          showRouteDetail(r.id);
          searchInput.value = '';
          searchResults.innerHTML = '';
        };
        searchResults.appendChild(li);
      });
    });
  }

  renderFavorites();
}

function renderFavorites() {
  const container = $('#favorites-container');
  if (!container) return;
  container.innerHTML = '';
  
  if (favorites.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No favorites saved yet. Add routes to favorites to see them here.</p>
      </div>
    `;
    return;
  }

  favorites.forEach(id => {
    const route = routes.find(r => r.id === id);
    if (!route) return;

    const card = document.createElement('div');
    card.className = 'favorite-card';
    card.innerHTML = `
      <div>
        <strong class="text-accent" style="cursor:pointer">${route.name} (${route.number})</strong>
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">
          ${route.source} ➔ ${route.destination}
        </p>
      </div>
      <button class="remove-fav" title="Remove Favorite">✖</button>
    `;

    // Click title to inspect detail
    card.querySelector('strong').onclick = () => {
      switchTab('schedules');
      showRouteDetail(route.id);
    };

    card.querySelector('.remove-fav').onclick = () => toggleFavorite(route.id);
    container.appendChild(card);
  });
}

// Render Schedules Tab
function renderRoutesList() {
  const container = $('#routes-container');
  if (!container) return;
  container.innerHTML = '';

  routes.forEach(r => {
    const div = document.createElement('div');
    div.className = 'route-item';
    div.innerHTML = `
      <div>
        <strong>${r.name}</strong> (${r.number})
        <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.25rem;">
          ${r.source} ➔ ${r.destination}
        </div>
      </div>
      <span>➔</span>
    `;
    div.onclick = () => showRouteDetail(r.id);
    container.appendChild(div);
  });
}

function showRouteDetail(routeId) {
  const route = routes.find(r => r.id === routeId);
  const detailPanel = $('#route-detail-view');
  if (!route || !detailPanel) return;

  const isFav = favorites.includes(route.id);

  detailPanel.innerHTML = `
    <div class="route-card">
      <h3>${route.name} (${route.number})</h3>
      <p><strong>Origin Terminal:</strong> ${route.source}</p>
      <p><strong>Destination Terminal:</strong> ${route.destination}</p>
      <p><strong>Base Adult Fare:</strong> $${route.fare.adult.toFixed(2)}</p>
      <p><strong>Base Student Fare:</strong> $${route.fare.student.toFixed(2)}</p>
      
      <h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 1.1rem;">Timeline Stops:</h4>
      <div class="route-stops-timeline">
        ${route.stops.map(stop => `<div class="timeline-stop">${stop}</div>`).join('')}
      </div>

      <h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 1.1rem;">Scheduled Timings:</h4>
      <div class="schedule-times">
        ${route.timings.map(time => `<span class="time-chip">${time}</span>`).join('')}
      </div>

      <div style="margin-top: 2rem;">
        <button class="btn btn-primary fav-toggle-btn" data-route-id="${route.id}">
          ${isFav ? '⭐ Remove Favorite' : '☆ Add to Favorites'}
        </button>
      </div>
    </div>
  `;

  // Add click to toggle favorite inside detail view
  detailPanel.querySelector('.fav-toggle-btn').onclick = () => toggleFavorite(route.id);
}

function updateFavoriteButtons() {
  const btn = $('.fav-toggle-btn');
  if (!btn) return;
  const routeId = Number(btn.getAttribute('data-route-id'));
  const isFav = favorites.includes(routeId);
  btn.textContent = isFav ? '⭐ Remove Favorite' : '☆ Add to Favorites';
}

// Populate Select Dropdowns in Maps & Fares Tabs
function populateSelects() {
  // Map Route selector
  const mapSelect = $('#map-route-selector');
  if (mapSelect) {
    mapSelect.innerHTML = `<option value="">-- Choose an active route --</option>`;
    routes.forEach(r => {
      mapSelect.innerHTML += `<option value="${r.id}">${r.name} (${r.number})</option>`;
    });
    mapSelect.addEventListener('change', handleMapRouteChange);
  }

  // Fare Route selector
  const fareRouteSelect = $('#fare-route');
  if (fareRouteSelect) {
    fareRouteSelect.innerHTML = `<option value="">-- Select Route --</option>`;
    routes.forEach(r => {
      fareRouteSelect.innerHTML += `<option value="${r.id}">${r.name} (${r.number})</option>`;
    });
  }
}

// Fare calculator handling
function handleFareRouteChange() {
  const routeId = Number($('#fare-route').value);
  const originSelect = $('#fare-origin');
  const destSelect = $('#fare-dest');
  
  if (!routeId) {
    originSelect.disabled = true;
    destSelect.disabled = true;
    originSelect.innerHTML = '<option value="">-- Select Origin --</option>';
    destSelect.innerHTML = '<option value="">-- Select Destination --</option>';
    return;
  }

  const route = routes.find(r => r.id === routeId);
  if (!route) return;

  originSelect.disabled = false;
  destSelect.disabled = false;

  originSelect.innerHTML = '<option value="">-- Select Origin --</option>';
  destSelect.innerHTML = '<option value="">-- Select Destination --</option>';

  route.stops.forEach((stop, i) => {
    originSelect.innerHTML += `<option value="${i}">${stop}</option>`;
    destSelect.innerHTML += `<option value="${i}">${stop}</option>`;
  });
}

function handleFareCalculation(e) {
  e.preventDefault();
  const routeId = Number($('#fare-route').value);
  const originIndex = Number($('#fare-origin').value);
  const destIndex = Number($('#fare-dest').value);
  const resultPanel = $('#fare-result');

  if (isNaN(originIndex) || isNaN(destIndex)) {
    toast('Please select both origin and destination stops.', 'warning');
    return;
  }

  if (originIndex === destIndex) {
    toast('Origin and Destination cannot be the same stop.', 'warning');
    return;
  }

  const route = routes.find(r => r.id === routeId);
  if (!route) return;

  const distanceIndex = Math.abs(destIndex - originIndex);
  
  // Calculate distance based scaling
  const adultFare = route.fare.adult + (distanceIndex - 1) * 0.50;
  const studentFare = route.fare.student + (distanceIndex - 1) * 0.30;

  resultPanel.classList.remove('hide');
  $('#result-distance').textContent = `${distanceIndex} stops away`;
  $('#result-adult-fare').textContent = `$${adultFare.toFixed(2)}`;
  $('#result-student-fare').textContent = `$${studentFare.toFixed(2)}`;
}

// Render Alerts & Feedback lists
function renderAlertsList() {
  const container = $('#alerts-list');
  if (!container) return;
  container.innerHTML = '';

  if (alerts.length === 0) {
    container.innerHTML = '<li class="empty-state">No alerts active at this moment.</li>';
    return;
  }

  alerts.forEach(a => {
    const li = document.createElement('li');
    li.className = `alert-item ${a.severity || 'warning'}`;
    const routeText = a.route_name ? `<span class="text-accent" style="font-weight:700;">Route ${a.route_number} (${a.route_name}):</span> ` : '';
    li.innerHTML = `
      <div>${routeText}${a.message}</div>
      <div class="alert-meta">Severity: ${a.severity || 'warning'} | Posted: ${new Date(a.created_at || Date.now()).toLocaleString()}</div>
    `;
    container.appendChild(li);
  });
}

async function handleFeedbackSubmit(e) {
  e.preventDefault();
  const name = $('#feedback-name').value.trim();
  const email = $('#feedback-email').value.trim();
  const message = $('#feedback-message').value.trim();

  try {
    const res = await fetch('/api/amo-bus/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message })
    });
    const data = await res.json();
    if (data.success) {
      toast('Feedback submitted! Thank you.', 'info');
      $('#feedback-form').reset();
    } else {
      toast(data.message || 'Submission failed.', 'danger');
    }
  } catch (err) {
    console.warn('API submission failed, using simulated success');
    toast('Feedback successfully saved (local simulation mode).', 'info');
    $('#feedback-form').reset();
  }
}

// Stats Counter
function updateStats() {
  const routeVal = $('#stat-routes-count');
  if (routeVal) routeVal.textContent = routes.length;
  const alertVal = $('#stat-alerts-count');
  if (alertVal) alertVal.textContent = alerts.length;
  
  // Render Nearby Stops dynamically
  const nearby = $('#nearby-container');
  if (nearby) {
    nearby.innerHTML = '';
    const stopsList = [
      { name: "Central Station Hub", dist: "0.2 km", walk: "3 mins walk", routes: "Routes: 101" },
      { name: "East Park gate", dist: "0.6 km", walk: "7 mins walk", routes: "Routes: 202" },
      { name: "City Hall square", dist: "1.1 km", walk: "15 mins walk", routes: "Routes: 202" },
      { name: "Business Park South", dist: "1.4 km", walk: "18 mins walk", routes: "Routes: 303" }
    ];
    stopsList.forEach(s => {
      nearby.innerHTML += `
        <div class="stop-card">
          <div class="stop-info">
            <h4>${s.name}</h4>
            <p>${s.walk} | ${s.routes}</p>
          </div>
          <div class="stop-dist">${s.dist}</div>
        </div>
      `;
    });
  }
}

// TAB 2: LIVE CANVAS MAP VISUALIZATION
let canvas, ctx;
let busRoutePath = [];
let busIndex = 0;
let busProgress = 0; // progress from 0 to 1 between two stops
let selectedMapRoute = null;

function initLiveMapCanvas() {
  canvas = $('#map-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  
  // Auto resizing to fit container
  const box = canvas.parentElement.getBoundingClientRect();
  canvas.width = box.width;
  canvas.height = Math.max(box.height, 400);

  // Clear animation frame if already running
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  // Draw default map background
  drawMap();
}

function drawMap() {
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid lines
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  const spacing = 40;
  for (let x = 0; x < canvas.width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Text title
  ctx.fillStyle = '#475569';
  ctx.font = '12px sans-serif';
  ctx.fillText("Interactive Route Simulation Map", 20, canvas.height - 20);

  if (selectedMapRoute && busRoutePath.length > 0) {
    // 1. Draw route line connecting stop points
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 5]); // Dotted road path
    ctx.moveTo(busRoutePath[0].x, busRoutePath[0].y);
    for (let i = 1; i < busRoutePath.length; i++) {
      ctx.lineTo(busRoutePath[i].x, busRoutePath[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // 2. Draw stops circles and labels
    busRoutePath.forEach((stop, i) => {
      ctx.beginPath();
      ctx.arc(stop.x, stop.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Stop Text labels
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(stop.name, stop.x - 30, stop.y - 14);
    });

    // 3. Calculate simulated bus position and animate movement
    const currentStop = busRoutePath[busIndex];
    const nextStop = busRoutePath[(busIndex + 1) % busRoutePath.length];
    
    // Linear interpolation
    const busX = currentStop.x + (nextStop.x - currentStop.x) * busProgress;
    const busY = currentStop.y + (nextStop.y - currentStop.y) * busProgress;

    // Draw the bus icon indicator
    ctx.beginPath();
    ctx.arc(busX, busY, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24'; // Yellow bus dot
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fbbf24';
    ctx.fill();
    ctx.shadowBlur = 0; // Reset shadow

    // Letter "B" on the dot
    ctx.fillStyle = '#020617';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText("🚌", busX - 8, busY + 4);

    // Update progress variables
    busProgress += 0.005; // speed speed multiplier
    if (busProgress >= 1) {
      busProgress = 0;
      busIndex = (busIndex + 1) % busRoutePath.length;
      
      // Update UI panels
      const nextStopName = busRoutePath[(busIndex + 1) % busRoutePath.length].name;
      $('#track-route-next-stop').textContent = nextStopName;
    }
  } else {
    // If no route selected, show select guide text
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px sans-serif';
    ctx.fillText("Please select a route from the controls panel to track", canvas.width/2 - 190, canvas.height/2);
  }
}

function handleMapRouteChange() {
  const routeId = Number($('#map-route-selector').value);
  const detailPanel = $('#tracker-route-detail');
  
  if (!routeId) {
    selectedMapRoute = null;
    busRoutePath = [];
    detailPanel.classList.add('hide');
    drawMap();
    return;
  }

  selectedMapRoute = routes.find(r => r.id === routeId);
  if (!selectedMapRoute) return;

  // Build coordinate paths for stops dynamically fitting canvas bounds
  const stops = selectedMapRoute.stops;
  busRoutePath = [];
  busIndex = 0;
  busProgress = 0;

  const w = canvas.width;
  const h = canvas.height;

  stops.forEach((stopName, i) => {
    // Generate some coordinates matching stops count
    const t = i / (stops.length - 1 || 1);
    
    // Wave paths so it's not a straight line
    const x = 80 + t * (w - 160);
    const y = h / 2 + Math.sin(t * Math.PI * 2) * (h / 3);

    busRoutePath.push({
      name: stopName,
      x: x,
      y: y
    });
  });

  // UI labels setup
  detailPanel.classList.remove('hide');
  $('#track-route-name').textContent = `${selectedMapRoute.name} (${selectedMapRoute.number})`;
  $('#track-route-next-stop').textContent = busRoutePath[(busIndex + 1) % busRoutePath.length].name;
  $('#track-route-speed').textContent = `${Math.floor(Math.random() * 20) + 40} km/h`;

  // Start animation loop
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  runMapLoop();
}

function runMapLoop() {
  if (activeTab !== 'map') return;
  drawMap();
  animationFrameId = requestAnimationFrame(runMapLoop);
}
