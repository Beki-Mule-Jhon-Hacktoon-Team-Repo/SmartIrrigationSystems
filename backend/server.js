const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const mongoose = require('mongoose');
const { server } = require('./app'); // <-- pulls the HTTP server

// ------------------- Uncaught Exception -------------------
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION!', err.name, err.message);
  process.exit(1);
});

// ------------------- MongoDB -------------------
// Build MongoDB URI from environment variables and support placeholder replacement
const buildMongoUri = () => {
  const rawUri = process.env.MONGODB_URI || '';
  const user = process.env.MONGODB_USER;
  const pass = process.env.MONGODB_PASSWORD;

  let mongoUri = rawUri;

  if (rawUri) {
    // If URI includes placeholders like <USER> or <PASSWORD>, replace them
    if (
      (rawUri.includes('<USER>') || rawUri.includes('<PASSWORD>')) &&
      user &&
      pass
    ) {
      mongoUri = rawUri
        .replace(/<USER>/g, encodeURIComponent(user))
        .replace(/<PASSWORD>/g, encodeURIComponent(pass));
    }
    // If URI already contains credentials or doesn't need replacement, use as-is
  } else if (user && pass) {
    // Build a basic URI when no MONGODB_URI is provided
    const host = process.env.MONGODB_HOST || 'localhost:27017';
    const db = process.env.MONGODB_DB || 'smartagrisense';
    const authSource = process.env.MONGODB_AUTH_SOURCE
      ? `?authSource=${process.env.MONGODB_AUTH_SOURCE}`
      : '';
    mongoUri = `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(
      pass
    )}@${host}/${db}${authSource}`;
  }

  return mongoUri;
};

const mongoUri = buildMongoUri();

if (!mongoUri) {
  console.error(
    'MongoDB connection string not provided or incomplete. Please set MONGODB_URI or MONGODB_USER and MONGODB_PASSWORD in .env'
  );
  process.exit(1);
}

mongoose
  .connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    autoIndex: process.env.NODE_ENV !== 'production',
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// ------------------- Start Server  ---
const DEFAULT_RETRIES = 5;
const START_RETRY_DELAY_MS = 200;

const startServer = (startPort, retries = DEFAULT_RETRIES) => {
  let port = Number(startPort) || 5000;
  let attempts = 0;

  const tryListen = () => {
    attempts += 1;

    const onError = (err) => {
      server.removeListener('listening', onListening);
      server.removeListener('error', onError);

      if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${port} in use (EADDRINUSE).`);
        if (attempts <= retries) {
          port += 1;
          console.log(
            `Retrying on port ${port} (${
              retries - attempts + 1
            } retries left)...`
          );
          setTimeout(tryListen, START_RETRY_DELAY_MS);
        } else {
          console.error('No available ports after retries. Exiting.');
          process.exit(1);
        }
      } else {
        console.error('Server error while starting:', err);
        process.exit(1);
      }
    };

    const onListening = () => {
      server.removeListener('error', onError);
      console.log(`SmartAgriSense API listening on port ${port}`);
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port);
  };

  tryListen();
};

const PORT = process.env.PORT || 5000;
startServer(PORT);

// ------------------- Unhandled Rejection (safe shutdown) ---
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION!', err && err.name, err && err.message);
  try {
    if (server && server.listening) {
      server.close(() => process.exit(1));
    } else {
      process.exit(1);
    }
  } catch (closeErr) {
    console.error('Error during shutdown after unhandledRejection:', closeErr);
    process.exit(1);
  }
});
