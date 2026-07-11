// ==========================================================================
// Coding Sandbox Workspace Controller (IDE Simulator)
// ==========================================================================

let activeChallenges = [];
let selectedChallenge = null;

// Challenge code templates matching seeded IDs
const CODE_TEMPLATES = {
  1: `function twoSum(nums, target) {\n    // Write your code here\n    // Return array containing indices [index1, index2]\n    \n}`,
  2: `function reverseString(s) {\n    // Write your code here\n    // Return the reversed string\n    \n}`,
  3: `function fib(n) {\n    // Write your code here\n    // Return the n-th Fibonacci number\n    \n}`
};

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadCodingChallenges();

  const runBtn = document.getElementById('run-code-btn');
  if (runBtn) {
    runBtn.addEventListener('click', runUserCode);
  }
});

async function loadCodingChallenges() {
  const sidebarList = document.getElementById('challenge-list');
  if (sidebarList) {
    sidebarList.innerHTML = `<div style="padding:15px; color:var(--text-secondary);">Loading challenges...</div>`;
  }

  try {
    const data = await apiRequest('/portal/coding');
    if (!data.success) {
      showToast('Failed to load coding challenges.', 'error');
      return;
    }

    activeChallenges = data.challenges;
    renderChallengesList();

    // Select first challenge by default
    if (activeChallenges.length > 0) {
      selectChallenge(activeChallenges[0].id);
    }
  } catch (err) {
    console.error('Error fetching challenges:', err);
    showToast('Failed to connect to backend server.', 'error');
  }
}

function renderChallengesList() {
  const list = document.getElementById('challenge-list');
  if (!list) return;

  list.innerHTML = activeChallenges.map(c => {
    let diffClass = 'badge-easy';
    if (c.difficulty === 'Medium') diffClass = 'badge-medium';
    else if (c.difficulty === 'Hard') diffClass = 'badge-hard';

    const isSelected = selectedChallenge && selectedChallenge.id === c.id ? 'active' : '';

    return `
      <div onclick="selectChallenge(${c.id})" class="sidebar-link ${isSelected}" style="cursor:pointer; display:flex; flex-direction:column; align-items:flex-start; gap:6px; margin-bottom:8px;">
        <div style="font-weight:600; font-size:0.95rem;">${c.title}</div>
        <span class="badge ${diffClass}" style="font-size:0.7rem; padding: 2px 6px;">${c.difficulty}</span>
      </div>
    `;
  }).join('');
}

async function selectChallenge(id) {
  selectedChallenge = activeChallenges.find(c => c.id == id);
  renderChallengesList();
  
  const pane = document.getElementById('challenge-details-pane');
  if (!pane || !selectedChallenge) return;

  let diffClass = 'badge-easy';
  if (selectedChallenge.difficulty === 'Medium') diffClass = 'badge-medium';
  else if (selectedChallenge.difficulty === 'Hard') diffClass = 'badge-hard';

  // Inject details
  pane.innerHTML = `
    <div class="glass-card" style="padding: 20px; overflow-y:auto; max-height: 100%;">
      <div class="flex-row-between" style="border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 15px;">
        <h2 style="font-size: 1.4rem;">${selectedChallenge.title}</h2>
        <span class="badge ${diffClass}">${selectedChallenge.difficulty}</span>
      </div>
      
      <div style="font-size: 0.95rem; line-height: 1.6; white-space: pre-line; color: var(--text-secondary); margin-bottom: 20px;">
        ${selectedChallenge.description}
      </div>

      <div style="display:flex; flex-direction:column; gap:12px;">
        ${selectedChallenge.input_format ? `
          <div>
            <h4 style="color:var(--accent-cyan); font-size:0.9rem; margin-bottom:4px;">📥 Input Format</h4>
            <div style="font-size:0.85rem; color:var(--text-secondary);">${selectedChallenge.input_format}</div>
          </div>
        ` : ''}

        ${selectedChallenge.output_format ? `
          <div>
            <h4 style="color:var(--accent-cyan); font-size:0.9rem; margin-bottom:4px;">📤 Output Format</h4>
            <div style="font-size:0.85rem; color:var(--text-secondary);">${selectedChallenge.output_format}</div>
          </div>
        ` : ''}

        ${selectedChallenge.constraints ? `
          <div>
            <h4 style="color:var(--accent-cyan); font-size:0.9rem; margin-bottom:4px;">⛓️ Constraints</h4>
            <code style="font-family:var(--font-mono); font-size:0.8rem; color:var(--accent-rose);">${selectedChallenge.constraints}</code>
          </div>
        ` : ''}

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-top: 10px;">
          <div>
            <h4 style="font-size:0.9rem; margin-bottom:4px;">📋 Sample Input</h4>
            <pre style="background:var(--bg-primary); padding:10px; border-radius:var(--radius-sm); font-family:var(--font-mono); font-size:0.8rem; border:1px solid var(--border-color);">${selectedChallenge.sample_input}</pre>
          </div>
          <div>
            <h4 style="font-size:0.9rem; margin-bottom:4px;">📋 Sample Output</h4>
            <pre style="background:var(--bg-primary); padding:10px; border-radius:var(--radius-sm); font-family:var(--font-mono); font-size:0.8rem; border:1px solid var(--border-color);">${selectedChallenge.sample_output}</pre>
          </div>
        </div>
      </div>
    </div>
  `;

  // Set code editor template
  const editor = document.getElementById('code-editor');
  if (editor) {
    editor.value = CODE_TEMPLATES[selectedChallenge.id] || `// Write your code here`;
  }

  // Clear previous outputs
  document.getElementById('console-output').innerHTML = `
    <div style="color: var(--text-muted);">Run code to inspect test cases outcome.</div>
  `;
}

