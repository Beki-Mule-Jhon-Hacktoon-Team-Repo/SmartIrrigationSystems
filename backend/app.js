const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const http = require('http');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan'); // added morgan

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

// enable CORS
app.use(cors());

// enable morgan in development for request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// simple request logging for debugging (keeps existing header logging)
app.use((req, _res, next) => {
  console.log(
    `[req] ${req.method} ${req.originalUrl} - Authorization: ${String(
      req.headers.authorization || ''
    ).slice(0, 80)}`
  );
  next();
});

// Basic JSON parsing
app.use(express.json());

// Middleware to verify Firebase ID token (improved logging & detailed error response)
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
    // log detailed firebase error for debugging 403/401
    console.error(
      'Token verification failed:',
      err && err.code,
      err && err.message
    );
    const code = (err && err.code) || 'auth/unknown-error';
    const status = code === 'auth/id-token-expired' ? 401 : 401;
    return res.status(status).json({
      status: 'fail',
      code,
      message: err && err.message,
    });
  }
};

// Diagnostic endpoint: verify arbitrary idToken (POST)
app.post('/api/v1/auth/verify', async (req, res) => {
  if (!firebaseInitialized) {
    return res
      .status(500)
      .json({ status: 'error', message: 'Firebase not initialized' });
  }
  const idToken = req.body && req.body.idToken;
  if (!idToken) {
    return res
      .status(400)
      .json({ status: 'fail', message: 'idToken required in body' });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return res.status(200).json({ status: 'success', decoded });
  } catch (err) {
    console.error(
      'verify endpoint error:',
      err && err.code,
      err && err.message
    );
    return res.status(401).json({
      status: 'fail',
      code: err && err.code,
      message: err && err.message,
    });
  }
});

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
