const dotenv = require('dotenv');
dotenv.config();

const farmRoutes = require('./routes/farmRoutes'); // <<< added

const authRoutes = require('./routes/auth');
const sensorRoutes = require('./routes/sensorRoutes');
const adminRoutes = require('./routes/adminRoutes'); // <<< add this require
const deviceRoutes = require('./routes/deviceRoutes');
const blogRoutes = require('./routes/blogRoutes'); // <-- new blog routes
// Socket.IO (real-time) — accept Arduino data, save to DB, broadcast to clients
const Sensor = require('./models/sensorModel');
const express = require('express');
const http = require('http');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const weatherRoutes = require('./routes/weatherRoutes');
const irrigationRoutes = require('./routes/irrigationRoutes');
const User = require('./models/userModel');

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

// Simple server bootstrap for dev
const app = express();

// Configure CORS to explicitly allow the frontend origin and common headers
// Use CLIENT_URL from .env if set, otherwise default to http://localhost:3000
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:3000';
const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like curl, mobile, server-to-server)
    if (!origin) return callback(null, true);
    // allow when matches configured client origin or same-origin (dev)
    if (origin === clientOrigin || origin.endsWith('.localhost'))
      return callback(null, true);
    // otherwise block
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'x-admin-email',
    'x-admin-password',
  ],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
// Ensure preflight (OPTIONS) requests are handled and respond with CORS headers
// Do not register a route pattern like '*' or '/*' with app.options — path-to-regexp
// can reject those patterns. Instead respond to OPTIONS here after the CORS
// middleware has already set the appropriate headers.
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// connect to MongoDB if provided
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