window.selectChallenge = selectChallenge;

async function runUserCode() {
  if (!selectedChallenge) return;

  const code = document.getElementById('code-editor').value.trim();
  const consoleOut = document.getElementById('console-output');
  if (!code) {
    showToast('Please type some code first.', 'error');
    return;
  }

  consoleOut.innerHTML = `<div style="color: var(--text-secondary);">Executing tests against compiler driver...</div>`;

  try {
    const res = await apiRequest(`/portal/coding/${selectedChallenge.id}/run`, {
      method: 'POST',
      body: JSON.stringify({ code })
    });

    if (!res.success) {
      consoleOut.innerHTML = `<div style="color: var(--accent-rose);">${res.message}</div>`;
      return;
    }

    // Format output
    let html = '';
    res.results.forEach(test => {
      const statusIcon = test.passed ? '✅ Passed' : '❌ Failed';
      const statusColor = test.passed ? 'var(--accent-emerald)' : 'var(--accent-rose)';

      html += `
        <div style="border-bottom: 1px solid var(--border-color); padding: 10px 0;">
          <div class="flex-row-between" style="margin-bottom: 6px;">
            <strong>Test Case ${test.testCaseIndex}</strong>
            <span style="color:${statusColor}; font-weight:700; font-size:0.85rem;">${statusIcon}</span>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); display:flex; flex-direction:column; gap:4px; padding-left:10px;">
            <div>Input: <code style="font-family:var(--font-mono); color:var(--text-primary);">${test.input.replace(/\n/g, ' ')}</code></div>
            <div>Expected: <code style="font-family:var(--font-mono); color:var(--accent-emerald);">${test.expected}</code></div>
            <div>Actual: <code style="font-family:var(--font-mono); color:${statusColor};">${test.actual}</code></div>
          </div>
        </div>
      `;
    });

    consoleOut.innerHTML = html;

    if (res.allPassed) {
      showToast('All test cases passed! Progress saved.', 'success');
      
      // Save progress to progress history database
      try {
        await apiRequest('/user/progress', {
          method: 'POST',
          body: JSON.stringify({
            topic: 'coding',
            subtopic: selectedChallenge.id.toString(),
            score: 1,
            max_score: 1
          })
        });
      } catch (e) {}

    } else {
      showToast('Some test cases failed. Optimize your solution and run again.', 'error');
    }

  } catch (err) {
    console.error('Execution failure:', err);
    consoleOut.innerHTML = `<div style="color: var(--accent-rose);">Compiler compilation or server endpoint connection failed.</div>`;
  }
}
