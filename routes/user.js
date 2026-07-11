const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('./auth');

// POST /api/user/progress
// Save progress, MCQ completions, mock test scores, coding challenge completions
router.post('/progress', authenticateToken, async (req, res) => {
  const { topic, subtopic, score, max_score } = req.body;
  if (!topic || !subtopic) {
    return res.status(400).json({ success: false, message: 'Please provide topic and subtopic parameters.' });
  }

  try {
    await db.query(
      'INSERT INTO user_progress (user_id, topic, subtopic, score, max_score) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, topic, subtopic, score, max_score]
    );
    res.json({ success: true, message: 'Progress saved successfully.' });
  } catch (err) {
    console.error('Error saving user progress:', err);
    res.status(500).json({ success: false, message: 'Failed to save progress.' });
  }
});

// GET /api/user/progress/stats
// Return aggregated progress statistics for charts and dashboard UI
router.get('/progress/stats', authenticateToken, async (req, res) => {
  try {
    const [progress] = await db.query(
      'SELECT DISTINCT topic, subtopic, score, max_score, completed_at FROM user_progress WHERE user_id = ?',
      [req.user.id]
    );

    // Initial stats schema
    const stats = {
      aptitude: { completed: 0, totalScore: 0, maxScore: 0, history: [] },
      technical: { completed: 0, totalScore: 0, maxScore: 0, history: [] },
      coding: { completed: 0, solvedIds: [], history: [] },
      mock: { completed: 0, exams: [], history: [] },
      hr: { completed: 0, solvedIds: [] }
    };

    progress.forEach(row => {
      if (row.topic === 'aptitude') {
        stats.aptitude.completed++;
        stats.aptitude.totalScore += Number(row.score || 0);
        stats.aptitude.maxScore += Number(row.max_score || 0);
        stats.aptitude.history.push({ date: row.completed_at, score: row.score, max: row.max_score, subtopic: row.subtopic });
      } else if (row.topic === 'technical') {
        stats.technical.completed++;
        stats.technical.totalScore += Number(row.score || 0);
        stats.technical.maxScore += Number(row.max_score || 0);
        stats.technical.history.push({ date: row.completed_at, score: row.score, max: row.max_score, subtopic: row.subtopic });
      } else if (row.topic === 'coding') {
        if (!stats.coding.solvedIds.includes(row.subtopic)) {
          stats.coding.solvedIds.push(row.subtopic);
          stats.coding.completed++;
        }
        stats.coding.history.push({ date: row.completed_at, challengeId: row.subtopic });
      } else if (row.topic === 'mock') {
        stats.mock.completed++;
        stats.mock.exams.push({ title: row.subtopic, score: row.score, max: row.max_score, date: row.completed_at });
        stats.mock.history.push({ date: row.completed_at, score: row.score, max: row.max_score });
      } else if (row.topic === 'hr') {
        if (!stats.hr.solvedIds.includes(row.subtopic)) {
          stats.hr.solvedIds.push(row.subtopic);
          stats.hr.completed++;
        }
      }
    });

    res.json({ success: true, stats });
  } catch (err) {
    console.error('Error fetching progress stats:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch progress stats.' });
  }
});

module.exports = router;