// create HTTP server and socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// allow clients to join/leave device rooms
io.on('connection', (socket) => {
  console.log('socket connected:', socket.id);

  socket.on('join-device', (deviceId) => {
    if (!deviceId) return;
    const room = `device:${deviceId}`;
    socket.join(room);
    console.log(`${socket.id} joined ${room}`);
  });

  socket.on('leave-device', (deviceId) => {
    if (!deviceId) return;
    const room = `device:${deviceId}`;
    socket.leave(room);
    console.log(`${socket.id} left ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected:', socket.id);
  });
});

// Mount sensor data router (which includes POST /sensor/:deviceId and GET /sensor/:deviceId/test-emit)
const createSensorDataRouter = require('./routes/sensorDataSocketRoute');
app.use('/', createSensorDataRouter({ io }));

// New convenience test endpoint registered in app.js
// GET /test-emit/:deviceId
// Emits a sample payload to device:<deviceId> and sensor:<sensorId> rooms
app.get('/test-emit/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const sensorId = req.query.sensorId || deviceId;

  const sample = {
    deviceId,
    sensorId,
    temperature: 25.5,
    humidity: 55,
    soil: 40,
    ph: 6.8,
    npk: 10,
    receivedAt: new Date(),
    meta: { test: true, emittedFrom: 'app.js' },
  };

  const roomDevice = `device:${deviceId}`;
  const roomSensor = `sensor:${sensorId}`;

  io.to(roomDevice).emit('device-data', sample);
  io.to(roomSensor).emit('device-data', sample);
  io.emit('device-data-all', { deviceId, sensorId, data: sample });

  return res.json({ ok: true, emitted: sample });
});

// basic health route
app.get('/', (req, res) => res.json({ ok: true }));

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

app.post('/api/v1/auth/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken)
    return res
      .status(400)
      .json({ status: 'fail', message: 'idToken required' });

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decoded;
    if (!email) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'Email not present in token' });
    }

    // Find existing user by email
    let user = await User.findOne({ email });

    if (!user) {
      // create new user
      user = await User.create({
        firebaseUid: uid,
        email,
        name: name || undefined,
        role: 'user',
      });
      // optionally store picture if available on a separate profile store or as metadata
      console.log(`Created new user ${email} (uid=${uid})`);
    } else if (!user.firebaseUid) {
      // link firebase uid if missing
      user.firebaseUid = uid;
      if (name) user.name = user.name || name;
      await user.save();
      console.log(
        `Linked firebase uid for existing user ${email} (uid=${uid})`
      );
    }

    // Return user record
    res.status(200).json({ status: 'success', data: { user } });
  } catch (err) {
    res.status(401).json({ status: 'fail', message: err.message });
  }
});

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

// Debug endpoint to inspect headers / firebase state
app.get('/api/v1/auth/debug', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Debug info',
    headers: req.headers,
    firebaseInitialized,
  });
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

app.post('/predict', (req, res) => {
  const inputData = req.body;
  const pyScript = path.join(__dirname, 'ai', 'predict.py');

  // Spawn python process and pipe JSON to its stdin to avoid writing files
  const py = spawn('python', [pyScript], { stdio: ['pipe', 'pipe', 'pipe'] });

  let stdout = '';
  let stderr = '';

  py.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });

  py.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  py.on('error', (err) => {
    console.error('Failed to start Python prediction process:', err);
    return res
      .status(500)
      .json({ error: 'Failed to start prediction process' });
  });

  // Safety timeout: kill python if it takes too long
  const timeoutMs = 15000; // 15s
  const timer = setTimeout(() => {
    try {
      py.kill();
    } catch (e) {
      /* ignore */
    }
  }, timeoutMs);

  py.on('close', (code) => {
    clearTimeout(timer);
    if (code !== 0) {
      console.error('Python process exited with code', code, 'stderr:', stderr);
      return res
        .status(500)
        .json({ error: 'AI Prediction Failed', details: stderr });
    }

    try {
      const result = JSON.parse(stdout);
      return res.json(result);
    } catch (err) {
      console.error('Invalid JSON from Python:', stdout, err);
      return res
        .status(500)
        .json({ error: 'Invalid response from AI', details: stdout });
    }
  });

  // Write input JSON to python stdin
  try {
    py.stdin.write(JSON.stringify(inputData));
    py.stdin.end();
  } catch (err) {
    console.error('Failed to write to Python stdin:', err);
    try {
      py.kill();
    } catch (e) {}
    clearTimeout(timer);
    return res
      .status(500)
      .json({ error: 'Failed to send input to prediction process' });
  }
});

// Protected route example: returns decoded Firebase token (user info)
app.get('/api/v1/auth/profile', verifyFirebaseToken, (req, res) => {
  res.status(200).json({
    status: 'success',
    user: req.user,
  });
});

// const io = new Server(server, { cors: { origin: '*' });

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('arduino-data', async (data) => {
    try {
      // persist incoming sensor reading
      const sensor = new Sensor(data);
      await sensor.save();
      // broadcast to all connected clients
      io.emit('sensor-update', data);
    } catch (err) {
      console.error('Error saving sensor data:', err && err.message);
      socket.emit('error', { message: 'Failed to save sensor data' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Add safe registration endpoint that does NOT fail when Firebase admin errors occur.
// This prevents "Invalid JWT Signature" from blocking user registration.
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'email and password required' });
    }

    // Check existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'User already exists' });
    }

    // Create user in MongoDB (pre-save middleware will hash password)
    const user = await User.create({ name, email, password, role });

    // Try to create a Firebase user if admin SDK is configured, but do NOT fail registration if it errors.
    if (admin && admin.apps && admin.apps.length > 0) {
      try {
        const fbUser = await admin.auth().createUser({
          email,
          password,
          displayName: name,
        });
        // link firebase uid to user record if created successfully
        user.firebaseUid = fbUser.uid;
        await user.save();
        console.log(`Firebase user created for ${email} uid=${fbUser.uid}`);
      } catch (fbErr) {
        // Log detailed warning but do not fail the registration request.
        console.warn(
          'Warning: Firebase createUser failed during registration (continuing).',
          fbErr && fbErr.message
        );
      }
    }

    // Hide password in response
    user.password = undefined;
    return res.status(201).json({ status: 'success', data: { user } });
  } catch (err) {
    console.error('Registration error:', err && err.message);
    // If validation error from mongoose, expose meaningful message
    const message =
      err && err.message ? err.message : 'Server error during registration';
    return res.status(400).json({ status: 'fail', message });
  }
});

// mount new API routers (after special auth endpoints)

app.use('/api/v1/farm', farmRoutes); // <<< mount public farm endpoints (singular)
app.use('/api/v1/sensor', sensorRoutes);
app.use('/api/v1/weather', weatherRoutes);
app.use('/api/v1/irrigation', irrigationRoutes);
app.use('/api/v1/admin', adminRoutes); // <<< mount admin routes
app.use('/api/v1/device', deviceRoutes);
app.use('/api/v1/blog', blogRoutes); // <-- mount blog API

// Mount auth routes (ensure this is after special auth endpoints so /profile isn't captured by /:id)
app.use('/api/v1/auth', authRoutes);

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
