// ==========================================================================
// MCQ & Aptitude Practice and HR / Company preparation Sheets Engine
// ==========================================================================

let activeQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {}; // Map of question index -> selected option

// Initialize page content based on file loading
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  
  const path = window.location.pathname.split('/').pop();
  if (path === 'aptitude.html') {
    // Aptitude page
    initMcqPage('aptitude', 'quantitative');
  } else if (path === 'mcqs.html') {
    // Technical MCQs page
    initMcqPage('technical', 'java');
  } else if (path === 'hr.html') {
    // HR Interview Page
    initHrPage();
  } else if (path === 'company.html') {
    // Company specific page
    initCompanyPage();
  }
});

// ==========================================================================
// MCQs (Aptitude & Technical) Implementation
// ==========================================================================

function initMcqPage(category, defaultSubject) {
  // Load subject select event
  const subjectSelect = document.getElementById('subject-selector');
  if (subjectSelect) {
    subjectSelect.value = defaultSubject;
    subjectSelect.addEventListener('change', (e) => {
      loadQuestions(category, e.target.value);
    });
    // Initial fetch
    loadQuestions(category, defaultSubject);
  }
}

async function loadQuestions(category, subject) {
  try {
    const listContainer = document.getElementById('question-area');
    if (listContainer) {
      listContainer.innerHTML = `<div style="text-align:center; padding:40px;">Fetching practice questions...</div>`;
    }

    const data = await apiRequest(`/portal/mcqs?category=${category}&subject=${subject}`);
    if (!data.success) {
      showToast('Failed to load MCQs.', 'error');
      return;
    }

    activeQuestions = data.questions;
    currentQuestionIndex = 0;
    userAnswers = {};

    renderCurrentQuestion(category, subject);
  } catch (err) {
    console.error('Error loading MCQs:', err);
    showToast('Failed to connect to backend server.', 'error');
  }
}

function renderCurrentQuestion(category, subject) {
  const container = document.getElementById('question-area');
  if (!container) return;

  if (activeQuestions.length === 0) {
    container.innerHTML = `
      <div class="glass-card" style="text-align: center; padding: 40px 20px;">
        <span style="font-size: 3rem;">📂</span>
        <h3 style="margin-top: 15px;">No Questions Found</h3>
        <p style="color: var(--text-secondary); margin-top: 10px;">Select another topic or check back later!</p>
      </div>
    `;
    return;
  }

  const q = activeQuestions[currentQuestionIndex];
  const selectedOpt = userAnswers[currentQuestionIndex];
  const hasAnswered = selectedOpt !== undefined;

  container.innerHTML = `
    <div class="glass-card question-box">
      <div class="flex-row-between" style="margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
        <span style="font-weight: 600; color: var(--accent-cyan); text-transform: uppercase;">
          Question ${currentQuestionIndex + 1} of ${activeQuestions.length}
        </span>
        <span class="badge badge-easy">${subject}</span>
      </div>
      
      <div class="question-text">${q.question}</div>
      
      <div class="options-list">
        <button onclick="selectOption('A')" class="option-btn ${getOptionClass('A', q.correct_option, selectedOpt)}">
          <strong>A.</strong> ${q.option_a}
        </button>
        <button onclick="selectOption('B')" class="option-btn ${getOptionClass('B', q.correct_option, selectedOpt)}">
          <strong>B.</strong> ${q.option_b}
        </button>
        <button onclick="selectOption('C')" class="option-btn ${getOptionClass('C', q.correct_option, selectedOpt)}">
          <strong>C.</strong> ${q.option_c}
        </button>
        <button onclick="selectOption('D')" class="option-btn ${getOptionClass('D', q.correct_option, selectedOpt)}">
          <strong>D.</strong> ${q.option_d}
        </button>
      </div>

      ${hasAnswered ? `
        <div class="explanation-box">
          <h4 style="color: var(--accent-amber); font-weight: 700; margin-bottom: 8px;">Explanation</h4>
          <p style="font-size: 0.95rem; line-height: 1.6;">${q.explanation || 'No explanation provided for this question.'}</p>
        </div>
      ` : ''}

      <div class="flex-row-between mt-4">
        <button onclick="navigateQuestion(-1)" class="btn btn-secondary" ${currentQuestionIndex === 0 ? 'disabled' : ''}>
          ⬅️ Previous
        </button>
        <button onclick="navigateQuestion(1)" class="btn btn-primary" ${currentQuestionIndex === activeQuestions.length - 1 ? 'disabled' : ''}>
          Next ➡️
        </button>
      </div>
    </div>
  `;
}

