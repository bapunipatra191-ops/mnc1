const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('./auth');

// GET /api/portal/mcqs
// Query parameters: category ('aptitude' | 'technical'), subject (optional)
router.get('/mcqs', authenticateToken, async (req, res) => {
  const { category, subject } = req.query;
  try {
    let queryStr = 'SELECT * FROM mcq_questions';
    const params = [];

    if (category && subject) {
      queryStr = 'SELECT * FROM mcq_questions WHERE category = ? AND subject = ?';
      params.push(category, subject);
    } else if (category) {
      queryStr = 'SELECT * FROM mcq_questions WHERE category = ?';
      params.push(category);
    }

    const [questions] = await db.query(queryStr, params);
    res.json({ success: true, questions });
  } catch (err) {
    console.error('Error fetching MCQs:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch MCQ questions.' });
  }
});

// GET /api/portal/coding
router.get('/coding', authenticateToken, async (req, res) => {
  try {
    const [challenges] = await db.query('SELECT * FROM coding_challenges');
    res.json({ success: true, challenges });
  } catch (err) {
    console.error('Error fetching coding challenges:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch coding challenges.' });
  }
});

// GET /api/portal/coding/:id
router.get('/coding/:id', authenticateToken, async (req, res) => {
  try {
    const [challenges] = await db.query('SELECT * FROM coding_challenges WHERE id = ?', [req.params.id]);
    if (!challenges || challenges.length === 0) {
      return res.status(404).json({ success: false, message: 'Challenge not found.' });
    }
    res.json({ success: true, challenge: challenges[0] });
  } catch (err) {
    console.error('Error fetching coding challenge details:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch coding challenge details.' });
  }
});

// GET /api/portal/hr
router.get('/hr', authenticateToken, async (req, res) => {
  try {
    const [questions] = await db.query('SELECT * FROM hr_questions');
    res.json({ success: true, questions });
  } catch (err) {
    console.error('Error fetching HR questions:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch HR questions.' });
  }
});

// GET /api/portal/mocktests
router.get('/mocktests', authenticateToken, async (req, res) => {
  try {
    const [tests] = await db.query('SELECT * FROM mock_tests');
    res.json({ success: true, tests });
  } catch (err) {
    console.error('Error fetching mock tests:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch mock tests.' });
  }
});

// GET /api/portal/mocktests/:id
router.get('/mocktests/:id', authenticateToken, async (req, res) => {
  try {
    const [tests] = await db.query('SELECT * FROM mock_tests WHERE id = ?', [req.params.id]);
    if (!tests || tests.length === 0) {
      return res.status(404).json({ success: false, message: 'Mock test not found.' });
    }
    const test = tests[0];
    // If questions is JSON string, parse it
    if (typeof test.questions === 'string') {
      try {
        test.questions = JSON.parse(test.questions);
      } catch(e) {}
    }
    res.json({ success: true, test });
  } catch (err) {
    console.error('Error fetching mock test details:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch mock test details.' });
  }
});

// POST /api/portal/coding/:id/run
// Runs user code against test cases in database
router.post('/coding/:id/run', authenticateToken, async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, message: 'Please write some code before running.' });
  }

  try {
    const [challenges] = await db.query('SELECT * FROM coding_challenges WHERE id = ?', [req.params.id]);
    if (!challenges || challenges.length === 0) {
      return res.status(404).json({ success: false, message: 'Coding challenge not found.' });
    }

    const challenge = challenges[0];
    let testCases = [];
    try {
      testCases = typeof challenge.test_cases === 'string' ? JSON.parse(challenge.test_cases) : challenge.test_cases;
    } catch (e) {
      testCases = [];
    }

    const results = [];
    let allPassed = true;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const inputStr = tc.input;
      const expectedOutputStr = tc.output.trim();

      let actualOutput = '';
      let error = null;

      try {
        // Compile driver scripts for specific challenges in a micro-sandbox
        let driverCode = '';
        if (challenge.id == 1) {
          // Two Sum
          driverCode = `
            ${code}
            const input = \`${inputStr}\`;
            const lines = input.trim().split('\\n');
            const nums = lines[0].split(' ').map(Number);
            const target = Number(lines[1]);
            const res = twoSum(nums, target);
            if(Array.isArray(res)) {
              console.log(res.join(' '));
            } else {
              console.log(res);
            }
          `;
        } else if (challenge.id == 2) {
          // Reverse String
          driverCode = `
            ${code}
            const input = \`${inputStr}\`;
            console.log(reverseString(input));
          `;
        } else if (challenge.id == 3) {
          // Fibonacci Number
          driverCode = `
            ${code}
            const input = \`${inputStr}\`;
            console.log(fib(Number(input.trim())));
          `;
        } else {
          // Generic fallback wrapper (expects function named solve(input))
          driverCode = `
            ${code}
            console.log(solve(\`${inputStr}\`));
          `;
        }

        // Intercept console.log statements from driver
        let consoleOutput = [];
        const sandboxLog = (...args) => {
          consoleOutput.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
        };

        // Create isolated run context
        const runInContext = new Function('console', driverCode);
        runInContext({ log: sandboxLog });

        actualOutput = consoleOutput.join('\n').trim();
      } catch (err) {
        error = err.message;
        allPassed = false;
      }

      const passed = !error && (actualOutput === expectedOutputStr);
      if (!passed) allPassed = false;

      results.push({
        testCaseIndex: i + 1,
        input: inputStr,
        expected: expectedOutputStr,
        actual: error ? `Error: ${error}` : actualOutput,
        passed
      });
    }

    res.json({
      success: true,
      results,
      allPassed
    });

  } catch (err) {
    console.error('Compiler simulation error:', err);
    res.status(500).json({ success: false, message: 'Compiler simulation encountered an error.' });
  }
});

module.exports = router;
