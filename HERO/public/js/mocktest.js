// ==========================================================================
// Mock Test Platform Controller (Timed Multi-section Assessment Engine)
// ==========================================================================

let activeTest = null;
let testQuestions = [];
let userTestAnswers = {}; // Map of global index -> user selection (char for MCQ, string for coding)
let currentGlobalIndex = 0;
let timerInterval = null;
let secondsRemaining = 0;

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadMockTests();

  const submitTestBtn = document.getElementById('submit-test-btn');
  if (submitTestBtn) {
    submitTestBtn.addEventListener('click', () => {
      confirmSubmitTest();
    });
  }
});

async function loadMockTests() {
  const container = document.getElementById('mocktests-list-area');
  if (!container) return;

  container.innerHTML = `<div style="text-align:center; padding:30px;">Fetching mock exams...</div>`;

  try {
    const data = await apiRequest('/portal/mocktests');
    if (!data.success) {
      showToast('Failed to load mock tests.', 'error');
      return;
    }

    if (data.tests.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:30px;">No mock tests configured by admin yet.</div>`;
      return;
    }

    container.innerHTML = data.tests.map(test => `
      <div class="glass-card" style="margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px;">
        <div>
          <h3 style="font-size:1.3rem; margin-bottom:6px;">${test.title}</h3>
          <p style="color:var(--text-secondary); font-size:0.9rem;">⏳ Duration: ${test.duration_minutes} Minutes | 📊 Includes: Aptitude + Tech + Coding</p>
        </div>
        <button onclick="startMockTest(${test.id})" class="btn btn-primary">Start Exam</button>
      </div>
    `).join('');

  } catch (err) {
    console.error('Error fetching mock tests:', err);
    showToast('Failed to connect to backend server.', 'error');
  }
}

async function startMockTest(testId) {
  try {
    showToast('Initializing test environment... Ready.', 'info');
    
    const data = await apiRequest(`/portal/mocktests/${testId}`);
    if (!data.success) {
      showToast('Failed to initialize test.', 'error');
      return;
    }

    activeTest = data.test;
    testQuestions = [];
    userTestAnswers = {};
    currentGlobalIndex = 0;

    // Load full question objects based on the test configuration
    // Fetch all MCQ questions and coding challenges to resolve ids
    const mcqRes = await apiRequest('/portal/mcqs');
    const codingRes = await apiRequest('/portal/coding');

    const allMcqs = mcqRes.questions || [];
    const allCoding = codingRes.challenges || [];

    // Map test questions schema
    activeTest.questions.forEach(qRef => {
      if (qRef.type === 'coding') {
        const fullQ = allCoding.find(c => c.id == qRef.id);
        if (fullQ) {
          testQuestions.push({ ...fullQ, testType: 'coding' });
        }
      } else {
        const fullQ = allMcqs.find(m => m.id == qRef.id);
        if (fullQ) {
          testQuestions.push({ ...fullQ, testType: 'mcq' });
        }
      }
    });

    // Hide lists selection view, display test layout
    document.getElementById('mock-selection-view').style.display = 'none';
    document.getElementById('mock-exam-workspace').style.display = 'grid';

    // Start Timer
    secondsRemaining = activeTest.duration_minutes * 60;
    startTimer();

    // Render Question Navigation list
    renderQuestionNav();

    // Render Current question
    renderQuestionWorkspace();

  } catch (err) {
    console.error('Error starting test:', err);
    showToast('Failed to retrieve test questions details.', 'error');
  }
}

window.startMockTest = startMockTest;

function startTimer() {
  updateTimerUI();
  timerInterval = setInterval(() => {
    secondsRemaining--;
    updateTimerUI();
    if (secondsRemaining <= 0) {
      clearInterval(timerInterval);
      showToast('Time expired! Submitting test automatically.', 'error');
      submitTest();
    }
  }, 1000);
}