function getOptionClass(optionChar, correctChar, selectedOpt) {
  if (selectedOpt === undefined) return '';
  if (optionChar === correctChar) return 'correct';
  if (selectedOpt === optionChar && optionChar !== correctChar) return 'wrong';
  if (selectedOpt === optionChar) return 'selected';
  return '';
}

async function selectOption(optionChar) {
  // Prevent re-answering an already answered question
  if (userAnswers[currentQuestionIndex] !== undefined) return;

  userAnswers[currentQuestionIndex] = optionChar;
  const q = activeQuestions[currentQuestionIndex];
  const isCorrect = optionChar === q.correct_option;

  const path = window.location.pathname.split('/').pop();
  const category = path === 'aptitude.html' ? 'aptitude' : 'technical';
  const subject = document.getElementById('subject-selector').value;

  // Render immediately to show explanation and color indicators
  renderCurrentQuestion(category, subject);

  // Save progress stats to backend database
  try {
    await apiRequest('/user/progress', {
      method: 'POST',
      body: JSON.stringify({
        topic: category,
        subtopic: subject,
        score: isCorrect ? 1 : 0,
        max_score: 1
      })
    });
  } catch (e) {
    console.error('Failed to log answer progress:', e);
  }

  if (isCorrect) {
    showToast('Correct answer! +1 point', 'success');
  } else {
    showToast(`Incorrect. Correct option is ${q.correct_option}`, 'error');
  }
}

window.selectOption = selectOption;

function navigateQuestion(direction) {
  const nextIdx = currentQuestionIndex + direction;
  if (nextIdx >= 0 && nextIdx < activeQuestions.length) {
    currentQuestionIndex = nextIdx;
    const path = window.location.pathname.split('/').pop();
    const category = path === 'aptitude.html' ? 'aptitude' : 'technical';
    const subject = document.getElementById('subject-selector').value;
    renderCurrentQuestion(category, subject);
  }
}

window.navigateQuestion = navigateQuestion;

// ==========================================================================
// HR Interview Prep Implementation (AI Starter STAR Method grading simulator)
// ==========================================================================

let hrQuestions = [];
let hrIndex = 0;

async function initHrPage() {
  const hrContainer = document.getElementById('hr-area');
  if (hrContainer) {
    hrContainer.innerHTML = `<div style="text-align:center; padding:40px;">Loading interview questions...</div>`;
  }

  try {
    const data = await apiRequest('/portal/hr');
    if (!data.success) {
      showToast('Failed to load HR questions.', 'error');
      return;
    }

    hrQuestions = data.questions;
    hrIndex = 0;
    renderHrQuestion();
  } catch (err) {
    console.error('Error loading HR questions:', err);
    showToast('Failed to load HR questions.', 'error');
  }
}

function renderHrQuestion() {
  const container = document.getElementById('hr-area');
  if (!container || hrQuestions.length === 0) return;

  const q = hrQuestions[hrIndex];
  container.innerHTML = `
    <div class="glass-card">
      <div style="margin-bottom: 20px; border-bottom:1px solid var(--border-color); padding-bottom:10px;">
        <span style="font-weight: 600; color: var(--accent-cyan);">HR INTERVIEW QUESTION ${hrIndex + 1} OF ${hrQuestions.length}</span>
      </div>
      <h3 style="font-size: 1.4rem; margin-bottom: 12px;">${q.question}</h3>
      <p style="color: var(--accent-amber); font-weight: 500; font-size: 0.95rem; margin-bottom: 20px;">💡 Tip: ${q.tips}</p>
      
      <div class="form-group">
        <label for="hr-user-response">Your Response</label>
        <textarea id="hr-user-response" rows="8" placeholder="Type your structured answer here. Try using the STAR method (Situation, Task, Action, Result)..." style="width: 100%; font-size:1rem;"></textarea>
      </div>

      <div class="flex-row-between mt-4">
        <div>
          <button onclick="navigateHr(-1)" class="btn btn-secondary mr-2" ${hrIndex === 0 ? 'disabled' : ''}>Previous</button>
          <button onclick="navigateHr(1)" class="btn btn-secondary" ${hrIndex === hrQuestions.length - 1 ? 'disabled' : ''}>Next</button>
        </div>
        <div>
          <button onclick="analyzeHrAnswer()" class="btn btn-primary">Submit for AI Review</button>
        </div>
      </div>

      <div id="hr-evaluation" style="display:none;" class="glass-card hr-feedback-card mt-4"></div>
    </div>
  `;
}

