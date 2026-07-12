// ==========================================================================
// Student Dashboard Controller & Progress Charting
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadDashboardData();
});

async function loadDashboardData() {
  try {
    const data = await apiRequest('/user/progress/stats');
    if (!data.success) {
      showToast('Failed to load progress statistics.', 'error');
      return;
    }

    const stats = data.stats;

    // 1. Update Username Greeting
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : { username: 'Scholar' };
    const usernameGreeting = document.getElementById('user-greet');
    if (usernameGreeting) {
      usernameGreeting.innerText = user.username;
    }

    // 2. Set Quick Stats Widgets
    document.getElementById('stat-aptitude-count').innerText = stats.aptitude.completed;
    document.getElementById('stat-tech-count').innerText = stats.technical.completed;
    document.getElementById('stat-coding-count').innerText = stats.coding.completed;
    document.getElementById('stat-mock-count').innerText = stats.mock.completed;

    // 3. Render Circular Progress SVGs
    // Aptitude Percent
    const aptPct = stats.aptitude.maxScore > 0 ? Math.round((stats.aptitude.totalScore / stats.aptitude.maxScore) * 100) : 0;
    renderProgressCircle('progress-aptitude', aptPct, 'var(--accent-cyan)');

    // Technical Percent
    const techPct = stats.technical.maxScore > 0 ? Math.round((stats.technical.totalScore / stats.technical.maxScore) * 100) : 0;
    renderProgressCircle('progress-technical', techPct, 'var(--accent-violet)');

    // Coding solved percent (out of 3 seeded challenges)
    const codingPct = Math.round((stats.coding.completed / 3) * 100);
    renderProgressCircle('progress-coding', codingPct, 'var(--accent-emerald)');

    // Overall readiness score
    const overallScore = Math.round((aptPct + techPct + codingPct) / 3);
    const overallDisplay = document.getElementById('overall-readiness');
    if (overallDisplay) {
      overallDisplay.innerText = `${overallScore}%`;
    }
    renderProgressCircle('progress-overall', overallScore, 'var(--grad-cyan-violet)');

    // 4. Render Mock Exams history list
    const mockListEl = document.getElementById('mock-history-list');
    if (mockListEl) {
      if (stats.mock.exams.length === 0) {
        mockListEl.innerHTML = `
          <div style="padding: 20px 0; text-align: center; color: var(--text-secondary);">
            No mock tests completed yet. Click on "Mock Tests" to start preparation!
          </div>
        `;
      } else {
        mockListEl.innerHTML = stats.mock.exams.map(exam => {
          const dateStr = new Date(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const pct = Math.round((exam.score / exam.max) * 100);
          let gradeColor = 'var(--accent-rose)';
          if (pct >= 70) gradeColor = 'var(--accent-emerald)';
          else if (pct >= 50) gradeColor = 'var(--accent-amber)';

          return `
            <div class="flex-row-between" style="padding: 14px 0; border-bottom: 1px solid var(--border-color);">
              <div>
                <div style="font-weight: 600;">${exam.title}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${dateStr}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: 700; color: ${gradeColor};">${exam.score} / ${exam.max}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">${pct}% Correct</div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

  } catch (err) {
    console.error('Error fetching dashboard progress:', err);
    showToast('Failed to connect to the backend server.', 'error');
  }
}

// Helper to render responsive progress ring SVG dynamically
function renderProgressCircle(elementId, percent, color) {
  const container = document.getElementById(elementId);
  if (!container) return;

  const radius = 40;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  container.innerHTML = `
    <svg height="80" width="80" style="transform: rotate(-90deg);">
      <circle
        stroke="hsla(222, 47%, 20%, 0.5)"
        fill="transparent"
        stroke-width="${stroke}"
        r="${normalizedRadius}"
        cx="40"
        cy="40"
      />
      <circle
        stroke="${color.includes('linear-gradient') ? 'url(#grad-accent)' : color}"
        fill="transparent"
        stroke-width="${stroke}"
        stroke-dasharray="${circumference} ${circumference}"
        style="stroke-dashoffset: ${strokeDashoffset}; transition: stroke-dashoffset 0.6s ease-in-out;"
        r="${normalizedRadius}"
        cx="40"
        cy="40"
      />
      ${color.includes('linear-gradient') ? `
        <defs>
          <linearGradient id="grad-accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="var(--accent-cyan)" />
            <stop offset="100%" stop-color="var(--accent-violet)" />
          </linearGradient>
        </defs>
      ` : ''}
    </svg>
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-weight: 700; font-size: 0.95rem;">
      ${percent}%
    </div>
  `;
}
