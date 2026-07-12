const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('./auth');

// Apply admin validation to all endpoints in this file
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/stats
// Returns overview dashboard stats for admins
router.get('/stats', async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM users');
    const [progress] = await db.query('SELECT * FROM user_progress');
    const [mcqs] = await db.query('SELECT * FROM mcq_questions');
    const [challenges] = await db.query('SELECT * FROM coding_challenges');

    const totalStudents = users.filter(u => u.role !== 'admin').length;
    const totalAdmins = users.filter(u => u.role === 'admin').length;

    // Calculate generic stats
    const codingCompletedCount = progress.filter(p => p.topic === 'coding').length;
    const mockTestsTaken = progress.filter(p => p.topic === 'mock').length;

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalAdmins,
        totalMcqs: mcqs.length,
        totalChallenges: challenges.length,
        codingCompletedCount,
        mockTestsTaken,
        users: users.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role, created_at: u.created_at }))
      }
    });
  } catch (err) {
    console.error('Error fetching admin statistics:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve admin stats.' });
  }
});

// POST /api/admin/mcqs
// Add a new MCQ question
router.post('/mcqs', async (req, res) => {
  const { category, subject, question, option_a, option_b, option_c, option_d, correct_option, explanation } = req.body;
  if (!category || !subject || !question || !option_a || !option_b || !option_c || !option_d || !correct_option) {
    return res.status(400).json({ success: false, message: 'Please provide all required MCQ fields.' });
  }

  try {
    await db.query(
      'INSERT INTO mcq_questions (category, subject, question, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [category, subject, question, option_a, option_b, option_c, option_d, correct_option, explanation || '']
    );
    res.status(201).json({ success: true, message: 'MCQ question added successfully.' });
  } catch (err) {
    console.error('Error adding MCQ:', err);
    res.status(500).json({ success: false, message: 'Failed to create MCQ question.' });
  }
});

// DELETE /api/admin/mcqs/:id
// Delete an MCQ question
router.delete('/mcqs/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM mcq_questions WHERE id = ?', [req.params.id]);
    if (result && result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'MCQ question not found.' });
    }
    res.json({ success: true, message: 'MCQ question deleted successfully.' });
  } catch (err) {
    console.error('Error deleting MCQ:', err);
    res.status(500).json({ success: false, message: 'Failed to delete MCQ question.' });
  }
});

// POST /api/admin/coding
// Add a new Coding Challenge
router.post('/coding', async (req, res) => {
  const { title, difficulty, description, input_format, output_format, constraints, sample_input, sample_output, test_cases } = req.body;
  if (!title || !difficulty || !description || !test_cases) {
    return res.status(400).json({ success: false, message: 'Please provide title, difficulty, description, and test_cases.' });
  }

  try {
    const tcString = typeof test_cases === 'string' ? test_cases : JSON.stringify(test_cases);
    await db.query(
      'INSERT INTO coding_challenges (title, difficulty, description, input_format, output_format, constraints, sample_input, sample_output, test_cases) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, difficulty, description, input_format || '', output_format || '', constraints || '', sample_input || '', sample_output || '', tcString]
    );
    res.status(201).json({ success: true, message: 'Coding challenge added successfully.' });
  } catch (err) {
    console.error('Error adding coding challenge:', err);
    res.status(500).json({ success: false, message: 'Failed to create coding challenge.' });
  }
});

// DELETE /api/admin/coding/:id
// Delete a coding challenge
router.delete('/coding/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM coding_challenges WHERE id = ?', [req.params.id]);
    if (result && result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Coding challenge not found.' });
    }
    res.json({ success: true, message: 'Coding challenge deleted successfully.' });
  } catch (err) {
    console.error('Error deleting coding challenge:', err);
    res.status(500).json({ success: false, message: 'Failed to delete coding challenge.' });
  }
});

module.exports = router;