window.navigateHr = (dir) => {
  const nextIdx = hrIndex + dir;
  if (nextIdx >= 0 && nextIdx < hrQuestions.length) {
    hrIndex = nextIdx;
    renderHrQuestion();
  }
};

async function analyzeHrAnswer() {
  const answerVal = document.getElementById('hr-user-response').value.trim();
  const evaluationDiv = document.getElementById('hr-evaluation');
  if (!answerVal) {
    showToast('Please type your response before requesting review.', 'error');
    return;
  }

  // AI-inspired STAR checklist analysis script
  const scoreCriteria = {
    Situation: /situation|background|context|was working|college/i.test(answerVal),
    Task: /task|goal|objective|problem|responsibility/i.test(answerVal),
    Action: /action|i resolved|i did|i code|implemented|designed/i.test(answerVal),
    Result: /result|outcome|learned|reduced|achieved|improved/i.test(answerVal)
  };

  const scoreList = Object.keys(scoreCriteria).filter(k => scoreCriteria[k]);
  const scoreVal = scoreList.length;
  let scoreText = '';
  let gradeColor = '';

  if (scoreVal === 4) {
    scoreText = 'Excellent (Perfect STAR method structure!)';
    gradeColor = 'var(--accent-emerald)';
  } else if (scoreVal >= 2) {
    scoreText = 'Good (Needs minor additions in missing STAR components)';
    gradeColor = 'var(--accent-cyan)';
  } else {
    scoreText = 'Informal (Structure is weak. Frame your answer describing the Situation, Task, Action, and Result)';
    gradeColor = 'var(--accent-rose)';
  }

  // Save complete state to database
  try {
    await apiRequest('/user/progress', {
      method: 'POST',
      body: JSON.stringify({
        topic: 'hr',
        subtopic: `question_${hrQuestions[hrIndex].id}`,
        score: scoreVal,
        max_score: 4
      })
    });
  } catch (e) {}

  evaluationDiv.style.display = 'block';
  evaluationDiv.innerHTML = `
    <h4 style="color: var(--accent-cyan); font-weight: 700; margin-bottom: 12px; display:flex; align-items:center; gap:8px;">
      <span>🤖</span> Answer Analysis & Structural Feedback
    </h4>
    <div style="margin-bottom:15px;">
      <strong>Structural Rating: </strong>
      <span style="color:${gradeColor}; font-weight:700;">${scoreText}</span>
    </div>
    
    <div style="display:flex; flex-direction:column; gap:8px; margin-bottom: 20px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:1.2rem;">${scoreCriteria.Situation ? '✅' : '❌'}</span>
        <span><strong>Situation:</strong> Describes the context/background.</span>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:1.2rem;">${scoreCriteria.Task ? '✅' : '❌'}</span>
        <span><strong>Task:</strong> Explains the specific challenge or goal.</span>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:1.2rem;">${scoreCriteria.Action ? '✅' : '❌'}</span>
        <span><strong>Action:</strong> details what YOU did to resolve it.</span>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:1.2rem;">${scoreCriteria.Result ? '✅' : '❌'}</span>
        <span><strong>Result:</strong> quantifies outcomes or shares lessons learned.</span>
      </div>
    </div>
    
    <div style="border-top:1px solid var(--border-color); padding-top:15px; margin-top: 15px;">
      <h5 style="color: var(--text-primary); font-size:1rem; margin-bottom: 8px;">Sample Good Answer:</h5>
      <p style="font-size:0.95rem; color: var(--text-secondary); line-height: 1.6; font-style: italic;">
        "${hrQuestions[hrIndex].sample_answer}"
      </p>
    </div>
  `;
}

window.analyzeHrAnswer = analyzeHrAnswer;

// ==========================================================================
// Company Prep Sheet Panels Implementation
// ==========================================================================

