const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const http = require('http');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin if service account available
let firebaseInitialized = false;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const saPath = process.env.FIREBASE_SERVICE_ACCOUNT;
    const resolved = saPath.startsWith('.')
      ? path.resolve(process.cwd(), saPath)
      : saPath;
    const raw = fs.readFileSync(resolved, 'utf8');
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log('Firebase Admin initialized');
  } catch (err) {
    console.warn(
      'Firebase service account not found or invalid – Firebase auth disabled.',
      err.message || err
    );
  }
} else {
  console.warn('FIREBASE_SERVICE_ACCOUNT not set – Firebase auth disabled.');
}

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Basic JSON parsing
app.use(express.json());

// Middleware to verify Firebase ID token
const verifyFirebaseToken = async (req, res, next) => {
  if (!firebaseInitialized) {
    return res.status(500).json({
      status: 'error',
      message: 'Firebase Admin not initialized on server',
    });
  }

  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({
      status: 'fail',
      message: 'Missing or malformed Authorization header',
    });
  }

  const idToken = match[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded; // attach decoded token (uid, email, etc.)
    return next();
  } catch (err) {
    console.error('Token verification failed:', err && err.message);
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid or expired ID token',
    });
  }
};

// Public health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'SmartAgriSense API (auth-only) is running',
    firebase: firebaseInitialized ? 'enabled' : 'disabled',
    timestamp: new Date().toISOString(),
  });
});

// Protected route example: returns decoded Firebase token (user info)
app.get('/api/v1/auth/profile', verifyFirebaseToken, (req, res) => {
  res.status(200).json({
    status: 'success',
    user: req.user,
  });
});

// ------------------- 404 & Error Handler -------------------
app.use((req, res) => {
  // fallback 404 handler without using path-to-regexp parsing
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`,
  });
});
// Export app and server for server.js to start
module.exports = { app, server };