function updateTimerUI() {
  const el = document.getElementById('test-timer');
  if (!el) return;

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  el.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function renderQuestionNav() {
  const grid = document.getElementById('nav-grid');
  if (!grid) return;

  grid.innerHTML = testQuestions.map((q, idx) => {
    let stateClass = '';
    if (idx === currentGlobalIndex) stateClass = 'active';
    else if (userTestAnswers[idx] !== undefined) stateClass = 'answered';

    return `
      <button onclick="jumpToQuestion(${idx})" class="nav-num-btn ${stateClass}">
        ${idx + 1}
      </button>
    `;
  }).join('');
}

window.jumpToQuestion = (idx) => {
  currentGlobalIndex = idx;
  renderQuestionNav();
  renderQuestionWorkspace();
};

function renderQuestionWorkspace() {
  const area = document.getElementById('test-question-pane');
  if (!area || testQuestions.length === 0) return;

  const q = testQuestions[currentGlobalIndex];
  const userAns = userTestAnswers[currentGlobalIndex];

  if (q.testType === 'mcq') {
    // MCQ layout
    area.innerHTML = `
      <div class="glass-card" style="min-height:350px;">
        <span style="font-weight:600; color:var(--accent-cyan); font-size:0.9rem; text-transform:uppercase;">
          SECTION: TECHNICAL / APTITUDE MCQ
        </span>
        <h3 style="font-size:1.25rem; margin:15px 0 25px 0;">${q.question}</h3>
        
        <div class="options-list">
          <button onclick="saveTestMcqAnswer('A')" class="option-btn ${userAns === 'A' ? 'selected' : ''}">
            <strong>A.</strong> ${q.option_a}
          </button>
          <button onclick="saveTestMcqAnswer('B')" class="option-btn ${userAns === 'B' ? 'selected' : ''}">
            <strong>B.</strong> ${q.option_b}
          </button>
          <button onclick="saveTestMcqAnswer('C')" class="option-btn ${userAns === 'C' ? 'selected' : ''}">
            <strong>C.</strong> ${q.option_c}
          </button>
          <button onclick="saveTestMcqAnswer('D')" class="option-btn ${userAns === 'D' ? 'selected' : ''}">
            <strong>D.</strong> ${q.option_d}
          </button>
        </div>
      </div>
    `;
  } else {
    // Coding layout (simplified single pane editor for exam ease)
    area.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; min-height:450px;">
        <div class="glass-card" style="padding:20px; overflow-y:auto;">
          <span style="font-weight:600; color:var(--accent-violet); font-size:0.9rem;">SECTION: CODING CHALLENGE</span>
          <h3 style="font-size:1.3rem; margin:10px 0;">${q.title}</h3>
          <p style="font-size:0.9rem; color:var(--text-secondary); line-height:1.6; white-space:pre-line;">${q.description}</p>
          <div style="margin-top:15px;">
            <strong>Sample Input:</strong>
            <pre style="background:var(--bg-primary); padding:8px; font-family:var(--font-mono); font-size:0.8rem; border:1px solid var(--border-color); border-radius:4px; margin-top:4px;">${q.sample_input}</pre>
          </div>
          <div style="margin-top:10px;">
            <strong>Sample Output:</strong>
            <pre style="background:var(--bg-primary); padding:8px; font-family:var(--font-mono); font-size:0.8rem; border:1px solid var(--border-color); border-radius:4px; margin-top:4px;">${q.sample_output}</pre>
          </div>
        </div>
        
        <div class="editor-pane">
          <div class="code-editor-wrapper">
            <textarea id="test-code-editor" class="code-textarea" oninput="saveTestCodingAnswer(this.value)" placeholder="Write your JavaScript code here...">${userAns || `function solve(input) {\n    // Solve code\n}`}</textarea>
          </div>
        </div>
      </div>
    `;
  }
}

window.saveTestMcqAnswer = (ansChar) => {
  userTestAnswers[currentGlobalIndex] = ansChar;
  renderQuestionNav();
  renderQuestionWorkspace();
};

window.saveTestCodingAnswer = (codeText) => {
  userTestAnswers[currentGlobalIndex] = codeText;
  // Don't call render to avoid cursor loss in textarea, just update nav grid state
  const navBtn = document.querySelector(`#nav-grid button:nth-child(${currentGlobalIndex + 1})`);
  if (navBtn && !navBtn.classList.contains('answered')) {
    navBtn.classList.add('answered');
  }
};

function confirmSubmitTest() {
  const answeredCount = Object.keys(userTestAnswers).length;
  const unanswered = testQuestions.length - answeredCount;

  let msg = 'Are you sure you want to submit the exam?';
  if (unanswered > 0) {
    msg += ` You have ${unanswered} unanswered question(s).`;
  }

  if (confirm(msg)) {
    submitTest();
  }
}

async function submitTest() {
  clearInterval(timerInterval);
  showToast('Evaluating test performance...', 'info');

  let mcqTotal = 0;
  let mcqCorrect = 0;
  let codingTotal = 0;
  let codingCorrect = 0;

  // Let's validate responses
  for (let i = 0; i < testQuestions.length; i++) {
    const q = testQuestions[i];
    const userAns = userTestAnswers[i];

    if (q.testType === 'mcq') {
      mcqTotal++;
      if (userAns === q.correct_option) {
        mcqCorrect++;
      }
    } else {
      codingTotal++;
      // Simple compiler simulation test to grade the coding question in exam
      const inputStr = q.sample_input;
      const expectedOutputStr = q.sample_output.trim();
      let actualOutput = '';
      try {
        let runnerCode = '';
        if (q.id == 1) {
          runnerCode = `
            ${userAns || ''}
            const input = \`${inputStr}\`;
            const lines = input.trim().split('\\n');
            const nums = lines[0].split(' ').map(Number);
            const target = Number(lines[1]);
            const res = twoSum(nums, target);
            console.log(Array.isArray(res) ? res.join(' ') : res);
          `;
        } else if (q.id == 2) {
          runnerCode = `
            ${userAns || ''}
            const input = \`${inputStr}\`;
            console.log(reverseString(input));
          `;
        } else if (q.id == 3) {
          runnerCode = `
            ${userAns || ''}
            const input = \`${inputStr}\`;
            console.log(fib(Number(input.trim())));
          `;
        } else {
          runnerCode = `
            ${userAns || ''}
            console.log(solve(\`${inputStr}\`));
          `;
        }

        let logs = [];
        const sandboxLog = (...args) => logs.push(args.join(' '));
        const run = new Function('console', runnerCode);
        run({ log: sandboxLog });
        actualOutput = logs.join('\n').trim();
      } catch (e) {}

      if (actualOutput === expectedOutputStr) {
        codingCorrect++;
      }
    }
  }

  // Calculate final numbers
  const totalScore = mcqCorrect + (codingCorrect * 4); // coding challenges carries 4 points weightage
  const maxPossibleScore = mcqTotal + (codingTotal * 4);
  const pct = Math.round((totalScore / maxPossibleScore) * 100);

  // Send result to backend user progress store
  try {
    await apiRequest('/user/progress', {
      method: 'POST',
      body: JSON.stringify({
        topic: 'mock',
        subtopic: activeTest.title,
        score: totalScore,
        max_score: maxPossibleScore
      })
    });
  } catch (e) {}

  // Render score results modal card
  renderMockResults(totalScore, maxPossibleScore, pct, mcqCorrect, mcqTotal, codingCorrect, codingTotal);
}

function renderMockResults(score, max, percent, mcqCorrect, mcqTotal, codingCorrect, codingTotal) {
  document.getElementById('mock-exam-workspace').style.display = 'none';
  const resultsDiv = document.getElementById('mock-results-view');
  resultsDiv.style.display = 'block';

  let remark = 'Excellent Work!';
  let remarkColor = 'var(--accent-emerald)';

  if (percent < 50) {
    remark = 'Needs Improvement. Keep Practicing!';
    remarkColor = 'var(--accent-rose)';
  } else if (percent < 75) {
    remark = 'Good Job! Review key concepts to score higher.';
    remarkColor = 'var(--accent-cyan)';
  }

  resultsDiv.innerHTML = `
    <div class="glass-card" style="max-width: 600px; margin: 40px auto; text-align: center; padding: 40px;">
      <span style="font-size: 4rem;">🏆</span>
      <h2 style="font-size: 2rem; margin-top: 15px;">Test Submitted</h2>
      
      <div style="font-size: 3rem; font-weight: 800; color:${remarkColor}; margin: 20px 0;">
        ${score} / ${max}
        <div style="font-size: 1.1rem; color: var(--text-secondary); font-weight: 500; margin-top: 5px;">
          Overall Score: ${percent}%
        </div>
      </div>

      <h3 style="color:${remarkColor}; margin-bottom: 25px;">${remark}</h3>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; background-color:var(--bg-secondary); padding: 20px; border-radius: var(--radius-md); text-align:left; margin-bottom: 30px;">
        <div>
          <span style="font-size: 1.2rem;">📝</span> MCQs Score:
          <div style="font-weight: 700; font-size:1.3rem; margin-top:5px;">${mcqCorrect} / ${mcqTotal} Correct</div>
        </div>
        <div>
          <span style="font-size: 1.2rem;">💻</span> Coding Solved:
          <div style="font-weight: 700; font-size:1.3rem; margin-top:5px;">${codingCorrect} / ${codingTotal} Cases</div>
        </div>
      </div>

      <div style="display:flex; justify-content:center; gap:15px;">
        <button onclick="window.location.reload()" class="btn btn-primary">Return to Mock Tests</button>
        <a href="dashboard.html" class="btn btn-secondary">Go to Dashboard</a>
      </div>
    </div>
  `;
}
