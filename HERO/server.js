const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth').router;
const portalRoutes = require('./routes/portal');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend API calls
app.use(cors());

// Parse incoming request JSON bodies
app.use(express.json());

// Serve static frontend assets from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Bind routers to API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Fallback path to index.html for undefined routes (supporting routing setups if needed)
app.get('*', (req, res, next) => {
  // If request is for an API endpoint, do not serve HTML
  if (req.url.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// General Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[ServerError]', err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred.'
  });
});

// Launch server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` MNC Interview Prep Portal Server Running!`);
  console.log(` Port: ${PORT}`);
  console.log(` Local: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