const COMPANY_GUIDES = {
  tcs: {
    title: 'TCS NQT Preparation',
    logo: '💼',
    rounds: 'Online Test (Cognitive + Technical MCQ + Coding) followed by Technical, Managerial, and HR Interviews.',
    pattern: 'Aptitude: 24 questions, Coding: 2 questions (Java, Python, C++, C). Negative marking is NOT present but questions are adaptive.',
    focus: 'Aptitude (Speed & Distance, Profit/Loss), DBMS concepts, Basic OOPs inheritance, String manipulation codes.'
  },
  infosys: {
    title: 'Infosys SP/DSE Preparation',
    logo: '🏢',
    rounds: 'Online Coding Test (3 Questions: Easy, Medium, Hard) followed by single Technical + HR Interview.',
    pattern: 'Heavy focus on advanced data structures (Graphs, Dynamic Programming, Trees) and algorithms.',
    focus: 'Dynamic programming, Recursion base cases, BFS/DFS algorithms, Complex SQL joins and transactions.'
  },
  wipro: {
    title: 'Wipro Elite NLTH Preparation',
    logo: '🌀',
    rounds: 'Aptitude Test + Coding assessment followed by a combined Technical & HR virtual interview.',
    pattern: 'Quantitative Aptitude, Logical Reasoning, Verbal, Coding (1 string/array program), Essay Writing section.',
    focus: 'Logical series questions, active/passive voice, array sorting problems, simple searching algorithms.'
  },
  amazon: {
    title: 'Amazon SDE preparation',
    logo: '📦',
    rounds: 'Online Assessment (Coding + Work Simulation) followed by 3 SDE technical rounds assessing Leadership Principles.',
    pattern: 'Hard coding questions on Trees/Graphs, System Design guidelines, and strict behavioral STAR interviews.',
    focus: 'Heaps, hash tables, sliding windows, system components scaling, and Amazon\'s 16 Leadership Principles.'
  },
  google: {
    title: 'Google STEP / SWE Preparation',
    logo: '🔍',
    rounds: 'Online Challenge (Coding) followed by 3-4 coding interviews testing data structures and algorithmic complexity.',
    pattern: 'Strict focus on code performance, time/space complexity optimization, edge-case coverage, and clean styling.',
    focus: 'Segment trees, graph traversal, recursive backtracking, binary search adaptations, and big-O constraints.'
  }
};

function initCompanyPage() {
  // Bind tab clicks
  const tabs = document.querySelectorAll('.company-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      // Toggle active tabs class
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const compId = tab.dataset.company;
      renderCompanyDetails(compId);
    });
  });

  // Load TCS as default
  renderCompanyDetails('tcs');
}

function renderCompanyDetails(compId) {
  const guide = COMPANY_GUIDES[compId];
  const container = document.getElementById('company-guide-panel');
  if (!container || !guide) return;

  container.innerHTML = `
    <div class="glass-card">
      <div style="display:flex; align-items:center; gap:15px; margin-bottom: 25px;">
        <span style="font-size: 3rem;">${guide.logo}</span>
        <div>
          <h2 style="font-size: 1.8rem;">${guide.title}</h2>
          <p style="color:var(--accent-cyan); font-weight:600;">Standard Hiring Roadmap & Focus Sheets</p>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:25px;">
        <div>
          <h4 style="color:var(--accent-violet); font-size:1.1rem; margin-bottom:8px;">🎯 Interview Rounds</h4>
          <p style="color:var(--text-secondary); font-size:0.95rem; line-height:1.6;">${guide.rounds}</p>
        </div>

        <div>
          <h4 style="color:var(--accent-violet); font-size:1.1rem; margin-bottom:8px;">📊 Assessment Test Pattern</h4>
          <p style="color:var(--text-secondary); font-size:0.95rem; line-height:1.6;">${guide.pattern}</p>
        </div>

        <div>
          <h4 style="color:var(--accent-violet); font-size:1.1rem; margin-bottom:8px;">🔥 Recommended Key Topics</h4>
          <p style="color:var(--text-secondary); font-size:0.95rem; line-height:1.6;">${guide.focus}</p>
        </div>
      </div>

      <div style="margin-top: 35px; padding-top: 20px; border-top: 1px solid var(--border-color); display:flex; gap:15px;">
        <a href="mocktests.html" class="btn btn-primary">Take Mock Test for ${compId.toUpperCase()}</a>
        <a href="coding.html" class="btn btn-secondary">Go to Coding Practice</a>
      </div>
    </div>
  `;
}
