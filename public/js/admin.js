// ==========================================================================
// Admin Control Panel Controller (Database & User Management Interface)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  checkAdmin();
  loadAdminDashboard();

  // Setup tab switcher
  const tabs = document.querySelectorAll('.admin-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const viewId = tab.dataset.view;
      document.getElementById('admin-view-stats').style.display = viewId === 'stats' ? 'block' : 'none';
      document.getElementById('admin-view-mcq').style.display = viewId === 'mcq' ? 'block' : 'none';
      document.getElementById('admin-view-coding').style.display = viewId === 'coding' ? 'block' : 'none';
    });
  });

  // Setup form submission events
  const mcqForm = document.getElementById('admin-add-mcq-form');
  if (mcqForm) {
    mcqForm.addEventListener('submit', handleAddMcq);
  }

  const codingForm = document.getElementById('admin-add-coding-form');
  if (codingForm) {
    codingForm.addEventListener('submit', handleAddCoding);
  }
});

async function loadAdminDashboard() {
  try {
    const data = await apiRequest('/admin/stats');
    if (!data.success) {
      showToast('Failed to load admin stats.', 'error');
      return;
    }

    const stats = data.stats;

    // Set counts UI
    document.getElementById('admin-stat-students').innerText = stats.totalStudents;
    document.getElementById('admin-stat-mcqs').innerText = stats.totalMcqs;
    document.getElementById('admin-stat-coding').innerText = stats.totalChallenges;
    document.getElementById('admin-stat-taken').innerText = stats.mockTestsTaken;

    // Render registered user list
    const tbody = document.getElementById('admin-users-tbody');
    if (tbody) {
      if (stats.users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No registered users found.</td></tr>`;
      } else {
        tbody.innerHTML = stats.users.map(u => {
          const dateStr = new Date(u.created_at).toLocaleDateString();
          return `
            <tr>
              <td><strong>${u.id}</strong></td>
              <td>${u.username}</td>
              <td>${u.email}</td>
              <td><span class="badge" style="background-color:rgba(255,255,255,0.08); color:var(--text-primary); font-size:0.75rem;">${u.role}</span></td>
              <td>${dateStr}</td>
            </tr>
          `;
        }).join('');
      }
    }

    // Load dynamic lists of items to allow deletion
    loadManageableItems();

  } catch (err) {
    console.error('Error fetching admin data:', err);
    showToast('Failed to connect to backend server.', 'error');
  }
}

async function loadManageableItems() {
  try {
    const mcqRes = await apiRequest('/portal/mcqs');
    const codingRes = await apiRequest('/portal/coding');

    const mcqs = mcqRes.questions || [];
    const coding = codingRes.challenges || [];

    // Render MCQs table
    const mcqTbody = document.getElementById('admin-manage-mcq-tbody');
    if (mcqTbody) {
      mcqTbody.innerHTML = mcqs.map(q => `
        <tr>
          <td><strong>${q.id}</strong></td>
          <td><span class="badge" style="background:rgba(6,182,212,0.15); color:var(--accent-cyan); font-size:0.75rem;">${q.category}</span></td>
          <td>${q.subject}</td>
          <td style="max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${q.question}</td>
          <td><strong>${q.correct_option}</strong></td>
          <td>
            <button onclick="deleteMcq(${q.id})" class="btn btn-danger" style="padding:6px 12px; font-size:0.8rem;">Delete</button>
          </td>
        </tr>
      `).join('');
    }

    // Render Coding table
    const codingTbody = document.getElementById('admin-manage-coding-tbody');
    if (codingTbody) {
      codingTbody.innerHTML = coding.map(c => `
        <tr>
          <td><strong>${c.id}</strong></td>
          <td>${c.title}</td>
          <td><span class="badge badge-easy">${c.difficulty}</span></td>
          <td>
            <button onclick="deleteCoding(${c.id})" class="btn btn-danger" style="padding:6px 12px; font-size:0.8rem;">Delete</button>
          </td>
        </tr>
      `).join('');
    }

  } catch (e) {
    console.error('Error loading manageable items list:', e);
  }
}

async function handleAddMcq(e) {
  e.preventDefault();
  const category = document.getElementById('mcq-category').value;
  const subject = document.getElementById('mcq-subject').value;
  const question = document.getElementById('mcq-question').value.trim();
  const option_a = document.getElementById('mcq-opt-a').value.trim();
  const option_b = document.getElementById('mcq-opt-b').value.trim();
  const option_c = document.getElementById('mcq-opt-c').value.trim();
  const option_d = document.getElementById('mcq-opt-d').value.trim();
  const correct_option = document.getElementById('mcq-correct').value;
  const explanation = document.getElementById('mcq-explanation').value.trim();

  try {
    const res = await apiRequest('/admin/mcqs', {
      method: 'POST',
      body: JSON.stringify({ category, subject, question, option_a, option_b, option_c, option_d, correct_option, explanation })
    });

    if (res.success) {
      showToast('MCQ added successfully!', 'success');
      document.getElementById('admin-add-mcq-form').reset();
      loadAdminDashboard();
    } else {
      showToast(res.message, 'error');
    }
  } catch (err) {
    showToast('Failed to add MCQ.', 'error');
  }
}

async function deleteMcq(id) {
  if (confirm(`Are you sure you want to delete MCQ ID ${id}?`)) {
    try {
      const res = await apiRequest(`/admin/mcqs/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast('MCQ deleted.', 'success');
        loadAdminDashboard();
      } else {
        showToast(res.message, 'error');
      }
    } catch (e) {
      showToast('Failed to delete question.', 'error');
    }
  }
}

window.deleteMcq = deleteMcq;

async function handleAddCoding(e) {
  e.preventDefault();
  const title = document.getElementById('coding-title').value.trim();
  const difficulty = document.getElementById('coding-difficulty').value;
  const description = document.getElementById('coding-desc').value.trim();
  const input_format = document.getElementById('coding-input-fmt').value.trim();
  const output_format = document.getElementById('coding-output-fmt').value.trim();
  const constraints = document.getElementById('coding-constraints').value.trim();
  const sample_input = document.getElementById('coding-sample-in').value.trim();
  const sample_output = document.getElementById('coding-sample-out').value.trim();
  const test_cases_raw = document.getElementById('coding-tests').value.trim();

  let test_cases = [];
  try {
    test_cases = JSON.parse(test_cases_raw);
  } catch (err) {
    showToast('Test Cases must be valid JSON matching format: [{"input":"...","output":"..."}]', 'error');
    return;
  }

  try {
    const res = await apiRequest('/admin/coding', {
      method: 'POST',
      body: JSON.stringify({ title, difficulty, description, input_format, output_format, constraints, sample_input, sample_output, test_cases })
    });

    if (res.success) {
      showToast('Coding Challenge created!', 'success');
      document.getElementById('admin-add-coding-form').reset();
      loadAdminDashboard();
    } else {
      showToast(res.message, 'error');
    }
  } catch (err) {
    showToast('Failed to add Coding Challenge.', 'error');
  }
}

async function deleteCoding(id) {
  if (confirm(`Are you sure you want to delete Coding Challenge ID ${id}?`)) {
    try {
      const res = await apiRequest(`/admin/coding/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast('Coding Challenge deleted.', 'success');
        loadAdminDashboard();
      } else {
        showToast(res.message, 'error');
      }
    } catch (e) {
      showToast('Failed to delete challenge.', 'error');
    }
  }
}

window.deleteCoding = deleteCoding;
