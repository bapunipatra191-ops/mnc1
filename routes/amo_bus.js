const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('./auth');

// GET /api/amo-bus/routes - Get all routes
router.get('/routes', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM amo_bus_routes');
    
    // Parse stops and timings from comma-separated string to arrays
    const formatted = rows.map(r => ({
      ...r,
      stops: r.stops ? r.stops.split(',') : [],
      timings: r.timings ? r.timings.split(',') : [],
      fare: {
        adult: Number(r.fare_adult),
        student: Number(r.fare_student)
      }
    }));
    
    res.json({ success: true, routes: formatted });
  } catch (err) {
    console.error('Error fetching routes:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch bus routes.' });
  }
});

// GET /api/amo-bus/alerts - Get all service alerts
router.get('/alerts', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT a.*, r.name as route_name, r.number as route_number FROM amo_bus_alerts a LEFT JOIN amo_bus_routes r ON a.route_id = r.id');
    res.json({ success: true, alerts: rows });
  } catch (err) {
    console.error('Error fetching alerts:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch service alerts.' });
  }
});

// POST /api/amo-bus/feedback - Submit feedback
router.post('/feedback', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, and message.' });
  }
  
  try {
    await db.query(
      'INSERT INTO amo_bus_feedback (name, email, message) VALUES (?, ?, ?)',
      [name, email, message]
    );
    res.status(201).json({ success: true, message: 'Feedback submitted successfully.' });
  } catch (err) {
    console.error('Error saving feedback:', err);
    res.status(500).json({ success: false, message: 'Failed to submit feedback.' });
  }
});

// GET /api/amo-bus/favorites - Get favorites for logged-in user
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT r.* FROM amo_bus_favorites f JOIN amo_bus_routes r ON f.route_id = r.id WHERE f.user_id = ?',
      [req.user.id]
    );
    
    const formatted = rows.map(r => ({
      ...r,
      stops: r.stops ? r.stops.split(',') : [],
      timings: r.timings ? r.timings.split(',') : [],
      fare: {
        adult: Number(r.fare_adult),
        student: Number(r.fare_student)
      }
    }));
    
    res.json({ success: true, favorites: formatted });
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch favorites.' });
  }
});

// POST /api/amo-bus/favorites/toggle - Toggle route favorite state
router.post('/favorites/toggle', authenticateToken, async (req, res) => {
  const { routeId } = req.body;
  if (!routeId) {
    return res.status(400).json({ success: false, message: 'routeId is required.' });
  }
  
  try {
    // Check if already favorited
    const [existing] = await db.query(
      'SELECT * FROM amo_bus_favorites WHERE user_id = ? AND route_id = ?',
      [req.user.id, routeId]
    );
    
    if (existing && existing.length > 0) {
      // Remove favorite
      await db.query(
        'DELETE FROM amo_bus_favorites WHERE user_id = ? AND route_id = ?',
        [req.user.id, routeId]
      );
      return res.json({ success: true, favorited: false, message: 'Removed from favorites.' });
    } else {
      // Add favorite
      await db.query(
        'INSERT INTO amo_bus_favorites (user_id, route_id) VALUES (?, ?)',
        [req.user.id, routeId]
      );
      return res.json({ success: true, favorited: true, message: 'Added to favorites.' });
    }
  } catch (err) {
    console.error('Error toggling favorite:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle favorite.' });
  }
});

module.exports = router;
